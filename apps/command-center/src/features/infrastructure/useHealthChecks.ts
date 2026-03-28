// ─── Wavult OS — Live Health Check Hook ──────────────────────────────────────
// Kör health checks mot service endpoints med timeout
// Automatisk polling var 60s för kritiska tjänster (criticalityLevel: 1)

import { useState, useEffect, useCallback, useRef } from 'react'
import type { ServiceStatus, HealthCheckResult } from './infraTypes'
import { HEALTH_CHECKS, SERVICE_REGISTRY } from './serviceRegistry'

const POLL_INTERVAL_MS = 60_000    // 60s för kritiska tjänster

// ─── Fetch med timeout ────────────────────────────────────────────────────────

async function fetchWithTimeout(
  url: string,
  method: 'GET' | 'HEAD',
  timeoutMs: number
): Promise<{ status: number; latency: number }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const t0 = performance.now()

  try {
    const res = await fetch(url, {
      method,
      signal: controller.signal,
      mode: 'no-cors',     // undviker CORS-fel för externa endpoints
      cache: 'no-store',
    })
    const latency = Math.round(performance.now() - t0)
    clearTimeout(timer)
    // no-cors returnerar status 0 — tolka som reachable
    return { status: res.status === 0 ? 200 : res.status, latency }
  } catch {
    clearTimeout(timer)
    const latency = Math.round(performance.now() - t0)
    throw Object.assign(new Error('Timeout eller nätverksfel'), { latency })
  }
}

// ─── Kör ett enskilt health check ────────────────────────────────────────────

async function runCheck(
  serviceId: string,
  url: string,
  method: 'GET' | 'HEAD',
  expectedStatus: number,
  timeout: number
): Promise<HealthCheckResult> {
  const now = new Date().toISOString()
  try {
    const { status, latency } = await fetchWithTimeout(url, method, timeout)
    const ok = status === 0 || status === expectedStatus || (status >= 200 && status < 300)
    return {
      serviceId,
      status: ok ? 'operational' : 'degraded',
      latency,
      lastChecked: now,
      httpStatus: status,
    }
  } catch (err: unknown) {
    const latency = (err as { latency?: number }).latency ?? null
    return {
      serviceId,
      status: 'down',
      latency,
      lastChecked: now,
      error: 'Unreachable',
    }
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface HealthCheckState {
  results: Record<string, HealthCheckResult>
  loading: boolean
  lastRun: string | null
  refresh: () => void
}

export function useHealthChecks(): HealthCheckState {
  const [results, setResults] = useState<Record<string, HealthCheckResult>>({})
  const [loading, setLoading] = useState(false)
  const [lastRun, setLastRun] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const runAllChecks = useCallback(async () => {
    setLoading(true)
    const checks = HEALTH_CHECKS

    const checkResults = await Promise.allSettled(
      checks.map(hc =>
        runCheck(hc.serviceId, hc.url, hc.method, hc.expectedStatus, hc.timeout)
      )
    )

    const newResults: Record<string, HealthCheckResult> = { ...results }
    checkResults.forEach((res, i) => {
      const hc = checks[i]
      if (res.status === 'fulfilled') {
        newResults[hc.serviceId] = res.value
      } else {
        newResults[hc.serviceId] = {
          serviceId: hc.serviceId,
          status: 'down' as ServiceStatus,
          latency: null,
          lastChecked: new Date().toISOString(),
          error: 'Check failed',
        }
      }
    })

    setResults(newResults)
    setLastRun(new Date().toISOString())
    setLoading(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Initiell körning + auto-poll
  useEffect(() => {
    runAllChecks()

    // Kör var 60s — kritiska tjänster (criticalityLevel: 1) har kortare interval
    timerRef.current = setInterval(() => {
      runAllChecks()
    }, POLL_INTERVAL_MS)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [runAllChecks])

  return { results, loading, lastRun, refresh: runAllChecks }
}

// ─── Kombinera health check-resultat med registry-status ────────────────────

export function mergeStatus(
  registryStatus: ServiceStatus,
  checkResult?: HealthCheckResult
): ServiceStatus {
  if (!checkResult) return registryStatus
  return checkResult.status
}

// ─── Status-etikett ───────────────────────────────────────────────────────────

export function statusLabel(status: ServiceStatus): string {
  const labels: Record<ServiceStatus, string> = {
    operational: 'Operational',
    degraded: 'Degraded',
    down: 'Down',
    unknown: 'Unknown',
    maintenance: 'Maintenance',
  }
  return labels[status]
}

// ─── Kritiska tjänster (criticalityLevel: 1) ──────────────────────────────────

export const CRITICAL_SERVICE_IDS = new Set(
  SERVICE_REGISTRY
    .filter(s => s.criticalityLevel === 1)
    .map(s => s.id)
)
