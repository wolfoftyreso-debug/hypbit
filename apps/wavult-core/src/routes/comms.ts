import { Router } from 'express'
const router = Router()

// POST /v1/comms/email — skicka email via Resend
router.post('/v1/comms/email', async (req, res) => {
  const key = process.env.RESEND_API_KEY
  if (!key) return res.status(503).json({ error: 'Resend not configured' })
  const { to, subject, html, from = 'Wavult OS <noreply@wavult.com>' } = req.body
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html }),
    })
    res.json(await r.json())
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /v1/comms/telegram — skicka Telegram-meddelande
router.post('/v1/comms/telegram', async (req, res) => {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return res.status(503).json({ error: 'Telegram not configured' })
  const { chat_id, text, parse_mode = 'Markdown' } = req.body
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, text, parse_mode }),
    })
    res.json(await r.json())
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /v1/comms/health
router.get('/v1/comms/health', (_req, res) => {
  res.json({
    resend: !!process.env.RESEND_API_KEY,
    telegram: !!process.env.TELEGRAM_BOT_TOKEN,
  })
})

export default router
