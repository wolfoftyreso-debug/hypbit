import { Router } from 'express'
const router = Router()

// POST /v1/analytics/track — Mixpanel event tracking
router.post('/v1/analytics/track', async (req, res) => {
  const token = process.env.MIXPANEL_TOKEN
  if (!token) return res.status(503).json({ error: 'Mixpanel not configured', configured: false })
  const { event, properties = {}, distinct_id } = req.body
  const data = Buffer.from(JSON.stringify([{ event, properties: { ...properties, distinct_id, token } }])).toString('base64')
  const r = await fetch(`https://api.mixpanel.com/track?data=${data}`)
  res.json({ tracked: r.ok })
})

// GET /v1/analytics/email/verify?email=x — Hunter.io email-verifiering
router.get('/v1/analytics/email/verify', async (req, res) => {
  const key = process.env.HUNTER_API_KEY
  if (!key) return res.status(503).json({ error: 'Hunter not configured', configured: false })
  const { email } = req.query
  const r = await fetch(`https://api.hunter.io/v2/email-verifier?email=${email}&api_key=${key}`)
  res.json(await r.json())
})

// GET /v1/analytics/company/enrich?domain=x — Clearbit company enrichment
router.get('/v1/analytics/company/enrich', async (req, res) => {
  const key = process.env.CLEARBIT_API_KEY
  if (!key) return res.status(503).json({ error: 'Clearbit not configured', configured: false })
  const { domain } = req.query
  const r = await fetch(`https://company.clearbit.com/v2/companies/find?domain=${domain}`, {
    headers: { Authorization: `Bearer ${key}` }
  })
  res.json(await r.json())
})

// GET /v1/analytics/health
router.get('/v1/analytics/health', (_req, res) => {
  res.json({
    mixpanel: !!process.env.MIXPANEL_TOKEN,
    hunter: !!process.env.HUNTER_API_KEY,
    clearbit: !!process.env.CLEARBIT_API_KEY,
    ga4: !!process.env.GA4_MEASUREMENT_ID,
  })
})

export default router
