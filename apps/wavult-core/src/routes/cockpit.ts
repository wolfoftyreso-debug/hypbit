/**
 * Wavult Cockpit API — /api/cockpit/*
 * Aggregates real-time metrics from all systems
 * Sources: AWS CloudWatch, Gitea, custom heartbeats, PostgreSQL, Cloudflare
 */
import { Router, Request, Response } from 'express'
import { createClient } from '@supabase/supabase-js'
import * as https from 'https'

const router = Router()

// ── HELPERS ───────────────────────────────────────────────────────────────────

function httpGet(url: string, headers: Record<string, string> = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, res => {
      let data = ''
      res.on('data', d => data += d)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
        catch { resolve({ status: res.statusCode, body: data }) }
      })
    })
    req.on('error', reject)
    req.setTimeout(5000, () => { req.destroy(); reject(new Error('timeout')) })
  })
}

// ── LATENCY CHECK ─────────────────────────────────────────────────────────────

async function checkLatency(url: string): Promise<{ ms: number; status: number; ok: boolean }> {
  const start = Date.now()
  try {
    const res = await httpGet(url)
    return { ms: Date.now() - start, status: res.status || 200, ok: true }
  } catch {
    return { ms: Date.now() - start, status: 0, ok: false }
  }
}

// ── AWS CLOUDWATCH / ECS ──────────────────────────────────────────────────────

async function getECSMetrics(_serviceName: string): Promise<any> {
  // In production: use AWS SDK with IAM role attached to ECS task
  // Simplified: call internal ECS metadata endpoint (only available inside ECS)
  try {
    const res = await httpGet('http://169.254.170.2/v2/stats', {})
    return { cpu: res.body?.cpu_percent || 0, memory: res.body?.memory_percent || 0 }
  } catch {
    return { cpu: 0, memory: 0 }
  }
}

// ── GITEA METRICS ─────────────────────────────────────────────────────────────

async function getGiteaMetrics(): Promise<any> {
  const token = process.env.GITEA_TOKEN || ''
  const base = process.env.GITEA_URL || 'https://git.wavult.com'
  try {
    const [repos, issues] = await Promise.allSettled([
      httpGet(`${base}/api/v1/repos/search?limit=50&token=${token}`),
      httpGet(`${base}/api/v1/repos/wavult/wavult-os/issues?state=open&token=${token}`),
    ])
    const repoData = repos.status === 'fulfilled' ? repos.value.body : {}
    const issueData = issues.status === 'fulfilled' ? issues.value.body : []
    return {
      total_repos: repoData?.data?.length || 0,
      live_repos: repoData?.data?.filter((r: any) => r.topics?.includes('status-live'))?.length || 0,
      open_issues: Array.isArray(issueData) ? issueData.length : 0,
    }
  } catch {
    return { total_repos: 0, live_repos: 0, open_issues: 0 }
  }
}

// ── DB METRICS ────────────────────────────────────────────────────────────────

async function getDBMetrics(): Promise<any> {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !supabaseKey) return { journal_entries: 0, customer_accounts: 0, deployments: 0 }

  const sb = createClient(supabaseUrl, supabaseKey)
  try {
    const [je, accts, deps] = await Promise.allSettled([
      sb.from('journal_entries').select('count', { count: 'exact', head: true }),
      sb.from('customer_accounts').select('count', { count: 'exact', head: true }),
      sb.from('deployments').select('count', { count: 'exact', head: true }),
    ])
    return {
      journal_entries: je.status === 'fulfilled' ? je.value.count || 0 : 0,
      customer_accounts: accts.status === 'fulfilled' ? accts.value.count || 0 : 0,
      deployments: deps.status === 'fulfilled' ? deps.value.count || 0 : 0,
    }
  } catch {
    return { journal_entries: 0, customer_accounts: 0, deployments: 0 }
  }
}

// ── CLOUDFLARE ANALYTICS ──────────────────────────────────────────────────────

async function getCFAnalytics(zoneId: string): Promise<any> {
  const token = process.env.CLOUDFLARE_API_TOKEN || ''
  const email = process.env.CF_EMAIL || ''
  if (!token || !email || !zoneId) return { requests: 0, bandwidth_gb: '0', threats: 0, pageviews: 0 }
  try {
    const res = await httpGet(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/analytics/dashboard?since=-60&until=0`,
      { 'X-Auth-Email': email, 'X-Auth-Key': token }
    )
    const totals = res.body?.result?.totals || {}
    return {
      requests: totals.requests?.all || 0,
      bandwidth_gb: ((totals.bandwidth?.all || 0) / 1024 / 1024 / 1024).toFixed(2),
      threats: totals.threats?.all || 0,
      pageviews: totals.pageviews?.all || 0,
    }
  } catch {
    return { requests: 0, bandwidth_gb: '0', threats: 0, pageviews: 0 }
  }
}

// ── MAIN METRICS ENDPOINT ─────────────────────────────────────────────────────

router.get('/metrics', async (_req: Request, res: Response) => {
  const start = Date.now()

  const SITES = [
    { name: 'wavult.com',     url: 'https://wavult.com/',          zone: '5bed27e91d719b3f9d82c234d191ad99' },
    { name: 'quixzoom.com',   url: 'https://quixzoom.com/',        zone: 'e9a9520b64cd67eca1d8d926ca9daa79' },
    { name: 'landvex.com',    url: 'https://landvex.com/',         zone: 'b079bed4fa20d093ea5b44428bea8ffd' },
    { name: 'api.wavult.com', url: 'https://api.wavult.com/health', zone: '' },
    { name: 'git.wavult.com', url: 'https://git.wavult.com/',      zone: '' },
  ]

  const [latencies, gitea, db, primaryCF] = await Promise.allSettled([
    Promise.all(SITES.map(s => checkLatency(s.url).then(l => ({ ...l, site: s.name })))),
    getGiteaMetrics(),
    getDBMetrics(),
    getCFAnalytics('5bed27e91d719b3f9d82c234d191ad99'),
  ])

  const latencyData = latencies.status === 'fulfilled' ? latencies.value : []
  const giteaData   = gitea.status === 'fulfilled'     ? gitea.value     : {}
  const dbData      = db.status === 'fulfilled'        ? db.value        : {}
  const cfData      = primaryCF.status === 'fulfilled'  ? primaryCF.value : {}

  // Health score (0–100)
  const upSites    = latencyData.filter((l: any) => l.ok).length
  const avgLatency = latencyData.length > 0
    ? latencyData.reduce((s: number, l: any) => s + l.ms, 0) / latencyData.length
    : 999
  const healthScore = Math.round(
    (upSites / Math.max(SITES.length, 1)) * 60 +
    (avgLatency < 200 ? 25 : avgLatency < 500 ? 15 : 5) +
    ((giteaData as any).live_repos > 5 ? 15 : 5)
  )

  res.json({
    timestamp:   new Date().toISOString(),
    collect_ms:  Date.now() - start,
    health_score: healthScore,
    status: healthScore > 80 ? 'nominal' : healthScore > 60 ? 'degraded' : 'critical',
    sites: latencyData,
    infrastructure: {
      live_repos:   (giteaData as any).live_repos   || 0,
      total_repos:  (giteaData as any).total_repos  || 0,
      open_issues:  (giteaData as any).open_issues  || 0,
    },
    database: dbData,
    traffic:  cfData,
    alerts: latencyData
      .filter((l: any) => !l.ok || l.ms > 2000)
      .map((l: any) => ({
        site:     l.site,
        severity: !l.ok ? 'critical' : 'warning',
        message:  !l.ok ? `${l.site} is down` : `${l.site} slow (${l.ms}ms)`,
      })),
  })
})

// GET /api/cockpit/heartbeat — simple alive check
router.get('/heartbeat', (_req: Request, res: Response) => {
  res.json({ ok: true, ts: new Date().toISOString(), service: 'wavult-cockpit' })
})

export default router
