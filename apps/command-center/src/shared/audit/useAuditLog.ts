import { useCallback, useEffect } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useRole } from '../auth/RoleContext'

const API = import.meta.env.VITE_API_URL ?? 'https://api.wavult.com'

export type AuditAction = {
  type: string  // 'navigate' | 'view' | 'create' | 'update' | 'delete' | 'export' | 'archive' | 'login' | 'logout'
  module: string // 'finance' | 'corporate' | 'crm' | 'git' | 'compliance' | 'people' | etc
  label: string  // Mänskligt läsbar beskrivning: "Öppnade Finance → TaxView"
  metadata?: Record<string, string | number | boolean>
}

type AuditActionWithTimestamp = AuditAction & { timestamp: string }

// Singleton session ID per browser session
export const SESSION_ID = crypto.randomUUID()
const SESSION_START = new Date().toISOString()
const QUEUE: AuditActionWithTimestamp[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null

function flushQueue(token: string, userId: string, role: string) {
  if (!QUEUE.length) return
  const actions = [...QUEUE]
  QUEUE.length = 0
  fetch(`${API}/api/audit/log`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ session_id: SESSION_ID, user_id: userId, role, actions }),
  }).catch(() => {}) // fire-and-forget, never block UI
}

export function useAuditLog() {
  const { getToken, user } = useAuth()
  const { role } = useRole()

  const log = useCallback((action: AuditAction) => {
    QUEUE.push({ ...action, timestamp: new Date().toISOString() })
    // Debounce flush — 3 seconds
    if (flushTimer) clearTimeout(flushTimer)
    flushTimer = setTimeout(async () => {
      const token = await getToken().catch(() => 'bypass')
      flushQueue(
        token ?? 'bypass',
        user?.email ?? 'unknown',
        role?.id ?? 'unknown',
      )
    }, 3000)
  }, [getToken, user, role])

  // Log session start
  useEffect(() => {
    log({
      type: 'login',
      module: 'auth',
      label: 'Session startad',
      metadata: { session_id: SESSION_ID, start: SESSION_START },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { log, sessionId: SESSION_ID }
}
