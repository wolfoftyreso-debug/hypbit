import { Router, Request, Response } from 'express'

const router = Router()

// GET /v1/media/images — Pexels image search
router.get('/v1/media/images', async (req: Request, res: Response) => {
  const { query, per_page = 10 } = req.query
  if (!query) return res.status(400).json({ error: 'query required' })

  const apiKey = process.env.PEXELS_API_KEY || ''
  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(String(query))}&per_page=${per_page}`,
      { headers: { 'Authorization': apiKey } }
    )
    const data = await response.json()
    return res.json(data)
  } catch (err) {
    return res.status(502).json({ error: 'Pexels failed', detail: String(err) })
  }
})

// POST /v1/media/video/render — Shotstack video render
router.post('/v1/media/video/render', async (req: Request, res: Response) => {
  const { timeline, output } = req.body
  const apiKey = process.env.SHOTSTACK_PRODUCTION_KEY || process.env.SHOTSTACK_SANDBOX_KEY || ''
  const baseUrl = process.env.SHOTSTACK_PRODUCTION_KEY
    ? 'https://api.shotstack.io/v1'
    : 'https://api.shotstack.io/stage'

  try {
    const response = await fetch(`${baseUrl}/render`, {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeline, output: output || { format: 'mp4', resolution: 'hd' } }),
    })
    return res.json(await response.json())
  } catch (err) {
    return res.status(502).json({ error: 'Video render failed', detail: String(err) })
  }
})

export default router
