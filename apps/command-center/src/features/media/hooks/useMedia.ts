import { useState, useEffect, useCallback } from 'react'
import { useApi } from '../../../shared/auth/useApi'
import type { Campaign, MediaChannel, Audience } from '../types'

export function useCampaigns() {
  const { apiFetch } = useApi()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/media/campaigns')
      if (res.ok) {
        const data = await res.json()
        setCampaigns(Array.isArray(data) ? data : [])
      } else {
        setError(`${res.status} ${res.statusText}`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [apiFetch])

  useEffect(() => { void load() }, [load])
  return { campaigns, loading, error, reload: load }
}

export function useChannels() {
  const { apiFetch } = useApi()
  const [channels, setChannels] = useState<MediaChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/media/channels')
      if (res.ok) {
        const data = await res.json()
        setChannels(Array.isArray(data) ? data : [])
      } else {
        setError(`${res.status} ${res.statusText}`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [apiFetch])

  useEffect(() => { void load() }, [load])
  return { channels, loading, error, reload: load }
}

export function useAudiences() {
  const { apiFetch } = useApi()
  const [audiences, setAudiences] = useState<Audience[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/media/audiences')
      if (res.ok) {
        const data = await res.json()
        setAudiences(Array.isArray(data) ? data : [])
      } else {
        setError(`${res.status} ${res.statusText}`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [apiFetch])

  useEffect(() => { void load() }, [load])
  return { audiences, loading, error, reload: load }
}
