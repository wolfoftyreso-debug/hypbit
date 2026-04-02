/**
 * WHOOP Integration — /whoop/*
 * OAuth2 + data fetch för teamets recovery, sömn och strain
 */
import { Router, Request, Response } from 'express'
import { Pool } from 'pg'

const router = Router()

const WHOOP_API  = 'https://api.prod.whoop.com/developer/v1'
const WHOOP_AUTH = 'https://api.prod.whoop.com/oauth/oauth2'
const CLIENT_ID     = process.env.WHOOP_CLIENT_ID     || ''
const CLIENT_SECRET = process.env.WHOOP_CLIENT_SECRET || ''
const REDIRECT_URI  = process.env.WHOOP_REDIRECT_URI  || 'https://api.wavult.com/whoop/callback'
const FRONTEND_URL  = process.env.FRONTEND_URL         || 'https://os.wavult.com'

function getPool() {
  const url = process.env.DATABASE_URL || process.env.DB_URL
  if (!url) throw new Error('DATABASE_URL not set')
  return new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } })
}

async function ensureTable() {
  const pool = getPool()
  await pool.query(`
    CREATE TABLE IF NOT EXISTS whoop_tokens (
      user_id       TEXT PRIMARY KEY,
      email         TEXT,
      full_name     TEXT,
      access_token  TEXT NOT NULL,
      refresh_token TEXT,
      expires_at    BIGINT,
      scope         TEXT,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS whoop_snapshots (
      id              SERIAL PRIMARY KEY,
      user_id         TEXT NOT NULL,
      recovery_score  NUMERIC,
      hrv             NUMERIC,
      resting_hr      NUMERIC,
      sleep_perf      NUMERIC,
      sleep_hours     NUMERIC,
      strain_score    NUMERIC,
      kilojoules      NUMERIC,
      snapshot_at     TIMESTAMPTZ DEFAULT NOW()
    );
  `)
  await pool.end()
}

async function refreshIfNeeded(token: { access_token: string; refresh_token: string; expires_at: number; user_id: string }) {
  if (Date.now() < token.expires_at - 60000) return token.access_token
  // Refresh
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: token.refresh_token,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  })
  const res = await fetch(`${WHOOP_AUTH}/token`, { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`)
  const data = await res.json() as any
  const pool = getPool()
  await pool.query(
    `UPDATE whoop_tokens SET access_token=$1, refresh_token=$2, expires_at=$3, updated_at=NOW() WHERE user_id=$4`,
    [data.access_token, data.refresh_token, Date.now() + data.expires_in * 1000, token.user_id]
  )
  await pool.end()
  return data.access_token as string
}

async function whoopGet(access_token: string, path: string) {
  const res = await fetch(`${WHOOP_API}${path}`, {
    headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' }
  })
  if (!res.ok) throw new Error(`WHOOP API ${path}: ${res.status}`)
  return res.json()
}

async function fetchUserData(access_token: string, _user_id: string) {
  try {
    const [recovery, sleep, strain] = await Promise.allSettled([
      whoopGet(access_token, '/recovery?limit=1'),
      whoopGet(access_token, '/activity/sleep?limit=1'),
      whoopGet(access_token, '/cycle?limit=1'),
    ])

    const r = recovery.status === 'fulfilled' ? (recovery.value as any)?.records?.[0] : null
    const s = sleep.status    === 'fulfilled' ? (sleep.value as any)?.records?.[0] : null
    const c = strain.status   === 'fulfilled' ? (strain.value as any)?.records?.[0] : null

    return {
      recovery: r ? {
        score:     r.score?.recovery_score     ?? null,
        hrv:       r.score?.hrv_rmssd_milli    ?? null,
        restingHr: r.score?.resting_heart_rate ?? null,
      } : null,
      sleep: s ? {
        performancePercent: s.score?.sleep_performance_percentage ?? null,
        durationHours:      s.score ? (s.score.total_in_bed_time_milli / 3_600_000) : null,
      } : null,
      strain: c ? {
        score:      c.score?.strain    ?? null,
        kilojoules: c.score?.kilojoule ?? null,
      } : null,
    }
  } catch {
    return { recovery: null, sleep: null, strain: null }
  }
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET /whoop/status — is current user connected?
router.get('/status', async (req: Request, res: Response) => {
  try {
    await ensureTable()
    const userId = (req as any).user?.id || req.headers['x-user-id'] as string
    if (!userId) return res.json({ connected: false })
    const pool = getPool()
    const { rows } = await pool.query('SELECT user_id FROM whoop_tokens WHERE user_id=$1', [userId])
    await pool.end()
    res.json({ connected: rows.length > 0 })
  } catch (e: any) {
    res.json({ connected: false, error: e.message })
  }
})

// POST /whoop/auth-url — generate OAuth URL
router.post('/auth-url', async (_req: Request, res: Response) => {
  if (!CLIENT_ID) return res.status(503).json({ error: 'WHOOP not configured' })
  const url = `${WHOOP_AUTH}/authorize?` + new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'read:recovery read:sleep read:workout read:body_measurement read:profile offline',
  }).toString()
  res.json({ url })
})

// GET /whoop/callback — OAuth callback (redirects browser after WHOOP auth)
router.get('/callback', async (req: Request, res: Response) => {
  const { code, error } = req.query as Record<string, string>
  if (error || !code) return res.redirect(`${FRONTEND_URL}/whoop?error=${error || 'no_code'}`)
  try {
    await ensureTable()
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code, redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
    })
    const tokenRes = await fetch(`${WHOOP_AUTH}/token`, {
      method: 'POST', body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    if (!tokenRes.ok) throw new Error(`Token exchange failed: ${tokenRes.status}`)
    const tokens = await tokenRes.json() as any

    // Get profile
    const profile = await whoopGet(tokens.access_token, '/user/profile/basic').catch(() => ({})) as any
    const userId = String(profile.user_id || tokens.user_id || Date.now())

    const pool = getPool()
    await pool.query(`
      INSERT INTO whoop_tokens (user_id, email, full_name, access_token, refresh_token, expires_at, scope)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (user_id) DO UPDATE SET
        access_token=$4, refresh_token=$5, expires_at=$6, scope=$7, updated_at=NOW()
    `, [
      userId,
      profile.email || '',
      `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
      tokens.access_token,
      tokens.refresh_token,
      Date.now() + tokens.expires_in * 1000,
      tokens.scope || ''
    ])
    await pool.end()

    res.redirect(`${FRONTEND_URL}/whoop?connected=true&connect_code=${userId}`)
  } catch (e: any) {
    res.redirect(`${FRONTEND_URL}/whoop?error=${encodeURIComponent(e.message)}`)
  }
})

// POST /whoop/token-exchange — frontend sends connect_code after callback, gets confirmation
router.post('/token-exchange', async (req: Request, res: Response) => {
  const { connect_code } = req.body
  if (!connect_code) return res.status(400).json({ error: 'connect_code required' })
  try {
    const pool = getPool()
    const { rows } = await pool.query(
      'SELECT user_id, email, full_name FROM whoop_tokens WHERE user_id=$1',
      [connect_code]
    )
    await pool.end()
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true, user_id: rows[0].user_id, email: rows[0].email, full_name: rows[0].full_name })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

// GET /whoop/me — my data (recovery, sleep, strain, HRV)
router.get('/me', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || req.headers['x-user-id'] as string
    if (!userId) return res.json({ connected: false, recovery: null, sleep: null, strain: null })

    const pool = getPool()
    const { rows } = await pool.query('SELECT * FROM whoop_tokens WHERE user_id=$1', [userId])
    await pool.end()
    if (!rows.length) return res.json({ connected: false, recovery: null, sleep: null, strain: null })

    const token = rows[0]
    const accessToken = await refreshIfNeeded({ ...token, expires_at: Number(token.expires_at) })
    const data = await fetchUserData(accessToken, userId)

    res.json({ connected: true, ...data, cached: false, last_updated: new Date().toISOString() })
  } catch (e: any) {
    res.json({ connected: false, recovery: null, sleep: null, strain: null, error: e.message })
  }
})

// GET /whoop/team — all connected users with latest data
router.get('/team', async (_req: Request, res: Response) => {
  try {
    await ensureTable()
    const pool = getPool()
    const { rows: tokens } = await pool.query('SELECT * FROM whoop_tokens ORDER BY full_name')
    await pool.end()

    const team = await Promise.all(tokens.map(async (t) => {
      try {
        const accessToken = await refreshIfNeeded({ ...t, expires_at: Number(t.expires_at) })
        const data = await fetchUserData(accessToken, t.user_id)
        return {
          user_id:           t.user_id,
          full_name:         t.full_name,
          email:             t.email,
          recovery_score:    data.recovery?.score ?? null,
          hrv:               data.recovery?.hrv   ?? null,
          resting_hr:        data.recovery?.restingHr ?? null,
          sleep_performance: data.sleep?.performancePercent ?? null,
          sleep_hours:       data.sleep?.durationHours ?? null,
          strain_score:      data.strain?.score ?? null,
          snapshot_at:       new Date().toISOString(),
        }
      } catch {
        return {
          user_id: t.user_id, full_name: t.full_name, email: t.email,
          recovery_score: null, hrv: null, resting_hr: null,
          sleep_performance: null, sleep_hours: null, strain_score: null,
          snapshot_at: null,
        }
      }
    }))

    const connected = team.filter(m => m.recovery_score != null)
    res.json({
      team,
      total_connected: connected.length,
      averages: {
        recovery: connected.length
          ? connected.reduce((s, m) => s + (m.recovery_score || 0), 0) / connected.length
          : null,
        sleep: connected.length
          ? connected.reduce((s, m) => s + (m.sleep_performance || 0), 0) / connected.length
          : null,
        strain: connected.length
          ? connected.reduce((s, m) => s + (m.strain_score || 0), 0) / connected.length
          : null,
      },
    })
  } catch (e: any) {
    res.json({ team: [], total_connected: 0, averages: { recovery: null, sleep: null, strain: null }, error: e.message })
  }
})

// DELETE /whoop/disconnect — remove user's WHOOP connection
router.delete('/disconnect', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || req.headers['x-user-id'] as string
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })
    const pool = getPool()
    await pool.query('DELETE FROM whoop_tokens WHERE user_id=$1', [userId])
    await pool.end()
    res.json({ ok: true })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

export default router
