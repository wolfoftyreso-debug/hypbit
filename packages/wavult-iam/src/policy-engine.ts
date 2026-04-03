import type { Policy, Action, ResourceType, PrincipalType, AuditEntry } from './types.js';

export type EvaluationResult = 'allow' | 'deny' | 'not-applicable';

/**
 * PolicyEngine — evaluates whether a principal may perform an action on a resource.
 *
 * Rules:
 * - Explicit DENY always wins over ALLOW (deny-override model)
 * - Wildcard '*' matches any action or resource
 * - Logs every evaluation to the audit trail
 */
export class PolicyEngine {
  private readonly policies = new Map<string, Policy>();
  private readonly auditTrail: AuditEntry[] = [];

  addPolicy(policy: Policy): void {
    this.policies.set(policy.id, policy);
  }

  removePolicy(id: string): boolean {
    return this.policies.delete(id);
  }

  listPolicies(): Policy[] {
    return [...this.policies.values()];
  }

  /**
   * Evaluate whether a principal may perform an action on a resource.
   * Deny overrides allow.
   */
  evaluate(
    principalId: string,
    principalType: PrincipalType,
    action: Action,
    resourceType: ResourceType,
    resourceId: string,
  ): EvaluationResult {
    const applicable = [...this.policies.values()].filter((p) =>
      p.principals.some((pr) => pr.id === principalId || pr.id === '*'),
    );

    if (applicable.length === 0) {
      this.audit(principalId, action, resourceType, resourceId, 'deny', 'No applicable policies');
      return 'not-applicable';
    }

    let hasAllow = false;

    for (const policy of applicable) {
      const actionMatch = policy.actions.includes('*') || policy.actions.includes(action);
      const resourceMatch =
        policy.resources.some(
          (r) =>
            (r.type === '*' || r.type === resourceType) &&
            (r.id === '*' || r.id === resourceId),
        );

      if (!actionMatch || !resourceMatch) continue;

      if (policy.effect === 'deny') {
        this.audit(
          principalId, action, resourceType, resourceId,
          'deny', `Explicit deny by policy: ${policy.id}`,
        );
        return 'deny';
      }
      hasAllow = true;
    }

    if (hasAllow) {
      this.audit(principalId, action, resourceType, resourceId, 'allow', 'Allowed by policy');
      return 'allow';
    }

    this.audit(
      principalId, action, resourceType, resourceId,
      'deny', 'No matching allow policy',
    );
    return 'not-applicable';
  }

  /** Return audit trail (newest first). */
  getAuditTrail(limit = 100): AuditEntry[] {
    return [...this.auditTrail]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  private audit(
    principalId: string,
    action: Action,
    resourceType: ResourceType,
    resourceId: string,
    result: 'allow' | 'deny',
    reason: string,
  ): void {
    this.auditTrail.push({
      timestamp: new Date(),
      principalId,
      action,
      resourceType,
      resourceId,
      result,
      reason,
    });
    if (this.auditTrail.length > 10_000) this.auditTrail.shift();
  }
}
