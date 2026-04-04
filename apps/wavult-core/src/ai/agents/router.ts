// ─── Agent Router ─────────────────────────────────────────────────────────────
// Klassificerar inkommande intent och delegerar till rätt ExpertAgent.
// Stödjer explicit agent-val, keyword-routing och rollbaserad åtkomstkontroll.

import { randomUUID } from 'crypto'
import type { AgentId, AgentRequest, AgentResponse } from './types'
import { EXPERT_AGENTS } from './definitions'
import { JR_AGENTS } from './jr-agents'
import { getRoleProfile, canAccessAgent } from './roles'
import { orchestrate } from '../orchestrator'

// Domänagenter + JR-agenter samlade
const ALL_AGENTS = { ...EXPERT_AGENTS, ...JR_AGENTS }

// ─── Intent klassificering via keyword-scoring ────────────────────────────────

function classifyIntent(message: string): { agentId: AgentId; confidence: number } {
  const lower = message.toLowerCase()
  const scores: Record<string, number> = {}

  for (const [id, agent] of Object.entries(ALL_AGENTS)) {
    let score = 0
    for (const keyword of agent.keywords) {
      if (lower.includes(keyword)) score++
    }
    scores[id] = score
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1])
  const [topId, topScore] = sorted[0]

  // Normalisera mot max 3 träffar (rimligt golv för konfidensberäkning)
  const confidence = topScore > 0 ? Math.min(topScore / 3, 1) : 0

  return {
    agentId: (topId as AgentId) ?? 'product',
    confidence,
  }
}

// ─── Huvud-routing-funktion ───────────────────────────────────────────────────

export async function routeToAgent(req: AgentRequest): Promise<AgentResponse> {
  const start = Date.now()
  const requestId = randomUUID()

  // 1. Välj agent — explicit override eller keyword-klassificering
  let agentId: AgentId
  let confidence: number

  if (req.agent_id) {
    agentId = req.agent_id
    confidence = 1.0
  } else {
    const classified = classifyIntent(req.message)
    agentId = classified.agentId
    confidence = classified.confidence
  }

  // 2. Rollbaserad åtkomstkontroll
  if (req.user_id) {
    if (!canAccessAgent(req.user_id, agentId)) {
      const profile = getRoleProfile(req.user_id)
      const allowed = profile?.allowed_agents ?? []
      throw new Error(
        `Åtkomst nekad: ${req.user_id} har inte tillgång till agent "${agentId}". ` +
        `Tillåtna agenter: ${allowed.join(', ')}`
      )
    }
  }

  // 3. Hämta agentdefinition
  const agent = ALL_AGENTS[agentId]
  if (!agent) throw new Error(`Okänd agent: ${agentId}`)

  // 4. Bygg systempromt — agentens promt + rollkontext
  let roleContextBlock = ''
  if (req.user_id) {
    const profile = getRoleProfile(req.user_id)
    if (profile) {
      roleContextBlock = `\n\n---\n**Samtalskontext:**\n${profile.role_context}`
    }
  }

  const systemPrompt =
    `${agent.system_prompt}${roleContextBlock}\n\n---\n` +
    `Du svarar alltid på svenska om inget annat anges.\n` +
    `Du är ${agent.name} och representerar ${agent.owner} i Wavult-teamet.\n` +
    `Håll svaren koncisa men fullständiga. Hänvisa alltid till konkreta data, tabeller och system.`

  // 5. Kör AI-anrop via orkestratorlagret
  const result = await orchestrate({
    task_type: agent.task_types[0],
    prompt: req.message,
    system: systemPrompt,
    context: req.context,
    model_override: agent.preferred_model,
  })

  return {
    content: result.content,
    agent_used: agentId,
    agent_name: agent.name,
    model_used: result.model_used,
    confidence,
    latency_ms: Date.now() - start,
    request_id: requestId,
  }
}
