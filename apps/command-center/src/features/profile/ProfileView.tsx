import React, { useEffect, useState } from 'react'
import { useAuth } from '../../shared/auth/AuthContext'
import { useRole } from '../../shared/auth/RoleContext'
import { SESSION_ID } from '../../shared/audit/useAuditLog'
import { useMyAnalytics, useTeamAnalytics } from '../../shared/audit/useTimeStudy'
import type { TeamMemberAnalytics } from '../../shared/audit/useTimeStudy'

const API = import.meta.env.VITE_API_URL ?? 'https://api.wavult.com'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditActionItem {
  type: string
  module: string
  label: string
  timestamp: string
  metadata?: Record<string, unknown>
}

interface AuditSession {
  id: string
  session_id: string
  user_id: string
  role: string
  started_at: string
  ended_at: string | null
  action_count: number
  summary: string
  actions: AuditActionItem[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, string> = {
  login:    '🔐',
  logout:   '👋',
  navigate: '→',
  view:     '👁',
  create:   '✨',
  update:   '✏️',
  delete:   '🗑',
  export:   '📤',
  archive:  '🗃️',
}

const MODULE_COLORS: Record<string, string> = {
  finance:    '#2D7A4F',
  corporate:  '#0A3D62',
  crm:        '#7A3B5A',
  git:        '#4A7A5B',
  compliance: '#B8760A',
  people:     '#2C6EA6',
  auth:       '#6B7280',
  dashboard:  '#4A4A6A',
  tasks:      '#5A6A4A',
  projects:   '#4A5A6A',
}

function getModuleColor(module: string): string {
  return MODULE_COLORS[module] ?? '#8B7355'
}

// ─── Summary generator ────────────────────────────────────────────────────────

function generateSummary(actions: AuditActionItem[]): string {
  const counts: Record<string, number> = {}
  const modules = new Set<string>()

  actions.forEach(a => {
    counts[a.type] = (counts[a.type] || 0) + 1
    if (a.module !== 'auth') modules.add(a.module)
  })

  const parts: string[] = []
  if (counts.navigate) parts.push(`Navigerade i ${modules.size} moduler`)
  if (counts.create) parts.push(`Skapade ${counts.create} poster`)
  if (counts.update) parts.push(`Uppdaterade ${counts.update} poster`)
  if (counts.archive) parts.push(`Arkiverade ${counts.archive} objekt`)
  if (counts.export) parts.push(`Exporterade ${counts.export} filer`)

  return parts.length ? parts.join(' · ') : 'Läste och granskade information'
}

// ─── Session Timeline ─────────────────────────────────────────────────────────

function SessionTimeline({ session, isActive }: { session: AuditSession; isActive: boolean }) {
  const [expanded, setExpanded] = useState(isActive)

  const startedAt = new Date(session.started_at)
  const summary = session.summary || generateSummary(session.actions)

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: `1px solid ${isActive ? '#C9A84C' : '#E8E3DA'}`,
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
        boxShadow: isActive ? '0 2px 12px rgba(201,168,76,0.15)' : '0 1px 4px rgba(0,0,0,0.05)',
      }}
    >
      {/* Session header */}
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          width: '100%',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {/* Active indicator */}
        {isActive && (
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#C9A84C',
              flexShrink: 0,
              boxShadow: '0 0 0 3px rgba(201,168,76,0.25)',
              animation: 'pulse 2s infinite',
            }}
          />
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E' }}>
              {startedAt.toLocaleDateString('sv-SE', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <span style={{ fontSize: 12, color: '#8A8278' }}>
              {startedAt.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {isActive && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 20,
                  background: '#FEF3C7',
                  color: '#92400E',
                  letterSpacing: '0.05em',
                }}
              >
                AKTIV
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: '#5A5550', margin: 0 }}>{summary}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span
            style={{
              fontSize: 11,
              color: '#8A8278',
              background: '#F5F0E8',
              padding: '3px 8px',
              borderRadius: 6,
            }}
          >
            {session.action_count || session.actions.length} händelser
          </span>
          <span style={{ fontSize: 14, color: '#8A8278', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            ▾
          </span>
        </div>
      </button>

      {/* Expanded timeline */}
      {expanded && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid #F0EBE2' }}>
          {session.actions.length === 0 ? (
            <p style={{ fontSize: 13, color: '#8A8278', padding: '16px 0', textAlign: 'center' }}>
              Ingen detaljerad aktivitet registrerad
            </p>
          ) : (
            <div style={{ paddingTop: 16 }}>
              {session.actions.map((action, idx) => {
                const isLeft = idx % 2 !== 0
                const color = getModuleColor(action.module)
                const icon = TYPE_ICONS[action.type] ?? '•'
                const time = new Date(action.timestamp).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })

                const CardContent = (
                  <div
                    style={{
                      background: '#F9F6F0',
                      border: '1px solid #E8E3DA',
                      borderRadius: 8,
                      padding: '10px 14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 14 }}>{icon}</span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: color,
                          color: '#FFFFFF',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {action.module}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: '#1A1A2E', margin: '0 0 4px', fontWeight: 500 }}>
                      {action.label}
                    </p>
                    <p style={{ fontSize: 11, color: '#8A8278', margin: 0 }}>{time}</p>
                  </div>
                )

                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 16,
                      marginBottom: 24,
                    }}
                  >
                    {/* Left slot */}
                    <div style={{ width: '42%', textAlign: 'right' }}>
                      {isLeft ? CardContent : null}
                    </div>

                    {/* Center dot + line */}
                    <div style={{ position: 'relative', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          background: color,
                          border: '2px solid #FFFFFF',
                          boxShadow: `0 0 0 2px ${color}40`,
                          zIndex: 1,
                        }}
                      />
                      {idx < session.actions.length - 1 && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 12,
                            left: '50%',
                            width: 1,
                            height: 'calc(100% + 24px)',
                            background: '#E8E3DA',
                            transform: 'translateX(-50%)',
                          }}
                        />
                      )}
                    </div>

                    {/* Right slot */}
                    <div style={{ width: '42%' }}>
                      {!isLeft ? CardContent : null}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── ProfileView ──────────────────────────────────────────────────────────────

// ─── Lean Analytics Section ───────────────────────────────────────────────────

function LeanAnalyticsSection({ userId, roleId }: { userId: string | undefined; roleId: string | undefined }) {
  const { data: analyticsData } = useMyAnalytics(userId)
  const { data: teamData } = useTeamAnalytics()

  const aggregate = analyticsData?.aggregate

  return (
    <>
      {/* Arbetsinsatsanalys */}
      <div style={{ marginTop: 32, marginBottom: 24 }}>
        <h2
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#8A8278',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            margin: '0 0 16px',
          }}
        >
          📊 Arbetsinsatsanalys — senaste 30 dagar
        </h2>

        {/* Score cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          {/* Sessionseffektivitet */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E8E3DA',
              borderRadius: 12,
              padding: 16,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 36, fontWeight: 700, color: '#0A3D62', lineHeight: 1 }}>
              {aggregate?.efficiency_score !== undefined ? `${aggregate.efficiency_score}%` : '—'}
            </div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }}>Sessionseffektivitet</div>
            <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>value-adding / total tid</div>
          </div>

          {/* Kaizen-index */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E8E3DA',
              borderRadius: 12,
              padding: 16,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 36, fontWeight: 700, color: '#E8B84B', lineHeight: 1 }}>
              {aggregate?.kaizen_score !== undefined ? aggregate.kaizen_score : '—'}
            </div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }}>Kaizen-index</div>
            <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>förbättringsåtgärder / totalt</div>
          </div>

          {/* Arbetsinsatspoäng */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E8E3DA',
              borderRadius: 12,
              padding: 16,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 36, fontWeight: 700, color: '#2D7A4F', lineHeight: 1 }}>
              {aggregate?.work_effort_score !== undefined ? aggregate.work_effort_score : '—'}
            </div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }}>Arbetsinsatspoäng</div>
            <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>sammansatt score</div>
          </div>
        </div>

        {/* Tid per modul */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E8E3DA',
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
          }}
        >
          <h3 style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Tid per modul
          </h3>
          {aggregate?.touch_time_by_module && Object.keys(aggregate.touch_time_by_module).length > 0 ? (
            Object.entries(aggregate.touch_time_by_module)
              .sort(([, a], [, b]) => b - a)
              .map(([module, ms]) => {
                const total = aggregate.total_time_ms ?? 1
                const pct = Math.round((ms / total) * 100)
                return (
                  <div key={module} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <span
                      style={{
                        fontSize: 12,
                        color: '#4B5563',
                        width: 96,
                        flexShrink: 0,
                        textTransform: 'capitalize',
                      }}
                    >
                      {module}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: 8,
                        background: '#F3F4F6',
                        borderRadius: 999,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          borderRadius: 999,
                          background: '#0A3D62',
                          width: `${pct}%`,
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#6B7280', width: 36, textAlign: 'right' }}>
                      {pct}%
                    </span>
                  </div>
                )
              })
          ) : (
            <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '12px 0', margin: 0 }}>
              Ingen moduldata tillgänglig ännu
            </p>
          )}
        </div>

        {/* Lean Waste-analys */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E8E3DA',
            borderRadius: 12,
            padding: 16,
          }}
        >
          <h3 style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Lean Waste-analys
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              { label: 'Motion', key: 'motion' as const, desc: 'Onödig navigering', color: '#F59E0B' },
              { label: 'Waiting', key: 'waiting' as const, desc: 'Idle-tid', color: '#EF4444' },
              { label: 'Overprocessing', key: 'overprocessing' as const, desc: 'Repeterade actions', color: '#8B5CF6' },
            ].map(w => (
              <div
                key={w.key}
                style={{
                  textAlign: 'center',
                  padding: 12,
                  borderRadius: 12,
                  border: '1px solid #E8E3DA',
                }}
              >
                <div style={{ fontSize: 24, fontWeight: 700, color: w.color }}>
                  {aggregate?.lean_waste_breakdown?.[w.key] !== undefined
                    ? `${aggregate.lean_waste_breakdown[w.key]}%`
                    : '0%'}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginTop: 4 }}>{w.label}</div>
                <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{w.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team-översikt (endast group-ceo och admin) */}
      {(roleId === 'group-ceo' || roleId === 'admin') && (
        <div style={{ marginBottom: 24 }}>
          <h2
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#8A8278',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              margin: '0 0 16px',
            }}
          >
            👥 Teamöversikt
          </h2>

          {teamData && teamData.length > 0 ? (
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E8E3DA',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              {/* Table header */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                  padding: '10px 16px',
                  background: '#F9F6F0',
                  borderBottom: '1px solid #E8E3DA',
                }}
              >
                {['Namn / Roll', 'Effektivitet', 'Kaizen', 'Waste Index', 'Arbetsinsats'].map(h => (
                  <span key={h} style={{ fontSize: 10, fontWeight: 700, color: '#8A8278', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </span>
                ))}
              </div>

              {/* Rows sorted by work_effort_score desc */}
              {[...teamData]
                .sort((a: TeamMemberAnalytics, b: TeamMemberAnalytics) => b.avg_work_effort - a.avg_work_effort)
                .map((member: TeamMemberAnalytics, idx: number) => (
                  <div
                    key={member.user_id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                      padding: '12px 16px',
                      borderBottom: idx < teamData.length - 1 ? '1px solid #F0EBE2' : 'none',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E' }}>{member.name}</div>
                      <div style={{ fontSize: 11, color: '#8A8278', marginTop: 1 }}>{member.role}</div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0A3D62' }}>
                      {member.avg_efficiency}%
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#E8B84B' }}>
                      {member.kaizen_score}
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: member.waste_index < 30 ? '#2D7A4F' : member.waste_index < 60 ? '#E8B84B' : '#EF4444',
                      }}
                    >
                      {member.waste_index}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#2D7A4F' }}>
                      {member.avg_work_effort}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E8E3DA',
                borderRadius: 12,
                padding: '32px 24px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E', margin: '0 0 6px' }}>
                Ingen teamdata tillgänglig
              </p>
              <p style={{ fontSize: 13, color: '#8A8278', margin: 0 }}>
                Teamanalysen visas här när API:et är anslutet och teammedlemmar har aktiva sessioner.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  )
}

// ─── ProfileView ──────────────────────────────────────────────────────────────

export function ProfileView() {
  const { user, getToken } = useAuth()
  const { effectiveRole } = useRole()
  const [sessions, setSessions] = useState<AuditSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSessions() {
      try {
        const token = await getToken().catch(() => 'bypass')
        const userId = user?.email ?? 'unknown'
        const res = await fetch(
          `${API}/api/audit/sessions?userId=${encodeURIComponent(userId)}&limit=20`,
          { headers: { Authorization: `Bearer ${token ?? 'bypass'}` } },
        )
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setSessions(Array.isArray(data) ? data : data.sessions ?? [])
      } catch (_err) {
        // API inte live ännu — visa tomt state, inga mockdata
        setSessions([])
        setError(null)
      } finally {
        setLoading(false)
      }
    }
    fetchSessions()
  }, [getToken, user])

  const initials = effectiveRole?.initials ?? 'ES'
  const name = effectiveRole?.name ?? user?.email ?? 'Okänd'
  const title = effectiveRole?.title ?? ''

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(201,168,76,0.25); }
          50% { box-shadow: 0 0 0 6px rgba(201,168,76,0.10); }
        }
      `}</style>

      {/* Profile header */}
      <div
        style={{
          background: '#1A1A2E',
          borderRadius: 16,
          padding: '32px 40px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: '#8B7355',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            fontWeight: 700,
            color: '#F5F0E8',
            flexShrink: 0,
            border: '3px solid rgba(201,168,76,0.4)',
          }}
        >
          {initials.charAt(0)}
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#F5F0E8', margin: '0 0 4px' }}>
            {name}
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(245,240,232,0.65)', margin: '0 0 8px' }}>{title}</p>
          <p style={{ fontSize: 12, color: 'rgba(245,240,232,0.4)', margin: 0, fontFamily: 'monospace' }}>
            {user?.email}
          </p>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <p style={{ fontSize: 10, color: 'rgba(245,240,232,0.4)', margin: '0 0 4px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Session ID
          </p>
          <p style={{ fontSize: 11, color: 'rgba(245,240,232,0.5)', margin: 0, fontFamily: 'monospace' }}>
            {SESSION_ID.slice(0, 18)}…
          </p>
        </div>
      </div>

      {/* Sessions history */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>
          Sessionshistorik
        </h2>
        {sessions.length > 0 && (
          <span style={{ fontSize: 12, color: '#8A8278' }}>
            {sessions.length} sessioner
          </span>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#8A8278' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '3px solid #E8E3DA',
              borderTopColor: '#C9A84C',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 12px',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <p style={{ fontSize: 14, margin: 0 }}>Hämtar historik…</p>
        </div>
      )}

      {!loading && error && (
        <div
          style={{
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: 8,
            padding: '16px 20px',
            color: '#991B1B',
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && sessions.length === 0 && (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E8E3DA',
            borderRadius: 12,
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#1A1A2E', marginBottom: 8 }}>
            Ingen historik tillgänglig ännu
          </p>
          <p style={{ fontSize: 14, color: '#8A8278', margin: 0 }}>
            Din aktivitet loggas under sessionen och visas här när API:et är anslutet.
          </p>
        </div>
      )}

      {!loading && sessions.map((session, idx) => (
        <SessionTimeline
          key={session.id ?? session.session_id}
          session={session}
          isActive={idx === 0 && !session.ended_at}
        />
      ))}

      {/* Lean/Kaizen Intelligence Layer */}
      <LeanAnalyticsSection
        userId={user?.email}
        roleId={effectiveRole?.id}
      />
    </div>
  )
}
