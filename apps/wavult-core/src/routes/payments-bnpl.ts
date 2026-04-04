import { Router } from 'express'
const router = Router()

// POST /v1/payments/klarna/session — skapa Klarna-session
router.post('/v1/payments/klarna/session', async (req, res) => {
  const key = process.env.KLARNA_API_KEY
  const username = process.env.KLARNA_USERNAME
  if (!key || !username) return res.status(503).json({ error: 'Klarna not configured', configured: false })
  const { amount, currency = 'SEK', locale = 'sv-SE', items } = req.body
  const credentials = Buffer.from(`${username}:${key}`).toString('base64')
  try {
    const r = await fetch('https://api.klarna.com/payments/v1/sessions', {
      method: 'POST',
      headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ purchase_country: 'SE', purchase_currency: currency, locale, order_amount: amount, order_lines: items || [] })
    })
    res.json(await r.json())
  } catch (err: any) { res.status(500).json({ error: err.message }) }
})

// POST /v1/payments/swish/initiate — starta Swish-betalning
router.post('/v1/payments/swish/initiate', async (req, res) => {
  const swishNumber = process.env.SWISH_PAYEE_NUMBER
  if (!swishNumber) return res.status(503).json({ error: 'Swish not configured', configured: false })
  // Swish kräver mTLS-certifikat — returnerar instruktioner
  res.json({
    status: 'pending_mtls_cert',
    message: 'Swish requires mTLS certificate. Configure SWISH_CERT and SWISH_KEY.',
    payee_number: swishNumber
  })
})

// GET /v1/payments/klarna/health
router.get('/v1/payments/klarna/health', (_req, res) => {
  res.json({ configured: !!process.env.KLARNA_API_KEY, provider: 'klarna' })
})

export default router
