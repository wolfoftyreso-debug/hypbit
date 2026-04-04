import { Router } from 'express'
const router = Router()

// POST /v1/ai/search — Perplexity web-sökning med AI-svar
router.post('/v1/ai/search', async (req, res) => {
  const key = process.env.PERPLEXITY_API_KEY
  if (!key) return res.status(503).json({ error: 'Perplexity not configured' })
  const { query, model = 'sonar' } = req.body
  try {
    const r = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: query }],
        return_citations: true,
        return_related_questions: true,
      }),
    })
    res.json(await r.json())
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /v1/ai/search/health
router.get('/v1/ai/search/health', (_req, res) => {
  res.json({ perplexity: !!process.env.PERPLEXITY_API_KEY })
})

export default router
