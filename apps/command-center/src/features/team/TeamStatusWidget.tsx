import { useState, useEffect } from 'react'

interface TeamMember { id: string; name: string; role: string; status: 'online' | 'away' | 'offline'; location?: string; currentTask?: string; avatar?: string }

function useTeamStatus() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    fetch('/api/team/status')
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(d => { setMembers(d.members ?? []); setLoading(false) })
      .catch(e => { setError(String(e)); setLoading(false) })
  }, [])
  return { members, loading, error }
}

const statusColor = { online: '#16a34a', away: '#d97706', offline: '#9ca3af' }
const statusLabel = { online: 'Online', away: 'Borta', offline: 'Offline' }

export default function TeamStatusWidget() {
  const { members, loading, error } = useTeamStatus()

  const online = members.filter(m => m.status === 'online').length

  return (
    <div>
      <div style={{ background: 'var(--color-brand)', borderRadius: 12, padding: '24px 28px', marginBottom: 24, color: 'var(--color-text-inverse)' }}>
        <div style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--color-accent)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 8 }}>Wavult Group</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>Team Status</h2>
        {!loading && !error && <p style={{ fontSize: 13, color: 'rgba(245,240,232,.6)', margin: 0 }}>{online} av {members.length} online</p>}
      </div>

      {loading && [1,2,3,4,5].map(i => (
        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-bg-muted)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ flex: 1 }}>
            <div style={{ width: 120, height: 14, background: 'var(--color-bg-muted)', borderRadius: 4, marginBottom: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ width: 80, height: 11, background: 'var(--color-bg-muted)', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
        </div>
      ))}

      {error && (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>Kunde inte hämta teamstatus</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{error}</div>
        </div>
      )}

      {!loading && !error && members.length === 0 && (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>Inga teammedlemmar</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Bjud in teamet för att se status här</div>
        </div>
      )}

      {!loading && !error && members.length > 0 && (
        <div>
          {members.map((m, i) => (
            <div key={m.id} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '14px 0', borderBottom: i < members.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                {m.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)' }}>{m.name}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{m.role}{m.location ? ` · ${m.location}` : ''}</div>
                {m.currentTask && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2, fontStyle: 'italic' }}>→ {m.currentTask}</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor[m.status] }} />
                <span style={{ fontSize: 11, color: statusColor[m.status], fontWeight: 600 }}>{statusLabel[m.status]}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
