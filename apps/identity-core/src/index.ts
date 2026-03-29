import express from 'express'
import crypto from 'crypto'
import rateLimit from 'express-rate-limit'
import { createClient } from '@supabase/supabase-js'
import { config } from './config'
import { authRouter } from './routes/auth'
import { sessionsRouter } from './routes/sessions'
import { mfaRouter } from './routes/mfa'
import { testConnection, initSchema, db } from './db/postgres'
import { metrics } from './metrics'

// DEPLOY LADDER (never big-bang):
// Step 1: AUTH_MODE=logging-only (observe, never block)
// Step 2: AUTH_MODE=soft (log failures, don't block)
// Step 3: AUTH_MODE=hard (full enforcement)
// Step 4: AUTH_MODE=identity-core-only (Supabase disabled)
const AUTH_MODE = config.authMode

const app = express()

app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: false, limit: '1mb' }))

// Request tracing — requestId injected before any route/middleware sees request
app.use((req, _res, next) => {
  req.requestId = crypto.randomUUID()
  next()
})

// Security headers — ALL responses
app.use((_req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'")
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.removeHeader('X-Powered-By')
  next()
})

// Health endpoint rate limiter — prevents uptime detection / DDoS amplification
const healthLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many health check requests' },
})

// Routes
app.use('/v1/auth', authRouter)
app.use('/v1/sessions', sessionsRouter)
app.use('/v1/mfa', mfaRouter)

// Health — rate limited
app.get('/health', healthLimiter, async (_req, res) => {
  const dbOk = await testConnection()
  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? 'ok' : 'degraded',
    db: dbOk ? 'connected' : 'disconnected',
    authMode: AUTH_MODE,
    authSource: config.authSource,
    forceLogoutAll: config.forceLogoutAll,
    version: '1.0.0',
    service: 'identity-core',
    metrics,
  })
})

async function main() {
  await initSchema()
  app.listen(config.port, () => {
    console.log('[Identity Core] Listening', { port: config.port, authMode: AUTH_MODE, authSource: config.authSource })
  })
}

main().catch((err) => {
  console.error('[Identity Core] Startup failed:', err)
  process.exit(1)
})

// rds-ready Sun Mar 29 00:27:24 UTC 2026

// ─── MIGRATION ENDPOINT (one-time use) ───────────────────────────────────────
app.post('/v1/migrate/from-supabase', async (_req, res) => {
  const authHeader = _req.headers.authorization
  if (authHeader !== `Bearer ${process.env.MIGRATION_SECRET || 'wavult-migrate-2026'}`) {
    return res.status(401).json({ error: 'UNAUTHORIZED' })
  }
  
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_KEY || ''
    )
    
    const { data, error } = await supabase.auth.admin.listUsers({ perPage: 100 })
    if (error) throw error
    
    let migrated = 0; let skipped = 0
    for (const user of data.users) {
      if (!user.email) { skipped++; continue }
      await db.query(
        `INSERT INTO ic_users (id, email, email_verified, full_name, org_id, roles, migrated_from, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'supabase', $7)
         ON CONFLICT (email) DO NOTHING`,
        [user.id, user.email.toLowerCase(), !!user.email_confirmed_at,
         user.user_metadata?.name || null, 'wavult', [], user.created_at]
      )
      migrated++
    }
    
    res.json({ migrated, skipped, total: data.users.length })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// Schema migration endpoint — runs pending ALTER TABLE / CREATE TABLE migrations
// Protected by migration secret, safe to call repeatedly (all DDL is idempotent)
app.post('/v1/auth/schema-migrate', async (req, res) => {
  const secret = req.headers['x-migration-secret']
  if (secret !== 'wavult-migrate-2026') return res.status(401).json({ error: 'UNAUTHORIZED' })

  try {
    await db.query(`
      -- MFA columns
      ALTER TABLE ic_users ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT false;
      ALTER TABLE ic_users ADD COLUMN IF NOT EXISTS mfa_secret TEXT;
      ALTER TABLE ic_users ADD COLUMN IF NOT EXISTS mfa_secret_pending TEXT;
      ALTER TABLE ic_users ADD COLUMN IF NOT EXISTS mfa_backup_codes TEXT;
      ALTER TABLE ic_users ADD COLUMN IF NOT EXISTS last_login_ip TEXT;

      -- ic_auth_audit for compliance
      CREATE TABLE IF NOT EXISTS ic_auth_audit (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID,
        event_type TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        country_code TEXT,
        success BOOLEAN NOT NULL DEFAULT true,
        error_code TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_ic_auth_audit_user ON ic_auth_audit(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_ic_auth_audit_event ON ic_auth_audit(event_type, created_at DESC);
    `)
    return res.json({ ok: true, run: 'mfa_and_audit', message: 'Schema migration completed' })
  } catch (err) {
    console.error('[Migration] Schema migrate failed:', err)
    return res.status(500).json({ error: 'MIGRATION_FAILED', detail: String(err) })
  }
})

// Catch-all: return 404 for unknown paths — do NOT leak endpoint existence
app.use((_req, res) => res.status(404).json({ error: 'NOT_FOUND' }))

export default app
