import { getSession, revokeSession, revokeAllUserSessions, Session, SessionState } from '../db/dynamo'

export async function getActiveSession(sessionId: string): Promise<Session | null> {
  const session = await getSession(sessionId)
  if (!session) return null

  switch (session.state) {
    case 'active':
      break
    case 'rotated':
    case 'revoked':
    case 'expired':
      return null
    default:
      // INVARIANT: unknown state must never silently pass
      throw new Error('UNKNOWN_SESSION_STATE: ' + (session as { state: string }).state)
  }

  if (new Date(session.expires_at) < new Date()) return null
  return session
}

export async function terminateSession(sessionId: string): Promise<void> {
  await revokeSession(sessionId)  // Idempotent
}

export async function terminateAllSessions(userId: string): Promise<void> {
  await revokeAllUserSessions(userId)
}

export type { SessionState }
