// ─── Agent Mesh — Public API ──────────────────────────────────────────────────
export { routeToAgent } from './router'
export { EXPERT_AGENTS } from './definitions'
export { ROLE_PROFILES, getRoleProfile, canAccessAgent } from './roles'
export type { AgentId, AgentRequest, AgentResponse, ExpertAgent, AgentTool } from './types'
export type { WavultRole, RoleProfile } from './roles'
