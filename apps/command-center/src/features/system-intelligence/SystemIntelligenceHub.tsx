// ─── System Intelligence Hub ───────────────────────────────────────────────
// Koncernhälsa-oscilloskop · Strategisk riskmatris · Beslutslogg · Marknadssignaler
// Fullt reaktiv mot backend — ingen hårdkodad data

import { useState } from 'react'
import { useTranslation } from '../../shared/i18n/useTranslation'
import {
  useSystemIntelligence,
  type QmsEntity,
  type QmsControl,
  type DecisionMeeting,
  type MarketSignal,
} from './useSystemIntelligence'

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function ActivityIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
}
function AlertIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
}
function CheckIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
}
function TrendingUpIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
}
function TrendingDownIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
}
function ClockIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
}
function RadarIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"/><path d="M4 6h.01"/><path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"/><path d="M16.24 7.76A6 6 0 1 0 8.23 16.67"/><path d="M12 18h.01"/><path d="M17.99 11.66A6 6 0 0 1 15.77 16.67"/><circle cx="12" cy="12" r="2"/><path d="m13.41 10.59 5.66-5.66"/></svg>
}
function RefreshIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
}

// ─── Loading & Empty States ───────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
      <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm">Hämtar data…</span>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="text-red-500"><AlertIcon /></div>
      <div className="text-sm text-red-700 font-medium">Kunde inte hämta data</div>
      <div className="text-xs text-gray-500 max-w-xs text-center">{message}</div>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#EDE8DC] border border-[#DDD5C5] hover:bg-[#DDD5C5] transition-colors"
      >
        <RefreshIcon /> Försök igen
      </button>
    </div>
  )
}

function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
      <div className="text-3xl">{icon}</div>
      <div className="text-sm font-medium text-gray-700">{title}</div>
      <div className="text-xs text-gray-500 max-w-xs">{subtitle}</div>
    </div>
  )
}

// ─── Entity Card ──────────────────────────────────────────────────────────────

function EntityCard({ entity }: { entity: QmsEntity }) {
  const stats = entity.stats ?? { not_started: 0, in_progress: 0, implemented: 0, verified: 0, not_applicable: 0 }
  const total = stats.not_started + stats.in_progress + stats.implemented + stats.verified + stats.not_applicable
  const done = stats.implemented + stats.verified
  const healthScore = total > 0 ? Math.round((done / (total - stats.not_applicable || 1)) * 100) : 0

  const statusColor = healthScore >= 70 ? '#10B981' : healthScore >= 40 ? '#F59E0B' : '#EF4444'
  const statusLabel = healthScore >= 70 ? 'Hälsosam' : healthScore >= 40 ? 'Varning' : 'Kritisk'

  const r = 24
  const circ = 2 * Math.PI * r
  const offset = circ - (healthScore / 100) * circ

  return (
    <div className="rounded-xl p-4 border border-[#DDD5C5] bg-[#F5F0E8]">
      <div className="flex items-start gap-3">
        <svg width="64" height="64" className="-rotate-90">
          <circle cx="32" cy="32" r={r} stroke="#DDD5C5" strokeWidth="5" fill="none" />
          <circle
            cx="32" cy="32" r={r}
            stroke={statusColor} strokeWidth="5" fill="none"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
          <text
            x="32" y="32"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#0A3D62"
            fontSize="12"
            fontWeight="bold"
            transform="rotate(90 32 32)"
          >
            {healthScore}
          </text>
        </svg>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-text-primary text-sm">{entity.name}</span>
            {entity.slug && (
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded uppercase"
                style={{ backgroundColor: statusColor + '22', color: statusColor }}
              >
                {entity.slug.toUpperCase()}
              </span>
            )}
          </div>
          {entity.jurisdiction && (
            <div className="text-xs text-gray-500 mt-0.5">{entity.jurisdiction}</div>
          )}
          <div className="flex items-center gap-1.5 mt-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />
            <span className="text-xs" style={{ color: statusColor }}>{statusLabel}</span>
          </div>
        </div>
      </div>

      {/* Standards */}
      {entity.standard_versions && entity.standard_versions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {entity.standard_versions.map(s => (
            <div key={s} className="flex items-center gap-1 text-xs text-gray-600">
              <span className="text-green-600"><CheckIcon /></span>{s}
            </div>
          ))}
        </div>
      )}

      {/* Implementation stats */}
      {total > 0 && (
        <div className="mt-3">
          <div className="flex gap-2 text-xs">
            {stats.implemented + stats.verified > 0 && (
              <span className="text-green-700">{stats.implemented + stats.verified} klar</span>
            )}
            {stats.in_progress > 0 && (
              <span className="text-amber-700">{stats.in_progress} pågår</span>
            )}
            {stats.not_started > 0 && (
              <span className="text-red-700">{stats.not_started} ej påbörjad</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Risk Matrix ──────────────────────────────────────────────────────────────

type RiskLevel = 'not_started' | 'in_progress_late' | 'in_progress' | 'done'

function getRiskLevel(ctrl: QmsControl): RiskLevel {
  const status = ctrl.implementation?.status ?? 'not_started'
  if (status === 'not_started') return 'not_started'
  if (status === 'in_progress') {
    const td = ctrl.implementation?.target_date
    if (td && new Date(td) < new Date()) return 'in_progress_late'
    return 'in_progress'
  }
  return 'done'
}

const levelMeta: Record<RiskLevel, { label: string; color: string; sortPriority: number }> = {
  not_started:     { label: 'Ej påbörjad', color: '#EF4444', sortPriority: 0 },
  in_progress_late:{ label: 'Försenad',    color: '#F97316', sortPriority: 1 },
  in_progress:     { label: 'Pågår',       color: '#F59E0B', sortPriority: 2 },
  done:            { label: 'Klar',        color: '#10B981', sortPriority: 3 },
}

function RiskMatrix({ controls, loading }: { controls: QmsControl[]; loading: boolean }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  if (loading) return <LoadingSpinner />

  const relevant = controls
    .filter(c => c.implementation?.status !== 'not_applicable')
    .sort((a, b) => {
      const la = getRiskLevel(a)
      const lb = getRiskLevel(b)
      return levelMeta[la].sortPriority - levelMeta[lb].sortPriority
    })

  if (relevant.length === 0) {
    return (
      <EmptyState
        icon="🔒"
        title="Inga QMS-kontroller registrerade"
        subtitle="Kontroller hämtas från /v1/qms/wavult-os/controls. Lägg till wavult-os som QMS-entitet."
      />
    )
  }

  const selected = relevant.find(r => r.id === selectedId)

  return (
    <div className="flex gap-5 h-full">
      {/* List */}
      <div className="flex flex-col gap-2 w-80 flex-shrink-0 overflow-y-auto">
        {relevant.map(ctrl => {
          const level = getRiskLevel(ctrl)
          const meta = levelMeta[level]
          return (
            <button
              key={ctrl.id}
              onClick={() => setSelectedId(selectedId === ctrl.id ? null : ctrl.id)}
              className={`text-left rounded-xl p-3 border transition-all ${
                selectedId === ctrl.id ? 'border-[#DDD5C5] bg-[#EDE8DC]' : 'border-surface-border bg-[#F0EBE1] hover:bg-[#EDE8DC]'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="text-xs font-bold px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: meta.color + '22', color: meta.color }}
                >
                  {meta.label}
                </div>
                {ctrl.category && (
                  <span className="text-xs text-gray-500">{ctrl.category}</span>
                )}
              </div>
              <div className="text-xs text-gray-400 font-mono mb-0.5">{ctrl.clause}</div>
              <div className="text-sm font-medium text-text-primary">{ctrl.title}</div>
              {ctrl.implementation?.responsible_person && (
                <div className="text-xs text-gray-500 mt-0.5">{ctrl.implementation.responsible_person}</div>
              )}
            </button>
          )
        })}
      </div>

      {/* Detail */}
      <div className="flex-1">
        {selected ? (
          <div className="rounded-xl border border-surface-border bg-[#F0EBE1] p-5 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div
                className="text-xs font-bold px-2 py-1 rounded uppercase"
                style={{
                  backgroundColor: levelMeta[getRiskLevel(selected)].color + '22',
                  color: levelMeta[getRiskLevel(selected)].color
                }}
              >
                {levelMeta[getRiskLevel(selected)].label}
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary">{selected.title}</h3>
                <div className="text-xs text-gray-500">{selected.clause} · {selected.category}</div>
              </div>
            </div>
            {selected.implementation?.gap_analysis && (
              <div>
                <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Gap-analys</div>
                <p className="text-sm text-gray-600">{selected.implementation.gap_analysis}</p>
              </div>
            )}
            {selected.implementation?.responsible_person && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="font-medium">Ansvarig:</span>
                {selected.implementation.responsible_person}
              </div>
            )}
            {selected.implementation?.target_date && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <ClockIcon /> Deadline:
                <span className="text-text-primary">{selected.implementation.target_date}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
            <RadarIcon />
            <div className="text-sm">Välj en kontroll för detaljer</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Decision Log ─────────────────────────────────────────────────────────────

const meetingStatusColors: Record<string, string> = {
  scheduled: '#F59E0B',
  in_progress: '#3B82F6',
  completed: '#10B981',
  cancelled: '#6B7280',
}
const meetingStatusLabels: Record<string, string> = {
  scheduled: 'Planerat',
  in_progress: 'Pågår',
  completed: 'Klar',
  cancelled: 'Avbokat',
}

function DecisionLog({ meetings, loading }: { meetings: DecisionMeeting[]; loading: boolean }) {
  if (loading) return <LoadingSpinner />

  if (meetings.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title="Ingen beslutslogg ännu"
        subtitle="Beslut och möten registreras via /api/decisions/meetings. Lägg till ditt första beslutsmöte."
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {meetings.map(meeting => {
        const statusColor = meetingStatusColors[meeting.status ?? ''] ?? '#6B7280'
        const statusLabel = meetingStatusLabels[meeting.status ?? ''] ?? meeting.status ?? 'Okänd'
        const decisions = meeting.decisions ?? []
        const actions = meeting.action_items ?? []

        return (
          <div key={meeting.id} className="rounded-xl border border-surface-border bg-[#F0EBE1] p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 pt-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <div
                    className="text-xs font-bold px-1.5 py-0.5 rounded uppercase"
                    style={{ backgroundColor: statusColor + '22', color: statusColor }}
                  >
                    {statusLabel}
                  </div>
                  {meeting.date && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <ClockIcon />{meeting.date}
                    </span>
                  )}
                  {meeting.attendees && meeting.attendees.length > 0 && (
                    <span className="text-xs text-gray-500">{meeting.attendees.join(', ')}</span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-text-primary mb-1">{meeting.title}</h4>
                {meeting.summary && (
                  <p className="text-xs text-gray-500 mb-2">{meeting.summary}</p>
                )}

                {decisions.length > 0 && (
                  <div className="rounded bg-[#EDE8DC] border border-surface-border px-3 py-2 mb-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Beslut</div>
                    <ul className="flex flex-col gap-1">
                      {decisions.map((d, i) => (
                        <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                          <CheckIcon />
                          {typeof d === 'string' ? d : d.text ?? JSON.stringify(d)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {actions.length > 0 && (
                  <div className="rounded bg-[#EDE8DC] border border-surface-border px-3 py-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Åtgärdspunkter</div>
                    <ul className="flex flex-col gap-1">
                      {actions.map((a, i) => (
                        <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                          <span className={(a.done) ? 'text-green-600' : 'text-amber-600'}>
                            {a.done ? <CheckIcon /> : <ClockIcon />}
                          </span>
                          {typeof a === 'string' ? a : a.text ?? JSON.stringify(a)}
                          {typeof a !== 'string' && a.owner && (
                            <span className="text-gray-400">({a.owner})</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Market Signals ───────────────────────────────────────────────────────────

function MarketSignals({ signals, loading }: { signals: MarketSignal[]; loading: boolean }) {
  if (loading) return <LoadingSpinner />

  if (signals.length === 0) {
    return (
      <EmptyState
        icon="📈"
        title="Inga marknadssignaler registrerade"
        subtitle="Lägg till signaler via POST /api/intelligence/signal med source, customer_id och value. Signaler dyker upp här direkt."
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {signals.map(signal => {
        const value = signal.value ?? 50
        const isStrong = value >= 70
        const isWeak = value < 30

        return (
          <div
            key={signal.id}
            className="rounded-xl border border-[#DDD5C5] bg-[#F0EBE1] p-4"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {isStrong && <span className="text-green-700"><TrendingUpIcon /></span>}
                {isWeak && <span className="text-red-700"><TrendingDownIcon /></span>}
                {!isStrong && !isWeak && <span className="text-gray-500">→</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {signal.product_hint && (
                    <div className="text-xs font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700">
                      {signal.product_hint}
                    </div>
                  )}
                  <div className="text-xs font-bold px-1.5 py-0.5 rounded uppercase"
                    style={{
                      backgroundColor: isStrong ? '#10B98122' : isWeak ? '#EF444422' : '#F59E0B22',
                      color: isStrong ? '#10B981' : isWeak ? '#EF4444' : '#F59E0B'
                    }}
                  >
                    {isStrong ? 'Stark' : isWeak ? 'Svag' : 'Måttlig'} ({value})
                  </div>
                </div>
                <div className="text-xs text-gray-400 font-mono mb-0.5">{signal.source}</div>
                {signal.metadata && Object.keys(signal.metadata).length > 0 && (
                  <p className="text-sm text-gray-700">
                    {JSON.stringify(signal.metadata).slice(0, 200)}
                  </p>
                )}
                {signal.timestamp && (
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(signal.timestamp).toLocaleDateString('sv-SE')}
                    {signal.customer_id && ` · ${signal.customer_id}`}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Koncernhälsa (Oscilloskop) ───────────────────────────────────────────────

function KoncernHalsa({
  entities,
  risk_summary,
  loading,
}: {
  entities: QmsEntity[]
  risk_summary: { critical: number; high: number; medium: number; low: number; group_lambda: number; total_controls: number }
  loading: boolean
}) {
  if (loading) return <LoadingSpinner />

  if (entities.length === 0) {
    return (
      <EmptyState
        icon="🏛"
        title="Inga koncernenheter registrerade"
        subtitle="Lägg till enheter i QMS-systemet via /v1/qms/entities. De visas här automatiskt."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {entities.map(entity => (
        <EntityCard key={entity.id} entity={entity} />
      ))}

      {/* Group Lambda card */}
      <div className="rounded-xl border border-surface-border bg-[#F0EBE1] p-4 flex flex-col gap-2">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Koncernhälsa (λ)</div>
        <div className={`text-4xl font-mono font-bold ${
          risk_summary.group_lambda >= 0.7 ? 'text-green-700'
          : risk_summary.group_lambda >= 0.4 ? 'text-amber-700'
          : 'text-red-700'
        }`}>
          λ {risk_summary.group_lambda.toFixed(2)}
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          Lambda = andel QMS-kontroller implementerade/verifierade av totalt tillämpliga.
          λ &lt; 0.5 = kritisk systemstress.
          {risk_summary.total_controls > 0 && (
            <> {risk_summary.low} av {risk_summary.total_controls} kontroller klara.</>
          )}
        </p>
        {/* Per-entity progress bars */}
        <div className="mt-2 flex flex-col gap-1.5">
          {entities.map(e => {
            const s = e.stats ?? { not_started: 0, in_progress: 0, implemented: 0, verified: 0, not_applicable: 0 }
            const total = s.not_started + s.in_progress + s.implemented + s.verified
            const done = s.implemented + s.verified
            const pct = total > 0 ? Math.round((done / total) * 100) : 0
            return (
              <div key={e.id} className="flex items-center gap-2 text-xs">
                <span className="w-24 truncate text-gray-500">{e.slug ?? e.id}</span>
                <div className="flex-1 bg-[#EDE8DC] rounded-full h-1.5">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: pct >= 70 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#EF4444',
                    }}
                  />
                </div>
                <span className="text-text-primary w-8 text-right">{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Strategi (statisk, produktbaserad) ───────────────────────────────────────

function StrategicOverview() {
  const zoomercycle = [
    { event: 'mission_created', desc: 'En ny bilduppgift läggs till på kartan — en zoomer tilldelas', color: '#2563EB' },
    { event: 'zoomer_assigned', desc: 'Zoomer accepterar uppdrag och påbörjar det', color: '#3B82F6' },
    { event: 'image_captured', desc: 'Bild tagen och uppladdad — leverans sker', color: '#E8B84B' },
    { event: 'submission_reviewed', desc: 'Kvalitetsgodkänd av systemet — zoomer valideras', color: '#10B981' },
    { event: 'payment_triggered', desc: 'Zoomer betalas — uppdragscykeln avslutas', color: '#0A3D62' },
  ]

  const products = [
    { name: 'quiXzoom', tagline: 'Last Mile Intelligence Capture', status: 'Launch Q2 2026, Sverige', color: '#E8B84B' },
    { name: 'LandveX', tagline: 'Right control. Right cost. Right interval.', status: 'Fas 3 efter quiXzoom', color: '#0A3D62' },
    { name: 'Quixom Ads', tagline: 'B2B dataplattform', status: 'Fas 2 monetisering', color: '#10B981' },
  ]

  const gtmSteps = [
    { step: '1', label: 'quiXzoom', desc: 'Crowdsourcad bildplattform — zoomers tar uppdrag och bygger databasen', color: '#E8B84B' },
    { step: '2', label: 'Quixom Ads', desc: 'B2B dataplattform monetiserar bilddata och hyperlokal intelligens', color: '#F59E0B' },
    { step: '3', label: 'LandveX', desc: 'Enterprise-försäljning av larm, händelserapporter och analysabonnemang till kommuner och Trafikverket', color: '#0A3D62' },
  ]

  return (
    <div className="flex flex-col gap-8">
      {/* Wavult OS */}
      <div className="rounded-2xl border border-[#DDD5C5] bg-[#F5F0E8] p-6">
        <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Wavult OS</div>
        <div className="text-xl font-bold text-[#0A3D62] mb-3">Internt enterprise-operativsystem</div>
        <p className="text-sm text-gray-600 leading-relaxed">
          Wavult OS är det interna enterprise-operativsystemet som driver alla Wavult Group-produkter.
          Det är inte en produkt som säljs — det är ryggraden som möjliggör quiXzoom, LandveX och Quixom Ads.
        </p>
        <div className="mt-4 flex gap-3 flex-wrap">
          {['quiXzoom', 'LandveX', 'Quixom Ads'].map(p => (
            <div key={p} className="rounded-lg border border-[#DDD5C5] bg-[#F0EBE1] px-3 py-1.5 text-xs font-medium text-[#0A3D62]">
              {p}
            </div>
          ))}
        </div>
      </div>

      {/* Produktportfölj */}
      <div>
        <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Produktportfölj</div>
        <div className="flex flex-col gap-3">
          {products.map(p => (
            <div
              key={p.name}
              className="rounded-xl border p-4 flex items-start gap-4"
              style={{ borderColor: p.color + '33', backgroundColor: p.color + '0A' }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-bold text-[#0A3D62] text-sm">{p.name}</span>
                  <span className="text-xs text-gray-600">— {p.tagline}</span>
                </div>
                <div
                  className="text-xs font-medium px-2 py-0.5 rounded inline-block"
                  style={{ backgroundColor: p.color + '22', color: p.color === '#0A3D62' ? '#0A3D62' : p.color }}
                >
                  {p.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GTM-sekvens */}
      <div>
        <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">GTM-sekvens</div>
        <div className="flex flex-col gap-2">
          {gtmSteps.map((step, i) => (
            <div key={step.step} className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: step.color + '22', color: step.color === '#0A3D62' ? '#0A3D62' : step.color }}
                >
                  {step.step}
                </div>
                {i < gtmSteps.length - 1 && <div className="w-px h-5 bg-[#DDD5C5]" />}
              </div>
              <div className="flex-1 rounded-xl border border-[#DDD5C5] bg-[#F0EBE1] px-4 py-3 mb-1">
                <div className="font-semibold text-[#0A3D62] text-sm mb-0.5">{step.label}</div>
                <div className="text-xs text-gray-600">{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* quiXzoom Zoomer-cykel */}
      <div>
        <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">quiXzoom — Zoomer-cykeln</div>
        <div className="rounded-xl border border-[#E8B84B]/30 bg-[#E8B84B]/5 p-5">
          <p className="text-sm text-gray-600 mb-4">
            Varje uppdrag i quiXzoom genererar en kedja av händelser — från att uppgiften skapas till att zoomern betalas.
          </p>
          <div className="flex flex-col gap-2">
            {zoomercycle.map((step, i) => (
              <div key={step.event} className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: step.color + '22', color: step.color }}
                  >
                    {i + 1}
                  </div>
                  {i < zoomercycle.length - 1 && (
                    <div className="w-px h-4 bg-[#DDD5C5] ml-2" />
                  )}
                </div>
                <div className="flex-1 rounded-lg bg-[#F0EBE1] border border-[#DDD5C5] px-3 py-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-xs font-mono" style={{ color: step.color }}>{step.event}</code>
                    <span className="text-xs text-gray-600">— {step.desc}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

type ActiveTab = 'oscilloskop' | 'risker' | 'beslut' | 'marknad' | 'pix'

export function SystemIntelligenceHub() {
  const { t: _t } = useTranslation()
  const [activeTab, setActiveTab] = useState<ActiveTab>('oscilloskop')

  const {
    entities,
    controls,
    risk_summary,
    market_signals,
    meetings,
    loading,
    error,
    refetch,
  } = useSystemIntelligence()

  const tabs: { id: ActiveTab; label: string; icon: string }[] = [
    { id: 'oscilloskop', label: 'Koncernhälsa', icon: '📡' },
    { id: 'risker', label: 'Riskmatris', icon: '⚠️' },
    { id: 'beslut', label: 'Beslutslogg', icon: '📋' },
    { id: 'marknad', label: 'Marknadssignaler', icon: '📈' },
    { id: 'pix', label: 'Strategi', icon: '🎯' },
  ]

  return (
    <div className="h-full flex flex-col bg-[#F0EBE1] text-text-primary overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-surface-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <ActivityIcon />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">System Intelligence</h1>
            <p className="text-xs text-gray-500">Koncernhälsa · Risker · Beslut · Marknad</p>
          </div>
        </div>

        {/* Summary KPIs — från faktisk backend-data */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            {loading ? (
              <div className="h-7 w-16 bg-[#EDE8DC] rounded animate-pulse" />
            ) : (
              <div className={`text-xl font-bold ${
                risk_summary.group_lambda >= 0.7 ? 'text-green-700'
                : risk_summary.group_lambda >= 0.4 ? 'text-amber-700'
                : 'text-red-700'
              }`}>
                λ {risk_summary.group_lambda.toFixed(2)}
              </div>
            )}
            <div className="text-xs text-gray-500">Group Lambda</div>
          </div>
          <div className="text-center">
            {loading ? (
              <div className="h-7 w-8 bg-[#EDE8DC] rounded animate-pulse" />
            ) : (
              <div className="text-xl font-bold text-red-700">{risk_summary.critical}</div>
            )}
            <div className="text-xs text-gray-500">Kritiska risker</div>
          </div>
          <div className="text-center">
            {loading ? (
              <div className="h-7 w-8 bg-[#EDE8DC] rounded animate-pulse" />
            ) : (
              <div className="text-xl font-bold text-amber-700">{risk_summary.high}</div>
            )}
            <div className="text-xs text-gray-500">Försenade</div>
          </div>
          <button
            onClick={refetch}
            className="p-2 rounded-lg bg-[#EDE8DC] border border-[#DDD5C5] hover:bg-[#DDD5C5] transition-colors text-gray-500"
            title="Uppdatera"
          >
            <RefreshIcon />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-3 pb-0 flex-shrink-0">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-t-lg font-medium border-b-2 transition-all ${
              activeTab === t.id
                ? 'text-text-primary border-blue-500 bg-[#EDE8DC]'
                : 'text-gray-500 border-transparent hover:text-text-primary hover:bg-[#F0EBE1]'
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
      <div className="h-px bg-[#EDE8DC] flex-shrink-0" />

      {/* Content */}
      <div className="flex-1 overflow-auto p-5">
        {/* Global error banner (non-blocking) */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3">
            <span className="text-red-500"><AlertIcon /></span>
            <span className="text-xs text-red-700 flex-1">{error}</span>
            <button onClick={refetch} className="text-xs text-red-700 underline hover:no-underline">Försök igen</button>
          </div>
        )}

        {activeTab === 'oscilloskop' && (
          <KoncernHalsa entities={entities} risk_summary={risk_summary} loading={loading} />
        )}

        {activeTab === 'risker' && (
          <div className="h-full" style={{ minHeight: '500px' }}>
            <RiskMatrix controls={controls} loading={loading} />
          </div>
        )}

        {activeTab === 'beslut' && (
          <DecisionLog meetings={meetings} loading={loading} />
        )}

        {activeTab === 'marknad' && (
          <MarketSignals signals={market_signals} loading={loading} />
        )}

        {activeTab === 'pix' && <StrategicOverview />}
      </div>
    </div>
  )
}
