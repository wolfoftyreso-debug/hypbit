import { Router, Request, Response, NextFunction } from 'express'
import { requireAuth } from '../middleware/auth'
import { getActiveSession, terminateSession, terminateAllSessions } from '../services/sessionService'

export const sessionsRouter = Router()

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next)
}

// GET /v1/sessions/:sessionId — get session info
sessionsRouter.get('/:sessionId', requireAuth, asyncHandler(async (req, res) => {
  const session = await getActiveSession(req.params.sessionId)
  if (!session) { res.status(404).json({ error: 'SESSION_NOT_FOUND' }); return }

  // Only allow users to view their own sessions
  if (session.user_id !== req.user!.sub) {
    res.status(403).json({ error: 'FORBIDDEN' })
    return
  }

  res.json({ data: session })
}))

// DELETE /v1/sessions/:sessionId — revoke a session
sessionsRouter.delete('/:sessionId', requireAuth, asyncHandler(async (req, res) => {
  const session = await getActiveSession(req.params.sessionId)
  if (!session) { res.status(404).json({ error: 'SESSION_NOT_FOUND' }); return }

  if (session.user_id !== req.user!.sub) {
    res.status(403).json({ error: 'FORBIDDEN' })
    return
  }

  await terminateSession(req.params.sessionId)
  res.json({ data: { success: true } })
}))

// DELETE /v1/sessions — revoke all sessions for current user
sessionsRouter.delete('/', requireAuth, asyncHandler(async (req, res) => {
  await terminateAllSessions(req.user!.sub)
  res.json({ data: { success: true } })
}))
