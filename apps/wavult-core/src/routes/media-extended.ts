import { Router } from 'express'
const router = Router()

// GET /v1/media/photos?q=query&per_page=10
router.get('/v1/media/photos', async (req, res) => {
  const key = process.env.PEXELS_API_KEY
  if (!key) return res.status(503).json({ error: 'Pexels not configured' })
  const { q = 'nature', per_page = 10 } = req.query
  try {
    const r = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(String(q))}&per_page=${per_page}`,
      { headers: { Authorization: key } }
    )
    res.json(await r.json())
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /v1/media/videos?q=query
router.get('/v1/media/videos', async (req, res) => {
  const key = process.env.COVERR_API_KEY
  const appId = process.env.COVERR_APP_ID
  if (!key) return res.status(503).json({ error: 'Coverr not configured' })
  const { q = 'city' } = req.query
  try {
    const r = await fetch(
      `https://api.coverr.co/videos?query=${encodeURIComponent(String(q))}&api_key=${key}&app_id=${appId ?? ''}`
    )
    res.json(await r.json())
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /v1/media/health
router.get('/v1/media/health', (_req, res) => {
  res.json({
    pexels: !!process.env.PEXELS_API_KEY,
    coverr: !!process.env.COVERR_API_KEY,
    mapbox: !!process.env.MAPBOX_PUBLIC_TOKEN,
  })
})

export default router
