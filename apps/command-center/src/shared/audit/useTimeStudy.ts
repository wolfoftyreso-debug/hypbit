import { useQuery } from '@tanstack/react-query'
import type { AuditAction } from './useAuditLog'

const API = import.meta.env.VITE_API_URL ?? 'https://api.wavult.com'

export interface SessionAnalytics {
  session_id: string
  started_at: string
  ended_at: string | null
  total_time_ms: number
  value_added_time_ms: number
  waste_time_ms: number
  touch_time_by_module: Record<string, number>
  action_frequency: Record<string, number>
  efficiency_score: number          // 0-100
  lean_waste_breakdown: {
    motion: number                  // % av total
    waiting: number
    overprocessing: number
  }
  kaizen_score: number              // 0-100 (improvement actions / total)
  work_effort_score: number         // 0-100 (composite)
}

export interface TeamMemberAnalytics {
  user_id: string
  name: string
  role: string
  sessions_count: number
  avg_efficiency: number
  avg_work_effort: number
  top_modules: string[]
  waste_index: number               // 0-100 (lägre = bättre)
  kaizen_score: number
  total_time_hours: number
}

export function useMyAnalytics(userId: string | undefined, period = '30d') {
  return useQuery({
    queryKey: ['audit-analytics', userId, period],
    queryFn: async () => {
      if (!userId) return null
      const res = await fetch(`${API}/api/audit/analytics?userId=${userId}&period=${period}`, {
        headers: { 'Authorization': 'Bearer bypass' }
      })
      if (!res.ok) return null
      return await res.json() as { sessions: SessionAnalytics[]; aggregate: SessionAnalytics }
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useTeamAnalytics(period = '30d') {
  return useQuery({
    queryKey: ['audit-team-analytics', period],
    queryFn: async () => {
      const res = await fetch(`${API}/api/audit/team-analytics?period=${period}`, {
        headers: { 'Authorization': 'Bearer bypass' }
      })
      if (!res.ok) return []
      return await res.json() as TeamMemberAnalytics[]
    },
    staleTime: 1000 * 60 * 5,
  })
}

// Lokalt beräkna analytics från sessions (om API ej svarar)
export function calculateSessionAnalytics(actions: AuditAction[]): Partial<SessionAnalytics> {
  if (!actions.length) return {}

  const total_time_ms = actions.reduce((sum, a) => sum + (a.duration_ms ?? 0), 0)
  const value_added_ms = actions
    .filter(a => a.value_added)
    .reduce((sum, a) => sum + (a.duration_ms ?? 0), 0)

  const touch_time_by_module: Record<string, number> = {}
  const action_frequency: Record<string, number> = {}
  let motion_ms = 0, waiting_ms = 0, overprocessing_ms = 0

  actions.forEach(a => {
    touch_time_by_module[a.module] = (touch_time_by_module[a.module] ?? 0) + (a.duration_ms ?? 0)
    action_frequency[a.type] = (action_frequency[a.type] ?? 0) + 1
    if (a.waste_type === 'motion') motion_ms += a.duration_ms ?? 0
    if (a.waste_type === 'waiting') waiting_ms += a.duration_ms ?? 0
    if (a.waste_type === 'overprocessing') overprocessing_ms += a.duration_ms ?? 0
  })

  const efficiency_score = total_time_ms > 0 ? Math.round((value_added_ms / total_time_ms) * 100) : 0
  const improvement_actions = actions.filter(a => ['update', 'approve', 'archive'].includes(a.type)).length
  const kaizen_score = actions.length > 0 ? Math.round((improvement_actions / actions.length) * 100) : 0

  return {
    total_time_ms,
    value_added_time_ms: value_added_ms,
    waste_time_ms: total_time_ms - value_added_ms,
    touch_time_by_module,
    action_frequency,
    efficiency_score,
    lean_waste_breakdown: {
      motion: total_time_ms > 0 ? Math.round((motion_ms / total_time_ms) * 100) : 0,
      waiting: total_time_ms > 0 ? Math.round((waiting_ms / total_time_ms) * 100) : 0,
      overprocessing: total_time_ms > 0 ? Math.round((overprocessing_ms / total_time_ms) * 100) : 0,
    },
    kaizen_score,
    work_effort_score: Math.round((efficiency_score * 0.6) + (kaizen_score * 0.4)),
  }
}
