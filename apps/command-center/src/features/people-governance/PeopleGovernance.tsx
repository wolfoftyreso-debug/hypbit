// ─── People & Governance ─────────────────────────────────────────────────────
// DISC-profiler, hälsodata och teamöversikt

import { useState } from 'react'
import { DISC_PROFILES, HEALTH_DATA } from './pgData'
import { DISC_DESCRIPTIONS, type DISCType } from './pgTypes'

// ─── Team roster (mappar till DISC personId:s) ─────────────────────────────────

const PEOPLE = [
  { id: 'erik-svensson',    name: 'Erik Svensson',    initials: 'ES', role: 'Chairman & Group CEO',          color: '#8B5CF6' },
  { id: 'leon-russo',       name: 'Leon Russo',        initials: 'LR', role: 'CEO Wavult Operations',         color: '#F59E0B' },
  { id: 'dennis-bjarnemark',name: 'Dennis Bjarnemark', initials: 'DB', role: 'Board / Chief Legal',           color: '#10B981' },
  { id: 'winston-bjarnemark',name:'Winston Bjarnemark', initials: 'WB', role: 'CFO',                          color: '#3B82F6' },
  { id: 'johan-berglund',   name: 'Johan Berglund',    initials: 'JB', role: 'Group CTO',                     color: '#06B6D4' },
]

// ─── Icons (inline SVG — no lucide-react dependency issues) ───────────────────

function UsersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function BrainIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
  )
}

function ActivityIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}

// ─── DISC Card ─────────────────────────────────────────────────────────────────

function DISCCard({ profile }: { profile: typeof DISC_PROFILES[0] }) {
  const primary = DISC_DESCRIPTIONS[profile.primary]
  const secondary = profile.secondary ? DISC_DESCRIPTIONS[profile.secondary] : null

  return (
    <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 16px', border: '1px solid rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 18 }}>{primary.emoji}</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: primary.color }}>{primary.label}</div>
          {secondary && <div style={{ fontSize: 10, color: '#8E8E93' }}>+ {secondary.label}</div>}
        </div>
      </div>

      {/* Score bars */}
      {(['D', 'I', 'S', 'C'] as DISCType[]).map(type => {
        const d = DISC_DESCRIPTIONS[type]
        const score = profile.scores[type]
        return (
          <div key={type} style={{ marginBottom: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ fontSize: 9, fontWeight: 600, color: d.color }}>{type}</span>
              <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#8E8E93' }}>{score}</span>
            </div>
            <div style={{ height: 4, background: 'rgba(0,0,0,0.06)', borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${score}%`, background: d.color, borderRadius: 2, transition: 'width 0.5s ease' }} />
            </div>
          </div>
        )
      })}

      <div style={{ marginTop: 8, fontSize: 10, color: '#3C3C43CC', lineHeight: 1.5 }}>
        {profile.communicationStyle}
      </div>
    </div>
  )
}

// ─── Person Card (Teamöversikt) ────────────────────────────────────────────────

function PersonCard({ person }: { person: typeof PEOPLE[0] }) {
  const [expanded, setExpanded] = useState(false)
  const disc = DISC_PROFILES.find(d => d.personId === person.id)

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid rgba(0,0,0,0.08)',
      borderRadius: 14,
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: person.color + '22',
            border: `1px solid ${person.color}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: person.color, flexShrink: 0,
          }}>
            {person.initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1C1C1E' }}>{person.name}</div>
            <div style={{ fontSize: 11, color: person.color, fontWeight: 600, marginTop: 1 }}>{person.role}</div>
          </div>
          {disc && (
            <div style={{
              padding: '3px 8px', borderRadius: 20,
              background: DISC_DESCRIPTIONS[disc.primary].color + '18',
              border: `1px solid ${DISC_DESCRIPTIONS[disc.primary].color}30`,
              fontSize: 11, fontWeight: 700,
              color: DISC_DESCRIPTIONS[disc.primary].color,
            }}>
              {disc.primary}{disc.secondary ? `+${disc.secondary}` : ''}
            </div>
          )}
        </div>

        {/* Toggle */}
        <button
          onClick={() => setExpanded(s => !s)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 11, fontWeight: 500, color: expanded ? person.color : '#8E8E93',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          }}
        >
          <span style={{ fontSize: 9 }}>{expanded ? '▲' : '▼'}</span>
          {expanded ? 'Dölj DISC-profil' : 'Visa DISC-profil'}
        </button>
      </div>

      {/* Expanded DISC section */}
      {expanded && disc && (
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', padding: '16px 20px', background: '#FAFAFA' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8E8E93', marginBottom: 8 }}>
            DISC-profil
          </div>
          <DISCCard profile={disc} />
        </div>
      )}
    </div>
  )
}

// ─── Profiler Tab ──────────────────────────────────────────────────────────────

function ProfilerTab() {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1C1C1E', margin: 0 }}>Team DISC-profiler</h2>
        <p style={{ fontSize: 12, color: '#8E8E93', marginTop: 4 }}>
          Kommunikationsstilar, styrkor och teamroller för hela core-teamet.
        </p>
      </div>

      {/* DISC legend */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {(['D', 'I', 'S', 'C'] as DISCType[]).map(type => {
          const d = DISC_DESCRIPTIONS[type]
          return (
            <div key={type} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 20,
              background: d.color + '15', border: `1px solid ${d.color}30`,
            }}>
              <span style={{ fontSize: 13 }}>{d.emoji}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: d.color }}>{type} — {d.label}</span>
            </div>
          )
        })}
      </div>

      {/* Profile cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {DISC_PROFILES.map(profile => {
          const person = PEOPLE.find(p => p.id === profile.personId)
          const primary = DISC_DESCRIPTIONS[profile.primary]
          return (
            <div key={profile.personId} style={{
              background: '#FFFFFF',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: 14,
              padding: 20,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>
              {/* Person header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: primary.color + '20',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                }}>
                  {primary.emoji}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1C1C1E' }}>{person?.name || profile.personId}</div>
                  <div style={{ fontSize: 11, color: primary.color, fontWeight: 600 }}>
                    {primary.label}{profile.secondary ? ` + ${DISC_DESCRIPTIONS[profile.secondary].label}` : ''}
                  </div>
                </div>
              </div>

              {/* Score bars */}
              <div style={{ marginBottom: 14 }}>
                {(['D', 'I', 'S', 'C'] as DISCType[]).map(type => {
                  const d = DISC_DESCRIPTIONS[type]
                  const score = profile.scores[type]
                  return (
                    <div key={type} style={{ marginBottom: 5 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: d.color }}>{type} · {d.label}</span>
                        <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#8E8E93' }}>{score}</span>
                      </div>
                      <div style={{ height: 5, background: 'rgba(0,0,0,0.06)', borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${score}%`, background: d.color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Description */}
              <div style={{ fontSize: 12, color: '#3C3C43CC', lineHeight: 1.6, marginBottom: 12 }}>
                {profile.description}
              </div>

              {/* Strengths */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#8E8E93', marginBottom: 4, letterSpacing: '0.06em' }}>STYRKOR</div>
                {profile.strengths.map(s => (
                  <div key={s} style={{ fontSize: 11, color: '#1C1C1E', padding: '2px 0' }}>✓ {s}</div>
                ))}
              </div>

              {/* Challenges */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#8E8E93', marginBottom: 4, letterSpacing: '0.06em' }}>UTMANINGAR</div>
                {profile.challenges.map(c => (
                  <div key={c} style={{ fontSize: 11, color: '#8E8E93', padding: '2px 0' }}>△ {c}</div>
                ))}
              </div>

              {/* Team role */}
              <div style={{
                fontSize: 11, color: '#8E8E93', fontStyle: 'italic',
                borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 10, marginTop: 10,
              }}>
                <strong style={{ color: '#3C3C43CC' }}>Teamroll:</strong> {profile.teamRole}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Hälsa Tab ────────────────────────────────────────────────────────────────

function HalsaTab() {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1C1C1E', margin: 0 }}>Hälsodata & välmående</h2>
        <p style={{ fontSize: 12, color: '#8E8E93', marginTop: 4 }}>
          WHOOP-data och självrapporterade välmåendemätningar.
        </p>
      </div>

      {/* WHOOP connect CTA */}
      <div style={{
        background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
        borderRadius: 14, padding: 24, marginBottom: 20,
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 32 }}>⌚</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>WHOOP Integration</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Koppla WHOOP för automatisk recovery, sömn och strain-data</div>
          </div>
        </div>
        <a
          href="/whoop"
          style={{
            display: 'inline-block', padding: '8px 16px',
            background: '#00C6FF', borderRadius: 8,
            fontSize: 12, fontWeight: 600, color: '#000',
            textDecoration: 'none',
          }}
        >
          Öppna WHOOP Dashboard →
        </a>
      </div>

      {/* Self-reported data */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8E8E93', marginBottom: 12 }}>
          Självrapporterad data
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {HEALTH_DATA.map(snap => {
            const person = PEOPLE.find(p => p.id === snap.personId)
            return (
              <div key={snap.personId + snap.date} style={{
                background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 12, padding: 16,
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1C1C1E', marginBottom: 4 }}>
                  {person?.name || snap.personId}
                </div>
                <div style={{ fontSize: 10, color: '#8E8E93', marginBottom: 12 }}>{snap.date}</div>

                {snap.energyLevel !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: '#3C3C43CC' }}>⚡ Energi</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#FF9500' }}>{snap.energyLevel}/5</span>
                  </div>
                )}
                {snap.stressLevel !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: '#3C3C43CC' }}>🔥 Stress</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#FF3B30' }}>{snap.stressLevel}/5</span>
                  </div>
                )}
                {snap.motivationLevel !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: '#3C3C43CC' }}>🎯 Motivation</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#34C759' }}>{snap.motivationLevel}/5</span>
                  </div>
                )}

                {snap.note && (
                  <div style={{
                    marginTop: 10, fontSize: 10, color: '#8E8E93', fontStyle: 'italic',
                    borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 8,
                  }}>
                    {snap.note}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

type Tab = 'Teamöversikt' | 'OKR' | 'Möten' | 'Profiler' | 'Hälsa'

const TABS: { id: Tab; icon: React.ReactNode }[] = [
  { id: 'Teamöversikt', icon: <UsersIcon /> },
  { id: 'Profiler',     icon: <BrainIcon /> },
  { id: 'Hälsa',        icon: <ActivityIcon /> },
]

export function PeopleGovernance() {
  const [activeTab, setActiveTab] = useState<Tab>('Teamöversikt')

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1C1C1E', margin: 0 }}>People & Governance</h1>
        <p style={{ fontSize: 13, color: '#8E8E93', marginTop: 4 }}>
          Team, DISC-profiler, OKR:s och hälsodata för Wavult Group core-team.
        </p>
      </div>

      {/* Tab nav */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 24,
        borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: 0,
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px',
              fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? '#007AFF' : '#8E8E93',
              background: 'none', border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #007AFF' : '2px solid transparent',
              cursor: 'pointer', marginBottom: -1,
              transition: 'color 0.15s',
            }}
          >
            {tab.icon}
            {tab.id}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'Teamöversikt' && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1C1C1E', margin: 0 }}>Core Team</h2>
            <p style={{ fontSize: 12, color: '#8E8E93', marginTop: 4 }}>
              {PEOPLE.length} teammedlemmar — klicka på ett kort för att se DISC-profil.
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Teamstorlek', value: String(PEOPLE.length), color: '#007AFF' },
              { label: 'DISC-profiler', value: String(DISC_PROFILES.length), color: '#34C759' },
              { label: 'Hälsosnaps', value: String(HEALTH_DATA.length), color: '#FF9500' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 12, padding: '14px 18px',
              }}>
                <div style={{ fontSize: 11, color: '#8E8E93', marginBottom: 4 }}>{stat.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: stat.color, fontVariantNumeric: 'tabular-nums' }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Person cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {PEOPLE.map(person => (
              <PersonCard key={person.id} person={person} />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Profiler' && <ProfilerTab />}

      {activeTab === 'Hälsa' && <HalsaTab />}
    </div>
  )
}
