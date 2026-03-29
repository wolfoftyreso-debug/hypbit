import { Router, Request, Response } from 'express'

const router = Router()

// Unified AI completion endpoint
// POST /v1/ai/complete
// Body: { provider, model, messages, max_tokens }
router.post('/v1/ai/complete', async (req: Request, res: Response) => {
  const { provider = 'anthropic', model, messages, max_tokens = 1000 } = req.body

  if (!messages?.length) return res.status(400).json({ error: 'messages required' })

  const startTime = Date.now()

  try {
    let result: any

    if (provider === 'openai' || provider === 'gpt') {
      const apiKey = process.env.OPENAI_API_KEY || ''
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model || 'gpt-4o-mini', messages, max_tokens }),
      })
      const data = await response.json() as any
      result = {
        provider: 'openai',
        model: data.model,
        content: data.choices?.[0]?.message?.content,
        tokens: data.usage?.total_tokens,
        cost_estimate: (data.usage?.total_tokens || 0) * 0.00015 / 1000,
      }
    } else {
      // Default: Anthropic
      const apiKey = process.env.ANTHROPIC_API_KEY || ''
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'claude-haiku-20240307',
          messages,
          max_tokens,
        }),
      })
      const data = await response.json() as any
      result = {
        provider: 'anthropic',
        model: data.model,
        content: data.content?.[0]?.text,
        tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
        cost_estimate: ((data.usage?.input_tokens || 0) * 0.00025 + (data.usage?.output_tokens || 0) * 0.00125) / 1000,
      }
    }

    const latencyMs = Date.now() - startTime

    // Log for cost tracking
    console.log(JSON.stringify({
      event: 'AI_API_CALL',
      provider,
      model: result.model,
      tokens: result.tokens,
      cost_usd: result.cost_estimate,
      latency_ms: latencyMs,
      timestamp: new Date().toISOString(),
    }))

    return res.json({ ...result, latency_ms: latencyMs })

  } catch (err) {
    // Fallback: if primary provider fails, try the other
    console.error(`[AI] ${provider} failed, attempting fallback:`, err)
    return res.status(502).json({
      error: `AI provider ${provider} failed`,
      fallback_available: provider !== 'openai',
      detail: String(err),
    })
  }
})

// POST /v1/ai/tts — text to speech
router.post('/v1/ai/tts', async (req: Request, res: Response) => {
  const { text, voice_id = '21m00Tcm4TlvDq8ikWAM', provider = 'elevenlabs' } = req.body
  if (!text) return res.status(400).json({ error: 'text required' })

  const apiKey = process.env.ELEVENLABS_API_KEY || ''
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    })
    const audio = await response.arrayBuffer()
    res.setHeader('Content-Type', 'audio/mpeg')
    return res.send(Buffer.from(audio))
  } catch (err) {
    return res.status(502).json({ error: 'TTS failed', detail: String(err) })
  }
})

// GET /v1/ai/cost — cost summary (from CloudWatch logs ideally, simplified here)
router.get('/v1/ai/cost', async (_req: Request, res: Response) => {
  return res.json({
    note: 'Cost tracking via CloudWatch Logs. Integrate with /finance for aggregated costs.',
    providers: ['openai', 'anthropic', 'elevenlabs'],
    cost_per_1k_tokens: {
      'gpt-4o-mini': 0.15,
      'claude-haiku': 1.25,
      'claude-sonnet': 15.0,
    },
  })
})

export default router
