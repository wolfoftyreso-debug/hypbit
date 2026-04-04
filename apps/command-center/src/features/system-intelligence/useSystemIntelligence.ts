/**
 * useSystemIntelligence — hämtar all data för SystemIntelligenceHub från backend
 *
 * Källor:
 *  - /v1/qms/entities          → koncernenheter
 *  - /v1/qms/wavult-os/controls → QMS-kontroller (→ risksammanfattning + lambda)
 *  - /api/intelligence/signals  → marknadssignaler (customer signals, kan vara tomt)
 *  - /api/decisions/meetings    → beslutslogg
 */
import { useState, useEffect, useCallback } from 'react'
import { useApi } from '../../shared/auth/useApi'

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface QmsEntity {
  id: string
  slug: string
  name: string
  description?: string
  status?: string
  standard_versions?: string[]
  jurisdiction?: string
  stats?: {
    not_started: number
    in_progress: number
    implemented: number
    verified: number
    not_applicable: number
  }
}

export interface QmsControl {
  id: string
  clause: string
  title: string
  category?: string
  implementation: {
    status: 'not_started' | 'in_progress' | 'implemented' | 'verified' | 'not_applicable'
    responsible_person?: string
    target_date?: string
    gap_analysis?: string
  }
}

export interface RiskSummary {
  critical: number   // not_started-kontroller (aldrig påbörjade)
  high: number       // in_progress men sent (förfallna target_date)
  medium: number     // in_progress, ej förfallna
  low: number        // implemented + verified
  group_lambda: number  // andel implemented/verified (0–1)
  total_controls: number
}

export interface MarketSignal {
  id: string
  customer_id?: string
  source: string
  value?: number
  metadata?: Record<string, unknown>
  product_hint?: string
  timestamp?: string
}

export interface DecisionMeeting {
  id: string
  title: string
  date?: string
  attendees?: string[]
  status?: string
  summary?: string
  decisions?: Array<{
    text?: string
    owner?: string
    deadline?: string
    status?: string
  }>
  action_items?: Array<{
    text?: string
    owner?: string
    deadline?: string
    done?: boolean
  }>
}

export interface SystemIntelligenceData {
  entities: QmsEntity[]
  controls: QmsControl[]
  risk_summary: RiskSummary
  market_signals: MarketSignal[]
  meetings: DecisionMeeting[]
  loading: boolean
  error: string | null
  refetch: () => void
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSystemIntelligence(): SystemIntelligenceData {
  const { apiFetch } = useApi()
  const [data, setData] = useState<Omit<SystemIntelligenceData, 'refetch'>>({
    entities: [],
    controls: [],
    risk_summary: { critical: 0, high: 0, medium: 0, low: 0, group_lambda: 0, total_controls: 0 },
    market_signals: [],
    meetings: [],
    loading: true,
    error: null,
  })
  const [tick, setTick] = useState(0)
  const refetch = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => {
    let cancelled = false

    async function fetchAll() {
      setData(d => ({ ...d, loading: true, error: null }))

      try {
        const now = new Date()

        const [entitiesRes, controlsRes, signalsRes, meetingsRes] = await Promise.allSettled([
          apiFetch('/v1/qms/entities'),
          apiFetch('/v1/qms/wavult-os/controls'),
          apiFetch('/api/intelligence/signals'),
          apiFetch('/api/decisions/meetings'),
        ])

        if (cancelled) return

        // ── Entities ──────────────────────────────────────────────────────────
        let entities: QmsEntity[] = []
        if (entitiesRes.status === 'fulfilled' && entitiesRes.value.ok) {
          const raw = await entitiesRes.value.json()
          entities = Array.isArray(raw) ? raw : raw.data ?? []
        }

        // ── Controls → Risk summary + Lambda ─────────────────────────────────
        let controls: QmsControl[] = []
        let risk_summary: RiskSummary = {
          critical: 0, high: 0, medium: 0, low: 0,
          group_lambda: 0, total_controls: 0
        }
        if (controlsRes.status === 'fulfilled' && controlsRes.value.ok) {
          const raw = await controlsRes.value.json()
          controls = Array.isArray(raw) ? raw : raw.data ?? []

          for (const ctrl of controls) {
            const status = ctrl.implementation?.status ?? 'not_started'
            if (status === 'not_started') {
              risk_summary.critical++
            } else if (status === 'in_progress') {
              // Om target_date är passerat → high, annars medium
              const targetDate = ctrl.implementation?.target_date
              if (targetDate && new Date(targetDate) < now) {
                risk_summary.high++
              } else {
                risk_summary.medium++
              }
            } else if (status === 'implemented' || status === 'verified') {
              risk_summary.low++
            }
            // not_applicable räknas inte
          }

          const actionableControls = controls.filter(
            c => c.implementation?.status !== 'not_applicable'
          ).length
          const doneControls = risk_summary.low
          risk_summary.group_lambda = actionableControls > 0
            ? parseFloat((doneControls / actionableControls).toFixed(2))
            : 0
          risk_summary.total_controls = controls.length
        }

        // ── Market signals ────────────────────────────────────────────────────
        let market_signals: MarketSignal[] = []
        if (signalsRes.status === 'fulfilled' && signalsRes.value.ok) {
          const raw = await signalsRes.value.json()
          market_signals = Array.isArray(raw)
            ? raw
            : raw.signals ?? raw.data ?? []
        }

        // ── Meetings / Decision log ───────────────────────────────────────────
        let meetings: DecisionMeeting[] = []
        if (meetingsRes.status === 'fulfilled' && meetingsRes.value.ok) {
          const raw = await meetingsRes.value.json()
          meetings = Array.isArray(raw) ? raw : raw.data ?? []
        }

        if (!cancelled) {
          setData({ entities, controls, risk_summary, market_signals, meetings, loading: false, error: null })
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Okänt fel'
        if (!cancelled) setData(d => ({ ...d, loading: false, error: msg }))
      }
    }

    fetchAll()
    return () => { cancelled = true }
  }, [tick])  // eslint-disable-line react-hooks/exhaustive-deps

  return { ...data, refetch }
}
