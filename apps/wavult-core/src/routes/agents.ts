// ─── Agent Mesh API Routes ────────────────────────────────────────────────────
// REST-interface för Wavult Agent Mesh.
//
// POST /v1/agents/chat           — auto-routa till bäst matchande agent
// GET  /v1/agents                — lista alla tillgängliga agenter
// GET  /v1/agents/me/:personId   — agenter tillgängliga för specifik person
// POST /v1/agents/:agentId/chat  — chat direkt med namngiven agent

import { Router, Request, Response } from 'express'
import { routeToAgent } from '../ai/agents/router'
import { EXPERT_AGENTS } from '../ai/agents/definitions'
import { JR_AGENTS } from '../ai/agents/jr-agents'
import { ROLE_PROFILES, getRoleProfile } from '../ai/agents/roles'
import type { AgentRequest } from '../ai/agents/types'

const router = Router()

// ─── POST /v1/agents/chat ─────────────────────────────────────────────────────
// Skicka ett meddelande — routern väljer agent automatiskt baserat på intent.
// Body: { message, agent_id?, context?, user_id?, session_id? }
router.post('/v1/agents/chat', async (req: Request, res: Response) => {
  try {
    const agentReq: AgentRequest = {
      message: req.body.message,
      agent_id: req.body.agent_id,
      context: req.body.context,
      user_id: req.body.user_id,
      session_id: req.body.session_id,
    }

    if (!agentReq.message || typeof agentReq.message !== 'string') {
      return res.status(400).json({ error: 'message saknas eller har fel format' })
    }

    const result = await routeToAgent(agentReq)
    return res.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Okänt fel'
    const status = message.startsWith('Åtkomst nekad') ? 403 : 503
    console.error('[agents] chat error:', message)
    return res.status(status).json({ error: message })
  }
})

// ─── GET /v1/agents ───────────────────────────────────────────────────────────
// Lista alla tillgängliga agenter med metadata (utan systempromt).
router.get('/v1/agents', (_req: Request, res: Response) => {
  const agents = Object.values(EXPERT_AGENTS).map(a => ({
    id: a.id,
    name: a.name,
    owner: a.owner,
    description: a.description,
    keywords: a.keywords.slice(0, 5),
    preferred_model: a.preferred_model,
    fallback_model: a.fallback_model,
    task_types: a.task_types,
    tools: a.tools.map(t => ({ name: t.name, description: t.description })),
  }))
  return res.json(agents)
})

// ─── GET /v1/agents/me/:personId ─────────────────────────────────────────────
// Returnerar rollprofil och tillgängliga agenter för en specifik person.
router.get('/v1/agents/me/:personId', (req: Request, res: Response) => {
  const { personId } = req.params
  const profile = getRoleProfile(personId)

  if (!profile) {
    return res.status(404).json({ error: `Ingen rollprofil hittades för: ${personId}` })
  }

  const availableAgents = profile.allowed_agents.map(agentId => {
    const agent = EXPERT_AGENTS[agentId]
    if (!agent) return null
    return {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      preferred_model: agent.preferred_model,
      is_default: agent.id === profile.default_agent,
    }
  }).filter(Boolean)

  return res.json({
    person_id: profile.person_id,
    display_name: profile.display_name,
    role: profile.role,
    default_agent: profile.default_agent,
    available_agents: availableAgents,
    agent_count: availableAgents.length,
  })
})

// ─── GET /v1/agents/roles ─────────────────────────────────────────────────────
// Lista alla rollprofiler (utan role_context).
router.get('/v1/agents/roles', (_req: Request, res: Response) => {
  const roles = Object.values(ROLE_PROFILES).map(p => ({
    person_id: p.person_id,
    display_name: p.display_name,
    role: p.role,
    email: p.email,
    default_agent: p.default_agent,
    allowed_agents: p.allowed_agents,
  }))
  return res.json(roles)
})

// ─── GET /v1/agents/jr ───────────────────────────────────────────────────────
// Lista alla JR-agenter (digitala tvillingar).
router.get('/v1/agents/jr', (_req: Request, res: Response) => {
  const agents = Object.values(JR_AGENTS).map(a => ({
    id: a.id,
    name: a.name,
    owner: a.owner,
    description: a.description,
    preferred_model: a.preferred_model,
    task_types: a.task_types,
    badge: 'Digital Tvilling 🪞',
  }))
  return res.json(agents)
})

// ─── POST /v1/agents/jr/:personId ────────────────────────────────────────────
// Chatta direkt med en persons JR-agent.
// Body: { message, context?, user_id? }
router.post('/v1/agents/jr/:personId', async (req: Request, res: Response) => {
  try {
    const agentId = `${req.params.personId}-jr`
    const result = await routeToAgent({
      message: req.body.message,
      agent_id: agentId as AgentRequest['agent_id'],
      context: req.body.context,
      user_id: req.body.user_id,
      session_id: req.body.session_id,
    })
    return res.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Okänt fel'
    console.error(`[agents/jr] /${req.params.personId} error:`, message)
    return res.status(503).json({ error: 'JR agent failed', detail: message })
  }
})

// ─── POST /v1/agents/:agentId/chat ───────────────────────────────────────────
// Chat direkt med en namngiven agent (kräver fortfarande rollkontroll om user_id anges).
// Body: { message, context?, user_id? }
router.post('/v1/agents/:agentId/chat', async (req: Request, res: Response) => {
  try {
    const result = await routeToAgent({
      message: req.body.message,
      agent_id: req.params.agentId as AgentRequest['agent_id'],
      context: req.body.context,
      user_id: req.body.user_id,
      session_id: req.body.session_id,
    })
    return res.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Okänt fel'
    const status = message.startsWith('Åtkomst nekad') ? 403 : 503
    console.error(`[agents] /${req.params.agentId} error:`, message)
    return res.status(status).json({ error: message })
  }
})

export default router
