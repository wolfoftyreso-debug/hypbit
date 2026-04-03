import { useState, useEffect } from 'react'

interface FitnessChallenge { id: string; title: string; participants: number; daysLeft: number; category: string; status: 'active' | 'upcoming' | 'completed' }
interface TeamFitnessScore { memberId: string; name: string; score: number; rank: number; streak: number }

function useCorpFittData() {
  const [challenges, setChallenges] = useState<FitnessChallenge[]>([])
  const [leaderboard, setLeaderboard] = useState<TeamFitnessScore[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/corpfitt/challenges').then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`)),
      fetch('/api/corpfitt/leaderboard').then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`)),
    ])
      .then(([c, l]) => { setChallenges(c.challenges ?? []); setLeaderboard(l.scores ?? []); setLoading(false) })
      .catch(e => { setError(String(e)); setLoading(false) })
  }, [])

  return { challenges, leaderboard, loading, error }
}

export default function CorpFittView() {
  const { challenges, leaderboard, loading, error } = useCorpFittData()

  return (
    <div>
      <div style={{ background: 'var(--color-brand)', borderRadius: 12, padding: '24px 28px', marginBottom: 24, color: 'var(--color-text-inverse)' }}>
        <div style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--color-accent)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 8 }}>CorpFitt</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>Team Fitness</h2>
        <p style={{ fontSize: 13, color: 'rgba(245,240,232,.6)', margin: 0 }}>Hälsoutmaningar och teamprestation</p>
      </div>

      {loading && (
        <div>
          {[1,2,3].map(i => <div key={i} style={{ background: 'var(--color-bg-muted)', borderRadius: 10, height: 70, marginBottom: 10, animation: 'pulse 1.5s ease-in-out infinite' }} />)}
        </div>
      )}

      {error && (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>Fitness-data ej tillgänglig</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{error}</div>
        </div>
      )}

      {!loading && !error && challenges.length === 0 && (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '64px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>💪</div>
          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8, fontSize: 16 }}>Inga aktiva utmaningar</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Skapa en hälsoutmaning för teamet</div>
        </div>
      )}

      {!loading && !error && challenges.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 12 }}>Aktiva utmaningar</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {challenges.filter(c => c.status === 'active').map(c => (
              <div key={c.id} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-accent)', borderRadius: 10, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)' }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{c.participants} deltagare · {c.category}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-accent)' }}>{c.daysLeft}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>dagar kvar</div>
                </div>
              </div>
            ))}
          </div>

          {leaderboard.length > 0 && (
            <>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 12 }}>Topplista</div>
              {leaderboard.slice(0, 5).map(m => (
                <div key={m.memberId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: m.rank <= 3 ? 'var(--color-accent)' : 'var(--color-bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: m.rank <= 3 ? 'var(--color-brand)' : 'var(--color-text-muted)' }}>{m.rank}</div>
                  <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{m.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-brand)' }}>{m.score} pts</span>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>🔥 {m.streak}d</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
