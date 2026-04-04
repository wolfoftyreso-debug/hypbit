import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../shared/auth/AuthContext'
import type {
  FinanceEntity,
  FinanceAccount,
  FinanceLedgerEntry,
  FinanceInvoice,
  FinanceCashFlow,
  FinanceKpi,
  FinanceIntercompany,
  FinanceTaxPeriod,
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

// ─── Finance Entities ─────────────────────────────────────────────────────────

export function useFinanceEntities() {
  const { getToken } = useAuth()
  return useQuery({
    queryKey: ['finance-entities'],
    queryFn: async () => {
      try {
        const token = await getToken()
        const data = await apiFetch<FinanceEntity[]>('/api/finance/entities', token)
        return data ?? []
      } catch (err) {
        console.warn('[Finance] finance_entities fetch error:', err)
        return [] as FinanceEntity[]
      }
    },
    staleTime: 1000 * 60 * 5,
  })
}

// ─── Finance KPIs ─────────────────────────────────────────────────────────────

export function useFinanceKpis(period?: string) {
  const { getToken } = useAuth()
  return useQuery({
    queryKey: ['finance-kpis', period],
    queryFn: async () => {
      try {
        const token = await getToken()
        const path = period ? `/api/finance/kpis?period=${encodeURIComponent(period)}` : '/api/finance/kpis'
        const data = await apiFetch<FinanceKpi[]>(path, token)
        return data ?? []
      } catch (err) {
        console.warn('[Finance] finance_kpis fetch error:', err)
        return [] as FinanceKpi[]
      }
    },
  })
}

export function useUpsertFinanceKpi() {
  const { getToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (kpi: Omit<FinanceKpi, 'id' | 'result' | 'created_at' | 'updated_at'>) => {
      const token = await getToken()
      const data = await apiFetch<FinanceKpi>('/api/finance/kpis', token, {
        method: 'POST',
        body: JSON.stringify(kpi),
      })
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance-kpis'] }),
  })
}

// ─── Finance Ledger ───────────────────────────────────────────────────────────

type LedgerFilters = {
  entityId?: string
  dateFrom?: string
  dateTo?: string
  currency?: string
  accountNr?: string
  refNr?: string
}

export function useFinanceLedger(filters?: LedgerFilters) {
  const { getToken } = useAuth()
  return useQuery({
    queryKey: ['finance-ledger', filters],
    queryFn: async () => {
      try {
        const token = await getToken()
        const params = new URLSearchParams()
        if (filters?.entityId)  params.set('entity_id', filters.entityId)
        if (filters?.dateFrom)  params.set('date_from', filters.dateFrom)
        if (filters?.dateTo)    params.set('date_to', filters.dateTo)
        if (filters?.currency)  params.set('currency', filters.currency)
        if (filters?.accountNr) params.set('account_nr', filters.accountNr)
        if (filters?.refNr)     params.set('ref_nr', filters.refNr)
        const qs = params.toString()
        const data = await apiFetch<FinanceLedgerEntry[]>(`/api/finance/ledger${qs ? `?${qs}` : ''}`, token)
        return data ?? []
      } catch (err) {
        console.warn('[Finance] finance_ledger fetch error:', err)
        return [] as FinanceLedgerEntry[]
      }
    },
  })
}

export function useCreateLedgerEntry() {
  const { getToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (entry: Omit<FinanceLedgerEntry, 'id' | 'created_at' | 'updated_at'>) => {
      const token = await getToken()
      return apiFetch<FinanceLedgerEntry>('/api/finance/ledger', token, {
        method: 'POST',
        body: JSON.stringify(entry),
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance-ledger'] }),
  })
}

// ─── Finance Accounts ─────────────────────────────────────────────────────────

export function useFinanceAccounts(entityId?: string) {
  const { getToken } = useAuth()
  return useQuery({
    queryKey: ['finance-accounts', entityId],
    queryFn: async () => {
      try {
        const token = await getToken()
        const path = entityId ? `/api/finance/accounts?entity_id=${encodeURIComponent(entityId)}` : '/api/finance/accounts'
        const data = await apiFetch<FinanceAccount[]>(path, token)
        return data ?? []
      } catch (err) {
        console.warn('[Finance] finance_accounts fetch error:', err)
        return [] as FinanceAccount[]
      }
    },
    staleTime: 1000 * 60 * 2,
  })
}

// ─── Finance Invoices ─────────────────────────────────────────────────────────

type InvoiceFilters = {
  entityId?: string
  status?: FinanceInvoice['status']
}

export function useFinanceInvoices(filters?: InvoiceFilters) {
  const { getToken } = useAuth()
  return useQuery({
    queryKey: ['finance-invoices', filters],
    queryFn: async () => {
      try {
        const token = await getToken()
        const params = new URLSearchParams()
        if (filters?.entityId) params.set('entity_id', filters.entityId)
        if (filters?.status)   params.set('status', filters.status)
        const qs = params.toString()
        const data = await apiFetch<FinanceInvoice[]>(`/api/invoices${qs ? `?${qs}` : ''}`, token)
        return data ?? []
      } catch (err) {
        console.warn('[Finance] finance_invoices fetch error:', err)
        return [] as FinanceInvoice[]
      }
    },
  })
}

export function useCreateInvoice() {
  const { getToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (invoice: Omit<FinanceInvoice, 'id' | 'created_at' | 'updated_at'>) => {
      const token = await getToken()
      return apiFetch<FinanceInvoice>('/api/invoices', token, {
        method: 'POST',
        body: JSON.stringify(invoice),
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance-invoices'] }),
  })
}

export function useUpdateInvoiceStatus() {
  const { getToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: FinanceInvoice['status'] }) => {
      const token = await getToken()
      return apiFetch<FinanceInvoice>(`/api/invoices/${id}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance-invoices'] }),
  })
}

// ─── Finance Cash Flow ────────────────────────────────────────────────────────

export function useFinanceCashFlow(entityId?: string, year?: number) {
  const { getToken } = useAuth()
  return useQuery({
    queryKey: ['finance-cashflow', entityId, year],
    queryFn: async () => {
      try {
        const token = await getToken()
        const params = new URLSearchParams()
        if (entityId) params.set('entity_id', entityId)
        if (year)     params.set('year', String(year))
        const qs = params.toString()
        const data = await apiFetch<FinanceCashFlow[]>(`/api/finance/cashflow${qs ? `?${qs}` : ''}`, token)
        return data ?? []
      } catch (err) {
        console.warn('[Finance] finance_cashflow fetch error:', err)
        return [] as FinanceCashFlow[]
      }
    },
  })
}

// ─── Finance Intercompany ─────────────────────────────────────────────────────

export function useFinanceIntercompany() {
  const { getToken } = useAuth()
  return useQuery({
    queryKey: ['finance-intercompany'],
    queryFn: async () => {
      try {
        const token = await getToken()
        const data = await apiFetch<FinanceIntercompany[]>('/api/finance/intercompany', token)
        return data ?? []
      } catch (err) {
        console.warn('[Finance] finance_intercompany fetch error:', err)
        return [] as FinanceIntercompany[]
      }
    },
  })
}

export function useUpdateIntercompanyStatus() {
  const { getToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: FinanceIntercompany['status'] }) => {
      const token = await getToken()
      return apiFetch<FinanceIntercompany>(`/api/finance/intercompany/${id}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance-intercompany'] }),
  })
}

// ─── Finance Tax Periods ──────────────────────────────────────────────────────

export function useFinanceTaxPeriods(entityId?: string) {
  const { getToken } = useAuth()
  return useQuery({
    queryKey: ['finance-tax-periods', entityId],
    queryFn: async () => {
      try {
        const token = await getToken()
        const path = entityId ? `/api/finance/tax-periods?entity_id=${encodeURIComponent(entityId)}` : '/api/finance/tax-periods'
        const data = await apiFetch<FinanceTaxPeriod[]>(path, token)
        return data ?? []
      } catch (err) {
        console.warn('[Finance] finance_tax_periods fetch error:', err)
        return [] as FinanceTaxPeriod[]
      }
    },
  })
}

export function useUpdateTaxPeriodStatus() {
  const { getToken } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: FinanceTaxPeriod['status'] }) => {
      const token = await getToken()
      return apiFetch<FinanceTaxPeriod>(`/api/finance/tax-periods/${id}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance-tax-periods'] }),
  })
}

// ─── Legacy hook (kept for backward compat) ───────────────────────────────────

export { useFinanceLedger as useLedgerEntries }
