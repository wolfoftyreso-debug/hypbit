import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../shared/auth/AuthContext'
import type {
  CrmContact,
  CrmProspect,
  CrmDeal,
  CrmActivity,
} from '../../../lib/supabase'

const API = import.meta.env.VITE_API_URL ?? 'https://api.wavult.com'

async function apiFetch<T>(path: string, token: string | null, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// ─── Contacts ─────────────────────────────────────────────────────────────────

export function useCrmContacts(search?: string) {
  const { getToken } = useAuth()
  return useQuery({
    queryKey: ['crm-contacts', search],
    queryFn: async () => {
      try {
        const token = await getToken()
        const path = search ? `/api/contacts?search=${encodeURIComponent(search)}` : '/api/contacts'
        const data = await apiFetch<CrmContact[]>(path, token)
        return data ?? []
      } catch (err) {
        console.warn('[CRM] contacts fetch error:', err)
        return [] as CrmContact[]
      }
    },
  })
}

export function useCreateContact() {
  const { getToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (contact: Omit<CrmContact, 'id' | 'created_at' | 'updated_at'>) => {
      const token = await getToken()
      return apiFetch<CrmContact>('/api/contacts', token, {
        method: 'POST',
        body: JSON.stringify(contact),
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-contacts'] }),
  })
}

export function useUpdateContact() {
  const { getToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CrmContact> & { id: string }) => {
      const token = await getToken()
      return apiFetch<CrmContact>(`/api/contacts/${id}`, token, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-contacts'] }),
  })
}

export function useDeleteContact() {
  const { getToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken()
      const res = await fetch(`${API}/api/contacts/${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-contacts'] }),
  })
}

// ─── Prospects ────────────────────────────────────────────────────────────────

type ProspectFilters = {
  stage?: CrmProspect['stage']
  assignee?: CrmProspect['assignee']
  product?: CrmProspect['product']
}

export function useCrmProspects(filters?: ProspectFilters) {
  const { getToken } = useAuth()
  return useQuery({
    queryKey: ['crm-prospects', filters],
    queryFn: async () => {
      try {
        const token = await getToken()
        const params = new URLSearchParams()
        if (filters?.stage)    params.set('stage', filters.stage)
        if (filters?.assignee) params.set('assignee', filters.assignee)
        if (filters?.product)  params.set('product', filters.product)
        const qs = params.toString()
        const data = await apiFetch<CrmProspect[]>(`/api/deals${qs ? `?${qs}` : ''}`, token)
        return data ?? []
      } catch (err) {
        console.warn('[CRM] prospects fetch error:', err)
        return [] as CrmProspect[]
      }
    },
  })
}

export function useCrmProspect(id: string) {
  const { getToken } = useAuth()
  return useQuery({
    queryKey: ['crm-prospects', id],
    queryFn: async () => {
      const token = await getToken()
      return apiFetch<CrmProspect>(`/api/deals/${id}`, token)
    },
    enabled: !!id,
  })
}

export function useCreateProspect() {
  const { getToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (prospect: Omit<CrmProspect, 'id' | 'created_at' | 'updated_at'>) => {
      const token = await getToken()
      return apiFetch<CrmProspect>('/api/deals', token, {
        method: 'POST',
        body: JSON.stringify(prospect),
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-prospects'] }),
  })
}

export function useUpdateProspect() {
  const { getToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CrmProspect> & { id: string }) => {
      const token = await getToken()
      return apiFetch<CrmProspect>(`/api/deals/${id}`, token, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-prospects'] }),
  })
}

export function useUpdateProspectStage() {
  const { getToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: CrmProspect['stage'] }) => {
      const token = await getToken()
      return apiFetch<CrmProspect>(`/api/deals/${id}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ stage, days_in_stage: 0 }),
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-prospects'] }),
  })
}

export function useDeleteProspect() {
  const { getToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken()
      const res = await fetch(`${API}/api/deals/${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-prospects'] }),
  })
}

// ─── Deals ────────────────────────────────────────────────────────────────────

type DealFilters = {
  status?: CrmDeal['status']
  assignee?: CrmDeal['assignee']
  product?: CrmDeal['product']
}

export function useCrmDeals(filters?: DealFilters) {
  const { getToken } = useAuth()
  return useQuery({
    queryKey: ['crm-deals', filters],
    queryFn: async () => {
      try {
        const token = await getToken()
        const params = new URLSearchParams()
        if (filters?.status)   params.set('status', filters.status)
        if (filters?.assignee) params.set('assignee', filters.assignee)
        if (filters?.product)  params.set('product', filters.product)
        const qs = params.toString()
        const data = await apiFetch<CrmDeal[]>(`/api/deals${qs ? `?${qs}` : ''}`, token)
        return data ?? []
      } catch (err) {
        console.warn('[CRM] deals fetch error:', err)
        return [] as CrmDeal[]
      }
    },
  })
}

export function useCreateDeal() {
  const { getToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (deal: Omit<CrmDeal, 'id' | 'created_at' | 'updated_at'>) => {
      const token = await getToken()
      return apiFetch<CrmDeal>('/api/deals', token, {
        method: 'POST',
        body: JSON.stringify(deal),
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-deals'] }),
  })
}

export function useUpdateDeal() {
  const { getToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CrmDeal> & { id: string }) => {
      const token = await getToken()
      return apiFetch<CrmDeal>(`/api/deals/${id}`, token, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-deals'] }),
  })
}

export function useDeleteDeal() {
  const { getToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken()
      const res = await fetch(`${API}/api/deals/${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-deals'] }),
  })
}

// ─── Activities ───────────────────────────────────────────────────────────────

export function useCrmActivities(prospectId?: string) {
  const { getToken } = useAuth()
  return useQuery({
    queryKey: ['crm-activities', prospectId],
    queryFn: async () => {
      try {
        const token = await getToken()
        const path = prospectId ? `/api/activities?prospect_id=${encodeURIComponent(prospectId)}` : '/api/activities'
        const data = await apiFetch<CrmActivity[]>(path, token)
        return data ?? []
      } catch (err) {
        console.warn('[CRM] activities fetch error:', err)
        return [] as CrmActivity[]
      }
    },
  })
}

export function useCreateActivity() {
  const { getToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (activity: Omit<CrmActivity, 'id' | 'created_at'>) => {
      const token = await getToken()
      return apiFetch<CrmActivity>('/api/activities', token, {
        method: 'POST',
        body: JSON.stringify(activity),
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-activities'] })
      qc.invalidateQueries({ queryKey: ['crm-prospects'] })
    },
  })
}

// ─── Pipeline Stats (derived from prospects) ──────────────────────────────────

export function useCrmPipelineStats() {
  const { getToken } = useAuth()
  return useQuery({
    queryKey: ['crm-pipeline-stats'],
    queryFn: async () => {
      try {
        const token = await getToken()
        const data = await apiFetch<CrmProspect[]>('/api/deals', token)
        const prospects = (data ?? []) as CrmProspect[]

        const totalPipeline = prospects
          .filter(p => !['Vunnen','Förlorad'].includes(p.stage))
          .reduce((s, p) => s + p.value_sek, 0)

        const wonValue = prospects
          .filter(p => p.stage === 'Vunnen')
          .reduce((s, p) => s + p.value_sek, 0)

        const byStage = prospects.reduce<Record<string, { count: number; value: number }>>((acc, p) => {
          if (!acc[p.stage]) acc[p.stage] = { count: 0, value: 0 }
          acc[p.stage].count += 1
          acc[p.stage].value += p.value_sek
          return acc
        }, {})

        const byAssignee = prospects.reduce<Record<string, { count: number; value: number }>>((acc, p) => {
          if (!acc[p.assignee]) acc[p.assignee] = { count: 0, value: 0 }
          acc[p.assignee].count += 1
          acc[p.assignee].value += p.value_sek
          return acc
        }, {})

        return { totalPipeline, wonValue, byStage, byAssignee, totalCount: prospects.length }
      } catch (err) {
        console.warn('[CRM] pipeline-stats fetch error:', err)
        return { totalPipeline: 0, wonValue: 0, byStage: {}, byAssignee: {}, totalCount: 0 }
      }
    },
  })
}
