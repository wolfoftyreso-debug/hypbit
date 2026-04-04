import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../shared/auth/AuthContext'
import type { Deal } from '../../../lib/supabase'

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

type DealFilters = {
  contactId?: string
  companyId?: string
  stage?: string
  status?: string
  minAmount?: number
  maxAmount?: number
  currency?: string
}

export function useDeals(filters?: DealFilters) {
  const { getToken } = useAuth()
  return useQuery({
    queryKey: ['deals', filters],
    queryFn: async () => {
      try {
        const token = await getToken()
        const params = new URLSearchParams()
        if (filters?.contactId)              params.set('contact_id', filters.contactId)
        if (filters?.companyId)              params.set('company_id', filters.companyId)
        if (filters?.stage)                  params.set('stage', filters.stage)
        if (filters?.status)                 params.set('status', filters.status)
        if (filters?.minAmount !== undefined) params.set('min_amount', String(filters.minAmount))
        if (filters?.maxAmount !== undefined) params.set('max_amount', String(filters.maxAmount))
        if (filters?.currency)               params.set('currency', filters.currency)
        const qs = params.toString()
        const data = await apiFetch<Deal[]>(`/api/deals${qs ? `?${qs}` : ''}`, token)
        return data ?? []
      } catch (err) {
        console.warn('[CRM] deals fetch error:', err)
        return [] as Deal[]
      }
    },
  })
}

export function useDeal(id: string) {
  const { getToken } = useAuth()
  return useQuery({
    queryKey: ['deals', id],
    queryFn: async () => {
      const token = await getToken()
      return apiFetch<Deal>(`/api/deals/${id}`, token)
    },
    enabled: !!id,
  })
}

export function useCreateDeal() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (deal: Omit<Deal, 'id' | 'created_at' | 'updated_at'>) => {
      const token = await getToken()
      return apiFetch<Deal>('/api/deals', token, {
        method: 'POST',
        body: JSON.stringify(deal),
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deals'] }),
  })
}

export function useUpdateDeal() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Deal> & { id: string }) => {
      const token = await getToken()
      return apiFetch<Deal>(`/api/deals/${id}`, token, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] })
      queryClient.invalidateQueries({ queryKey: ['deals', data.id] })
    },
  })
}

export function useDeleteDeal() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken()
      const res = await fetch(`${API}/api/deals/${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deals'] }),
  })
}

export function useDealStats(filters?: DealFilters) {
  const { getToken } = useAuth()
  return useQuery({
    queryKey: ['deals-stats', filters],
    queryFn: async () => {
      try {
        const token = await getToken()
        const params = new URLSearchParams()
        if (filters?.contactId) params.set('contact_id', filters.contactId)
        if (filters?.companyId) params.set('company_id', filters.companyId)
        if (filters?.stage)     params.set('stage', filters.stage)
        if (filters?.status)    params.set('status', filters.status)
        if (filters?.currency)  params.set('currency', filters.currency)
        const qs = params.toString()
        const data = await apiFetch<Deal[]>(`/api/deals${qs ? `?${qs}` : ''}`, token)
        const deals = (data ?? []) as Deal[]

        const stats = {
          totalDeals: deals.length,
          totalValue: deals.reduce((sum, deal) => sum + (deal.amount || 0), 0),
          totalByCurrency: {} as Record<string, number>,
          totalByStage: {} as Record<string, number>,
          avgDealSize: 0,
        }

        deals.forEach((deal) => {
          if (deal.amount) {
            if (!stats.totalByCurrency[deal.currency]) stats.totalByCurrency[deal.currency] = 0
            stats.totalByCurrency[deal.currency] += deal.amount

            if (deal.stage) {
              if (!stats.totalByStage[deal.stage]) stats.totalByStage[deal.stage] = 0
              stats.totalByStage[deal.stage] += deal.amount
            }
          }
        })

        stats.avgDealSize = stats.totalDeals > 0 ? stats.totalValue / stats.totalDeals : 0
        return stats
      } catch (err) {
        console.warn('[CRM] deal-stats fetch error:', err)
        return {
          totalDeals: 0,
          totalValue: 0,
          totalByCurrency: {},
          totalByStage: {},
          avgDealSize: 0,
        }
      }
    },
  })
}
