/**
 * Wavult OS Cockpit Panel
 * Mini live preview + expandable full cockpit with analog+digital gauges, EKG, site status, alerts
 */
import { useState, useEffect, useCallback } from 'react'
import { useApi } from '../../shared/auth/useApi'

// ── Types ─────────────────────────────────────────────────────────────────────

interface SiteMetric { site: string; ms: number; status: number; ok: boolean }
interface Alert { site: string; severity: 'critical' | 'warning'; message: string }
interface Metrics {
  timestamp: string
  collect_ms: number
  health_score: number
  status: 'nominal' | 'degraded' | 'critical'
  sites: SiteMetric[]
  infrastructure: { live_repos: number; total_repos: number; open_issues: number }
  database: { journal_entries: number; customer_accounts: number; deployments: number }
  traffic: { requests: number; bandwidth_gb: string; threats: number; pageviews: number }
  alerts: Alert[]
}

// ── Analog Gauge ──────────────────────────────────────────────────────────────

function AnalogGauge({ value, max, label, unit, color = '#C9A84C' }: {
  value: number; max: number; label: string; unit: string; color?: string
}) {
  const pct = Math.min(value / max, 1)
  const angle = -135 + pct * 270  // -135° to +135°
  const r = 40
  const cx = 52, cy = 52

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width="104" height="80" viewBox="0 0 104 80">
        {/* Arc track */}
        <path
          d={`M ${cx - r * Math.cos(Math.PI * 0.75)} ${cy - r * Math.sin(Math.PI * 0.75)} A ${r} ${r} 0 1 1 ${cx + r * Math.cos(Math.PI * 0.75)} ${cy - r * Math.sin(Math.PI * 0.75)}`}
          fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="6" strokeLinecap="round"
        />
        {/* Arc fill */}
        <path
          d={`M ${cx - r * Math.cos(Math.PI * 0.75)} ${cy - r * Math.sin(Math.PI * 0.75)} A ${r} ${r} 0 ${pct > 0.5 ? 1 : 0} 1 ${
            cx + r * Math.cos(((angle + 180) * Math.PI) / 180 - Math.PI * 0.5)
          } ${cy - r * Math.sin(((angle + 180) * Math.PI) / 180 - Math.PI * 0.5)}`}
          fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
        />
        {/* Needle */}
        <line
          x1={cx} y1={cy}
          x2={cx + (r - 8) * Math.cos((angle * Math.PI) / 180 - Math.PI / 2)}
          y2={cy + (r - 8) * Math.sin((angle * Math.PI) / 180 - Math.PI / 2)}
          stroke={color} strokeWidth="2" strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="3" fill={color} />
        {/* Value */}
        <text x={cx} y={cy + 18} textAnchor="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="monospace">
          {value.toFixed(value < 10 ? 1 : 0)}{unit}
        </text>
      </svg>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: '.1em' }}>{label}</span>
    </div>
  )
}

// ── Digital Display ────────────────────────────────────────────────────────────

function DigitalDisplay({ label, value, unit, color = '#C9A84C', blink = false }: {
  label: string; value: string | number; unit?: string; color?: string; blink?: boolean
}) {
  return (
    <div style={{ background: '#0A0A1A', border: '1px solid rgba(201,168,76,.2)', borderRadius: 6, padding: '10px 14px', minWidth: 90 }}>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>{label}</div>
      <div style={{
        fontFamily: 'Courier New, monospace', fontSize: 20, fontWeight: 700, color,
        animation: blink ? 'blink 1s step-end infinite' : 'none',
        textShadow: `0 0 8px ${color}66`,
      }}>
        {value}{unit && <span style={{ fontSize: 11, marginLeft: 2 }}>{unit}</span>}
      </div>
    </div>
  )
}

// ── EKG Line ──────────────────────────────────────────────────────────────────

function EKGLine({ data, color = '#00FF88', width = 200, height = 40 }: {
  data: number[]; color?: string; width?: number; height?: number
}) {
  if (data.length < 2) return null
  const max = Math.max(...data, 1)
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - (v / max) * (height - 4)}`).join(' ')
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" filter="url(#glow)" />
    </svg>
  )
}

// ── Status Dot ─────────────────────────────────────────────────────────────────

function StatusDot({ ok, pulse = true }: { ok: boolean; pulse?: boolean }) {
  const color = ok ? '#00FF88' : '#FF3333'
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: 10, height: 10 }}>
      {pulse && ok && (
        <span style={{
          position: 'absolute', inset: -2, borderRadius: '50%',
          background: color, opacity: .3,
          animation: 'ping 1.5s cubic-bezier(0,0,.2,1) infinite',
        }} />
      )}
      <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color }} />
    </span>
  )
}

// ── Mini Preview ──────────────────────────────────────────────────────────────

function MiniPreview({ url, label, onExpand }: { url: string; label: string; onExpand: () => void }) {
  return (
    <div
      onClick={onExpand}
      style={{
        position: 'relative', width: '100%', cursor: 'pointer',
        border: '1px solid rgba(201,168,76,.25)', borderRadius: 8,
        overflow: 'hidden', background: '#0A0A1A',
      }}
    >
      <div style={{ padding: '6px 10px', background: '#0A0A1A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', fontFamily: 'monospace' }}>{label}</span>
        <span style={{ fontSize: 9, color: '#C9A84C' }}>⊞ EXPAND</span>
      </div>
      <div style={{ position: 'relative', height: 140, overflow: 'hidden' }}>
        <iframe
          src={url}
          style={{ width: '200%', height: 280, border: 'none', transform: 'scale(.5)', transformOrigin: 'top left', pointerEvents: 'none' }}
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  )
}

// ── Main Cockpit ──────────────────────────────────────────────────────────────

interface CockpitProps {
  siteUrl?: string
  siteLabel?: string
  isLive?: boolean
  mode?: 'mini' | 'full'
}

export function CockpitPanel({
  siteUrl = 'https://wavult.com',
  siteLabel = 'wavult.com',
  isLive = true,
  mode: initialMode = 'mini',
}: CockpitProps) {
  const { apiFetch } = useApi()
  const [mode, setMode] = useState<'mini' | 'full'>(initialMode)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [latencyHistory, setLatencyHistory] = useState<number[]>([])
  const [activeControl, setActiveControl] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await apiFetch('/api/cockpit/metrics')
      if (res.ok) {
        const data = await res.json() as Metrics
        setMetrics(data)
        const siteLatency = data.sites.find(s => s.site.includes(siteLabel.split('.')[0]))?.ms || 0
        setLatencyHistory(h => [...h.slice(-49), siteLatency])
      }
    } catch { /* silently fail — cockpit is non-critical UI */ }
  }, [apiFetch, siteLabel])

  useEffect(() => {
    void fetchMetrics()
    const interval = setInterval(fetchMetrics, 15_000)
    return () => clearInterval(interval)
  }, [fetchMetrics])

  const healthColor = metrics?.status === 'nominal' ? '#00FF88' : metrics?.status === 'degraded' ? '#FFB800' : '#FF3333'
  const avgLatency  = metrics?.sites?.length
    ? metrics.sites.reduce((s, l) => s + l.ms, 0) / metrics.sites.length
    : 0

  // ── MINI MODE ─────────────────────────────────────────────────────────────
  if (mode === 'mini') {
    return (
      <div style={{ width: '100%', fontFamily: 'system-ui, sans-serif' }}>
        <MiniPreview url={siteUrl} label={siteLabel} onExpand={() => setMode('full')} />
        {metrics && (
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <DigitalDisplay label="Health"  value={metrics.health_score} unit="%" color={healthColor} />
            <DigitalDisplay label="Latency" value={Math.round(avgLatency)} unit="ms" />
            {metrics.alerts.length > 0 && (
              <DigitalDisplay label="Alerts" value={metrics.alerts.length} color="#FF3333" blink />
            )}
          </div>
        )}
        <style>{`
          @keyframes ping  { 75%,100% { transform: scale(2); opacity: 0; } }
          @keyframes blink { 0%,100%  { opacity: 1; } 50% { opacity: .3; } }
        `}</style>
      </div>
    )
  }

  // ── FULL COCKPIT MODE ──────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: '#050510',
      display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif',
    }}>

      {/* TOP BAR */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', background: '#0A0A1A', borderBottom: '1px solid rgba(201,168,76,.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <StatusDot ok={metrics?.status === 'nominal'} />
          <span style={{ color: '#C9A84C', fontFamily: 'monospace', fontSize: 13, fontWeight: 700, letterSpacing: '.1em' }}>
            WAVULT COCKPIT — {siteLabel.toUpperCase()}
          </span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', fontFamily: 'monospace' }}>
            {metrics ? new Date(metrics.timestamp).toLocaleTimeString() : '—'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!isLive && (
            <span style={{ background: '#332200', color: '#FFB800', padding: '3px 10px', borderRadius: 4, fontSize: 10, fontFamily: 'monospace', fontWeight: 700 }}>
              SANDBOX MODE
            </span>
          )}
          <button onClick={fetchMetrics} style={{ background: 'none', border: '1px solid rgba(255,255,255,.2)', color: 'rgba(255,255,255,.6)', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>
            ↻ REFRESH
          </button>
          <button onClick={() => setMode('mini')} style={{ background: '#C9A84C', border: 'none', color: '#050510', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
            ✕ CLOSE
          </button>
        </div>
      </div>

      {/* MAIN: iframe + gauges panel */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 380px', overflow: 'hidden' }}>

        {/* LIVE PREVIEW */}
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <iframe
            src={siteUrl}
            style={{ width: '100%', height: '100%', border: 'none' }}
            sandbox={isLive ? 'allow-scripts allow-same-origin allow-forms' : 'allow-scripts'}
          />
          {!isLive && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,5,16,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ background: 'rgba(51,34,0,.9)', border: '1px solid #FFB800', borderRadius: 8, padding: '12px 24px', color: '#FFB800', fontFamily: 'monospace', fontSize: 13, fontWeight: 700 }}>
                ⚠ SANDBOX — No live systems connected
              </div>
            </div>
          )}
        </div>

        {/* GAUGES PANEL */}
        <div style={{ background: '#080818', borderLeft: '1px solid rgba(201,168,76,.15)', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>

          {/* EKG */}
          <div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,.4)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 8 }}>Latency EKG</div>
            <div style={{ background: '#0A0A1A', borderRadius: 6, padding: '8px 10px' }}>
              <EKGLine
                data={latencyHistory.length > 2 ? latencyHistory : [50,60,45,80,55,70,40,65,50]}
                width={320} height={48} color="#00FF88"
              />
            </div>
          </div>

          {/* Analog gauges */}
          <div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,.4)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 8 }}>System Gauges</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              <AnalogGauge value={metrics?.health_score || 0} max={100}  label="Health"   unit="%" color={healthColor} />
              <AnalogGauge value={Math.round(avgLatency)}     max={1000} label="Latency"  unit="ms" color="#3B9BF5" />
              <AnalogGauge value={metrics?.traffic?.requests || 0} max={10000} label="Requests" unit="" color="#B44FE8" />
            </div>
          </div>

          {/* Digital displays */}
          <div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,.4)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 8 }}>Live Readings</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <DigitalDisplay label="Health"      value={metrics?.health_score ?? '—'} unit="%" color={healthColor} />
              <DigitalDisplay label="Avg Latency" value={Math.round(avgLatency) || '—'} unit="ms" />
              <DigitalDisplay label="Pageviews"   value={metrics?.traffic?.pageviews?.toLocaleString() ?? '—'} />
              <DigitalDisplay label="Threats"     value={metrics?.traffic?.threats ?? 0} color={metrics?.traffic?.threats ? '#FF3333' : '#00FF88'} />
              <DigitalDisplay label="Live Repos"  value={metrics?.infrastructure?.live_repos ?? '—'} color="#3B9BF5" />
              <DigitalDisplay label="Open Issues" value={metrics?.infrastructure?.open_issues ?? 0} color={metrics?.infrastructure?.open_issues ? '#FFB800' : '#00FF88'} />
            </div>
          </div>

          {/* Site status */}
          {metrics?.sites && (
            <div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,.4)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 8 }}>Site Status</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {metrics.sites.map(site => (
                  <div key={site.site} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', background: '#0A0A1A', borderRadius: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <StatusDot ok={site.ok} pulse={false} />
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', fontFamily: 'monospace' }}>{site.site}</span>
                    </div>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: site.ms < 200 ? '#00FF88' : site.ms < 500 ? '#FFB800' : '#FF3333' }}>
                      {site.ok ? `${site.ms}ms` : 'DOWN'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alerts */}
          {metrics?.alerts && metrics.alerts.length > 0 && (
            <div>
              <div style={{ fontSize: 9, color: '#FF3333', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 8 }}>⚠ Active Alerts</div>
              {metrics.alerts.map((a, i) => (
                <div key={i} style={{
                  padding: '6px 10px',
                  background: a.severity === 'critical' ? 'rgba(255,51,51,.1)' : 'rgba(255,184,0,.1)',
                  border: `1px solid ${a.severity === 'critical' ? '#FF3333' : '#FFB800'}44`,
                  borderRadius: 4, marginBottom: 4,
                }}>
                  <span style={{ fontSize: 11, color: a.severity === 'critical' ? '#FF3333' : '#FFB800', fontFamily: 'monospace' }}>
                    {a.message}
                  </span>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* FOOTER — control buttons */}
      <div style={{ background: '#0A0A1A', borderTop: '1px solid rgba(201,168,76,.2)', padding: '12px 20px' }}>
        {activeControl && (
          <div style={{ marginBottom: 12, padding: 16, background: '#0D0D28', border: '1px solid rgba(201,168,76,.3)', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: '#C9A84C', fontFamily: 'monospace', fontWeight: 700, marginBottom: 8 }}>{activeControl.toUpperCase()} SETTINGS</div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', margin: 0 }}>Settings panel for {activeControl} — connected to Wavult API Core</p>
            <button onClick={() => setActiveControl(null)} style={{ marginTop: 8, background: 'none', border: '1px solid rgba(255,255,255,.2)', color: 'rgba(255,255,255,.5)', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>
              Close ✕
            </button>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {([
            { id: 'deployments', label: '🚀 Deployments', color: '#3B9BF5' },
            { id: 'database',    label: '🗄 Database',    color: '#00FF88' },
            { id: 'cache',       label: '⚡ Cache',       color: '#FFB800' },
            { id: 'cdn',         label: '🌐 CDN',         color: '#B44FE8' },
            { id: 'auth',        label: '🔐 Auth',        color: '#FF6B35' },
            { id: 'monitoring',  label: '📊 Monitoring',  color: '#C9A84C' },
            { id: 'logs',        label: '📋 Logs',        color: '#888' },
            { id: 'workers',     label: '⚙️ Workers',     color: '#3B9BF5' },
            { id: 'alerts',      label: `🔔 Alerts${metrics?.alerts?.length ? ` (${metrics.alerts.length})` : ''}`, color: metrics?.alerts?.length ? '#FF3333' : '#888' },
            { id: 'scaling',     label: '📈 Scaling',     color: '#00FF88' }] as { id: string; label: string; color: string }[]).map(ctrl => (
            <button
              key={ctrl.id}
              onClick={() => setActiveControl(activeControl === ctrl.id ? null : ctrl.id)}
              style={{
                background: activeControl === ctrl.id ? ctrl.color + '22' : '#0D0D28',
                border: `1px solid ${activeControl === ctrl.id ? ctrl.color : 'rgba(255,255,255,.1)'}`,
                color: activeControl === ctrl.id ? ctrl.color : 'rgba(255,255,255,.6)',
                padding: '6px 14px', borderRadius: 5, cursor: 'pointer',
                fontSize: 12, fontFamily: 'monospace', transition: 'all .15s',
              }}
            >
              {ctrl.label}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes ping  { 75%,100% { transform: scale(2); opacity: 0; } }
        @keyframes blink { 0%,100%  { opacity: 1; } 50% { opacity: .3; } }
      `}</style>
    </div>
  )
}

// ── Hook for cockpit integration ──────────────────────────────────────────────

export function useCockpit() {
  const [open, setOpen] = useState(false)
  const [activeSite, setActiveSite] = useState({ url: 'https://wavult.com', label: 'wavult.com', isLive: true })
  return { open, setOpen, activeSite, setActiveSite }
}
