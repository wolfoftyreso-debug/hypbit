export type CommandType =
  | 'restart_service'
  | 'scale_service'
  | 'rollback_service'
  | 'reroute_traffic'
  | 'kill_traffic'

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

// State machine — valid transitions only (enforced by validateTransition):
// created → simulating → simulated → awaiting_approval → approved → executing → completed | failed | rolled_back
// failed → rolled_back | rollback_failed
// simulated | awaiting_approval | approved → cancelled
export type CommandStatus =
  | 'created'
  | 'simulating'
  | 'simulated'
  | 'awaiting_approval'
  | 'approved'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'rolled_back'
  | 'rollback_failed'   // rollback attempt itself failed — requires_manual_intervention = true
  | 'partial_success'   // some steps completed; can retry to 'completed' or revert to 'rolled_back'

// ─── STATE MACHINE ────────────────────────────────────────────────────────────

export const ALLOWED_TRANSITIONS: Record<CommandStatus, CommandStatus[]> = {
  created:           ['simulating'],
  simulating:        ['simulated', 'failed'],
  simulated:         ['awaiting_approval', 'cancelled'],
  awaiting_approval: ['approved', 'cancelled'],
  approved:          ['executing'],
  executing:         ['completed', 'failed', 'rolled_back', 'partial_success'],
  completed:         [],
  failed:            ['rolled_back', 'rollback_failed'],
  cancelled:         [],
  rolled_back:       [],
  rollback_failed:   [],  // terminal — requires_manual_intervention must be set
  partial_success:   ['completed', 'rolled_back'],  // retry to completed or revert
}

/**
 * Validates a state transition.
 * Usage: if (!validateTransition(current, next)) throw new Error('INVALID_STATE_TRANSITION')
 */
export function validateTransition(from: CommandStatus, to: CommandStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false
}

// ─── COMMAND REQUEST ──────────────────────────────────────────────────────────

export interface CommandRequest {
  id: string
  type: CommandType
  targetNodeId: string
  requestedBy: string
  timestamp: string
  idempotency_key: string
  signature?: string  // sha256(type + targetNodeId + requestedBy + timestamp)
  dependsOn?: string[]  // command IDs that must complete before this executes
  context: {
    incidentId?: string
    intent: string        // required: "reduce_latency" | "restore_stability" | "manual_intervention"
    reason: string        // required: human-readable reason
    triggeredBy?: string  // alert_id or person
  }
}

// ─── SIMULATION ───────────────────────────────────────────────────────────────

export interface CommandSimulation {
  expectedDowntimeSeconds: number
  usersAffected: number
  revenueImpactPerMinute: number
  autoRecoveryLikely: boolean
  // confidence score 0-100:
  // 85-100: historical data match + all dependencies known → fast-path eligible
  // 70-84: partial data, some uncertainty → approval required
  // 50-69: estimated, limited historical data → approval required
  // <50:   never auto-approve, always block (CONFIDENCE_TOO_LOW)
  confidence: number
  riskLevel: RiskLevel
  steps: string[]
  rollbackPlan?: string[]  // steps to undo this command if it fails or is rolled back
}

// ─── EXECUTION ────────────────────────────────────────────────────────────────

export interface CommandExecution {
  commandId: string
  status: CommandStatus
  simulation?: CommandSimulation
  simulatedAt?: string
  approvedBy?: string
  startedAt?: string
  completedAt?: string
  result?: string
  error?: string
  requires_manual_intervention?: boolean  // set when status = rollback_failed
}

// ─── INCIDENT ────────────────────────────────────────────────────────────────

export interface Incident {
  id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  affectedNodeIds: string[]
  rootCauseNodeId?: string
  causalChain: Array<{ nodeId: string; event: string; timestamp: string }>
  suggestedCommands: CommandType[]
  status: 'active' | 'mitigating' | 'mitigated' | 'resolved'
  detectedAt: string
}

// ─── OWNERSHIP ────────────────────────────────────────────────────────────────

export interface NodeResponsibility {
  nodeId: string
  primaryOwner: string
  secondaryOwner?: string
  onCall: boolean
  escalationPath: string[]
}
