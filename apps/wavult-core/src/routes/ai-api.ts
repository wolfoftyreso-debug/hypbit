// ─── AI API Route ─────────────────────────────────────────────────────────────
// Kombinerar legacy-endpoints (/v1/ai/complete, /v1/ai/tts, /v1/ai/image)
// med det nya Enterprise AI Orchestration Layer (/v1/ai/orchestrate m.fl.)

import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/requireAuth'
import {
  orchestrate,
  getAILogs,
  getAIStats,
  MODEL_REGISTRY,
  getCacheStats,
} from '../ai'
import type { AIRequest } from '../ai'

const router = Router()
router.use(requireAuth)

// ─────────────────────────────────────────────────────────────────────────────
// ORCHESTRATION LAYER — nya endpoints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /v1/ai/orchestrate — central AI-gateway med automatisk modellval
 *
 * Body:
 *   task_type: 'chat' | 'code' | 'analysis' | 'embedding' | 'stt' | 'classification' | 'document' | 'reasoning'
 *   prompt: string
 *   system?: string
 *   context?: string
 *   max_tokens?: number
 *   temperature?: number
 *   model_override?: ModelId
 *   cache?: boolean  (default: true)
 *   metadata?: Record<string, unknown>
 */
router.post('/v1/ai/orchestrate', async (req: Request, res: Response) => {
  try {
    const aiReq: AIRequest = {
      task_type: req.body.task_type || 'chat',
      prompt: req.body.prompt,
      system: req.body.system,
      context: req.body.context,
      max_tokens: req.body.max_tokens,
      temperature: req.body.temperature,
      model_override: req.body.model_override,
      cache: req.body.cache,
      audio_url: req.body.audio_url,
      metadata: req.body.metadata,
    }

    if (!aiReq.prompt) {
      return res.status(400).json({ error: 'prompt required' })
    }

    const result = await orchestrate(aiReq)
    return res.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[ai:orchestrate] error:', message)
    return res.status(503).json({
      error: 'AI orchestration failed',
      detail: message,
    })
  }
})

/**
 * GET /v1/ai/models — lista alla konfigurerade modeller med status
 */
router.get('/v1/ai/models', (_req: Request, res: Response) => {
  const models = Object.values(MODEL_REGISTRY).map(m => ({
    id: m.id,
    name: m.name,
    provider: m.provider,
    available: m.available,
    cost_per_1k_tokens: m.costPer1kTokens,
    max_context_tokens: m.maxContextTokens,
    strengths: m.strengths,
  }))
  return res.json(models)
})

/**
 * GET /v1/ai/stats — aggregerad användningsstatistik
 */
router.get('/v1/ai/stats', (_req: Request, res: Response) => {
  return res.json({
    ...getAIStats(),
    cache: getCacheStats(),
  })
})

/**
 * GET /v1/ai/logs?limit=100 — senaste AI-anrop
 */
router.get('/v1/ai/logs', (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000)
  return res.json(getAILogs(limit))
})

/**
 * GET /v1/ai/health — hälsostatus för orchestratorn
 */
router.get('/v1/ai/health', (_req: Request, res: Response) => {
  const models = Object.values(MODEL_REGISTRY)
  const available = models.filter(m => m.available).map(m => m.id)
  const byProvider = models.reduce((acc, m) => {
    if (!acc[m.provider]) acc[m.provider] = { total: 0, available: 0 }
    acc[m.provider].total++
    if (m.available) acc[m.provider].available++
    return acc
  }, {} as Record<string, { total: number; available: number }>)

  return res.json({
    status: available.length > 0 ? 'healthy' : 'degraded',
    available_models: available,
    total_models: models.length,
    by_provider: byProvider,
    cache: getCacheStats(),
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY ENDPOINTS — bevarade för bakåtkompatibilitet
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /v1/ai/complete — legacy multi-provider endpoint
 * Body: { provider, model, messages, max_tokens }
 */
router.post('/v1/ai/complete', async (req: Request, res: Response) => {
  const { provider = 'anthropic', model, messages, max_tokens = 1000 } = req.body

  if (!messages?.length) return res.status(400).json({ error: 'messages required' })

  const startTime = Date.now()

  try {
    let result: Record<string, unknown>

    if (provider === 'openai' || provider === 'gpt') {
      const apiKey = process.env.OPENAI_API_KEY || ''
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model || 'gpt-4o-mini', messages, max_tokens }),
      })
      const data = await response.json() as Record<string, unknown>
      const usage = data.usage as Record<string, number> | undefined
      const choices = data.choices as Array<{ message?: { content?: string } }> | undefined
      result = {
        provider: 'openai',
        model: data.model,
        content: choices?.[0]?.message?.content,
        tokens: usage?.total_tokens,
        cost_estimate: (usage?.total_tokens || 0) * 0.00015 / 1000,
      }
    } else if (provider === 'gemini') {
      const apiKey = process.env.GEMINI_API_KEY || ''
      const model_name = model || 'gemini-1.5-flash'
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model_name}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: (messages as Array<{ role: string; content: string }>).map(m => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content }],
            })),
          }),
        },
      )
      const data = await response.json() as Record<string, unknown>
      const candidates = data.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined
      const usageMeta = data.usageMetadata as { totalTokenCount?: number } | undefined
      const text = candidates?.[0]?.content?.parts?.[0]?.text || ''
      const tokens = usageMeta?.totalTokenCount || 0
      result = {
        provider: 'gemini',
        model: model_name,
        content: text,
        tokens,
        cost_estimate: tokens * 0.000075 / 1000,
      }
    } else if (provider === 'did') {
      const apiKey = process.env.DID_API_KEY || ''
      const { script, presenter_id = 'amy-jcwCkr1grs' } = req.body as { script?: string; presenter_id?: string }
      const lastMessage = (messages as Array<{ content: string }>)[messages.length - 1]
      const response = await fetch('https://api.d-id.com/talks', {
        method: 'POST',
        headers: { 'Authorization': `Basic ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_url: `https://d-id-public-bucket.s3.amazonaws.com/presenters/${presenter_id}.jpg`,
          script: { type: 'text', input: script || lastMessage?.content || '', language: 'sv' },
        }),
      })
      const data = await response.json() as { id?: string; status?: string }
      result = { provider: 'did', id: data.id, status: data.status, cost_estimate: 0.01 }
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
      const data = await response.json() as {
        model?: string
        content?: Array<{ text?: string }>
        usage?: { input_tokens?: number; output_tokens?: number }
      }
      const inputTokens = data.usage?.input_tokens || 0
      const outputTokens = data.usage?.output_tokens || 0
      result = {
        provider: 'anthropic',
        model: data.model,
        content: data.content?.[0]?.text,
        tokens: inputTokens + outputTokens,
        cost_estimate: (inputTokens * 0.00025 + outputTokens * 0.00125) / 1000,
      }
    }

    const latencyMs = Date.now() - startTime
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[AI] ${provider} failed:`, message)
    return res.status(502).json({
      error: `AI provider ${provider} failed`,
      fallback_available: provider !== 'openai',
      detail: message,
    })
  }
})

/**
 * POST /v1/ai/tts — ElevenLabs text-to-speech proxy
 */
router.post('/v1/ai/tts', async (req: Request, res: Response) => {
  const { text, voice_id = '21m00Tcm4TlvDq8ikWAM' } = req.body as {
    text?: string
    voice_id?: string
  }
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
  } catch (err: unknown) {
    return res.status(502).json({ error: 'TTS failed', detail: String(err) })
  }
})

/**
 * POST /v1/ai/image — bildgenerering via Gemini/Imagen
 */
router.post('/v1/ai/image', async (req: Request, res: Response) => {
  const { prompt, model = 'gemini-2.5-flash-image', count = 1 } = req.body as {
    prompt?: string
    model?: string
    count?: number
  }

  if (!prompt) return res.status(400).json({ error: 'prompt required' })

  const apiKey = process.env.GEMINI_API_KEY || ''
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' })

  try {
    if (model.includes('flash-image') || model.includes('gemini')) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
          }),
        },
      )
      if (!response.ok) {
        const err = await response.text()
        return res.status(response.status).json({ error: 'Gemini image generation failed', detail: err })
      }
      const data = await response.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> } }>
      }
      const images: Array<{ b64: string; mimeType: string }> = []
      for (const part of data?.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData?.data) {
          images.push({ b64: part.inlineData.data, mimeType: part.inlineData.mimeType || 'image/png' })
        }
      }
      return res.json({ images, model, count: images.length })
    }

    // Imagen models
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateImages?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: { text: prompt },
          number_of_images: Math.min(count, 4),
          safety_filter_level: 'BLOCK_ONLY_HIGH',
          person_generation: 'ALLOW_ADULT',
        }),
      },
    )
    if (!response.ok) {
      const err = await response.text()
      return res.status(response.status).json({ error: 'Imagen generation failed', detail: err })
    }
    const data = await response.json() as {
      generatedImages?: Array<{ image?: { imageBytes?: string } }>
    }
    const images = (data.generatedImages || []).map(img => ({
      b64: img.image?.imageBytes || '',
      mimeType: 'image/png',
    }))
    return res.json({ images, model, count: images.length })
  } catch (err: unknown) {
    return res.status(502).json({ error: 'Image generation failed', detail: String(err) })
  }
})

/**
 * POST /v1/ai/grok — direkt proxy till xAI Grok API
 *
 * Body:
 *   prompt: string      — user message
 *   model?: string      — 'grok-3' (default) | 'grok-3-mini' | 'grok-2'
 *   system?: string     — system prompt (valfri)
 *
 * Routing hint: brainstorm, alternativ, kreativ, naming, trend → Grok
 */
router.post('/v1/ai/grok', async (req: Request, res: Response) => {
  const { prompt, model = 'grok-3', system } = req.body as {
    prompt?: string
    model?: string
    system?: string
  }

  if (!prompt) return res.status(400).json({ error: 'prompt required' })

  const apiKey = process.env.GROK_API_KEY
  if (!apiKey || apiKey === 'CONFIGURE_ME') {
    return res.status(503).json({
      error: 'Grok not configured — set GROK_API_KEY in SSM /wavult/prod/GROK_API_KEY',
      provider: 'grok',
    })
  }

  try {
    const messages: Array<{role: string; content: string}> = []
    if (system) messages.push({ role: 'system', content: system })
    messages.push({ role: 'user', content: prompt })

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
      }),
      signal: AbortSignal.timeout(60_000),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => `HTTP ${response.status}`)
      return res.status(response.status).json({
        error: 'xAI Grok API error',
        detail: errText,
        provider: 'grok',
      })
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
    }

    return res.json({
      provider: 'grok',
      model,
      response: data.choices?.[0]?.message?.content,
      usage: data.usage,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[ai:grok] error:', message)
    return res.status(503).json({ error: 'Grok request failed', detail: message, provider: 'grok' })
  }
})

/**
 * GET /v1/ai/cost — kostnadsoversikt (legacy)
 */
router.get('/v1/ai/cost', (_req: Request, res: Response) => {
  const stats = getAIStats()
  return res.json({
    total_cost_usd: stats.totalCost,
    total_requests: stats.total,
    by_model: stats.byModel,
    avg_latency_ms: stats.avgLatency,
    cache_hit_rate: stats.cacheHitRate,
    note: 'Live stats from orchestration layer. For CloudWatch aggregation, see /v1/ai/stats.',
  })
})

export default router
