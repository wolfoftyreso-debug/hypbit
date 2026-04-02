import { useState, useEffect, useCallback } from 'react'
import { useApi } from '../../../shared/auth/useApi'

export interface JournalEntry {
  id: string
  entity_id: string
  verification_number: string
  date: string
  description: string
  reference: string
  locked: boolean
  journal_lines: JournalLine[]
}

export interface JournalLine {
  id: string
  account_number: string
  account_name: string
  debit: number
  credit: number
  description: string
}

export interface Account {
  id: string
  account_number: string
  account_name: string
  account_type: string
  account_class: string
}

export function useAccounting(entityId: string) {
  const { apiFetch } = useApi()
  const [journal, setJournal] = useState<JournalEntry[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [jRes, aRes] = await Promise.allSettled([
        apiFetch(`/api/accounting/${entityId}/journal`),
        apiFetch(`/api/accounting/${entityId}/accounts`),
      ])
      if (jRes.status === 'fulfilled' && jRes.value.ok) setJournal(await jRes.value.json())
      if (aRes.status === 'fulfilled' && aRes.value.ok) setAccounts(await aRes.value.json())
    } catch {} finally { setLoading(false) }
  }, [apiFetch, entityId])

  useEffect(() => { void load() }, [load])

  const seedChartOfAccounts = async () => {
    await apiFetch(`/api/accounting/${entityId}/seed-chart`, { method: 'POST' })
    await load()
  }

  const createEntry = async (entry: Partial<JournalEntry> & { lines: Partial<JournalLine>[] }) => {
    const res = await apiFetch(`/api/accounting/${entityId}/journal`, {
      method: 'POST',
      body: JSON.stringify(entry)
    })
    if (res.ok) await load()
    return res.json()
  }

  return { journal, accounts, loading, reload: load, seedChartOfAccounts, createEntry }
}

export function useBalanceSheet(entityId: string, asOfDate?: string) {
  const { apiFetch } = useApi()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const url = `/api/accounting/${entityId}/balance-sheet${asOfDate ? `?as_of_date=${asOfDate}` : ''}`
    apiFetch(url).then(r => r.json()).then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [apiFetch, entityId, asOfDate])

  return { data, loading }
}

export function useIncomeStatement(entityId: string, fromDate?: string, toDate?: string) {
  const { apiFetch } = useApi()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams()
    if (fromDate) params.set('from_date', fromDate)
    if (toDate) params.set('to_date', toDate)
    const url = `/api/accounting/${entityId}/income-statement?${params}`
    apiFetch(url).then(r => r.json()).then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [apiFetch, entityId, fromDate, toDate])

  return { data, loading }
}
