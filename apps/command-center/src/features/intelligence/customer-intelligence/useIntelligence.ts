import { useState, useEffect, useCallback } from 'react'
import { useApi } from '../../../shared/auth/useApi'
import type { CustomerIntelligenceProfile, CustomerSignal } from './types'

export function useCustomerIntelligence(customerId?: string) {
  const { apiFetch } = useApi()
  const [profile, setProfile] = useState<CustomerIntelligenceProfile | null>(null)
  const [signals, setSignals] = useState<CustomerSignal[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!customerId) return
    setLoading(true)
    try {
      const [profileRes, signalsRes] = await Promise.allSettled([
        apiFetch(`/api/intelligence/profile/${customerId}`),
        apiFetch(`/api/intelligence/signals?customer_id=${customerId}&days=30`)])
      if (profileRes.status === 'fulfilled' && profileRes.value.ok)
        setProfile(await profileRes.value.json())
      if (signalsRes.status === 'fulfilled' && signalsRes.value.ok)
        setSignals(await signalsRes.value.json())
    } catch {} finally { setLoading(false) }
  }, [apiFetch, customerId])

  useEffect(() => { void load() }, [load])

  const captureSignal = async (signal: { source: string; value: number; metadata?: Record<string, unknown> }) => {
    if (!customerId) return
    await apiFetch('/api/intelligence/signal', {
      method: 'POST',
      body: JSON.stringify({ customer_id: customerId, ...signal })
    }).catch(() => {})
  }

  return { profile, signals, loading, reload: load, captureSignal }
}

export function useIntelligenceDashboard() {
  const { apiFetch } = useApi()
  const [data, setData] = useState<{ signals_30d: number; high_churn_risk: any[]; top_engaged: any[] } | null>(null)

  useEffect(() => {
    apiFetch('/api/intelligence/dashboard')
      .then(r => r.json()).then(setData).catch(() => {})
  }, [apiFetch])

  return { data }
}
