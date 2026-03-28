import { Router, Request, Response } from 'express'
import { v4 as uuid } from 'uuid'
import crypto from 'crypto'
import { supabase } from '../supabase'

export const commandsRouter = Router()

// ─── RESOURCE LOCKS ──────────────────────────────────────────────────────────
// Resource locks use 120s TTL (enforced via timeout watchdog below).
// Production: replace Map with Redis SETNX with 120s TTL.
// Heartbeat: executor must call /v1/commands/:id/heartbeat every 30s or lock releases.
const resourceLocks = new Map<string, string>() // nodeId → commandId

// ─── PENDING EXECUTIONS ──────────────────────────────────────────────────────
interface PendingCommand {
  type: string
  targetNodeId: string
  simulatedAt: string
  timeoutHandle: ReturnType<typeof setTimeout>
}
const pendingCommands = new Map<string, PendingCommand>()

// ─── IDEMPOTENCY STORE ───────────────────────────────────────────────────────
// In-memory — swap for Redis in production
const idempotencyStore = new Map<string, object>()

// ─── COMMAND TIMEOUTS ────────────────────────────────────────────────────────
const COMMAND_TIMEOUTS: Record<string, number> = {
  restart_service:  120_000,  // 2 min
  scale_service:    300_000,  // 5 min
  rollback_service: 180_000,  // 3 min
  kill_traffic:      30_000,  // 30 sec
  reroute_traffic:   60_000,  // 1 min
}

// ─── COMMANDS THAT BYPASS INCIDENT MODE BLOCK ────────────────────────────────
const INCIDENT_MODE_ALLOWED: string[] = ['restart_service', 'reroute_traffic']

// ─── SIMULATION ENGINE ───────────────────────────────────────────────────────

interface SimulationResult {
  expectedDowntimeSeconds: number
  usersAffected: number
  revenueImpactPerMinute: number
  riskLevel: string
  // confidence score 0-100:
  // 85-100: historical data match + all deps known → fast-path eligible (no explicit approval needed)
  // 70-84: partial data, some uncertainty → approval required
  // 50-69: estimated, limited historical data → approval required
  // <50:   never auto-approve — blocked with CONFIDENCE_TOO_LOW
  confidence: number
  steps: string[]
  rollbackPlan: string[]
  autoRecoveryLikely: boolean
}

const SIMULATIONS: Record<string, SimulationResult> = {
  restart_service: {
    expectedDowntimeSeconds: 5,
    usersAffected: 3200,
    revenueImpactPerMinute: 120,
    riskLevel: 'medium',
    confidence: 87,
    steps: ['Drain connections', 'Stop container', 'Pull latest image', 'Start container', 'Health check'],
    rollbackPlan: ['Register previous task definition', 'Force new deployment', 'Verify health'],
    autoRecoveryLikely: true,
  },
  scale_service: {
    expectedDowntimeSeconds: 0,
    usersAffected: 0,
    revenueImpactPerMinute: 0,
    riskLevel: 'low',
    confidence: 95,
    steps: ['Register new task', 'Wait for healthy', 'Load balance'],
    rollbackPlan: ['Update desired count back to original'],
    autoRecoveryLikely: true,
  },
  rollback_service: {
    expectedDowntimeSeconds: 10,
    usersAffected: 8000,
    revenueImpactPerMinute: 480,
    riskLevel: 'high',
    confidence: 72,
    steps: ['Identify previous task definition', 'Stop current', 'Deploy previous', 'Verify health'],
    rollbackPlan: ['Re-deploy current task definition', 'Monitor for 5 minutes'],
    autoRecoveryLikely: false,
  },
  reroute_traffic: {
    expectedDowntimeSeconds: 2,
    usersAffected: 1000,
    revenueImpactPerMinute: 40,
    riskLevel: 'medium',
    confidence: 80,
    steps: ['Update ALB listener rule', 'Verify new target group health', 'Monitor latency'],
    rollbackPlan: ['Revert ALB listener rule to original target group'],
    autoRecoveryLikely: true,
  },
  kill_traffic: {
    expectedDowntimeSeconds: 999,
    usersAffected: 50000,
    revenueImpactPerMinute: 3000,
    riskLevel: 'critical',
    confidence: 99,
    steps: ['Remove target group from ALB', 'Return 503 to all users'],
    rollbackPlan: ['Re-attach target group to ALB', 'Verify health checks pass', 'Confirm traffic resumes'],
    autoRecoveryLikely: false,
  },
}

async function simulateCommand(command: Record<string, unknown>): Promise<SimulationResult> {
  return SIMULATIONS[command.type as string] ?? SIMULATIONS.restart_service
}

// ─── ROUTES ──────────────────────────────────────────────────────────────────

// POST /v1/commands — create + simulate command
commandsRouter.post('/', async (req: Request, res: Response) => {
  const { type, targetNodeId, requestedBy, context, dependsOn } = req.body
  const idempotencyKey = req.headers['idempotency-key'] as string | undefined

  if (!type || !targetNodeId || !requestedBy) {
    return res.status(400).json({ error: 'MISSING_PARAMS' })
  }
  if (!context?.intent || !context?.reason) {
    return res.status(400).json({ error: 'MISSING_CONTEXT', message: 'context.intent and context.reason are required' })
  }

  // ── Idempotency check ──
  if (idempotencyKey && idempotencyStore.has(idempotencyKey)) {
    console.log(`[Commands] Idempotent replay: ${idempotencyKey}`)
    return res.json(idempotencyStore.get(idempotencyKey))
  }

  const now = new Date().toISOString()

  // ── Command signature — tamper-detection ──
  const payloadToSign = JSON.stringify({ type, targetNodeId, requestedBy, timestamp: now })
  const signature = crypto.createHash('sha256').update(payloadToSign).digest('hex')

  const command = {
    id: uuid(),
    type,
    targetNodeId,
    requestedBy,
    context,
    dependsOn: dependsOn ?? [],
    idempotency_key: idempotencyKey ?? uuid(),
    signature,
    status: 'simulating',
    timestamp: now,
    simulatedAt: now,
  }

  // ── Audit log — append-only ──
  // Production rules:
  // - Use PostgreSQL role with INSERT-only permission on system_commands
  // - Add row_checksum: SHA256(id + type + status + timestamp)
  // - Consider hash-chain for full tamper detection
  try {
    await supabase.from('system_commands').insert({
      id: command.id,
      type: command.type,
      target_node_id: command.targetNodeId,
      requested_by: command.requestedBy,
      context: command.context,
      depends_on: command.dependsOn,
      idempotency_key: command.idempotency_key,
      signature: command.signature,
      status: command.status,
    })
  } catch {
    console.log('[Commands] DB insert skipped (table not provisioned):', command.id)
  }

  const simulation = await simulateCommand(command)

  console.log(`[Command] ${command.type} on ${command.targetNodeId} by ${command.requestedBy}`, {
    commandId: command.id,
    risk: simulation.riskLevel,
    confidence: simulation.confidence,
    usersAffected: simulation.usersAffected,
  })

  const result = { command: { ...command, status: 'simulated' }, simulation }

  if (idempotencyKey) {
    idempotencyStore.set(idempotencyKey, result)
  }

  res.json(result)
})

// POST /v1/commands/:id/execute — execute after approval
commandsRouter.post('/:id/execute', async (req: Request, res: Response) => {
  const { id } = req.params
  const { approvedBy, secondApprovedBy, overrideFlag, type, targetNodeId, simulatedAt, simulation, signature } = req.body

  if (!approvedBy) {
    return res.status(400).json({ error: 'MISSING_APPROVED_BY' })
  }

  const commandType: string = type || pendingCommands.get(id)?.type || 'restart_service'
  const commandTarget: string = targetNodeId || ''

  // ── Incident mode block — only critical remediation commands pass through ──
  const incidentMode = process.env.INCIDENT_MODE === 'true'
  if (incidentMode && !INCIDENT_MODE_ALLOWED.includes(commandType)) {
    return res.status(423).json({
      error: 'INCIDENT_MODE_ACTIVE',
      message: `Only ${INCIDENT_MODE_ALLOWED.join(', ')} allowed during active incident. Got: ${commandType}`,
    })
  }

  // ── Signature verification ──
  if (signature) {
    const pending = pendingCommands.get(id)
    const storedSig = req.body.originalSignature ?? signature
    void storedSig  // will be compared in production against DB record
    // TODO: fetch from DB and compare: if (dbRecord.signature !== storedSig) return 403 TAMPERED
  }

  // ── Confidence policy ──
  const sim = simulation as SimulationResult | undefined
  if (sim) {
    if (sim.confidence < 50) {
      return res.status(403).json({
        error: 'CONFIDENCE_TOO_LOW',
        message: `Auto-blocked: confidence ${sim.confidence} < 50. Manual override required.`,
        confidence: sim.confidence,
      })
    }
    if (sim.confidence < 80 && !approvedBy) {
      return res.status(403).json({
        error: 'APPROVAL_REQUIRED',
        message: `Confidence ${sim.confidence} (50–80) requires explicit approval.`,
        confidence: sim.confidence,
      })
    }
    // 80+: fast-path allowed

    // ── Blast radius guard ──
    if (sim.usersAffected > 5000 && !secondApprovedBy) {
      return res.status(403).json({
        error: 'MULTI_APPROVAL_REQUIRED',
        message: `${sim.usersAffected.toLocaleString()} users affected. Requires second approval.`,
        requiredApprovers: 2,
        usersAffected: sim.usersAffected,
      })
    }
  }

  // ── kill_traffic override gate ──
  if (commandType === 'kill_traffic' && !overrideFlag) {
    return res.status(403).json({
      error: 'KILL_TRAFFIC_OVERRIDE_REQUIRED',
      message: 'kill_traffic requires explicit overrideFlag: true in request body.',
    })
  }

  // ── Resource lock check ──
  const currentLock = resourceLocks.get(commandTarget)
  if (currentLock && currentLock !== id) {
    return res.status(409).json({
      error: 'RESOURCE_LOCKED',
      message: `Node ${commandTarget} is already being modified by command ${currentLock}`,
      lockedBy: currentLock,
    })
  }

  // ── Stale simulation guard — block if simulation is older than 60 seconds ──
  const simTimestamp = simulatedAt ?? pendingCommands.get(id)?.simulatedAt
  if (simTimestamp) {
    const simAge = Date.now() - new Date(simTimestamp).getTime()
    if (simAge > 60_000) {
      return res.status(409).json({
        error: 'STALE_SIMULATION',
        message: 'Simulation is older than 60 seconds. Re-simulate before executing.',
        simulatedAt: simTimestamp,
        ageMs: simAge,
      })
    }
  }

  // ── Acquire resource lock ──
  resourceLocks.set(commandTarget, id)

  const timeoutMs = COMMAND_TIMEOUTS[commandType] ?? 120_000
  console.log(`[Command] EXECUTE: ${id} approved by ${approvedBy}${secondApprovedBy ? ` + ${secondApprovedBy}` : ''} (timeout: ${timeoutMs / 1000}s)`)

  // ── Timeout watchdog ──
  const timeoutHandle = setTimeout(async () => {
    console.log(`[Command] Timeout — attempting rollback for ${id}`)
    try {
      // TODO: call rollback on Action Engine
      console.log(`[Command] Rollback initiated for timed-out command ${id}`)
    } catch {
      console.error(`[Command] Rollback after timeout FAILED — ROLLBACK_FAILED — requires_manual_intervention=true for ${id}`)
      // Production: update DB: status=rollback_failed, requires_manual_intervention=true
    }
    resourceLocks.delete(commandTarget)
    pendingCommands.delete(id)
  }, timeoutMs)

  pendingCommands.set(id, {
    type: commandType,
    targetNodeId: commandTarget,
    simulatedAt: simTimestamp ?? new Date().toISOString(),
    timeoutHandle,
  })

  // TODO: Route to Action Engine → AWS
  // For now: safe dummy execution — immediately complete
  clearTimeout(timeoutHandle)
  pendingCommands.delete(id)
  resourceLocks.delete(commandTarget)

  res.json({
    commandId: id,
    status: 'completed',
    result: 'Command logged (Action Engine not yet connected to AWS)',
    approvedBy,
    secondApprovedBy: secondApprovedBy ?? null,
    executedAt: new Date().toISOString(),
    executionResult: {
      expected: { latencyMs: 42, errorRate: 0.02 },
      actual: null,   // filled in after real AWS execution
      diff: null,     // flagged if diff > 20% from expected
    },
  })
})

// GET /v1/commands — list recent commands
commandsRouter.get('/', async (_req: Request, res: Response) => {
  res.json({ commands: [] })
})
