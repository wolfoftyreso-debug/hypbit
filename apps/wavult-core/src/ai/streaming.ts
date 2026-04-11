// ─── AI Streaming Layer ───────────────────────────────────────────────────────
// orchestrateStream — async generator som yield:ar events i realtid.
//
// Designmål:
//   1. Första byten <500 ms (yield "thinking" direkt innan modellval)
//   2. Inga silent failures — alltid minst ett "done"-event
//   3. Streamar från providern när det går, fakar stream från non-stream
//      providers (en chunk) när det inte går
//   4. Fallback-loop genom ROUTING_MATRIX — yield "fallback"-events så UI
//      kan visa vilken modell som faktiskt svarade
//   5. Sista-ditt heuristisk fallback om alla providers failar
//   6. Refusal/truncation-detektion via response-quality — omstartar med
//      nästa kandidat
//
// Denna modul är ADDITIV ovanpå orchestrator.ts. Non-streaming-pathen är
// orörd. UI som vill ha streaming anropar /v1/ai/orchestrate/stream. UI som
// inte vill det anropar /v1/ai/orchestrate som förut.

import { randomUUID } from 'crypto'
import { selectModel, ROUTING_MATRIX, MODEL_REGISTRY } from './registry'
import { getCached, setCache } from './cache'
import { callProvider } from './providers'
import { heuristicFallback, HEURISTIC_MODEL_MARKER } from './fallback'
import { scoreResponse } from './response-quality'
import type { AIRequest, AIResponse, ModelConfig, ModelId, ResolvedModelId } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Event-typer som streamas till klient
// ─────────────────────────────────────────────────────────────────────────────

export type StreamEvent =
  | { type: 'thinking'; message: string }
  | { type: 'model_selected'; model: ModelId }
  | { type: 'chunk'; content: string; model: ResolvedModelId }
  | { type: 'fallback'; from: ModelId; to: ModelId; reason: string }
  | { type: 'quality_reject'; model: ModelId; reason: string; matched?: string }
  | { type: 'degraded'; reason: string }
  | { type: 'done'; final: AIResponse }
  | { type: 'error'; message: string }

// ─────────────────────────────────────────────────────────────────────────────
// Provider-specifika streamers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ollama lokalt — NDJSON-stream med `{response, done}` per rad.
 */
async function* streamOllama(model: ModelConfig, req: AIRequest): AsyncGenerator<string> {
  const modelName = model.id === 'llama4-scout'
    ? 'llama4:scout'
    : model.id === 'llama4-maverick'
      ? 'llama4:maverick'
      : 'llama3.2:latest'

  const payload = {
    model: modelName,
    prompt: req.system ? `System: ${req.system}\n\nUser: ${req.prompt}` : req.prompt,
    stream: true,
    options: {
      temperature: req.temperature ?? 0.7,
      num_predict: req.max_tokens ?? 2048,
    },
  }

  const res = await fetch(model.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(120_000),
  })

  if (!res.ok || !res.body) {
    throw new Error(`Ollama stream error ${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const obj = JSON.parse(line) as { response?: string; done?: boolean }
          if (obj.response) yield obj.response
          if (obj.done) return
        } catch {
          // Malformed NDJSON-rad — ignorera
        }
      }
    }
  } finally {
    try { reader.releaseLock() } catch { /* ignore */ }
  }
}

/**
 * OpenAI-kompatibel SSE — täcker DeepSeek, Groq, xAI.
 * Format: `data: {choices:[{delta:{content:"..."}}]}\n\n`,
 *         följt av `data: [DONE]\n\n`.
 */
async function* streamOpenAICompat(model: ModelConfig, req: AIRequest): AsyncGenerator<string> {
  let key: string | undefined
  let modelName: string
  let endpoint = model.endpoint

  switch (model.provider) {
    case 'deepseek':
      key = process.env.DEEPSEEK_API_KEY
      modelName = model.id === 'deepseek-r1' ? 'deepseek-reasoner' : 'deepseek-chat'
      break
    case 'groq':
      key = process.env.GROQ_API_KEY
      modelName = 'llama-3.3-70b-versatile'
      endpoint = 'https://api.groq.com/openai/v1/chat/completions'
      break
    case 'xai':
      key = process.env.GROK_API_KEY
      modelName = model.id === 'grok-3-mini' ? 'grok-3-mini' : 'grok-3'
      break
    default:
      throw new Error(`streamOpenAICompat: unsupported provider ${model.provider}`)
  }

  if (!key || key === 'CONFIGURE_ME') {
    throw new Error(`${model.provider.toUpperCase()}_API_KEY not set`)
  }

  const messages: Array<{ role: string; content: string }> = []
  if (req.system) messages.push({ role: 'system', content: req.system })
  messages.push({ role: 'user', content: req.prompt })

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelName,
      messages,
      max_tokens: req.max_tokens ?? 4096,
      temperature: req.temperature ?? 0.7,
      stream: true,
    }),
    signal: AbortSignal.timeout(120_000),
  })

  if (!res.ok || !res.body) {
    const errText = res.ok ? 'no body' : await res.text().catch(() => `HTTP ${res.status}`)
    throw new Error(`${model.provider} stream error ${res.status}: ${errText}`)
  }

  yield* parseSSEChunks(res.body, (obj) => {
    // OpenAI-kompatibel delta: choices[0].delta.content
    const data = obj as { choices?: Array<{ delta?: { content?: string } }> }
    return data.choices?.[0]?.delta?.content
  })
}

/**
 * Anthropic SSE — annan event-struktur.
 * Format: `event: content_block_delta\ndata: {type, delta:{type:"text_delta", text:"..."}}`
 */
async function* streamAnthropic(model: ModelConfig, req: AIRequest): AsyncGenerator<string> {
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
  if (!ANTHROPIC_KEY) throw new Error('ANTHROPIC_API_KEY not set')

  const modelName = model.id === 'claude-haiku' ? 'claude-haiku-4-5' : 'claude-sonnet-4-6'

  const payload: Record<string, unknown> = {
    model: modelName,
    max_tokens: req.max_tokens ?? 4096,
    messages: [{ role: 'user', content: req.prompt }],
    stream: true,
  }
  if (req.system) payload.system = req.system

  const res = await fetch(model.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(120_000),
  })

  if (!res.ok || !res.body) {
    const errText = res.ok ? 'no body' : await res.text().catch(() => `HTTP ${res.status}`)
    throw new Error(`Anthropic stream error ${res.status}: ${errText}`)
  }

  yield* parseSSEChunks(res.body, (obj) => {
    const data = obj as {
      type?: string
      delta?: { type?: string; text?: string }
    }
    if (data.type === 'content_block_delta' && data.delta?.type === 'text_delta') {
      return data.delta.text
    }
    return undefined
  })
}

/**
 * Generell SSE-parser. Läser `data: <json>\n\n`-event, skippar `[DONE]`,
 * parsar JSON, plockar ut text med `extract`-callback.
 */
async function* parseSSEChunks(
  body: ReadableStream<Uint8Array>,
  extract: (obj: unknown) => string | undefined,
): AsyncGenerator<string> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const events = buffer.split('\n\n')
      buffer = events.pop() || ''
      for (const ev of events) {
        // Hitta `data:`-raden
        for (const line of ev.split('\n')) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue
          const payload = trimmed.slice(5).trim()
          if (payload === '[DONE]' || payload === '') continue
          try {
            const obj = JSON.parse(payload) as unknown
            const text = extract(obj)
            if (text) yield text
          } catch {
            // Ignorera malformade data-rader
          }
        }
      }
    }
  } finally {
    try { reader.releaseLock() } catch { /* ignore */ }
  }
}

/**
 * Fake-stream för providers utan riktig streaming (Google Gemini i dagsläget,
 * OpenAI-whisper är inte text). Anropar den befintliga non-streaming
 * `callProvider` och yield:ar hela svaret som en chunk.
 *
 * Detta är med avsikt — UI-koden ska inte behöva veta vilken provider som
 * hade native streaming vs fake.
 */
async function* streamNonStreaming(model: ModelConfig, req: AIRequest): AsyncGenerator<string> {
  const full = await callProvider(model, req)
  yield full
}

/**
 * Router — välj rätt streamer baserat på provider.
 */
function streamProvider(model: ModelConfig, req: AIRequest): AsyncGenerator<string> {
  switch (model.provider) {
    case 'local':
      return streamOllama(model, req)
    case 'anthropic':
      return streamAnthropic(model, req)
    case 'deepseek':
    case 'groq':
    case 'xai':
      return streamOpenAICompat(model, req)
    case 'google':
    case 'openai':
      return streamNonStreaming(model, req)
    default:
      throw new Error(`streamProvider: unknown provider ${(model as ModelConfig).provider}`)
  }
}

/**
 * Konsumera en async generator och samla hela strängen medan vi yield:ar
 * varje chunk utåt. Används så vi både (a) streamar till UI och (b) får
 * hela content för cache + quality check.
 */
async function* teeToBuffer(
  src: AsyncGenerator<string>,
  sink: { content: string },
): AsyncGenerator<string> {
  for await (const chunk of src) {
    sink.content += chunk
    yield chunk
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// orchestrateStream — HUVUDAPI
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Streamande motsvarighet till orchestrate().
 *
 * Kontrakt:
 *   - Yield:ar ALLTID minst ett 'done'- ELLER ett 'degraded'+'done'-event.
 *   - Yield:ar 'thinking' inom första event-cyklen (<5 ms) så UI kan visa
 *     typing-indikator innan modellval.
 *   - Cache-hit: yield hela cachade innehållet som en chunk + done.
 *   - Fallback genom ROUTING_MATRIX vid provider-fel eller quality reject.
 *   - Sista-ditt: heuristisk fallback via fallback.ts. Yield:ar 'degraded'
 *     innan heuristiken och markerar final.model_used = 'heuristic-fallback'.
 *
 * Kastar ALDRIG exception till consumer. Fel wraps som 'error'-event följt
 * av 'done' med heuristisk content.
 */
export async function* orchestrateStream(
  req: AIRequest,
): AsyncGenerator<StreamEvent> {
  const requestId = randomUUID()
  const start = Date.now()

  // Steg 0: Omedelbar signal att vi är igång. Håller first-byte under 500 ms.
  yield { type: 'thinking', message: 'Selecting model…' }

  if (!req.prompt || req.prompt.trim().length === 0) {
    const content = heuristicFallback(req, 'empty prompt')
    yield { type: 'degraded', reason: 'empty_prompt' }
    yield { type: 'chunk', content, model: HEURISTIC_MODEL_MARKER }
    yield {
      type: 'done',
      final: {
        content,
        model_used: HEURISTIC_MODEL_MARKER,
        tokens_used: 0,
        latency_ms: Date.now() - start,
        cost_usd: 0,
        cached: false,
        request_id: requestId,
      },
    }
    return
  }

  // Steg 1: Välj primär modell
  let primary: ModelConfig
  try {
    primary = selectModel(req.task_type, req.model_override)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    yield { type: 'error', message: msg }
    const content = heuristicFallback(req, msg)
    yield { type: 'degraded', reason: 'no_models_available' }
    yield { type: 'chunk', content, model: HEURISTIC_MODEL_MARKER }
    yield {
      type: 'done',
      final: {
        content,
        model_used: HEURISTIC_MODEL_MARKER,
        tokens_used: 0,
        latency_ms: Date.now() - start,
        cost_usd: 0,
        cached: false,
        request_id: requestId,
      },
    }
    return
  }

  yield { type: 'model_selected', model: primary.id }

  // Steg 2: Cache lookup
  const useCache = req.cache !== false
  if (useCache) {
    const cached = await getCached(req.prompt, primary.id, req.system)
    if (cached) {
      yield { type: 'chunk', content: cached, model: primary.id }
      yield {
        type: 'done',
        final: {
          content: cached,
          model_used: primary.id,
          tokens_used: 0,
          latency_ms: Date.now() - start,
          cost_usd: 0,
          cached: true,
          request_id: requestId,
        },
      }
      return
    }
  }

  // Steg 3: Iterera genom kandidatlistan, stream:a varje försök
  const candidates: ModelConfig[] = buildCandidateList(req, primary)

  let lastError: string | undefined
  for (let i = 0; i < candidates.length; i++) {
    const current = candidates[i]
    const buffer = { content: '' }

    if (i > 0) {
      yield {
        type: 'fallback',
        from: candidates[i - 1].id,
        to: current.id,
        reason: lastError || 'unknown',
      }
    }

    try {
      for await (const chunk of teeToBuffer(streamProvider(current, req), buffer)) {
        if (chunk) yield { type: 'chunk', content: chunk, model: current.id }
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err)
      console.error(`[ai:stream] ${current.id} failed:`, lastError)
      continue
    }

    // Steg 4: Quality check efter provider-fullbordan
    const verdict = scoreResponse(buffer.content, req)
    if (!verdict.acceptable) {
      yield {
        type: 'quality_reject',
        model: current.id,
        reason: verdict.reason,
        matched: verdict.matched,
      }
      lastError = `quality_reject:${verdict.reason}`
      continue
    }

    // Steg 5: Lyckat svar — cache + done
    if (useCache && buffer.content) {
      await setCache(req.prompt, current.id, buffer.content, 3600, req.system)
    }

    const latency = Date.now() - start
    const tokensEst = Math.ceil((req.prompt.length + buffer.content.length) / 4)
    const costUsd = (tokensEst / 1000) * current.costPer1kTokens

    yield {
      type: 'done',
      final: {
        content: buffer.content,
        model_used: current.id,
        tokens_used: tokensEst,
        latency_ms: latency,
        cost_usd: costUsd,
        cached: false,
        request_id: requestId,
      },
    }
    return
  }

  // Steg 6: Alla kandidater misslyckades — heuristisk fallback
  const content = heuristicFallback(req, lastError)
  yield { type: 'degraded', reason: lastError || 'all_models_failed' }
  yield { type: 'chunk', content, model: HEURISTIC_MODEL_MARKER }
  yield {
    type: 'done',
    final: {
      content,
      model_used: HEURISTIC_MODEL_MARKER,
      tokens_used: 0,
      latency_ms: Date.now() - start,
      cost_usd: 0,
      cached: false,
      request_id: requestId,
    },
  }
}

/**
 * Bygg kandidatlistan: primär modell först, sedan övriga från ROUTING_MATRIX
 * som är available och inte är duplikat av primären. Håller en stabil,
 * deterministisk ordning.
 */
function buildCandidateList(req: AIRequest, primary: ModelConfig): ModelConfig[] {
  const list: ModelConfig[] = [primary]
  const seen = new Set<ModelId>([primary.id])
  const matrix = ROUTING_MATRIX[req.task_type] || []
  for (const id of matrix) {
    if (seen.has(id)) continue
    const m = MODEL_REGISTRY[id]
    if (m?.available) {
      list.push(m)
      seen.add(id)
    }
  }
  return list
}
