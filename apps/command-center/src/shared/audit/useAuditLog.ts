import { useCallback, useEffect } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useRole } from '../auth/RoleContext'

const API = import.meta.env.VITE_API_URL ?? 'https://api.wavult.com'

export type AuditAction = {
  type: string  // 'navigate' | 'view' | 'create' | 'update' | 'delete' | 'export' | 'archive' | 'login' | 'logout' | 'submit' | 'approve'
  module: string // 'finance' | 'corporate' | 'crm' | 'git' | 'compliance' | 'people' | etc
  label: string  // Mänskligt läsbar beskrivning: "Öppnade Finance → TaxView"
  timestamp?: string
  duration_ms?: number       // tid i vyn (mäts automatiskt sedan föregående action)
  value_added: boolean       // sätts per action-typ
  waste_type?: 'waiting' | 'overprocessing' | 'motion' | null
  metadata?: Record<string, string | number | boolean>
}

// Value-added mapping
export const VALUE_ADDED_ACTIONS = new Set(['create', 'update', 'approve', 'export', 'archive', 'submit'])

export const WASTE_TYPE_MAP: Record<string, AuditAction['waste_type']> = {
  navigate: 'motion',
  view: null,       // neutral
  login: null,
  logout: null,
}

type AuditActionWithTimestamp = AuditAction & { timestamp: string }

// Singleton session ID per browser session
export const SESSION_ID = typeof crypto !== 'undefined' && crypto.randomUUID
  ? crypto.randomUUID()
  : `session-${Date.now()}-${Math.random().toString(36).slice(2)}`
const SESSION_START = new Date().toISOString()
const QUEUE: AuditActionWithTimestamp[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null
let lastActionTimestamp: number | null = null

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

  const log = useCallback((action: Omit<AuditAction, 'value_added' | 'duration_ms' | 'waste_type'> & Partial<Pick<AuditAction, 'value_added' | 'duration_ms' | 'waste_type'>>) => {
    const now = Date.now()

    // Auto-calculate duration since previous action
    const duration_ms = lastActionTimestamp !== null ? now - lastActionTimestamp : undefined
    lastActionTimestamp = now

    // Auto-derive value_added and waste_type if not provided
    const value_added = action.value_added ?? VALUE_ADDED_ACTIONS.has(action.type)
    const waste_type = action.waste_type !== undefined ? action.waste_type : (WASTE_TYPE_MAP[action.type] ?? null)

    const enrichedAction: AuditActionWithTimestamp = {
      ...action,
      timestamp: new Date().toISOString(),
      duration_ms,
      value_added,
      waste_type,
    }

    QUEUE.push(enrichedAction)

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
