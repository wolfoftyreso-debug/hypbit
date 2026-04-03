// ─── System Audit Dashboard ──────────────────────────────────────────────────
// Live health-check visualisering — /v1/system/audit
// Design: #F5F0E8 bakgrund · navy #0A3D62 · gold #E8B84B

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useApi } from '../../shared/auth/useApi'

// ─── Types ────────────────────────────────────────────────────────────────────

type CheckStatus = 'ok' | 'warn' | 'error'
type Overall = 'operational' | 'degraded' | 'down'

interface CheckResult {
  id: string
  name: string
  status: CheckStatus
  latencyMs: number
  detail: string
  lastOk: string | null
}

interface AuditResponse {
  timestamp: string
  overall: Overall
  healthScore: number
  checks: CheckResult[]
  alerts: string[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REFRESH_INTERVAL = 30

const STATUS_COLOR: Record<CheckStatus, string> = {
  ok:    '#2E7D32',
  warn:  '#E65100',
  error: '#C62828',
}

const STATUS_BG: Record<CheckStatus, string> = {
  ok:    '#E8F5E9',
  warn:  '#FFF3E0',
  error: '#FFEBEE',
}

const OVERALL_COLOR: Record<Overall, string> = {
  operational: '#2E7D32',
  degraded:    '#E65100',
  down:        '#C62828',
}

const OVERALL_BG: Record<Overall, string> = {
  operational: '#E8F5E9',
  degraded:    '#FFF3E0',
  down:        '#FFEBEE',
}

const OVERALL_LABEL: Record<Overall, string> = {
  operational: 'OPERATIONAL',
  degraded:    'DEGRADED',
  down:        'DOWN',
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, overall }: { score: number; overall: Overall }) {
  const r = 52
  const circumference = 2 * Math.PI * r
  const filled = (score / 100) * circumference
  const ringColor = score >= 80 ? '#0A3D62' : score >= 50 ? '#E8B84B' : '#C62828'

  return (
    <svg width="128" height="128" viewBox="0 0 128 128" aria-label={`Health score ${score}`}>
      <circle cx="64" cy="64" r={r} fill="none" stroke="#E0D8CE" strokeWidth="10" />
      <circle
        cx="64" cy="64" r={r}
        fill="none"
        stroke={ringColor}
        strokeWidth="10"
        strokeDasharray={`${filled} ${circumference}`}
        strokeLinecap="round"
        transform="rotate(-90 64 64)"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text
        x="64" y="58"
        textAnchor="middle"
        fontSize="26"
        fontWeight="700"
        fill="#0A3D62"
        fontFamily="var(--font-mono, monospace)"
      >
        {score}
      </text>
      <text
        x="64" y="75"
        textAnchor="middle"
        fontSize="9"
        fontWeight="700"
        fill={OVERALL_COLOR[overall]}
        letterSpacing="0.05em"
      >
        {OVERALL_LABEL[overall]}
      </text>
    </svg>
  )
}

// ─── Check Card ───────────────────────────────────────────────────────────────

function CheckCard({ check }: { check: CheckResult }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: `1px solid ${STATUS_COLOR[check.status]}30`,
        borderLeft: `4px solid ${STATUS_COLOR[check.status]}`,
        borderRadius: '0 10px 10px 0',
        padding: '14px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 7,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#0A3D62' }}>{check.name}</span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 9px',
            borderRadius: 20,
            background: STATUS_BG[check.status],
            color: STATUS_COLOR[check.status],
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            flexShrink: 0,
          }}
        >
          {check.status}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
        <span style={{ fontSize: 12, color: '#888', fontFamily: 'var(--font-mono, monospace)' }}>
          {check.latencyMs}ms
        </span>
        {check.lastOk && (
          <span style={{ fontSize: 12, color: '#aaa' }}>
            ok {new Date(check.lastOk).toLocaleTimeString('sv-SE')}
          </span>
        )}
      </div>

      {check.detail && (
        <p style={{ fontSize: 12, color: '#666', margin: 0, wordBreak: 'break-word', lineHeight: 1.4 }}>
          {check.detail}
        </p>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SystemAuditDashboard() {
  const { apiFetch } = useApi()
  const [data, setData] = useState<AuditResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/v1/system/audit')
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      const json = await res.json() as AuditResponse
      setData(json)
      setLastFetched(new Date())
      setCountdown(REFRESH_INTERVAL)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }, [apiFetch])

  useEffect(() => { fetchData() }, [fetchData])

  // Countdown + auto-refresh
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { fetchData(); return REFRESH_INTERVAL }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [fetchData])

  return (
    <div style={{ background: '#F5F0E8', minHeight: '100%' }}>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0A3D62', margin: 0 }}>System Audit</h1>
          <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0', fontFamily: 'var(--font-mono, monospace)' }}>
            {lastFetched
              ? `Senast hämtad ${lastFetched.toLocaleTimeString('sv-SE')}`
              : 'Hämtar…'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: '#999', fontFamily: 'var(--font-mono, monospace)' }}>
            Uppdaterar om {countdown}s
          </span>
          <button
            onClick={fetchData}
            disabled={loading}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              background: '#0A3D62',
              color: '#F5F0E8',
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.65 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {loading ? 'Hämtar…' : 'Uppdatera'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            background: '#FFEBEE',
            border: '1px solid #C62828',
            color: '#C62828',
            fontSize: 14,
            marginBottom: 24,
          }}
        >
          {error}
        </div>
      )}

      {/* Initial loading */}
      {loading && !data && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60, gap: 14 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '4px solid #E8B84B',
              borderTopColor: 'transparent',
              animation: 'audit-spin 0.8s linear infinite',
            }}
          />
          <style>{`@keyframes audit-spin { to { transform: rotate(360deg) } }`}</style>
          <span style={{ fontSize: 14, color: '#888' }}>Kör hälsokontroller…</span>
        </div>
      )}

      {data && (
        <>
          {/* Overview card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 28,
              background: '#FFFFFF',
              borderRadius: 16,
              padding: '22px 28px',
              marginBottom: 24,
              border: '1px solid rgba(10,61,98,0.08)',
              boxShadow: '0 1px 4px rgba(10,61,98,0.06)',
              flexWrap: 'wrap',
            }}
          >
            <ScoreRing score={data.healthScore} overall={data.overall} />

            <div style={{ flex: 1, minWidth: 160 }}>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '4px 14px',
                  borderRadius: 20,
                  background: OVERALL_BG[data.overall],
                  color: OVERALL_COLOR[data.overall],
                  letterSpacing: '0.08em',
                  marginBottom: 10,
                }}
              >
                {OVERALL_LABEL[data.overall]}
              </span>

              <p style={{ fontSize: 13, color: '#555', margin: '0 0 6px' }}>
                Score{' '}
                <strong style={{ color: '#0A3D62' }}>{data.healthScore}/100</strong>
                {' '}— {data.checks.filter(c => c.status === 'ok').length}/{data.checks.length} checks passing
              </p>

              <p style={{ fontSize: 11, color: '#aaa', margin: 0, fontFamily: 'var(--font-mono, monospace)' }}>
                {new Date(data.timestamp).toLocaleString('sv-SE')}
              </p>
            </div>
          </div>

          {/* Alerts */}
          {data.alerts.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 13, fontWeight: 600, color: '#C62828', margin: '0 0 8px' }}>
                Alerts ({data.alerts.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.alerts.map((alert, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '9px 14px',
                      borderRadius: 8,
                      background: '#FFEBEE',
                      border: '1px solid #C6282830',
                      fontSize: 13,
                      color: '#C62828',
                    }}
                  >
                    ⚠ {alert}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Service checks grid */}
          <h2 style={{ fontSize: 13, fontWeight: 600, color: '#0A3D62', margin: '0 0 10px' }}>
            Service Checks
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
              gap: 12,
            }}
          >
            {data.checks.map(check => (
              <CheckCard key={check.id} check={check} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
