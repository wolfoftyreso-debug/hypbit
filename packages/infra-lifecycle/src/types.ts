/**
 * Wavult OS Infrastructure Execution Lifecycle — Core Types
 *
 * Every infrastructure change — Cloudflare, AWS, services, secrets, CI/CD —
 * runs through these 18 phases.
 */

// ─── Enums ───────────────────────────────────────────────────────────────────

export type WorkItemType =
  | 'migration'
  | 'deployment'
  | 'secret-rotation'
  | 'patch'
  | 'policy-update'
  | 'audit'
  | 'cleanup';

export type InfraDomain =
  | 'cloudflare'
  | 'aws'
  | 'internal-service'
  | 'cicd'
  | 'security-policy'
  | 'iam';

export type WorkItemStatus =
  | 'queued'
  | 'in-progress'
  | 'blocked'
  | 'approved'
  | 'rejected'
  | 'executing'
  | 'validating'
  | 'cutover'
  | 'monitoring'
  | 'cleanup'
  | 'complete'
  | 'rolled-back'
  | 'failed';

export type PhaseStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped' | 'blocked';

export type Criticality = 'P0' | 'P1' | 'P2' | 'P3';

export type ResourceTier = 'CORE' | 'EDGE' | 'STATE' | 'EPHEMERAL';

export type BlastRadius = 'GLOBAL' | 'SERVICE' | 'LOCAL';

export type PhaseId =
  | 'TRIGGER'
  | 'SCOPE_DEFINITION'
  | 'FULL_DISCOVERY'
  | 'CLASSIFICATION'
  | 'DEPENDENCY_MAPPING'
  | 'RISK_ASSESSMENT'
  | 'DESIGN'
  | 'APPROVAL_GATE'
  | 'ENV_PREPARATION'
  | 'PRE_FLIGHT_CHECK'
  | 'STAGED_EXECUTION'
  | 'HEALTH_VALIDATION'
  | 'INTEGRATION_VALIDATION'
  | 'CUTOVER'
  | 'ROLLBACK'
  | 'MONITORING_WINDOW'
  | 'CLEANUP'
  | 'POST_MORTEM';

// ─── Core entities ────────────────────────────────────────────────────────────

export interface WorkItem {
  id: string;
  type: WorkItemType;
  domain: InfraDomain;
  title: string;
  description: string;
  requestedBy: string;
  requestedAt: Date;
  status: WorkItemStatus;
  currentPhase?: PhaseId;
  phases: PhaseRecord[];
  metadata: Record<string, unknown>;
}

export interface PhaseRecord {
  phaseId: PhaseId;
  phaseNumber: number;
  status: PhaseStatus;
  startedAt?: Date;
  completedAt?: Date;
  input: unknown;
  output: unknown;
  validationResults: ValidationResult[];
  logEntries: LogEntry[];
  blockers: Blocker[];
  error?: string;
}

export interface ValidationResult {
  check: string;
  passed: boolean;
  detail?: string;
  severity: Criticality;
}

export interface Blocker {
  id: string;
  description: string;
  severity: Criticality;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
}

export interface LogEntry {
  timestamp: Date;
  phase: PhaseId;
  workItemId: string;
  level: 'info' | 'warn' | 'error' | 'audit';
  message: string;
  data?: Record<string, unknown>;
  /** NEVER log secret values — only IDs/names */
  secretsRedacted?: boolean;
}

// ─── Phase-specific outputs ───────────────────────────────────────────────────

export interface ScopeDefinition {
  systems: string[];
  resources: ResourceRef[];
  exclusions: ResourceRef[];
  affectedServices: string[];
}

export interface ResourceRef {
  type: string;
  id: string;
  name?: string;
  domain: InfraDomain;
}

export interface InventoryItem {
  resource: ResourceRef;
  tier: ResourceTier;
  criticality: Criticality;
  blastRadius: BlastRadius;
  owner: string;
  dependencies: ResourceRef[];
  consumers: string[];
}

export interface RiskItem {
  id: string;
  description: string;
  probability: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  score: number;
  mitigation?: string;
  accepted?: boolean;
  acceptedBy?: string;
}

export interface DesignSpec {
  targetState: Record<string, unknown>;
  tokenMap: Array<{ role: string; tokenName: string; permissions: string[]; envVar: string }>;
  permissionModel: Record<string, string[]>;
  rollbackPlan: RollbackPlan;
  successCriteria: SuccessCriterion[];
  monitoringWindowMs: number;
}

export interface RollbackPlan {
  steps: string[];
  estimatedDurationMs: number;
  requiresManualIntervention: boolean;
  preRollbackSnapshot?: Record<string, unknown>;
}

export interface SuccessCriterion {
  id: string;
  description: string;
  criticality: Criticality;
  check: () => Promise<ValidationResult>;
}

export interface Approval {
  approved: boolean;
  approvedBy: string;
  approvedAt: Date;
  conditions: string[];
  expiresAt: Date;
}

export interface ExecutionStep {
  id: string;
  name: string;
  action: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  /** Parameters without any secret values */
  parameters: Record<string, unknown>;
  output?: unknown;
  error?: string;
}
