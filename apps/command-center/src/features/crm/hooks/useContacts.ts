import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../shared/auth/AuthContext'
import type { Contact } from '../../../lib/supabase'

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

type ContactFilters = {
  companyId?: string
  type?: string
  status?: string
  search?: string
}

export function useContacts(filters?: ContactFilters) {
  const { getToken } = useAuth()
  return useQuery({
    queryKey: ['contacts', filters],
    queryFn: async () => {
      try {
        const token = await getToken()
        const params = new URLSearchParams()
        if (filters?.companyId) params.set('company_id', filters.companyId)
        if (filters?.type)      params.set('type', filters.type)
        if (filters?.status)    params.set('status', filters.status)
        if (filters?.search)    params.set('search', filters.search)
        const qs = params.toString()
        const data = await apiFetch<Contact[]>(`/api/contacts${qs ? `?${qs}` : ''}`, token)
        return data ?? []
      } catch (err) {
        console.warn('[CRM] contacts fetch error:', err)
        return [] as Contact[]
      }
    },
  })
}

export function useContact(id: string) {
  const { getToken } = useAuth()
  return useQuery({
    queryKey: ['contacts', id],
    queryFn: async () => {
      const token = await getToken()
      return apiFetch<Contact>(`/api/contacts/${id}`, token)
    },
    enabled: !!id,
  })
}

export function useCreateContact() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) => {
      const token = await getToken()
      return apiFetch<Contact>('/api/contacts', token, {
        method: 'POST',
        body: JSON.stringify(contact),
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts'] }),
  })
}

export function useUpdateContact() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Contact> & { id: string }) => {
      const token = await getToken()
      return apiFetch<Contact>(`/api/contacts/${id}`, token, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['contacts', data.id] })
    },
  })
}

export function useDeleteContact() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken()
      const res = await fetch(`${API}/api/contacts/${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts'] }),
  })
}
