// ─── Agent Mesh Types ─────────────────────────────────────────────────────────
// Typdefinitioner för Wavult Agent Mesh — 10 specialiserade expert-agenter

import type { ModelId, TaskType } from '../types'

export type AgentId =
  | 'qms'           // ISO 9001/27001, GDPR, NIS2, compliance
  | 'legal'         // Avtal, bolagsrätt, DPA, juridik
  | 'finance'       // Budget, bokföring, likviditet, transfer pricing
  | 'code'          // Kod, arkitektur, Gitea, CI/CD, deploy
  | 'infra'         // AWS, ECS, networking, security, monitoring
  | 'people'        // HR, kompetens, onboarding, utbildning
  | 'risk'          // Riskregister, CAPA, incidenter
  | 'data'          // Databasqueries, rapporter, analytics
  | 'operations'    // Drift, leverans, kundprocess, SLA
  | 'product'       // quiXzoom, LandveX, produktstrategi

export interface AgentTool {
  name: string
  description: string
  api_route?: string        // Intern API-route agenten kan anropa
  db_tables?: string[]      // Databastabeller agenten läser
}

export interface ExpertAgent {
  id: AgentId
  name: string
  owner: string             // 'erik' | 'dennis' | 'johan' | 'leon' | 'winston'
  description: string
  system_prompt: string     // Detaljerad systempromt för agenten
  preferred_model: ModelId  // Föredragen modell
  fallback_model: ModelId
  task_types: TaskType[]    // Vilka task-typer agenten hanterar
  tools: AgentTool[]
  keywords: string[]        // Nyckelord för routing
}

export interface AgentRequest {
  message: string
  agent_id?: AgentId        // Explicit agent-val (override)
  context?: string          // Extra kontext
  user_id?: string
  session_id?: string
}

export interface AgentResponse {
  content: string
  agent_used: AgentId
  agent_name: string
  model_used: ModelId
  confidence: number        // 0-1, hur säker routern var
  latency_ms: number
  request_id: string
  tools_called?: string[]
}
