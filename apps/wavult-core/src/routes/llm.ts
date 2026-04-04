import { Router, Request, Response } from 'express'

const router = Router()

const LLAMA_HOST = process.env.LLAMA_HOST || 'http://localhost:11434'

// POST /v1/ai/internal — intern LLM-inference via Llama 4 Scout
router.post('/v1/ai/internal', async (req: Request, res: Response) => {
  try {
    const { prompt, model = 'llama4:scout', stream = false, system } = req.body

    if (!prompt) return res.status(400).json({ error: 'prompt required' })

    const payload: any = {
      model,
      prompt,
      stream,
    }
    if (system) payload.system = system

    const response = await fetch(`${LLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) throw new Error(`Ollama error: ${response.status}`)

    const data = await response.json() as any
    res.json({
      response: data.response,
      model: data.model,
      done: data.done,
      eval_duration_ms: Math.round((data.eval_duration || 0) / 1e6),
    })
  } catch (err: any) {
    console.error('[llm] error:', err)
    res.status(503).json({ error: 'LLM unavailable', detail: err?.message })
  }
})

// GET /v1/ai/models — lista tillgängliga modeller
router.get('/v1/ai/models', async (_req: Request, res: Response) => {
  try {
    const response = await fetch(`${LLAMA_HOST}/api/tags`)
    const data = await response.json() as any
    res.json(data.models || [])
  } catch (err: any) {
    res.status(503).json({ error: 'LLM unavailable' })
  }
})

// GET /v1/ai/health — hälsostatus för LLM-tjänsten
router.get('/v1/ai/health', async (_req: Request, res: Response) => {
  try {
    const start = Date.now()
    await fetch(`${LLAMA_HOST}/api/tags`)
    res.json({ status: 'healthy', latency_ms: Date.now() - start, host: LLAMA_HOST })
  } catch {
    res.status(503).json({ status: 'unavailable', host: LLAMA_HOST })
  }
})

export default router
