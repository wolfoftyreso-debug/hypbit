import { Router } from 'express'
const router = Router()

// POST /v1/stripe/payment-intent
router.post('/v1/stripe/payment-intent', async (req, res) => {
  const STRIPE_KEY = process.env.STRIPE_SECRET_KEY
  if (!STRIPE_KEY) return res.status(503).json({ error: 'Stripe not configured' })
  try {
    const { amount, currency = 'sek', metadata } = req.body
    const r = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: String(amount),
        currency,
        'metadata[source]': 'wavult-os',
      }),
    })
    const data = await r.json()
    res.json(data)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /v1/stripe/health
router.get('/v1/stripe/health', async (_req, res) => {
  const key = process.env.STRIPE_SECRET_KEY
  res.json({ available: !!key, provider: 'stripe' })
})

// POST /v1/banksign/initiate — BankSign BankID-signering
router.post('/v1/banksign/initiate', async (req, res) => {
  const user = process.env.BANKSIGN_API_USER
  const pass = process.env.BANKSIGN_PASSWORD
  const guid = process.env.BANKSIGN_COMPANY_GUID
  if (!user || !pass || !guid) return res.status(503).json({ error: 'BankSign not configured' })
  try {
    const { personalNumber, message } = req.body
    const basicAuth = Buffer.from(`${user}:${pass}`).toString('base64')
    const r = await fetch('https://api.banksign.se/v2/sign', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ companyGuid: guid, personalNumber, message }),
    })
    res.json(await r.json())
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /v1/banksign/health
router.get('/v1/banksign/health', (_req, res) => {
  res.json({
    available: !!(process.env.BANKSIGN_API_USER && process.env.BANKSIGN_PASSWORD),
    provider: 'banksign',
  })
})

export default router
