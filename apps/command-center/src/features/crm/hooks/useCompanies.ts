import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../shared/auth/AuthContext'
import type { Company } from '../../../lib/supabase'

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

type CompanyFilters = {
  industry?: string
  size?: string
  status?: string
  search?: string
}

export function useCompanies(filters?: CompanyFilters) {
  const { getToken } = useAuth()
  return useQuery({
    queryKey: ['companies', filters],
    queryFn: async () => {
      try {
        const token = await getToken()
        const params = new URLSearchParams()
        if (filters?.industry) params.set('industry', filters.industry)
        if (filters?.size)     params.set('size', filters.size)
        if (filters?.status)   params.set('status', filters.status)
        if (filters?.search)   params.set('search', filters.search)
        const qs = params.toString()
        const data = await apiFetch<Company[]>(`/api/companies${qs ? `?${qs}` : ''}`, token)
        return data ?? []
      } catch (err) {
        console.warn('[CRM] companies fetch error:', err)
        return [] as Company[]
      }
    },
  })
}

export function useCompany(id: string) {
  const { getToken } = useAuth()
  return useQuery({
    queryKey: ['companies', id],
    queryFn: async () => {
      const token = await getToken()
      return apiFetch<Company>(`/api/companies/${id}`, token)
    },
    enabled: !!id,
  })
}

export function useCreateCompany() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (company: Omit<Company, 'id' | 'created_at' | 'updated_at'>) => {
      const token = await getToken()
      return apiFetch<Company>('/api/companies', token, {
        method: 'POST',
        body: JSON.stringify(company),
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companies'] }),
  })
}

export function useUpdateCompany() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Company> & { id: string }) => {
      const token = await getToken()
      return apiFetch<Company>(`/api/companies/${id}`, token, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      queryClient.invalidateQueries({ queryKey: ['companies', data.id] })
    },
  })
}

export function useDeleteCompany() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken()
      const res = await fetch(`${API}/api/companies/${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companies'] }),
  })
}
