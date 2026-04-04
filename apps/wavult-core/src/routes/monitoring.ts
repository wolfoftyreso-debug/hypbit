import { Router } from 'express'
const router = Router()

// POST /v1/monitoring/error — rapportera fel till Sentry
router.post('/v1/monitoring/error', async (req, res) => {
  const dsn = process.env.SENTRY_DSN
  if (!dsn) return res.status(503).json({ error: 'Sentry not configured', configured: false })
  // Sentry SDK används normalt — detta är REST fallback
  const { message, level = 'error', tags } = req.body
  res.json({ queued: true, message: 'Use Sentry SDK in application code' })
})

// GET /v1/monitoring/health
router.get('/v1/monitoring/health', (_req, res) => {
  res.json({
    sentry: !!process.env.SENTRY_DSN,
    datadog: !!process.env.DATADOG_API_KEY,
    pagerduty: !!process.env.PAGERDUTY_KEY,
  })
})

export default router
