import type { IAMRole, Policy } from './types.js';

const now = new Date();

const makePolicy = (
  id: string,
  actions: Policy['actions'],
  resources: Policy['resources'],
  effect: Policy['effect'] = 'allow',
  description?: string,
): Policy => ({
  id,
  principals: [], // assigned at role level
  actions,
  resources,
  effect,
  description,
  createdAt: now,
});

/** All resources wildcard shorthand */
const ALL: Policy['resources'] = [{ type: '*', id: '*' }];

export const PREDEFINED_ROLES: Record<string, IAMRole> = {
  INFRA_ADMIN: {
    id: 'role:infra-admin',
    name: 'Infrastructure Admin',
    description: 'Full access to all Wavult OS infrastructure resources.',
    policies: [
      makePolicy('pol:infra-admin:all', ['*'], ALL, 'allow', 'Full access'),
    ],
  },

  DEPLOY_AGENT: {
    id: 'role:deploy-agent',
    name: 'Deploy Agent',
    description: 'Can trigger and rollback deployments, read DNS, restart services.',
    policies: [
      makePolicy(
        'pol:deploy-agent:deploy',
        ['deploy:trigger', 'deploy:rollback', 'deploy:read'],
        [{ type: 'deployment', id: '*' }],
      ),
      makePolicy(
        'pol:deploy-agent:service',
        ['service:restart', 'service:read'],
        [{ type: 'service', id: '*' }],
      ),
      makePolicy(
        'pol:deploy-agent:dns-read',
        ['dns:read', 'zone:read'],
        [{ type: 'zone', id: '*' }],
      ),
      makePolicy(
        'pol:deploy-agent:pages-read',
        ['pages:read'],
        [{ type: 'pages', id: '*' }],
      ),
    ],
  },

  RUNTIME_SERVICE: {
    id: 'role:runtime-service',
    name: 'Runtime Service',
    description: 'Minimal access for running services — read DNS and secrets only.',
    policies: [
      makePolicy(
        'pol:runtime:dns-read',
        ['dns:read', 'zone:read'],
        [{ type: 'zone', id: '*' }],
      ),
      makePolicy(
        'pol:runtime:secret-read',
        ['secret:read'],
        [{ type: 'secret', id: '*' }],
      ),
      makePolicy(
        'pol:runtime:service-read',
        ['service:read'],
        [{ type: 'service', id: '*' }],
      ),
    ],
  },

  READ_ONLY_AUDIT: {
    id: 'role:read-only-audit',
    name: 'Read-Only Auditor',
    description: 'Read access to all resources, no writes. For auditing and monitoring.',
    policies: [
      makePolicy(
        'pol:audit:read-all',
        ['dns:read', 'zone:read', 'deploy:read', 'pages:read', 'tunnel:read',
          'service:read', 'iam:read', 'waf:read', 'audit:read'],
        ALL,
      ),
    ],
  },

  DNS_MANAGER: {
    id: 'role:dns-manager',
    name: 'DNS Manager',
    description: 'Read and write DNS records. No deployment or IAM access.',
    policies: [
      makePolicy(
        'pol:dns-manager:dns',
        ['dns:read', 'dns:write', 'zone:read'],
        [{ type: 'zone', id: '*' }],
      ),
    ],
  },

  TUNNEL_MANAGER: {
    id: 'role:tunnel-manager',
    name: 'Tunnel Manager',
    description: 'Manage Cloudflare Tunnels. Read-only DNS access.',
    policies: [
      makePolicy(
        'pol:tunnel-manager:tunnel',
        ['tunnel:manage', 'tunnel:read'],
        [{ type: 'tunnel', id: '*' }],
      ),
      makePolicy(
        'pol:tunnel-manager:dns-read',
        ['dns:read', 'zone:read'],
        [{ type: 'zone', id: '*' }],
      ),
    ],
  },
};
