// ─── AI Orchestration Layer — Public API ─────────────────────────────────────
export { orchestrate, getAILogs, getAIStats } from './orchestrator'
export { selectModel, MODEL_REGISTRY, ROUTING_MATRIX } from './registry'
export { getCacheStats } from './cache'
export type { AIRequest, AIResponse, ModelId, TaskType, ModelConfig, AILogEntry } from './types'
