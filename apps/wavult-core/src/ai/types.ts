// ─── AI Orchestration Types ───────────────────────────────────────────────────

export type TaskType =
  | 'chat'           // Konversation, frågor/svar
  | 'code'           // Kodgenerering, review, debug
  | 'analysis'       // Dataanalys, summering, extraktion
  | 'embedding'      // Vektorsökning
  | 'stt'            // Speech-to-text
  | 'classification' // Klassificering, routing
  | 'document'       // Dokumentbearbetning, lång kontext
  | 'reasoning'      // Komplex problemlösning
  | 'creative'       // Brainstorming, namngivning, kreativa idéer, trender (→ Grok)

export type ModelId =
  | 'llama4-scout'
  | 'llama4-maverick'
  | 'deepseek-v3'
  | 'deepseek-r1'
  | 'claude-haiku'
  | 'claude-sonnet'
  | 'gemini-flash'
  | 'gemini-pro'
  | 'whisper-local'
  | 'whisper-api'
  | 'groq-llama'
  | 'grok-3'
  | 'grok-3-mini'

export interface ModelConfig {
  id: ModelId
  name: string
  provider: 'local' | 'anthropic' | 'google' | 'openai' | 'deepseek' | 'groq' | 'xai'
  endpoint: string
  costPer1kTokens: number  // USD
  maxContextTokens: number
  strengths: TaskType[]
  available: boolean
  avgLatencyMs?: number
}

export interface AIRequest {
  task_type: TaskType
  prompt: string
  system?: string
  context?: string          // Extra kontext
  max_tokens?: number
  temperature?: number
  model_override?: ModelId  // Tvinga specifik modell
  cache?: boolean           // Tillåt cachning (default: true)
  audio_url?: string        // För STT
  metadata?: Record<string, unknown>
}

/**
 * Markör för heuristiskt fallback-svar när alla LLM-providers misslyckas.
 * Inte en riktig modell — finns inte i MODEL_REGISTRY.
 * Behandlas av observability som success=false.
 */
export type HeuristicFallbackMarker = 'heuristic-fallback'

/**
 * Identitet för den modell som faktiskt producerade svaret.
 * Kan vara en riktig modell i registret ELLER den heuristiska
 * fallback-markören om alla providers misslyckades.
 */
export type ResolvedModelId = ModelId | HeuristicFallbackMarker

export interface AIResponse {
  content: string
  model_used: ResolvedModelId
  tokens_used?: number
  latency_ms: number
  cost_usd?: number
  cached: boolean
  request_id: string
}

export interface AILogEntry {
  request_id: string
  task_type: TaskType
  model_used: ResolvedModelId
  tokens_used: number
  latency_ms: number
  cost_usd: number
  cached: boolean
  success: boolean
  error?: string
  timestamp: string
}
