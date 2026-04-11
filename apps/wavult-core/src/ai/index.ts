// ─── AI Orchestration Layer — Public API ─────────────────────────────────────
export { orchestrate, getAILogs, getAIStats } from './orchestrator'
export { orchestrateStream } from './streaming'
export { selectModel, MODEL_REGISTRY, ROUTING_MATRIX } from './registry'
export { getCacheStats } from './cache'
export { heuristicFallback, HEURISTIC_MODEL_MARKER } from './fallback'
export { scoreResponse } from './response-quality'
export type {
  AIRequest,
  AIResponse,
  ModelId,
  ResolvedModelId,
  HeuristicFallbackMarker,
  TaskType,
  ModelConfig,
  AILogEntry,
} from './types'
export type { StreamEvent } from './streaming'
export type { QualityVerdict } from './response-quality'

// ─── Agent Mesh ───────────────────────────────────────────────────────────────
export { routeToAgent, EXPERT_AGENTS, ROLE_PROFILES, getRoleProfile, canAccessAgent } from './agents'
export type { AgentId, AgentRequest, AgentResponse, ExpertAgent, WavultRole, RoleProfile } from './agents'
