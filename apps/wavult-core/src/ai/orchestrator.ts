// ─── AI Orchestrator ──────────────────────────────────────────────────────────
// Kärnan i AI-lagret — routing, cache, logging, fallback.
// Ansvarar för: modellval → cache-kontroll → inference → fallback → loggning.

import { randomUUID } from 'crypto'
import { selectModel, ROUTING_MATRIX, MODEL_REGISTRY } from './registry'
import { getCached, setCache } from './cache'
import { callProvider } from './providers'
import type { AIRequest, AIResponse, AILogEntry, ModelConfig } from './types'

// In-memory logbuffer — ersätt med DB/CloudWatch vid skalning
const logs: AILogEntry[] = []
const MAX_LOG_SIZE = 10_000
const LOG_TRIM_SIZE = 1_000

/**
 * Kör ett AI-anrop via orkestratorlagret.
 *
 * Flöde:
 *  1. Välj optimal modell (routing-matris + override)
 *  2. Cache-lookup om cache=true (default)
 *  3. Inference med automatisk fallback till nästa kandidat
 *  4. Cachea lyckat svar
 *  5. Logga metadata (tokens, latens, kostnad)
 */
export async function orchestrate(req: AIRequest): Promise<AIResponse> {
  const requestId = randomUUID()
  const start = Date.now()

  // 1. Välj primär modell
  const model = selectModel(req.task_type, req.model_override)

  // 2. Cache-lookup
  const useCache = req.cache !== false
  if (useCache) {
    const cached = await getCached(req.prompt, model.id, req.system)
    if (cached) {
      // Logga cache-hit separat
      pushLog({
        request_id: requestId,
        task_type: req.task_type,
        model_used: model.id,
        tokens_used: 0,
        latency_ms: Date.now() - start,
        cost_usd: 0,
        cached: true,
        success: true,
        timestamp: new Date().toISOString(),
      })

      return {
        content: cached,
        model_used: model.id,
        tokens_used: 0,
        latency_ms: Date.now() - start,
        cost_usd: 0,
        cached: true,
        request_id: requestId,
      }
    }
  }

  // 3. Inference med fallback
  let content = ''
  let usedModel: ModelConfig = model
  let lastError: string | undefined

  // Prova primär modell
  try {
    content = await callProvider(model, req)
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err)
    console.error(`[ai:orchestrator] ${model.id} failed:`, errMsg)
    lastError = errMsg

    // Fallback: iterera routing-matrisen och hoppa över primären
    const candidates = ROUTING_MATRIX[req.task_type] || []
    for (const candidateId of candidates) {
      if (candidateId === model.id) continue
      const fallback = MODEL_REGISTRY[candidateId]
      if (!fallback?.available) continue

      try {
        content = await callProvider(fallback, req)
        usedModel = fallback
        lastError = undefined
        console.info(`[ai:orchestrator] fallback succeeded: ${candidateId}`)
        break
      } catch (fe: unknown) {
        const feMsg = fe instanceof Error ? fe.message : String(fe)
        console.error(`[ai:orchestrator] fallback ${candidateId} failed:`, feMsg)
        lastError = feMsg
      }
    }

    if (!content) {
      // Logga misslyckad
      pushLog({
        request_id: requestId,
        task_type: req.task_type,
        model_used: model.id,
        tokens_used: 0,
        latency_ms: Date.now() - start,
        cost_usd: 0,
        cached: false,
        success: false,
        error: lastError,
        timestamp: new Date().toISOString(),
      })
      throw new Error(`All models failed for task_type=${req.task_type}. Last error: ${lastError}`)
    }
  }

  const latency = Date.now() - start

  // Tokenuppskattning: ~4 tecken per token (grov men tillräcklig för kostnadsspårning)
  const tokensEst = Math.ceil((req.prompt.length + content.length) / 4)
  const costUsd = (tokensEst / 1000) * usedModel.costPer1kTokens

  // 4. Cachea lyckat svar
  if (useCache && content) {
    await setCache(req.prompt, usedModel.id, content, 3600, req.system)
  }

  // 5. Logga
  pushLog({
    request_id: requestId,
    task_type: req.task_type,
    model_used: usedModel.id,
    tokens_used: tokensEst,
    latency_ms: latency,
    cost_usd: costUsd,
    cached: false,
    success: true,
    timestamp: new Date().toISOString(),
  })

  return {
    content,
    model_used: usedModel.id,
    tokens_used: tokensEst,
    latency_ms: latency,
    cost_usd: costUsd,
    cached: false,
    request_id: requestId,
  }
}

function pushLog(entry: AILogEntry): void {
  logs.push(entry)
  // Trim vid overflow — behåll senaste entries
  if (logs.length > MAX_LOG_SIZE) {
    logs.splice(0, LOG_TRIM_SIZE)
  }
}

/**
 * Returnerar de senaste AI-anropen i omvänd kronologisk ordning.
 */
export function getAILogs(limit = 100): AILogEntry[] {
  return logs.slice(-limit).reverse()
}

/**
 * Aggregerad statistik över alla loggade AI-anrop.
 */
export function getAIStats(): {
  total: number
  byModel: Record<string, number>
  byTaskType: Record<string, number>
  totalCost: number
  avgLatency: number
  cacheHitRate: number
  successRate: number
} {
  const total = logs.length
  if (total === 0) {
    return {
      total: 0,
      byModel: {},
      byTaskType: {},
      totalCost: 0,
      avgLatency: 0,
      cacheHitRate: 0,
      successRate: 0,
    }
  }

  const byModel: Record<string, number> = {}
  const byTaskType: Record<string, number> = {}
  let totalCost = 0
  let totalLatency = 0
  let cacheHits = 0
  let successes = 0

  for (const l of logs) {
    byModel[l.model_used] = (byModel[l.model_used] || 0) + 1
    byTaskType[l.task_type] = (byTaskType[l.task_type] || 0) + 1
    totalCost += l.cost_usd
    totalLatency += l.latency_ms
    if (l.cached) cacheHits++
    if (l.success) successes++
  }

  return {
    total,
    byModel,
    byTaskType,
    totalCost: Math.round(totalCost * 1_000_000) / 1_000_000, // 6 decimaler
    avgLatency: Math.round(totalLatency / total),
    cacheHitRate: Math.round((cacheHits / total) * 1000) / 1000,
    successRate: Math.round((successes / total) * 1000) / 1000,
  }
}
