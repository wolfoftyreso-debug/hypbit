/**
 * System Audit — /v1/system/audit
 * Parallella health-checks mot alla kritiska infrastrukturkomponenter
 * Inga auth-krav — intern observability endpoint
 */
import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'
import { ECSClient, DescribeServicesCommand } from '@aws-sdk/client-ecs'
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3'
import * as https from 'https'

const router = Router()

// ─── Types ────────────────────────────────────────────────────────────────────

interface CheckResult {
  id: string
  name: string
  status: 'ok' | 'warn' | 'error'
  latencyMs: number
  detail: string
  lastOk: string | null
}

// ─── Weights (summerar till 1.0) ─────────────────────────────────────────────

const WEIGHTS: Record<string, number> = {
  ecs:        0.30,
  supabase:   0.25,
  alb:        0.20,
  s3:         0.10,
  gitea:      0.10,
  cloudflare: 0.05,
}

function scoreStatus(status: 'ok' | 'warn' | 'error'): number {
  if (status === 'ok')   return 100
  if (status === 'warn') return 60
  return 0
}

// ─── HTTP helpers ────────────────────────────────────────────────────────────

function httpHead(url: string): Promise<{ status: number }> {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method: 'HEAD' }, res => {
      res.resume()
      resolve({ status: res.statusCode ?? 0 })
    })
    req.on('error', reject)
    req.setTimeout(5000, () => { req.destroy(); reject(new Error('timeout')) })
    req.end()
  })
}

function httpGetJson(
  url: string,
  headers: Record<string, string> = {}
): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, res => {
      let raw = ''
      res.on('data', (chunk: string) => { raw += chunk })
      res.on('end', () => {
        try { resolve({ status: res.statusCode ?? 0, body: JSON.parse(raw) }) }
        catch { resolve({ status: res.statusCode ?? 0, body: raw }) }
      })
    })
    req.on('error', reject)
    req.setTimeout(5000, () => { req.destroy(); reject(new Error('timeout')) })
  })
}

function raceTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms)),
  ])
}

// ─── Checks ──────────────────────────────────────────────────────────────────

async function checkSupabase(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const url = process.env.SUPABASE_URL ?? ''
    const key = process.env.SUPABASE_SERVICE_KEY ?? ''
    if (!url || !key) throw new Error('SUPABASE_URL/SUPABASE_SERVICE_KEY not configured')
    const supabase = createClient(url, key)
    const { error } = await raceTimeout(
      supabase.from('audit_log').select('id').limit(1),
      5000
    )
    if (error) throw new Error(error.message)
    return { id: 'supabase', name: 'Supabase', status: 'ok', latencyMs: Date.now() - start, detail: 'SELECT 1 ok', lastOk: new Date().toISOString() }
  } catch (err) {
    return { id: 'supabase', name: 'Supabase', status: 'error', latencyMs: Date.now() - start, detail: String(err), lastOk: null }
  }
}

async function checkECS(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const ecs = new ECSClient({ region: 'eu-north-1' })
    const services = ['wavult-os-api', 'quixzoom-api', 'n8n', 'team-pulse']
    const result = await raceTimeout(
      ecs.send(new DescribeServicesCommand({ cluster: 'wavult', services })),
      5000
    )
    const svcs = result.services ?? []
    const down = svcs.filter(s => (s.runningCount ?? 0) === 0 && (s.desiredCount ?? 0) > 0)
    const degraded = svcs.filter(s => (s.runningCount ?? 0) > 0 && (s.runningCount ?? 0) < (s.desiredCount ?? 0))

    let status: 'ok' | 'warn' | 'error' = 'ok'
    let detail = `${svcs.length} services ok`
    if (down.length > 0) {
      status = 'error'
      detail = `Down: ${down.map(s => s.serviceName).join(', ')}`
    } else if (degraded.length > 0) {
      status = 'warn'
      detail = `Degraded: ${degraded.map(s => s.serviceName).join(', ')}`
    }
    return { id: 'ecs', name: 'ECS Cluster', status, latencyMs: Date.now() - start, detail, lastOk: status !== 'error' ? new Date().toISOString() : null }
  } catch (err) {
    return { id: 'ecs', name: 'ECS Cluster', status: 'error', latencyMs: Date.now() - start, detail: String(err), lastOk: null }
  }
}

async function checkALB(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const res = await httpGetJson('https://api.wavult.com/health')
    const latencyMs = Date.now() - start
    if (res.status >= 200 && res.status < 300) {
      return { id: 'alb', name: 'ALB / API', status: 'ok', latencyMs, detail: `HTTP ${res.status}`, lastOk: new Date().toISOString() }
    }
    return { id: 'alb', name: 'ALB / API', status: 'warn', latencyMs, detail: `HTTP ${res.status}`, lastOk: null }
  } catch (err) {
    return { id: 'alb', name: 'ALB / API', status: 'error', latencyMs: Date.now() - start, detail: String(err), lastOk: null }
  }
}

async function checkGitea(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const res = await httpHead('https://git.wavult.com')
    const latencyMs = Date.now() - start
    if (res.status >= 200 && res.status < 400) {
      return { id: 'gitea', name: 'Gitea', status: 'ok', latencyMs, detail: `HTTP ${res.status}`, lastOk: new Date().toISOString() }
    }
    return { id: 'gitea', name: 'Gitea', status: 'warn', latencyMs, detail: `HTTP ${res.status}`, lastOk: null }
  } catch (err) {
    return { id: 'gitea', name: 'Gitea', status: 'error', latencyMs: Date.now() - start, detail: String(err), lastOk: null }
  }
}

async function checkS3(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const s3 = new S3Client({ region: 'eu-north-1' })
    await raceTimeout(
      s3.send(new HeadBucketCommand({ Bucket: 'wavult-images-eu-primary' })),
      5000
    )
    return { id: 's3', name: 'S3 Bucket', status: 'ok', latencyMs: Date.now() - start, detail: 'HeadBucket ok', lastOk: new Date().toISOString() }
  } catch (err) {
    return { id: 's3', name: 'S3 Bucket', status: 'error', latencyMs: Date.now() - start, detail: String(err), lastOk: null }
  }
}

async function checkCloudflare(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const email = process.env.CF_EMAIL ?? ''
    const token = process.env.CLOUDFLARE_API_TOKEN ?? ''
    const res = await httpGetJson(
      'https://api.cloudflare.com/client/v4/zones/5bed27e91d719b3f9d82c234d191ad99',
      { 'X-Auth-Email': email, 'X-Auth-Key': token }
    )
    const latencyMs = Date.now() - start
    const body = res.body as { success?: boolean; result?: { status?: string } }
    if (!body.success) {
      return { id: 'cloudflare', name: 'Cloudflare', status: 'warn', latencyMs, detail: `HTTP ${res.status} — success=false`, lastOk: null }
    }
    return { id: 'cloudflare', name: 'Cloudflare', status: 'ok', latencyMs, detail: `Zone ${body.result?.status ?? 'active'}`, lastOk: new Date().toISOString() }
  } catch (err) {
    return { id: 'cloudflare', name: 'Cloudflare', status: 'error', latencyMs: Date.now() - start, detail: String(err), lastOk: null }
  }
}

// ─── Route ───────────────────────────────────────────────────────────────────

// GET /v1/system/audit
router.get('/audit', async (_req, res) => {
  const settled = await Promise.allSettled([
    checkSupabase(),
    checkECS(),
    checkALB(),
    checkGitea(),
    checkS3(),
    checkCloudflare(),
  ])

  const fallbackIds   = ['supabase', 'ecs', 'alb', 'gitea', 's3', 'cloudflare']
  const fallbackNames = ['Supabase', 'ECS Cluster', 'ALB / API', 'Gitea', 'S3 Bucket', 'Cloudflare']

  const checks: CheckResult[] = settled.map((r, i) => {
    if (r.status === 'fulfilled') return r.value
    return {
      id:        fallbackIds[i],
      name:      fallbackNames[i],
      status:    'error',
      latencyMs: 5000,
      detail:    String(r.reason),
      lastOk:    null,
    }
  })

  let healthScore = 0
  for (const check of checks) {
    healthScore += scoreStatus(check.status) * (WEIGHTS[check.id] ?? 0)
  }
  healthScore = Math.round(healthScore)

  const overall: 'operational' | 'degraded' | 'down' =
    healthScore >= 80 ? 'operational' : healthScore >= 50 ? 'degraded' : 'down'

  const alerts = checks
    .filter(c => c.status !== 'ok')
    .map(c => `${c.name}: ${c.detail}`)

  res.json({ timestamp: new Date().toISOString(), overall, healthScore, checks, alerts })
})

export default router
