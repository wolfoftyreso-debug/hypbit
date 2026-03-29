import express from 'express'

const app = express()
app.use(express.json())

const PORT = parseInt(process.env.PORT || '3006')
const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || ''

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'landvex-api',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

// Objects (infrastructure objects monitored by Landvex)
app.get('/v1/objects', async (_req, res) => {
  // Stub — returns mock data until Supabase schema is ready
  res.json({
    data: [
      { id: 'obj-001', name: 'Brygga Värmdö Hamn', type: 'pier', municipality: 'Värmdö', status: 'ok', lastInspected: null },
      { id: 'obj-002', name: 'Kajanläggning Nacka', type: 'quay', municipality: 'Nacka', status: 'monitoring', lastInspected: null },
    ],
    total: 2,
    note: 'Stub data — connect to QuiXzoom database for live data',
  })
})

// Alerts
app.get('/v1/alerts', async (_req, res) => {
  res.json({ data: [], total: 0, message: 'No active alerts' })
})

// Webhook contract (for BOS scheduler integration)
app.post('/v1/webhooks/bos', (req, res) => {
  const { jobId, type, payload } = req.body
  console.log(`[BOS Webhook] ${type}`, { jobId, payload })
  res.json({ jobId, status: 'SUCCESS', processedAt: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`[Landvex API] Listening on port ${PORT}`)
  console.log(`[Landvex API] Environment: ${process.env.NODE_ENV || 'development'}`)
})
