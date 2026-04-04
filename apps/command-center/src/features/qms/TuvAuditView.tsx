/**
 * TuvAuditView — TÜV Rheinland Full Audit Simulation
 * Hans-Dieter Müller, Senior Auditor
 * ISO 9001:2015 + ISO 27001:2022 + GDPR + NIS2
 *
 * Designstandard: #F5F0E8 cream · Navy #0A3D62 · Gold #E8B84B
 */

import React, { useState, useEffect } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TuvSession {
  session_id: string
  date: string
  total: number
  pass: number
  fail: number
  warning: number
  critical: number
  pass_rate: number
  final_verdict: 'READY' | 'CONDITIONAL' | 'NOT_READY' | 'UNKNOWN'
}

interface TuvTest {
  id: string
  session_id: string
  scenario_id: string
  test_name: string
  test_description: string
  org_size: number
  expected: string
  actual: string
  verdict: 'PASS' | 'FAIL' | 'WARNING' | 'CRITICAL'
  tuv_comment: string
  iso_clause: string
  created_at: string
}

interface TuvScenario {
  scenario_id: string
  tests: TuvTest[]
  pass: number
  fail: number
  warning: number
  critical: number
}

interface TuvSessionDetail {
  session_id: string
  date: string
  summary: { total: number; pass: number; fail: number; warning: number; critical: number; pass_rate: number }
  scenarios: TuvScenario[]
}

interface TuvSupplier {
  id: string
  supplier_name: string
  iso_standard: string
  has_certification: boolean
  certification_body: string | null
  certification_valid_until: string | null
  has_dpa: boolean
  dpa_compliant: boolean
  security_questionnaire_score: number
  data_residency_compliant: boolean
  sub_processor_disclosure: boolean
  breach_notification_sla: string
  overall_rating: 'approved' | 'conditional' | 'rejected'
  conditions: string | null
  auditor_notes: string
  created_at: string
}

interface SprintItem {
  priority: number
  action: string
  owner: string
  deadline: string
  status: string
  iso_clause: string
  estimated_hours: number
  description: string
}

interface TuvSprint {
  sprint_name: string
  deadline: string
  days_remaining: number
  sprint_plan: SprintItem[]
  open_capas: any[]
  dpa_gaps: any[]
  readiness_score: number
  recommendation: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE = '/v1/tuv'

const VERDICT_CONFIG = {
  PASS:     { label: 'PASS',     bg: '#EAFAF1', fg: '#1D6A39', dot: '#A9DFBF', icon: '✅' },
  WARNING:  { label: 'WARNING',  bg: '#FEF9E7', fg: '#9A7D0A', dot: '#F9E79F', icon: '⚠️' },
  FAIL:     { label: 'FAIL',     bg: '#FDEDEC', fg: '#922B21', dot: '#F1948A', icon: '❌' },
  CRITICAL: { label: 'CRITICAL', bg: '#F9EBEA', fg: '#78281F', dot: '#E6B0AA', icon: '🔴' },
} as const

const RATING_CONFIG = {
  approved:    { label: 'Godkänd',      bg: '#EAFAF1', fg: '#1D6A39', dot: '#27AE60' },
  conditional: { label: 'Villkorlig',   bg: '#FEF9E7', fg: '#9A7D0A', dot: '#F39C12' },
  rejected:    { label: 'Avvisad',      bg: '#FDEDEC', fg: '#922B21', dot: '#E74C3C' },
} as const

const FINAL_VERDICT_CONFIG = {
  READY:       { label: 'REDO FÖR CERTIFIERING', bg: '#EAFAF1', fg: '#1D6A39', border: '#27AE60' },
  CONDITIONAL: { label: 'VILLKORLIGT REDO',       bg: '#FEF9E7', fg: '#9A7D0A', border: '#F39C12' },
  NOT_READY:   { label: 'EJ CERTIFIERINGSREDO',   bg: '#FDEDEC', fg: '#922B21', border: '#E74C3C' },
  UNKNOWN:     { label: 'OKÄNT',                  bg: '#F4F6F7', fg: '#5D6D7E', border: '#BFC9CA' },
} as const

const SCENARIO_NAMES: Record<string, string> = {
  S01: 'Solo-organisation (1 person)',
  S02: '5-personers organisation — Wavult nuläge',
  S03: '50-personers skalningstest',
  S04: '500-personers enterprise skalning',
  S05: 'Ansvarsrotation — Dennis slutar',
  S06: 'Backend-reaktivitet — Live API',
  S07: 'GDPR Compliance Chain — End-to-End',
  S08: 'Business Continuity — Simulated Outage',
  S09: 'Leverantörs-ISO-granskning',
  S10: 'Proaktiv Agent-reaktivitet',
  S11: 'Tidslinje-stresstest — 7 dagar Thailand',
  S12: 'TÜV Final Verdict',
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useTuvSessions() {
  const [sessions, setSessions] = useState<TuvSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_BASE}/sessions`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('wavult_token') || ''}` } })
      .then(r => r.json())
      .then(d => setSessions(d.sessions || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return { sessions, loading, error }
}

function useTuvSessionDetail(sessionId: string | null) {
  const [detail, setDetail] = useState<TuvSessionDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!sessionId) { setDetail(null); return }
    setLoading(true)
    fetch(`${API_BASE}/sessions/${sessionId}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('wavult_token') || ''}` } })
      .then(r => r.json())
      .then(d => setDetail(d))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false))
  }, [sessionId])

  return { detail, loading }
}

function useTuvSuppliers() {
  const [data, setData] = useState<{ suppliers: TuvSupplier[]; summary: any } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/suppliers`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('wavult_token') || ''}` } })
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  return { data, loading }
}

function useTuvSprint() {
  const [sprint, setSprint] = useState<TuvSprint | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('tuv_sprint_checked') || '{}') }
    catch { return {} }
  })

  useEffect(() => {
    fetch(`${API_BASE}/sprint`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('wavult_token') || ''}` } })
      .then(r => r.json())
      .then(d => setSprint(d))
      .catch(() => setSprint(null))
      .finally(() => setLoading(false))
  }, [])

  const toggleItem = (priority: number) => {
    setCheckedItems(prev => {
      const next = { ...prev, [priority]: !prev[priority] }
      localStorage.setItem('tuv_sprint_checked', JSON.stringify(next))
      return next
    })
  }

  return { sprint, loading, checkedItems, toggleItem }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function VerdictBadge({ verdict }: { verdict: 'PASS' | 'FAIL' | 'WARNING' | 'CRITICAL' }) {
  const cfg = VERDICT_CONFIG[verdict]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px',
      borderRadius: 4, background: cfg.bg, color: cfg.fg,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
      fontFamily: 'monospace'
    }}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

function RatingBadge({ rating }: { rating: 'approved' | 'conditional' | 'rejected' }) {
  const cfg = RATING_CONFIG[rating]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px',
      borderRadius: 12, background: cfg.bg, color: cfg.fg,
      fontSize: 12, fontWeight: 700
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
      {cfg.label}
    </span>
  )
}

function ScoreBar({ value, max = 100, color }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const barColor = color || (pct >= 80 ? '#27AE60' : pct >= 60 ? '#F39C12' : '#E74C3C')
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: '#E8E0D4', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 3, transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: barColor, minWidth: 32, textAlign: 'right' }}>
        {value}
      </span>
    </div>
  )
}

function VerdictBar({ pass, fail, warning, critical, total }: {
  pass: number; fail: number; warning: number; critical: number; total: number
}) {
  if (total === 0) return null
  return (
    <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 1 }}>
      {pass > 0 && <div style={{ flex: pass, background: '#27AE60' }} title={`PASS: ${pass}`} />}
      {warning > 0 && <div style={{ flex: warning, background: '#F39C12' }} title={`WARNING: ${warning}`} />}
      {fail > 0 && <div style={{ flex: fail, background: '#E74C3C' }} title={`FAIL: ${fail}`} />}
      {critical > 0 && <div style={{ flex: critical, background: '#8B0000' }} title={`CRITICAL: ${critical}`} />}
    </div>
  )
}

// ─── Session List ─────────────────────────────────────────────────────────────

function SessionList({ sessions, selectedId, onSelect }: {
  sessions: TuvSession[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {sessions.map(s => {
        const fvc = FINAL_VERDICT_CONFIG[s.final_verdict] || FINAL_VERDICT_CONFIG.UNKNOWN
        const isSelected = s.session_id === selectedId
        return (
          <div
            key={s.session_id}
            onClick={() => onSelect(s.session_id)}
            style={{
              padding: '12px 16px', borderRadius: 8, cursor: 'pointer',
              border: `2px solid ${isSelected ? '#0A3D62' : '#E8E0D4'}`,
              background: isSelected ? '#F0EBE3' : '#FDFAF7',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#0A3D62' }}>
                  {s.session_id}
                </div>
                <div style={{ fontSize: 11, color: '#7F8C8D', marginTop: 2 }}>
                  {new Date(s.date).toLocaleString('sv-SE')}
                </div>
              </div>
              <div style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                background: fvc.bg, color: fvc.fg, border: `1px solid ${fvc.border}`, textAlign: 'center'
              }}>
                {s.final_verdict}
              </div>
            </div>
            <VerdictBar pass={s.pass} fail={s.fail} warning={s.warning} critical={s.critical} total={s.total} />
            <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11 }}>
              <span style={{ color: '#27AE60', fontWeight: 600 }}>✅ {s.pass}</span>
              <span style={{ color: '#F39C12', fontWeight: 600 }}>⚠️ {s.warning}</span>
              <span style={{ color: '#E74C3C', fontWeight: 600 }}>❌ {s.fail}</span>
              <span style={{ color: '#8B0000', fontWeight: 600 }}>🔴 {s.critical}</span>
              <span style={{ color: '#0A3D62', fontWeight: 700, marginLeft: 'auto' }}>{s.pass_rate}% pass</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Session Detail ───────────────────────────────────────────────────────────

function SessionDetail({ detail }: { detail: TuvSessionDetail }) {
  const [expandedScenario, setExpandedScenario] = useState<string | null>('S01')
  const fvc = FINAL_VERDICT_CONFIG[
    detail.summary.critical > 2 || detail.summary.fail > 5 ? 'NOT_READY' :
    detail.summary.critical > 0 || detail.summary.fail > 0 ? 'CONDITIONAL' : 'READY'
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary banner */}
      <div style={{
        padding: '16px 20px', borderRadius: 10,
        background: fvc.bg, border: `2px solid ${fvc.border}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 24 }}>🇩🇪</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: fvc.fg }}>
              TÜV RHEINLAND — {fvc.label}
            </div>
            <div style={{ fontSize: 12, color: '#7F8C8D' }}>
              Prüfer: Hans-Dieter Müller · {new Date(detail.date).toLocaleString('sv-SE')}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: fvc.fg }}>
              {detail.summary.pass_rate}%
            </div>
            <div style={{ fontSize: 11, color: '#7F8C8D' }}>pass rate</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          {[
            { label: 'PASS', count: detail.summary.pass, color: '#27AE60' },
            { label: 'WARNING', count: detail.summary.warning, color: '#F39C12' },
            { label: 'FAIL', count: detail.summary.fail, color: '#E74C3C' },
            { label: 'CRITICAL', count: detail.summary.critical, color: '#8B0000' },
          ].map(({ label, count, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color }}>{count}</div>
              <div style={{ fontSize: 10, color: '#7F8C8D', fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scenarios */}
      {detail.scenarios.map(scenario => {
        const name = SCENARIO_NAMES[scenario.scenario_id] || scenario.scenario_id
        const isExpanded = expandedScenario === scenario.scenario_id
        const hasIssues = scenario.fail > 0 || scenario.critical > 0

        return (
          <div key={scenario.scenario_id} style={{
            borderRadius: 8, border: `1px solid ${hasIssues ? '#F1948A' : '#E8E0D4'}`,
            overflow: 'hidden', background: '#FDFAF7'
          }}>
            {/* Scenario header */}
            <div
              onClick={() => setExpandedScenario(isExpanded ? null : scenario.scenario_id)}
              style={{
                padding: '10px 14px', cursor: 'pointer',
                background: hasIssues ? '#FEF5F5' : '#F5F0E8',
                display: 'flex', alignItems: 'center', gap: 10
              }}
            >
              <span style={{
                fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
                color: '#0A3D62', background: '#D4E6F1', padding: '2px 6px', borderRadius: 4
              }}>
                {scenario.scenario_id}
              </span>
              <span style={{ flex: 1, fontWeight: 600, fontSize: 13, color: '#0A3D62' }}>{name}</span>
              <div style={{ display: 'flex', gap: 6, fontSize: 11 }}>
                {scenario.pass > 0 && <span style={{ color: '#27AE60', fontWeight: 700 }}>✅{scenario.pass}</span>}
                {scenario.warning > 0 && <span style={{ color: '#F39C12', fontWeight: 700 }}>⚠️{scenario.warning}</span>}
                {scenario.fail > 0 && <span style={{ color: '#E74C3C', fontWeight: 700 }}>❌{scenario.fail}</span>}
                {scenario.critical > 0 && <span style={{ color: '#8B0000', fontWeight: 700 }}>🔴{scenario.critical}</span>}
              </div>
              <span style={{ fontSize: 12, color: '#7F8C8D' }}>{isExpanded ? '▲' : '▼'}</span>
            </div>

            {/* Test rows */}
            {isExpanded && (
              <div style={{ padding: '8px 0' }}>
                {scenario.tests.map(test => (
                  <div key={test.id} style={{
                    padding: '8px 14px',
                    borderBottom: '1px solid #F0EBE3',
                    background: test.verdict === 'CRITICAL' ? '#FEF5F5' : 'transparent'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <VerdictBadge verdict={test.verdict} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#2C3E50' }}>{test.test_name}</div>
                        {test.test_description && (
                          <div style={{ fontSize: 11, color: '#7F8C8D', marginTop: 2 }}>{test.test_description}</div>
                        )}
                        {(test.verdict === 'FAIL' || test.verdict === 'CRITICAL') && test.tuv_comment && (
                          <div style={{
                            marginTop: 6, padding: '6px 10px', borderRadius: 4,
                            background: '#F9EBEA', color: '#922B21', fontSize: 11,
                            borderLeft: '3px solid #E74C3C'
                          }}>
                            <strong>Müller:</strong> {test.tuv_comment}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 10, color: '#95A5A6' }}>
                          <span>ISO {test.iso_clause}</span>
                          <span>Org-storlek: {test.org_size}</span>
                          {test.actual && <span>Faktiskt: <code>{test.actual.slice(0, 60)}</code></span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Supplier Table ───────────────────────────────────────────────────────────

function SupplierTable({ suppliers, summary }: { suppliers: TuvSupplier[]; summary: any }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div>
      {/* Summary */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Godkända', count: summary.approved, color: '#27AE60', bg: '#EAFAF1' },
          { label: 'Villkorliga', count: summary.conditional, color: '#F39C12', bg: '#FEF9E7' },
          { label: 'Avvisade', count: summary.rejected, color: '#E74C3C', bg: '#FDEDEC' },
          { label: 'Avg score', count: `${summary.avg_score}/100`, color: '#0A3D62', bg: '#EBF5FB' },
        ].map(({ label, count, color, bg }) => (
          <div key={label} style={{
            padding: '10px 16px', borderRadius: 8, background: bg, flex: 1, minWidth: 80, textAlign: 'center'
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color }}>{count}</div>
            <div style={{ fontSize: 11, color: '#7F8C8D' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Supplier rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {suppliers.map(s => {
          const isExpanded = expanded === s.id
          return (
            <div key={s.id} style={{
              borderRadius: 8, border: `1px solid ${s.overall_rating === 'rejected' ? '#F1948A' : '#E8E0D4'}`,
              overflow: 'hidden', background: '#FDFAF7'
            }}>
              <div
                onClick={() => setExpanded(isExpanded ? null : s.id)}
                style={{
                  padding: '10px 14px', cursor: 'pointer',
                  background: s.overall_rating === 'rejected' ? '#FEF5F5' :
                              s.overall_rating === 'approved' ? '#F0FDF4' : '#FDFAF7',
                  display: 'flex', alignItems: 'center', gap: 12
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0A3D62' }}>{s.supplier_name}</div>
                  <div style={{ fontSize: 11, color: '#7F8C8D' }}>{s.iso_standard}</div>
                </div>
                <ScoreBar value={s.security_questionnaire_score} />
                <RatingBadge rating={s.overall_rating} />
                <span style={{ fontSize: 12, color: '#7F8C8D' }}>{isExpanded ? '▲' : '▼'}</span>
              </div>

              {isExpanded && (
                <div style={{ padding: '12px 14px', borderTop: '1px solid #F0EBE3' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                    {[
                      { label: 'ISO-certifikat', value: s.has_certification ? `✅ ${s.certification_body}` : '❌ Saknas' },
                      { label: 'Giltigt till', value: s.certification_valid_until || '—' },
                      { label: 'DPA signerat', value: s.has_dpa ? '✅ Ja' : '❌ Nej' },
                      { label: 'DPA compliant', value: s.dpa_compliant ? '✅ Ja' : '❌ Nej' },
                      { label: 'Data i EU', value: s.data_residency_compliant ? '✅ Ja' : '⚠️ Nej' },
                      { label: 'Underlev. redovisas', value: s.sub_processor_disclosure ? '✅ Ja' : '⚠️ Nej' },
                      { label: 'Breach SLA', value: s.breach_notification_sla },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ fontSize: 12 }}>
                        <span style={{ color: '#95A5A6', marginRight: 4 }}>{label}:</span>
                        <span style={{ color: '#2C3E50', fontWeight: 600 }}>{value}</span>
                      </div>
                    ))}
                  </div>
                  {s.auditor_notes && (
                    <div style={{
                      padding: '8px 10px', borderRadius: 4, background: '#F5F0E8',
                      fontSize: 12, color: '#2C3E50', borderLeft: '3px solid #E8B84B'
                    }}>
                      <strong>Müller:</strong> {s.auditor_notes}
                    </div>
                  )}
                  {s.conditions && (
                    <div style={{
                      marginTop: 6, padding: '8px 10px', borderRadius: 4,
                      background: '#FEF9E7', fontSize: 12, color: '#9A7D0A',
                      borderLeft: '3px solid #F39C12'
                    }}>
                      <strong>Villkor:</strong> {s.conditions}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Sprint Plan ──────────────────────────────────────────────────────────────

function SprintPlanView({ sprint, checkedItems, onToggle }: {
  sprint: TuvSprint
  checkedItems: Record<number, boolean>
  onToggle: (priority: number) => void
}) {
  const doneCount = sprint.sprint_plan.filter(i => checkedItems[i.priority]).length
  const totalCount = sprint.sprint_plan.length
  const progressPct = Math.round((doneCount / totalCount) * 100)

  const urgencyColor = sprint.days_remaining <= 3 ? '#E74C3C' :
                       sprint.days_remaining <= 7 ? '#F39C12' : '#27AE60'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px', borderRadius: 10, background: '#FEF9E7',
        border: '2px solid #F39C12'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <span style={{ fontSize: 28 }}>🇹🇭</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#0A3D62' }}>Thailand Certification Sprint</div>
            <div style={{ fontSize: 12, color: '#7F8C8D' }}>Deadline: 11 april 2026</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: urgencyColor }}>{sprint.days_remaining}</div>
            <div style={{ fontSize: 11, color: '#7F8C8D' }}>dagar kvar</div>
          </div>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: '#7F8C8D' }}>Åtgärder slutförda</span>
            <span style={{ fontWeight: 700, color: '#0A3D62' }}>{doneCount}/{totalCount}</span>
          </div>
          <div style={{ height: 8, background: '#E8E0D4', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              width: `${progressPct}%`, height: '100%', background: '#27AE60',
              borderRadius: 4, transition: 'width 0.5s ease'
            }} />
          </div>
        </div>

        <div style={{
          padding: '8px 10px', borderRadius: 6, background: '#F5F0E8',
          fontSize: 12, color: '#9A7D0A', fontStyle: 'italic'
        }}>
          {sprint.recommendation}
        </div>
      </div>

      {/* Sprint items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sprint.sprint_plan.map(item => {
          const isDone = checkedItems[item.priority]
          return (
            <div
              key={item.priority}
              style={{
                padding: '12px 14px', borderRadius: 8,
                border: `1px solid ${isDone ? '#A9DFBF' : '#E8E0D4'}`,
                background: isDone ? '#F0FDF4' : '#FDFAF7',
                opacity: isDone ? 0.75 : 1,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onClick={() => onToggle(item.priority)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                {/* Checkbox */}
                <div style={{
                  width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 1,
                  background: isDone ? '#27AE60' : 'white',
                  border: `2px solid ${isDone ? '#27AE60' : '#BFC9CA'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {isDone && <span style={{ color: 'white', fontSize: 12, fontWeight: 900 }}>✓</span>}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      background: '#0A3D62', color: 'white', borderRadius: 4,
                      padding: '1px 6px', fontSize: 10, fontWeight: 700
                    }}>P{item.priority}</span>
                    <span style={{
                      fontWeight: 700, fontSize: 13, color: '#0A3D62',
                      textDecoration: isDone ? 'line-through' : 'none'
                    }}>{item.action}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#7F8C8D' }}>{item.description}</div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11 }}>
                    <span style={{ color: '#5D6D7E' }}>👤 {item.owner}</span>
                    <span style={{ color: '#E74C3C', fontWeight: 600 }}>📅 {item.deadline}</span>
                    <span style={{ color: '#7F8C8D' }}>⏱ ~{item.estimated_hours}h</span>
                    <span style={{ color: '#7F8C8D', fontFamily: 'monospace' }}>§ {item.iso_clause}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* DPA gaps */}
      {sprint.dpa_gaps && sprint.dpa_gaps.length > 0 && (
        <div style={{
          padding: '12px 14px', borderRadius: 8, background: '#FDEDEC',
          border: '1px solid #F1948A'
        }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#922B21', marginBottom: 8 }}>
            🔴 Leverantörer utan DPA (tredjelandsöverföring)
          </div>
          {sprint.dpa_gaps.map((gap: any, i: number) => (
            <div key={i} style={{ fontSize: 12, color: '#922B21', padding: '2px 0' }}>
              • {gap.supplier_name}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Tab = 'sessions' | 'suppliers' | 'sprint'

export function TuvAuditView() {
  const [activeTab, setActiveTab] = useState<Tab>('sessions')
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)

  const { sessions, loading: sessionsLoading } = useTuvSessions()
  const { detail, loading: detailLoading } = useTuvSessionDetail(selectedSessionId)
  const { data: supplierData, loading: suppliersLoading } = useTuvSuppliers()
  const { sprint, loading: sprintLoading, checkedItems, toggleItem } = useTuvSprint()

  // Auto-select latest session
  useEffect(() => {
    if (sessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(sessions[0].session_id)
    }
  }, [sessions, selectedSessionId])

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'sessions', label: 'Audit Sessioner', icon: '🏛️' },
    { id: 'suppliers', label: 'Leverantörsaudit', icon: '🔍' },
    { id: 'sprint', label: 'Thailand Sprint', icon: '🇹🇭' },
  ]

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#2C3E50', maxWidth: 1400, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{
        background: 'linear-gradient(135deg, #0A3D62 0%, #154360 100%)',
        color: 'white', padding: '20px 24px', borderRadius: '12px 12px 0 0',
        display: 'flex', alignItems: 'center', gap: 16
      }}>
        <div style={{ fontSize: 36 }}>🇩🇪</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>
            TÜV RHEINLAND — Vollständige Systemprüfung
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
            Prüfer: Hans-Dieter Müller · ISO 9001:2015 + ISO 27001:2022 + GDPR + NIS2
          </div>
        </div>
        {sessions[0] && (
          <div style={{
            padding: '8px 14px', borderRadius: 8,
            background: sessions[0].final_verdict === 'READY' ? '#27AE60' :
                        sessions[0].final_verdict === 'CONDITIONAL' ? '#F39C12' : '#E74C3C',
            fontWeight: 800, fontSize: 13
          }}>
            {sessions[0]?.final_verdict || '—'}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, background: '#F5F0E8', borderBottom: '2px solid #E8E0D4' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 20px', border: 'none', cursor: 'pointer',
              background: activeTab === tab.id ? 'white' : 'transparent',
              color: activeTab === tab.id ? '#0A3D62' : '#7F8C8D',
              fontWeight: activeTab === tab.id ? 700 : 400,
              fontSize: 13, borderBottom: activeTab === tab.id ? '2px solid #0A3D62' : '2px solid transparent',
              marginBottom: -2, transition: 'all 0.15s ease'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ background: 'white', padding: 24, borderRadius: '0 0 12px 12px', border: '1px solid #E8E0D4', borderTop: 'none' }}>

        {/* Sessions tab */}
        {activeTab === 'sessions' && (
          <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, alignItems: 'start' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#7F8C8D', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Audit Sessioner
              </div>
              {sessionsLoading ? (
                <div style={{ color: '#95A5A6', fontSize: 13, padding: 20 }}>Laddar sessioner...</div>
              ) : sessions.length === 0 ? (
                <div style={{ color: '#95A5A6', fontSize: 13, padding: 20, textAlign: 'center' }}>
                  Inga audit-sessioner hittades.<br />Kör TÜV audit-scriptet för att starta.
                </div>
              ) : (
                <SessionList sessions={sessions} selectedId={selectedSessionId} onSelect={setSelectedSessionId} />
              )}
            </div>
            <div>
              {detailLoading ? (
                <div style={{ color: '#95A5A6', fontSize: 13, padding: 40, textAlign: 'center' }}>
                  Laddar sessiondetaljer...
                </div>
              ) : detail ? (
                <SessionDetail detail={detail} />
              ) : (
                <div style={{ color: '#95A5A6', fontSize: 13, padding: 40, textAlign: 'center' }}>
                  Välj en session för att se detaljer
                </div>
              )}
            </div>
          </div>
        )}

        {/* Suppliers tab */}
        {activeTab === 'suppliers' && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#7F8C8D', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Leverantörs-ISO-granskning · Art. 28 GDPR
            </div>
            {suppliersLoading ? (
              <div style={{ color: '#95A5A6', fontSize: 13, padding: 40, textAlign: 'center' }}>Laddar leverantörer...</div>
            ) : supplierData ? (
              <SupplierTable suppliers={supplierData.suppliers} summary={supplierData.summary} />
            ) : (
              <div style={{ color: '#E74C3C', fontSize: 13, padding: 20 }}>Kunde inte ladda leverantörsdata.</div>
            )}
          </div>
        )}

        {/* Sprint tab */}
        {activeTab === 'sprint' && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#7F8C8D', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Thailand Sprint-plan · 7 dagar till certifiering
            </div>
            {sprintLoading ? (
              <div style={{ color: '#95A5A6', fontSize: 13, padding: 40, textAlign: 'center' }}>Laddar sprint-plan...</div>
            ) : sprint ? (
              <SprintPlanView sprint={sprint} checkedItems={checkedItems} onToggle={toggleItem} />
            ) : (
              <div style={{ color: '#E74C3C', fontSize: 13, padding: 20 }}>Kunde inte ladda sprint-plan.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default TuvAuditView
