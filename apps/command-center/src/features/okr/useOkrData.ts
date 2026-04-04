/**
 * useOkrData — reaktiv hook för OKR-modulen
 * Hämtar data live från API Core. Ingen mockdata.
 */

import { useState, useEffect, useCallback } from 'react'
import { useApi } from '../../shared/auth/useApi'
import type {
  OkrCycle,
  OkrObjective,
  OkrDashboard,
  OkrKeyResult,
  OkrCheckin,
  OkrInitiative,
  Confidence,
} from './okrTypes'

// ─── Cycles hook ──────────────────────────────────────────────────────────────

export interface UseOkrCyclesResult {
  cycles: OkrCycle[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useOkrCycles(entity?: string): UseOkrCyclesResult {
  const { apiFetch } = useApi()
  const [cycles, setCycles] = useState<OkrCycle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => {
    setLoading(true)
    const qs = entity ? `?entity=${encodeURIComponent(entity)}` : ''
    apiFetch(`/v1/okr/cycles${qs}`)
      .then(r => r.json())
      .then(d => { setCycles(d); setError(null) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [entity, tick])

  return { cycles, loading, error, refetch }
}

// ─── Objectives hook ──────────────────────────────────────────────────────────

export interface UseOkrObjectivesResult {
  objectives: OkrObjective[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useOkrObjectives(cycleId: string | null): UseOkrObjectivesResult {
  const { apiFetch } = useApi()
  const [objectives, setObjectives] = useState<OkrObjective[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => {
    if (!cycleId) { setObjectives([]); return }
    setLoading(true)
    apiFetch(`/v1/okr/${cycleId}/objectives`)
      .then(r => r.json())
      .then(d => { setObjectives(d); setError(null) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [cycleId, tick])

  return { objectives, loading, error, refetch }
}

// ─── Dashboard hook ───────────────────────────────────────────────────────────

export interface UseOkrDashboardResult {
  dashboard: OkrDashboard | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useOkrDashboard(entity: string = 'wavult-os'): UseOkrDashboardResult {
  const { apiFetch } = useApi()
  const [dashboard, setDashboard] = useState<OkrDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => {
    setLoading(true)
    apiFetch(`/v1/okr/dashboard?entity=${encodeURIComponent(entity)}`)
      .then(r => r.json())
      .then(d => { setDashboard(d); setError(null) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [entity, tick])

  return { dashboard, loading, error, refetch }
}

// ─── Check-ins hook ───────────────────────────────────────────────────────────

export function useOkrCheckins(krId: string | null) {
  const { apiFetch } = useApi()
  const [checkins, setCheckins] = useState<OkrCheckin[]>([])
  const [loading, setLoading] = useState(false)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => {
    if (!krId) return
    setLoading(true)
    apiFetch(`/v1/okr/kr/${krId}/checkins`)
      .then(r => r.json())
      .then(d => setCheckins(d))
      .finally(() => setLoading(false))
  }, [krId, tick])

  return { checkins, loading, refetch }
}

// ─── API actions ──────────────────────────────────────────────────────────────

export function useOkrActions() {
  const { apiFetch } = useApi()

  const createObjective = async (cycleId: string, payload: Partial<OkrObjective>) => {
    const r = await apiFetch(`/v1/okr/${cycleId}/objectives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return r.json()
  }

  const updateObjective = async (objectiveId: string, payload: Partial<OkrObjective>) => {
    const r = await apiFetch(`/v1/okr/objectives/${objectiveId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return r.json()
  }

  const deleteObjective = async (objectiveId: string) => {
    const r = await apiFetch(`/v1/okr/objectives/${objectiveId}`, { method: 'DELETE' })
    return r.json()
  }

  const createKr = async (objectiveId: string, payload: Partial<OkrKeyResult>) => {
    const r = await apiFetch(`/v1/okr/objectives/${objectiveId}/kr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return r.json()
  }

  const updateKr = async (krId: string, payload: Partial<OkrKeyResult>) => {
    const r = await apiFetch(`/v1/okr/kr/${krId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return r.json()
  }

  const deleteKr = async (krId: string) => {
    const r = await apiFetch(`/v1/okr/kr/${krId}`, { method: 'DELETE' })
    return r.json()
  }

  const createInitiative = async (krId: string, payload: Partial<OkrInitiative>) => {
    const r = await apiFetch(`/v1/okr/kr/${krId}/initiatives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return r.json()
  }

  const checkin = async (krId: string, payload: {
    checked_by: string
    current_value?: number
    confidence: Confidence
    note?: string
    blocker?: string
    meeting_id?: string
  }) => {
    const r = await apiFetch(`/v1/okr/kr/${krId}/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return r.json()
  }

  const createCycle = async (payload: Partial<OkrCycle>) => {
    const r = await apiFetch('/v1/okr/cycles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return r.json()
  }

  return {
    createObjective, updateObjective, deleteObjective,
    createKr, updateKr, deleteKr,
    createInitiative,
    checkin,
    createCycle,
  }
}
