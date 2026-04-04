import { Router } from 'express'
const router = Router()

// POST /v1/legal/sign/document — skapa signeringsärende i Scrive
router.post('/v1/legal/sign/document', async (req, res) => {
  const key = process.env.SCRIVE_API_TOKEN
  if (!key) return res.status(503).json({ error: 'Scrive not configured', configured: false })
  const { title, parties } = req.body
  try {
    const r = await fetch('https://api.scrive.com/api/v2/documents/new', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, parties })
    })
    res.json(await r.json())
  } catch (err: any) { res.status(500).json({ error: err.message }) }
})

// GET /v1/legal/sign/health
router.get('/v1/legal/sign/health', (_req, res) => {
  res.json({
    scrive: !!process.env.SCRIVE_API_TOKEN,
    docusign: !!process.env.DOCUSIGN_ACCESS_TOKEN
  })
})

export default router
