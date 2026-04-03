import type { IAMManager } from './iam-manager.js';
import type { Action, ResourceType } from './types.js';

type Request = {
  headers: Record<string, string | string[] | undefined>;
  user?: { id: string };
  [key: string]: unknown;
};

type Response = {
  status: (code: number) => Response;
  json: (body: unknown) => void;
};

type NextFn = (err?: unknown) => void;

/**
 * Express-compatible middleware that enforces IAM permission checks.
 *
 * Reads principal ID from req.user.id (set by your auth middleware).
 *
 * @example
 * router.post('/dns/records',
 *   requirePermission(iam, 'dns:write', 'zone'),
 *   handler
 * );
 */
export function requirePermission(
  iam: IAMManager,
  action: Action,
  resourceType: ResourceType = '*',
  resourceIdResolver?: (req: Request) => string,
) {
  return async (req: Request, res: Response, next: NextFn): Promise<void> => {
    const principalId = req.user?.id;

    if (!principalId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No authenticated principal found on request',
        code: 'IAM_NO_PRINCIPAL',
      });
      return;
    }

    const resourceId = resourceIdResolver ? resourceIdResolver(req) : '*';

    const allowed = await iam.checkPermission(principalId, action, resourceType, resourceId);

    if (!allowed) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Principal '${principalId}' is not allowed to perform '${action}' on '${resourceType}:${resourceId}'`,
        code: 'IAM_PERMISSION_DENIED',
        principal: principalId,
        action,
        resource: `${resourceType}:${resourceId}`,
      });
      return;
    }

    next();
  };
}

/**
 * Express-compatible middleware that checks whether the principal has any of the given roles.
 */
export function requireRole(
  iam: IAMManager,
  ...roleIds: string[]
) {
  return async (req: Request, res: Response, next: NextFn): Promise<void> => {
    const principalId = req.user?.id;

    if (!principalId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No authenticated principal found on request',
        code: 'IAM_NO_PRINCIPAL',
      });
      return;
    }

    const principalRoles = iam.getPrincipalRoles(principalId).map((r) => r.id);
    const hasRole = roleIds.some((rid) => principalRoles.includes(rid));

    if (!hasRole) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Principal '${principalId}' does not have required role(s): ${roleIds.join(', ')}`,
        code: 'IAM_ROLE_REQUIRED',
        principal: principalId,
        requiredRoles: roleIds,
        principalRoles,
      });
      return;
    }

    next();
  };
}
