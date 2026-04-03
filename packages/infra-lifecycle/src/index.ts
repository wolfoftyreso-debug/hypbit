/**
 * @wavult/infra-lifecycle
 *
 * Wavult OS Infrastructure Execution Lifecycle Engine.
 * Enforces the 18-phase model across all infrastructure domains:
 * Cloudflare, AWS, internal services, CI/CD, security policies.
 *
 * @see docs/INFRA_LIFECYCLE.md
 */

export { LifecycleEngine } from './lifecycle-engine.js';
export type { PhaseHandler, LifecycleEngineConfig } from './lifecycle-engine.js';

export { WorkItemManager, PHASE_ORDER } from './work-item.js';

export { AuditService } from './audit.service.js';

export type {
  WorkItem,
  WorkItemType,
  WorkItemStatus,
  InfraDomain,
  PhaseId,
  PhaseRecord,
  PhaseStatus,
  ValidationResult,
  Blocker,
  LogEntry,
  Criticality,
  ResourceTier,
  BlastRadius,
  ResourceRef,
  InventoryItem,
  RiskItem,
  DesignSpec,
  RollbackPlan,
  SuccessCriterion,
  Approval,
  ExecutionStep,
  ScopeDefinition,
} from './types.js';
