import { Request, Response, NextFunction } from 'express'
import { logAuthEvent } from '../services/authService'

/**
 * Audit middleware — logs all authenticated requests.
 * Attach after requireAuth() on sensitive routes.
 */
export function auditLog(eventType: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (req.user) {
      await logAuthEvent(
        req.user.sub,
        eventType,
        req.ip || undefined,
        req.headers['user-agent'] || undefined,
        req.user.session_id,
        { method: req.method, path: req.path }
      ).catch((err) => console.error('[Audit] Failed to log event:', err))
    }
    next()
  }
}
