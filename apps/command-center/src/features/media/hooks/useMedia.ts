import { useState, useEffect, useCallback } from 'react'
import { useApi } from '../../../shared/auth/useApi'
import { MOCK_CAMPAIGNS, MOCK_CHANNELS, MOCK_AUDIENCES } from '../mockData'

export function useCampaigns() {
  const { apiFetch } = useApi()
  const [campaigns, setCampaigns] = useState(MOCK_CAMPAIGNS)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/media/campaigns')
      if (res.ok) {
        const data = await res.json()
        if (data.length > 0) setCampaigns(data)
      }
    } catch {} finally { setLoading(false) }
  }, [apiFetch])

  useEffect(() => { void load() }, [load])
  return { campaigns, loading, reload: load }
}

export function useChannels() {
  const { apiFetch } = useApi()
  const [channels, setChannels] = useState(MOCK_CHANNELS)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/media/channels')
      if (res.ok) {
        const data = await res.json()
        if (data.length > 0) setChannels(data)
      }
    } catch {} finally { setLoading(false) }
  }, [apiFetch])

  useEffect(() => { void load() }, [load])
  return { channels, loading, reload: load }
}

export function useAudiences() {
  const { apiFetch } = useApi()
  const [audiences, setAudiences] = useState(MOCK_AUDIENCES)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/media/audiences')
      if (res.ok) {
        const data = await res.json()
        if (data.length > 0) setAudiences(data)
      }
    } catch {} finally { setLoading(false) }
  }, [apiFetch])

  useEffect(() => { void load() }, [load])
  return { audiences, loading, reload: load }
}
