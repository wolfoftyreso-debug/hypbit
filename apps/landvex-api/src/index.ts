import express, { Request, Response, NextFunction } from 'express'
import { Pool } from 'pg'
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { RekognitionClient, DetectLabelsCommand } from '@aws-sdk/client-rekognition'
import { v4 as uuid } from 'uuid'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'

// ── CONFIG ────────────────────────────────────────────────────────────────────

if (!process.env.RDS_HOST) {
  console.error('[Landvex API] FATAL: RDS_HOST env var not set')
  process.exit(1)
}

const app = express()
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: false, limit: '1mb' }))

// Security headers
app.use((_req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.removeHeader('X-Powered-By')
  next()
})

const PORT = parseInt(process.env.PORT || '3006')
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'
const JWT_ISSUER = process.env.JWT_ISSUER || 'identity.wavult.com'
const S3_BUCKET = process.env.S3_BUCKET || 'wavult-images-eu-primary'
const AWS_REGION = process.env.AWS_REGION || 'eu-north-1'

// ── AWS CLIENTS ───────────────────────────────────────────────────────────────

const s3 = new S3Client({ region: AWS_REGION })
const rekognition = new RekognitionClient({ region: AWS_REGION })

// ── DATABASE ──────────────────────────────────────────────────────────────────

const pool = new Pool({
  host: process.env.RDS_HOST,
  port: parseInt(process.env.RDS_PORT || '5432'),
  database: process.env.RDS_DATABASE || 'wavult_identity',
  user: process.env.RDS_USER || 'wavult_admin',
  password: process.env.RDS_PASSWORD || '',
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

pool.on('error', (err) => console.error('[RDS] Pool error:', err.message))

// ── AUTH ──────────────────────────────────────────────────────────────────────

interface JwtUser {
  sub: string
  email: string
  roles: string[]
  org: string
}

declare global {
  namespace Express {
    interface Request { user?: JwtUser }
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) { res.status(401).json({ error: 'MISSING_TOKEN' }); return }
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET, {
      algorithms: ['HS256', 'RS256'],
      issuer: JWT_ISSUER,
    }) as JwtUser
    req.user = payload
    next()
  } catch (err) {
    const name = err instanceof Error ? err.name : ''
    if (name === 'TokenExpiredError') { res.status(401).json({ error: 'TOKEN_EXPIRED' }); return }
    res.status(401).json({ error: 'INVALID_TOKEN' })
  }
}

function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) { res.status(401).json({ error: 'UNAUTHORIZED' }); return }
    if (!roles.some(r => req.user!.roles?.includes(r))) {
      res.status(403).json({ error: 'FORBIDDEN' }); return
    }
    next()
  }
}

// ── RATE LIMITS ───────────────────────────────────────────────────────────────

const healthLimiter = rateLimit({ windowMs: 60_000, max: 30, standardHeaders: true, legacyHeaders: false })
const apiLimiter = rateLimit({ windowMs: 60_000, max: 200, standardHeaders: true, legacyHeaders: false })
app.use('/v1', apiLimiter)

// ── MIGRATION ─────────────────────────────────────────────────────────────────

async function runMigration(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS wavult.landvex_tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      description TEXT,
      lat FLOAT NOT NULL,
      lng FLOAT NOT NULL,
      radius_m INT DEFAULT 500,
      requirements JSONB DEFAULT '{}',
      status TEXT DEFAULT 'open',
      client_id UUID,
      created_by TEXT NOT NULL,
      assigned_to TEXT,
      claimed_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      version INT DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS wavult.landvex_submissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      task_id UUID REFERENCES wavult.landvex_tasks(id),
      user_id TEXT NOT NULL,
      image_key TEXT,
      metadata JSONB DEFAULT '{}',
      status TEXT DEFAULT 'pending',
      retry_count INT DEFAULT 0,
      idempotency_key TEXT UNIQUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS wavult.landvex_analysis_results (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      submission_id UUID REFERENCES wavult.landvex_submissions(id),
      detected_objects JSONB DEFAULT '[]',
      confidence_score FLOAT,
      flags JSONB DEFAULT '[]',
      model_version TEXT DEFAULT 'rekognition-v1',
      processed_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS wavult.landvex_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      aggregate_id UUID NOT NULL,
      aggregate_type TEXT NOT NULL,
      event_type TEXT NOT NULL,
      payload JSONB DEFAULT '{}',
      actor_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_landvex_tasks_status ON wavult.landvex_tasks(status);
    CREATE INDEX IF NOT EXISTS idx_landvex_tasks_geo ON wavult.landvex_tasks(lat, lng);
    CREATE INDEX IF NOT EXISTS idx_landvex_events_aggregate ON wavult.landvex_events(aggregate_id, event_type);
  `)
  console.log('[Landvex API] Migration complete')
}

// ── EVENT HELPER ──────────────────────────────────────────────────────────────

async function emitEvent(
  aggregateId: string,
  aggregateType: string,
  eventType: string,
  payload: Record<string, unknown>,
  actorId?: string
): Promise<void> {
  await pool.query(
    `INSERT INTO wavult.landvex_events (aggregate_id, aggregate_type, event_type, payload, actor_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [aggregateId, aggregateType, eventType, JSON.stringify(payload), actorId || null]
  )
}

// ── PROCESSING PIPELINE ───────────────────────────────────────────────────────

async function runProcessingPipeline(
  submissionId: string,
  taskId: string,
  imageKey: string,
  actorId: string
): Promise<void> {
  try {
    await pool.query(
      `UPDATE wavult.landvex_submissions SET status='processing', updated_at=NOW() WHERE id=$1`,
      [submissionId]
    )
    await emitEvent(submissionId, 'submission', 'PROCESSING_STARTED', { task_id: taskId }, actorId)

    // 1. Verify S3 object exists
    try {
      await s3.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: imageKey }))
    } catch {
      console.error(`[Pipeline] S3 object not found: ${imageKey}`)
      await pool.query(
        `UPDATE wavult.landvex_submissions SET status='failed', retry_count=retry_count+1, updated_at=NOW() WHERE id=$1`,
        [submissionId]
      )
      return
    }

    // 2. Run Rekognition
    const rekResult = await rekognition.send(new DetectLabelsCommand({
      Image: { S3Object: { Bucket: S3_BUCKET, Name: imageKey } },
      MaxLabels: 20,
      MinConfidence: 50,
    }))

    const labels = rekResult.Labels || []
    const detectedObjects = labels.map(l => ({
      label: l.Name,
      confidence: l.Confidence,
      categories: l.Categories?.map(c => c.Name),
    }))

    const avgConfidence = labels.length > 0
      ? labels.reduce((sum, l) => sum + (l.Confidence || 0), 0) / labels.length
      : 0

    // 3. Generate flags
    const flags: string[] = []
    const labelNames = labels.map(l => (l.Name || '').toLowerCase())
    const safetyKeywords = ['lifeguard', 'life jacket', 'safety', 'life preserver', 'flotation']
    const hasSafety = safetyKeywords.some(kw => labelNames.some(n => n.includes(kw)))
    if (!hasSafety) flags.push('no_safety_equipment_detected')
    if (avgConfidence < 60) flags.push('low_confidence_detection')

    // 4. Store analysis result
    await pool.query(
      `INSERT INTO wavult.landvex_analysis_results
       (submission_id, detected_objects, confidence_score, flags, model_version, processed_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [submissionId, JSON.stringify(detectedObjects), avgConfidence, JSON.stringify(flags), 'rekognition-v1']
    )

    // 5. Update submission + task
    await pool.query(
      `UPDATE wavult.landvex_submissions SET status='done', updated_at=NOW() WHERE id=$1`,
      [submissionId]
    )
    await pool.query(
      `UPDATE wavult.landvex_tasks SET status='completed', completed_at=NOW(), updated_at=NOW() WHERE id=$1`,
      [taskId]
    )

    // 6. Emit events
    await emitEvent(submissionId, 'submission', 'PROCESSING_COMPLETED', {
      task_id: taskId, objects_detected: detectedObjects.length, flags, confidence: avgConfidence,
    }, actorId)
    await emitEvent(taskId, 'task', 'RESULT_ATTACHED', {
      submission_id: submissionId, confidence: avgConfidence, flags,
    }, actorId)

    console.log(`[Pipeline] Completed: submission=${submissionId} confidence=${avgConfidence.toFixed(1)}% flags=${flags.join(',')}`)
  } catch (err) {
    console.error('[Pipeline] Failed:', err)
    await pool.query(
      `UPDATE wavult.landvex_submissions SET status='failed', retry_count=retry_count+1, updated_at=NOW() WHERE id=$1`,
      [submissionId]
    ).catch(() => {})
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ── HEALTH (no auth) ──────────────────────────────────────────────────────────

app.get('/health', healthLimiter, async (_req, res) => {
  let dbOk = false
  try { await pool.query('SELECT 1'); dbOk = true } catch {}
  res.json({
    status: dbOk ? 'ok' : 'degraded',
    service: 'landvex-api',
    version: '4.0.0',
    db: dbOk ? 'rds' : 'disconnected',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

// ── OBJECTS ───────────────────────────────────────────────────────────────────

app.get('/v1/objects', requireAuth, async (req, res) => {
  const { municipality, type, status, client_id, limit = '100', offset = '0' } = req.query
  const params: unknown[] = []
  let query = `SELECT o.*, c.name as client_name, c.type as client_type
    FROM wavult.landvex_objects o
    LEFT JOIN wavult.landvex_clients c ON c.id = o.client_id WHERE 1=1`
  if (municipality) { query += ` AND o.municipality = $${params.length + 1}`; params.push(municipality) }
  if (type) { query += ` AND o.type = $${params.length + 1}`; params.push(type) }
  if (status) { query += ` AND o.status = $${params.length + 1}`; params.push(status) }
  if (client_id) { query += ` AND o.client_id = $${params.length + 1}`; params.push(client_id) }
  query += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
  params.push(Number(limit), Number(offset))
  try {
    const result = await pool.query(query, params)
    const countResult = await pool.query(`SELECT COUNT(*) FROM wavult.landvex_objects`)
    return res.json({ data: result.rows, total: Number(countResult.rows[0].count), limit: Number(limit), offset: Number(offset) })
  } catch { return res.status(500).json({ error: 'INTERNAL_ERROR' }) }
})

app.get('/v1/objects/:id', requireAuth, async (req, res) => {
  try {
    const [objRes, alertsRes] = await Promise.all([
      pool.query(`SELECT o.*, c.name as client_name FROM wavult.landvex_objects o LEFT JOIN wavult.landvex_clients c ON c.id = o.client_id WHERE o.id = $1`, [req.params.id]),
      pool.query(`SELECT * FROM wavult.landvex_alerts WHERE object_id = $1 ORDER BY created_at DESC LIMIT 20`, [req.params.id]),
    ])
    if (objRes.rows.length === 0) return res.status(404).json({ error: 'NOT_FOUND' })
    return res.json({ ...objRes.rows[0], alerts: alertsRes.rows })
  } catch { return res.status(500).json({ error: 'INTERNAL_ERROR' }) }
})

app.post('/v1/objects', requireAuth, requireRole('admin', 'client'), async (req, res) => {
  const { name, type, municipality, lat, lng, status, client_id, metadata } = req.body
  if (!name || !type || !municipality) return res.status(400).json({ error: 'name, type, municipality required' })
  try {
    const result = await pool.query(
      `INSERT INTO wavult.landvex_objects (name, type, municipality, lat, lng, status, client_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, type, municipality, lat || null, lng || null, status || 'ok', client_id || null, metadata ? JSON.stringify(metadata) : '{}']
    )
    return res.status(201).json(result.rows[0])
  } catch { return res.status(500).json({ error: 'INTERNAL_ERROR' }) }
})

app.patch('/v1/objects/:id', requireAuth, requireRole('admin', 'client'), async (req, res) => {
  const { name, type, municipality, lat, lng, status, client_id, metadata, last_inspected } = req.body
  const updates: string[] = []; const params: unknown[] = []
  if (name !== undefined) { updates.push(`name=$${params.length + 1}`); params.push(name) }
  if (type !== undefined) { updates.push(`type=$${params.length + 1}`); params.push(type) }
  if (municipality !== undefined) { updates.push(`municipality=$${params.length + 1}`); params.push(municipality) }
  if (lat !== undefined) { updates.push(`lat=$${params.length + 1}`); params.push(lat) }
  if (lng !== undefined) { updates.push(`lng=$${params.length + 1}`); params.push(lng) }
  if (status !== undefined) { updates.push(`status=$${params.length + 1}`); params.push(status) }
  if (client_id !== undefined) { updates.push(`client_id=$${params.length + 1}`); params.push(client_id) }
  if (metadata !== undefined) { updates.push(`metadata=$${params.length + 1}`); params.push(JSON.stringify(metadata)) }
  if (last_inspected !== undefined) { updates.push(`last_inspected=$${params.length + 1}`); params.push(last_inspected); updates.push(`inspection_count=inspection_count+1`) }
  if (updates.length === 0) return res.status(400).json({ error: 'NO_FIELDS_TO_UPDATE' })
  params.push(req.params.id)
  try {
    const result = await pool.query(`UPDATE wavult.landvex_objects SET ${updates.join(', ')} WHERE id=$${params.length} RETURNING *`, params)
    if (result.rows.length === 0) return res.status(404).json({ error: 'NOT_FOUND' })
    return res.json(result.rows[0])
  } catch { return res.status(500).json({ error: 'INTERNAL_ERROR' }) }
})

// ── ALERTS ────────────────────────────────────────────────────────────────────

app.get('/v1/alerts', requireAuth, async (req, res) => {
  const { object_id, severity, resolved = 'false', acknowledged, limit = '100' } = req.query
  const params: unknown[] = []
  let query = `SELECT a.*, o.name as object_name, o.municipality, o.type as object_type
    FROM wavult.landvex_alerts a LEFT JOIN wavult.landvex_objects o ON o.id = a.object_id WHERE 1=1`
  if (resolved !== undefined) { query += ` AND a.resolved = $${params.length + 1}`; params.push(resolved === 'true') }
  if (object_id) { query += ` AND a.object_id = $${params.length + 1}`; params.push(object_id) }
  if (severity) { query += ` AND a.severity = $${params.length + 1}`; params.push(severity) }
  if (acknowledged !== undefined) { query += ` AND a.acknowledged = $${params.length + 1}`; params.push(acknowledged === 'true') }
  query += ` ORDER BY a.created_at DESC LIMIT $${params.length + 1}`
  params.push(Number(limit))
  try {
    const result = await pool.query(query, params)
    return res.json({ data: result.rows, total: result.rows.length })
  } catch { return res.status(500).json({ error: 'INTERNAL_ERROR' }) }
})

app.post('/v1/alerts', requireAuth, requireRole('admin', 'client'), async (req, res) => {
  const { object_id, severity, message, source } = req.body
  if (!severity || !message) return res.status(400).json({ error: 'severity and message required' })
  try {
    const result = await pool.query(
      `INSERT INTO wavult.landvex_alerts (object_id, severity, message, source, acknowledged, resolved)
       VALUES ($1, $2, $3, $4, false, false) RETURNING *`,
      [object_id || null, severity, message, source || 'system']
    )
    if (object_id && severity !== 'info') {
      const newStatus = severity === 'critical' ? 'critical' : 'alert'
      await pool.query(`UPDATE wavult.landvex_objects SET status=$1 WHERE id=$2 AND status IN ('ok','monitoring')`, [newStatus, object_id])
    }
    return res.status(201).json(result.rows[0])
  } catch { return res.status(500).json({ error: 'INTERNAL_ERROR' }) }
})

app.post('/v1/alerts/:id/acknowledge', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`UPDATE wavult.landvex_alerts SET acknowledged=true WHERE id=$1 RETURNING *`, [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'NOT_FOUND' })
    return res.json(result.rows[0])
  } catch { return res.status(500).json({ error: 'INTERNAL_ERROR' }) }
})

app.post('/v1/alerts/:id/resolve', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`UPDATE wavult.landvex_alerts SET resolved=true, acknowledged=true WHERE id=$1 RETURNING *`, [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'NOT_FOUND' })
    return res.json(result.rows[0])
  } catch { return res.status(500).json({ error: 'INTERNAL_ERROR' }) }
})

// ── CLIENTS ───────────────────────────────────────────────────────────────────

app.get('/v1/clients', requireAuth, async (req, res) => {
  const { type, status = 'active', limit = '100' } = req.query
  const params: unknown[] = []
  let query = `SELECT * FROM wavult.landvex_clients WHERE 1=1`
  if (type) { query += ` AND type = $${params.length + 1}`; params.push(type) }
  if (status) { query += ` AND status = $${params.length + 1}`; params.push(status) }
  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`
  params.push(Number(limit))
  try {
    const result = await pool.query(query, params)
    return res.json(result.rows)
  } catch { return res.status(500).json({ error: 'INTERNAL_ERROR' }) }
})

app.get('/v1/clients/:id', requireAuth, async (req, res) => {
  try {
    const [clientRes, objsRes] = await Promise.all([
      pool.query(`SELECT * FROM wavult.landvex_clients WHERE id=$1`, [req.params.id]),
      pool.query(`SELECT * FROM wavult.landvex_objects WHERE client_id=$1 ORDER BY created_at DESC`, [req.params.id]),
    ])
    if (clientRes.rows.length === 0) return res.status(404).json({ error: 'NOT_FOUND' })
    return res.json({ ...clientRes.rows[0], objects: objsRes.rows })
  } catch { return res.status(500).json({ error: 'INTERNAL_ERROR' }) }
})

app.post('/v1/clients', requireAuth, requireRole('admin'), async (req, res) => {
  const { name, org_nr, type, contact_email, contact_phone, contract_start, contract_end } = req.body
  if (!name) return res.status(400).json({ error: 'name required' })
  try {
    const result = await pool.query(
      `INSERT INTO wavult.landvex_clients (name, org_nr, type, contact_email, contact_phone, contract_start, contract_end, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active') RETURNING *`,
      [name, org_nr || null, type || 'municipality', contact_email || null, contact_phone || null, contract_start || null, contract_end || null]
    )
    return res.status(201).json(result.rows[0])
  } catch { return res.status(500).json({ error: 'INTERNAL_ERROR' }) }
})

app.patch('/v1/clients/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const { name, org_nr, type, contact_email, contact_phone, contract_start, contract_end, status } = req.body
  const updates: string[] = []; const params: unknown[] = []
  if (name !== undefined) { updates.push(`name=$${params.length + 1}`); params.push(name) }
  if (org_nr !== undefined) { updates.push(`org_nr=$${params.length + 1}`); params.push(org_nr) }
  if (type !== undefined) { updates.push(`type=$${params.length + 1}`); params.push(type) }
  if (contact_email !== undefined) { updates.push(`contact_email=$${params.length + 1}`); params.push(contact_email) }
  if (contact_phone !== undefined) { updates.push(`contact_phone=$${params.length + 1}`); params.push(contact_phone) }
  if (contract_start !== undefined) { updates.push(`contract_start=$${params.length + 1}`); params.push(contract_start) }
  if (contract_end !== undefined) { updates.push(`contract_end=$${params.length + 1}`); params.push(contract_end) }
  if (status !== undefined) { updates.push(`status=$${params.length + 1}`); params.push(status) }
  if (updates.length === 0) return res.status(400).json({ error: 'NO_FIELDS_TO_UPDATE' })
  params.push(req.params.id)
  try {
    const result = await pool.query(`UPDATE wavult.landvex_clients SET ${updates.join(', ')} WHERE id=$${params.length} RETURNING *`, params)
    if (result.rows.length === 0) return res.status(404).json({ error: 'NOT_FOUND' })
    return res.json(result.rows[0])
  } catch { return res.status(500).json({ error: 'INTERNAL_ERROR' }) }
})

// ── STATS ─────────────────────────────────────────────────────────────────────

app.get('/v1/stats', requireAuth, async (_req, res) => {
  try {
    const [objectsRes, alertsRes, clientsRes, tasksRes] = await Promise.all([
      pool.query(`SELECT status, COUNT(*) as cnt FROM wavult.landvex_objects GROUP BY status`),
      pool.query(`SELECT severity, COUNT(*) as cnt FROM wavult.landvex_alerts WHERE resolved=false GROUP BY severity`),
      pool.query(`SELECT COUNT(*) as cnt FROM wavult.landvex_clients`),
      pool.query(`SELECT status, COUNT(*) as cnt FROM wavult.landvex_tasks GROUP BY status`),
    ])
    const objectsByStatus: Record<string, number> = {}
    for (const row of objectsRes.rows) objectsByStatus[row.status] = Number(row.cnt)
    const alertsBySeverity: Record<string, number> = {}
    for (const row of alertsRes.rows) alertsBySeverity[row.severity] = Number(row.cnt)
    const tasksByStatus: Record<string, number> = {}
    for (const row of tasksRes.rows) tasksByStatus[row.status] = Number(row.cnt)
    return res.json({
      objects: { total: Object.values(objectsByStatus).reduce((a, b) => a + b, 0), by_status: objectsByStatus },
      alerts: { active: Object.values(alertsBySeverity).reduce((a, b) => a + b, 0), by_severity: alertsBySeverity },
      clients: { total: Number(clientsRes.rows[0].cnt) },
      tasks: { total: Object.values(tasksByStatus).reduce((a, b) => a + b, 0), by_status: tasksByStatus },
    })
  } catch { return res.status(500).json({ error: 'INTERNAL_ERROR' }) }
})

// ── TASKS ─────────────────────────────────────────────────────────────────────

// POST /v1/tasks — create task (admin/client only)
app.post('/v1/tasks', requireAuth, requireRole('admin', 'client'), async (req, res) => {
  const { title, description, lat, lng, radius_m, requirements, client_id } = req.body
  if (!title) return res.status(400).json({ error: 'title required' })
  if (lat === undefined || lng === undefined || isNaN(Number(lat)) || isNaN(Number(lng))) {
    return res.status(400).json({ error: 'lat and lng required' })
  }
  try {
    const result = await pool.query(
      `INSERT INTO wavult.landvex_tasks (title, description, lat, lng, radius_m, requirements, client_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, description || null, Number(lat), Number(lng), radius_m || 500,
       requirements ? JSON.stringify(requirements) : '{}', client_id || null, req.user!.sub]
    )
    const task = result.rows[0]
    await emitEvent(task.id, 'task', 'TASK_CREATED', { title, lat, lng, client_id }, req.user!.sub)
    await emitEvent(task.id, 'task', 'TASK_AVAILABLE', { task_id: task.id }, req.user!.sub)
    return res.status(201).json(task)
  } catch { return res.status(500).json({ error: 'INTERNAL_ERROR' }) }
})

// GET /v1/tasks — geo search or list all
app.get('/v1/tasks', requireAuth, async (req, res) => {
  const { lat, lng, radius = '50', status, limit = '100', offset = '0' } = req.query
  const params: unknown[] = []
  let query = `SELECT * FROM wavult.landvex_tasks WHERE 1=1`
  if (lat && lng) {
    const r = Number(radius) / 111 // degrees approximation
    query += ` AND (lat - $${params.length + 1})^2 + (lng - $${params.length + 2})^2 < $${params.length + 3}^2`
    params.push(Number(lat), Number(lng), r)
  }
  if (status) { query += ` AND status = $${params.length + 1}`; params.push(status) }
  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
  params.push(Number(limit), Number(offset))
  try {
    const result = await pool.query(query, params)
    return res.json({ data: result.rows, total: result.rows.length, limit: Number(limit), offset: Number(offset) })
  } catch { return res.status(500).json({ error: 'INTERNAL_ERROR' }) }
})

// GET /v1/tasks/:id — task detail with submissions + result
app.get('/v1/tasks/:id', requireAuth, async (req, res) => {
  try {
    const [taskRes, subsRes] = await Promise.all([
      pool.query(`SELECT * FROM wavult.landvex_tasks WHERE id=$1`, [req.params.id]),
      pool.query(
        `SELECT s.*, a.detected_objects, a.confidence_score, a.flags, a.model_version, a.processed_at
         FROM wavult.landvex_submissions s
         LEFT JOIN wavult.landvex_analysis_results a ON a.submission_id = s.id
         WHERE s.task_id=$1 ORDER BY s.created_at DESC`,
        [req.params.id]
      ),
    ])
    if (taskRes.rows.length === 0) return res.status(404).json({ error: 'NOT_FOUND' })
    return res.json({ ...taskRes.rows[0], submissions: subsRes.rows })
  } catch { return res.status(500).json({ error: 'INTERNAL_ERROR' }) }
})

// POST /v1/tasks/:id/claim — zoomer claims task
app.post('/v1/tasks/:id/claim', requireAuth, requireRole('zoomer'), async (req, res) => {
  try {
    const taskRes = await pool.query(`SELECT * FROM wavult.landvex_tasks WHERE id=$1`, [req.params.id])
    if (taskRes.rows.length === 0) return res.status(404).json({ error: 'NOT_FOUND' })
    const task = taskRes.rows[0]
    if (task.status !== 'open') return res.status(409).json({ error: 'TASK_NOT_OPEN', current_status: task.status })

    // Optimistic lock — only update if still open at same version
    const result = await pool.query(
      `UPDATE wavult.landvex_tasks
       SET status='claimed', assigned_to=$1, claimed_at=NOW(), version=version+1, updated_at=NOW()
       WHERE id=$2 AND status='open' AND version=$3
       RETURNING *`,
      [req.user!.sub, req.params.id, task.version]
    )
    if (result.rows.length === 0) return res.status(409).json({ error: 'TASK_ALREADY_CLAIMED' })

    await emitEvent(req.params.id, 'task', 'TASK_CLAIMED', { zoomer_id: req.user!.sub }, req.user!.sub)
    return res.json(result.rows[0])
  } catch { return res.status(500).json({ error: 'INTERNAL_ERROR' }) }
})

// ── UPLOAD URL ────────────────────────────────────────────────────────────────

// POST /v1/upload-url — get presigned S3 URL for image upload
app.post('/v1/upload-url', requireAuth, requireRole('zoomer'), async (req, res) => {
  const { task_id, file_type } = req.body
  if (!task_id || !file_type) return res.status(400).json({ error: 'task_id and file_type required' })
  const validTypes = ['jpg', 'jpeg', 'png', 'heic']
  if (!validTypes.includes(file_type)) return res.status(400).json({ error: 'Invalid file_type. Allowed: jpg, jpeg, png, heic' })
  try {
    const taskRes = await pool.query(`SELECT * FROM wavult.landvex_tasks WHERE id=$1`, [task_id])
    if (taskRes.rows.length === 0) return res.status(404).json({ error: 'TASK_NOT_FOUND' })
    if (taskRes.rows[0].assigned_to !== req.user!.sub) return res.status(403).json({ error: 'NOT_TASK_OWNER' })

    const key = `landvex/orig/${task_id}/${uuid()}.${file_type}`
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: `image/${file_type === 'heic' ? 'heif' : file_type}`,
    })
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 })
    return res.json({ upload_url: uploadUrl, key, expires_in: 300 })
  } catch { return res.status(500).json({ error: 'INTERNAL_ERROR' }) }
})

// ── SUBMISSIONS ───────────────────────────────────────────────────────────────

// POST /v1/submissions — register submission + start processing
app.post('/v1/submissions', requireAuth, requireRole('zoomer'), async (req, res) => {
  const { task_id, image_key, metadata, idempotency_key } = req.body
  if (!task_id || !idempotency_key) return res.status(400).json({ error: 'task_id and idempotency_key required' })

  try {
    // Idempotency check
    const existing = await pool.query(
      `SELECT * FROM wavult.landvex_submissions WHERE idempotency_key=$1`, [idempotency_key]
    )
    if (existing.rows.length > 0) {
      return res.status(200).json({ submission_id: existing.rows[0].id, status: existing.rows[0].status, idempotent: true })
    }

    // Validate task ownership
    const taskRes = await pool.query(`SELECT * FROM wavult.landvex_tasks WHERE id=$1`, [task_id])
    if (taskRes.rows.length === 0) return res.status(404).json({ error: 'TASK_NOT_FOUND' })
    if (taskRes.rows[0].assigned_to !== req.user!.sub) return res.status(403).json({ error: 'NOT_TASK_OWNER' })

    const submissionId = uuid()
    await pool.query(
      `INSERT INTO wavult.landvex_submissions (id, task_id, user_id, image_key, metadata, status, idempotency_key)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6)`,
      [submissionId, task_id, req.user!.sub, image_key || null, JSON.stringify(metadata || {}), idempotency_key]
    )

    await emitEvent(submissionId, 'submission', 'IMAGE_UPLOADED', { task_id, image_key }, req.user!.sub)

    // Start async processing pipeline
    if (image_key) {
      setImmediate(() => runProcessingPipeline(submissionId, task_id, image_key, req.user!.sub))
    }

    return res.status(202).json({ submission_id: submissionId, status: 'pending', message: 'Processing started' })
  } catch { return res.status(500).json({ error: 'INTERNAL_ERROR' }) }
})

// ── RESULTS ───────────────────────────────────────────────────────────────────

// GET /v1/tasks/:id/result — analysis result for client/admin
app.get('/v1/tasks/:id/result', requireAuth, requireRole('admin', 'client'), async (req, res) => {
  try {
    const [taskRes, subsRes] = await Promise.all([
      pool.query(`SELECT * FROM wavult.landvex_tasks WHERE id=$1`, [req.params.id]),
      pool.query(
        `SELECT s.id, s.status, s.created_at, s.metadata,
                a.detected_objects, a.confidence_score, a.flags, a.model_version, a.processed_at
         FROM wavult.landvex_submissions s
         LEFT JOIN wavult.landvex_analysis_results a ON a.submission_id = s.id
         WHERE s.task_id=$1 AND s.status='done'
         ORDER BY s.created_at DESC`,
        [req.params.id]
      ),
    ])
    if (taskRes.rows.length === 0) return res.status(404).json({ error: 'NOT_FOUND' })
    const submissions = subsRes.rows.map(row => ({
      id: row.id, status: row.status, created_at: row.created_at, metadata: row.metadata,
      analysis: row.detected_objects ? {
        detected_objects: row.detected_objects,
        confidence_score: row.confidence_score,
        flags: row.flags,
        model_version: row.model_version,
        processed_at: row.processed_at,
      } : null,
    }))
    return res.json({ task: taskRes.rows[0], submissions })
  } catch { return res.status(500).json({ error: 'INTERNAL_ERROR' }) }
})

// ── EVENTS (audit trail) ──────────────────────────────────────────────────────

// GET /v1/events/:aggregate_id — event sourcing replay
app.get('/v1/events/:aggregate_id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM wavult.landvex_events WHERE aggregate_id=$1 ORDER BY created_at ASC`,
      [req.params.aggregate_id]
    )
    return res.json({ aggregate_id: req.params.aggregate_id, events: result.rows })
  } catch { return res.status(500).json({ error: 'INTERNAL_ERROR' }) }
})

// ── WEBHOOKS (no auth — internal BOS) ────────────────────────────────────────

app.post('/v1/webhooks/bos', (req, res) => {
  const { jobId, type, payload } = req.body
  console.log(`[BOS Webhook] ${type}`, { jobId, payload })
  res.json({ jobId, status: 'SUCCESS', processedAt: new Date().toISOString() })
})

// ── 404 ───────────────────────────────────────────────────────────────────────

app.use((_req, res) => res.status(404).json({ error: 'NOT_FOUND' }))

// ── START ─────────────────────────────────────────────────────────────────────

app.listen(PORT, async () => {
  console.log(`[Landvex API] Listening on port ${PORT}`)
  console.log(`[Landvex API] DB: RDS PostgreSQL (wavult schema)`)
  console.log(`[Landvex API] Environment: ${process.env.NODE_ENV || 'development'}`)
  try {
    await runMigration()
  } catch (err) {
    console.error('[Landvex API] Migration failed:', err)
  }
})
