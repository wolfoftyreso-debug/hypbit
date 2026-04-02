import { useState, useEffect, useCallback } from 'react'
import { useApi } from '../../../shared/auth/useApi'

export interface TaxDeclaration {
  id: string
  entity_id: string
  jurisdiction: string
  declaration_type: string
  period_from: string
  period_to: string
  deadline: string
  status: 'draft' | 'prepared' | 'submitted' | 'confirmed' | 'overdue'
  amount_due: number
  currency: string
  submission_ref?: string
  submitted_at?: string
  submitted_by?: string
  data: Record<string, unknown>
}

export interface TaxCalendarEntry {
  type: string
  period: string
  deadline: string
  jurisdiction: string
  description: string
}

export function useTaxDeclarations(entityId: string) {
  const { apiFetch } = useApi()
  const [declarations, setDeclarations] = useState<TaxDeclaration[]>([])
  const [upcoming, setUpcoming] = useState<TaxDeclaration[]>([])
  const [calendar, setCalendar] = useState<TaxCalendarEntry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [dRes, uRes, cRes] = await Promise.allSettled([
        apiFetch(`/api/tax/${entityId}/declarations`),
        apiFetch(`/api/tax/${entityId}/upcoming`),
        apiFetch(`/api/tax/${entityId}/calendar`),
      ])
      if (dRes.status === 'fulfilled' && dRes.value.ok) setDeclarations(await dRes.value.json())
      if (uRes.status === 'fulfilled' && uRes.value.ok) setUpcoming(await uRes.value.json())
      if (cRes.status === 'fulfilled' && cRes.value.ok) {
        const d = await cRes.value.json()
        setCalendar(d.calendar ?? [])
      }
    } catch { /* silent */ } finally { setLoading(false) }
  }, [apiFetch, entityId])

  useEffect(() => { void load() }, [load])

  const calculateMoms = async (periodFrom: string, periodTo: string, quarter: string) => {
    const res = await apiFetch(`/api/tax/${entityId}/calculate/se-moms`, {
      method: 'POST',
      body: JSON.stringify({ period_from: periodFrom, period_to: periodTo, quarter }),
    })
    if (res.ok) await load()
    return res.json()
  }

  const calculateAGI = async (periodFrom: string, periodTo: string, month: string) => {
    const res = await apiFetch(`/api/tax/${entityId}/calculate/se-agi`, {
      method: 'POST',
      body: JSON.stringify({ period_from: periodFrom, period_to: periodTo, month }),
    })
    if (res.ok) await load()
    return res.json()
  }

  const submitDeclaration = async (
    declarationId: string,
    submissionRef: string,
    submittedBy: string,
  ) => {
    const res = await apiFetch(
      `/api/tax/${entityId}/declarations/${declarationId}/submit`,
      {
        method: 'POST',
        body: JSON.stringify({ submission_ref: submissionRef, submitted_by: submittedBy }),
      },
    )
    if (res.ok) await load()
    return res.json()
  }

  return {
    declarations,
    upcoming,
    calendar,
    loading,
    reload: load,
    calculateMoms,
    calculateAGI,
    submitDeclaration,
  }
}
