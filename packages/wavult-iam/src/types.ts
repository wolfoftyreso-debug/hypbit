export type PrincipalType = 'user' | 'service' | 'agent';
export type PolicyEffect = 'allow' | 'deny';

export type Action =
  | 'dns:read'
  | 'dns:write'
  | 'zone:read'
  | 'zone:write'
  | 'deploy:trigger'
  | 'deploy:rollback'
  | 'deploy:read'
  | 'pages:read'
  | 'pages:write'
  | 'tunnel:manage'
  | 'tunnel:read'
  | 'service:restart'
  | 'service:read'
  | 'secret:read'
  | 'secret:write'
  | 'iam:admin'
  | 'iam:read'
  | 'waf:read'
  | 'waf:write'
  | 'audit:read'
  | '*';

export type ResourceType =
  | 'zone'
  | 'deployment'
  | 'tunnel'
  | 'service'
  | 'secret'
  | 'iam'
  | 'pages'
  | '*';

export interface Principal {
  id: string;
  type: PrincipalType;
  name: string;
  metadata?: Record<string, string>;
}

export interface Resource {
  type: ResourceType;
  id: string;
  name?: string;
}

export interface PolicyCondition {
  /** Restrict to specific IP addresses or CIDR ranges */
  ipRange?: string[];
  /** Restrict to specific time window (ISO time strings, e.g. "08:00"–"18:00") */
  timeWindow?: { from: string; to: string; timezone?: string };
}

export interface Policy {
  id: string;
  principals: Array<{ id: string; type: PrincipalType }>;
  actions: Action[];
  resources: Array<{ type: ResourceType; id: string }>;
  effect: PolicyEffect;
  conditions?: PolicyCondition;
  description?: string;
  createdAt: Date;
}

export interface IAMRole {
  id: string;
  name: string;
  description: string;
  policies: Policy[];
}

export interface AuditEntry {
  timestamp: Date;
  principalId: string;
  action: Action;
  resourceType: ResourceType;
  resourceId: string;
  result: 'allow' | 'deny';
  reason: string;
}
