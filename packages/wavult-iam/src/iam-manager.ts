import type { Principal, IAMRole, Action, ResourceType, PrincipalType, AuditEntry } from './types.js';
import { PolicyEngine } from './policy-engine.js';
import { PREDEFINED_ROLES } from './roles.js';

export interface IAMManagerConfig {
  /** Seed with predefined roles on init (default: true) */
  loadPredefinedRoles?: boolean;
}

/**
 * IAMManager — high-level interface for managing principals, roles, and permissions.
 */
export class IAMManager {
  private readonly engine: PolicyEngine;
  private readonly principals = new Map<string, Principal>();
  private readonly principalRoles = new Map<string, Set<string>>();
  private readonly roles = new Map<string, IAMRole>();
  private readonly checkLog: Array<{
    timestamp: Date;
    principalId: string;
    action: Action;
    resourceId: string;
    allowed: boolean;
  }> = [];

  constructor(config: IAMManagerConfig = {}) {
    this.engine = new PolicyEngine();

    // Load predefined roles by default
    if (config.loadPredefinedRoles !== false) {
      for (const role of Object.values(PREDEFINED_ROLES)) {
        this.registerRole(role);
      }
    }
  }

  // ─── Principals ────────────────────────────────────────────────────────────

  registerPrincipal(principal: Principal): void {
    this.principals.set(principal.id, principal);
    if (!this.principalRoles.has(principal.id)) {
      this.principalRoles.set(principal.id, new Set());
    }
  }

  getPrincipal(id: string): Principal | undefined {
    return this.principals.get(id);
  }

  // ─── Roles ─────────────────────────────────────────────────────────────────

  registerRole(role: IAMRole): void {
    this.roles.set(role.id, role);
    for (const policy of role.policies) {
      this.engine.addPolicy(policy);
    }
  }

  /** Assign a role to a principal. Adds the principal to all role policies. */
  assignRole(principalId: string, roleId: string): void {
    const role = this.roles.get(roleId);
    if (!role) throw new Error(`Role not found: ${roleId}`);

    const principal = this.principals.get(principalId);
    if (!principal) throw new Error(`Principal not found: ${principalId}`);

    // Add principal to each policy in the role
    for (const policy of role.policies) {
      const existing = this.engine.listPolicies().find((p) => p.id === policy.id);
      if (existing && !existing.principals.some((pr) => pr.id === principalId)) {
        existing.principals.push({ id: principalId, type: principal.type });
      }
    }

    const roles = this.principalRoles.get(principalId) ?? new Set();
    roles.add(roleId);
    this.principalRoles.set(principalId, roles);
  }

  /** Remove a role from a principal. */
  removeRole(principalId: string, roleId: string): void {
    const roles = this.principalRoles.get(principalId);
    if (roles) roles.delete(roleId);
  }

  /** Get roles assigned to a principal. */
  getPrincipalRoles(principalId: string): IAMRole[] {
    const roleIds = this.principalRoles.get(principalId) ?? new Set();
    return [...roleIds]
      .map((id) => this.roles.get(id))
      .filter((r): r is IAMRole => r !== undefined);
  }

  // ─── Permission Checks ─────────────────────────────────────────────────────

  /** Check whether a principal is allowed to perform an action on a resource. */
  async checkPermission(
    principalId: string,
    action: Action,
    resourceType: ResourceType,
    resourceId = '*',
  ): Promise<boolean> {
    const principal = this.principals.get(principalId);
    const principalType: PrincipalType = principal?.type ?? 'service';

    const result = this.engine.evaluate(
      principalId,
      principalType,
      action,
      resourceType,
      resourceId,
    );

    const allowed = result === 'allow';

    this.checkLog.push({
      timestamp: new Date(),
      principalId,
      action,
      resourceId,
      allowed,
    });
    if (this.checkLog.length > 5_000) this.checkLog.shift();

    return allowed;
  }

  /** Get all actions a principal is effectively allowed to perform. */
  async getEffectivePermissions(principalId: string): Promise<Action[]> {
    const ALL_ACTIONS: Action[] = [
      'dns:read', 'dns:write', 'zone:read', 'zone:write',
      'deploy:trigger', 'deploy:rollback', 'deploy:read',
      'pages:read', 'pages:write', 'tunnel:manage', 'tunnel:read',
      'service:restart', 'service:read', 'secret:read', 'secret:write',
      'iam:admin', 'iam:read', 'waf:read', 'waf:write', 'audit:read',
    ];

    const allowed: Action[] = [];
    for (const action of ALL_ACTIONS) {
      const ok = await this.checkPermission(principalId, action, '*');
      if (ok) allowed.push(action);
    }
    return allowed;
  }

  // ─── Audit ─────────────────────────────────────────────────────────────────

  getAuditTrail(limit = 100): AuditEntry[] {
    return this.engine.getAuditTrail(limit);
  }

  getCheckLog(limit = 100) {
    return [...this.checkLog]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}
