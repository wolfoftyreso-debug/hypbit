import { Router } from 'express'
const router = Router()

// POST /v1/ai/image/generate — Stability AI bildgenerering
router.post('/v1/ai/image/generate', async (req, res) => {
  const key = process.env.STABILITY_API_KEY
  if (!key) return res.status(503).json({ error: 'Stability AI not configured', configured: false })
  const { prompt, model = 'stable-diffusion-xl-1024-v1-0', width = 1024, height = 1024 } = req.body
  try {
    const r = await fetch(`https://api.stability.ai/v1/generation/${model}/text-to-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ text_prompts: [{ text: prompt }], width, height, samples: 1 })
    })
    const data = await r.json() as any
    res.json(data)
  } catch (err: any) { res.status(500).json({ error: err.message }) }
})

// POST /v1/ai/video/generate — Runway ML videogenerering
router.post('/v1/ai/video/generate', async (req, res) => {
  const key = process.env.RUNWAY_API_KEY
  if (!key) return res.status(503).json({ error: 'Runway not configured', configured: false })
  const { prompt, duration = 4 } = req.body
  try {
    const r = await fetch('https://api.runwayml.com/v1/image_to_video', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'X-Runway-Version': '2024-11-06' },
      body: JSON.stringify({ promptText: prompt, duration })
    })
    res.json(await r.json())
  } catch (err: any) { res.status(500).json({ error: err.message }) }
})

// POST /v1/ai/fast — Groq ultra-snabb inference
router.post('/v1/ai/fast', async (req, res) => {
  const key = process.env.GROQ_API_KEY
  if (!key) return res.status(503).json({ error: 'Groq not configured', configured: false })
  const { prompt, model = 'llama-3.3-70b-versatile', system } = req.body
  try {
    const messages: Array<{ role: string; content: string }> = []
    if (system) messages.push({ role: 'system', content: system })
    messages.push({ role: 'user', content: prompt })
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, max_tokens: 2048 })
    })
    const data = await r.json() as any
    res.json({
      content: data.choices?.[0]?.message?.content,
      model,
      latency_ms: data.usage?.completion_time ? Math.round(data.usage.completion_time * 1000) : null
    })
  } catch (err: any) { res.status(500).json({ error: err.message }) }
})

// GET /v1/ai/video/health
router.get('/v1/ai/video/health', (_req, res) => {
  res.json({
    stability: !!process.env.STABILITY_API_KEY,
    runway: !!process.env.RUNWAY_API_KEY,
    groq: !!process.env.GROQ_API_KEY,
    sora: !!process.env.SORA_API_KEY,
    veo3: !!process.env.VEO3_API_KEY,
  })
})

export default router
