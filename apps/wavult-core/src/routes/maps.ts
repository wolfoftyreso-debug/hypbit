import { Router } from 'express'
const router = Router()

// GET /v1/maps/geocode?q=address
router.get('/v1/maps/geocode', async (req, res) => {
  const token = process.env.MAPBOX_PUBLIC_TOKEN
  if (!token) return res.status(503).json({ error: 'Mapbox not configured' })
  const { q } = req.query
  if (!q) return res.status(400).json({ error: 'Missing query param: q' })
  try {
    const r = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(String(q))}.json?access_token=${token}`
    )
    res.json(await r.json())
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /v1/maps/reverse?lat=59.33&lng=18.06
router.get('/v1/maps/reverse', async (req, res) => {
  const token = process.env.MAPBOX_PUBLIC_TOKEN
  if (!token) return res.status(503).json({ error: 'Mapbox not configured' })
  const { lat, lng } = req.query
  if (!lat || !lng) return res.status(400).json({ error: 'Missing lat/lng' })
  try {
    const r = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}`
    )
    res.json(await r.json())
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /v1/maps/health
router.get('/v1/maps/health', (_req, res) => {
  res.json({ mapbox: !!process.env.MAPBOX_PUBLIC_TOKEN })
})

export default router
