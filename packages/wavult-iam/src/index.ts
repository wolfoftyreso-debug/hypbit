/**
 * @wavult/wavult-iam
 *
 * Internal IAM / Policy Engine for Wavult OS.
 * Controls who can do what to which resources.
 */

export { IAMManager } from './iam-manager.js';
export type { IAMManagerConfig } from './iam-manager.js';

export { PolicyEngine } from './policy-engine.js';
export type { EvaluationResult } from './policy-engine.js';

export { requirePermission, requireRole } from './middleware.js';

export { PREDEFINED_ROLES } from './roles.js';

export type {
  Principal,
  PrincipalType,
  Resource,
  ResourceType,
  Action,
  Policy,
  PolicyEffect,
  PolicyCondition,
  IAMRole,
  AuditEntry,
} from './types.js';
