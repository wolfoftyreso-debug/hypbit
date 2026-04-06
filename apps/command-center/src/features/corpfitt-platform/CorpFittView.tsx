import { useState, useEffect } from 'react'
import { ModuleHeader, SectionIllustration } from '../../shared/illustrations/ModuleIllustration'

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
      fetch('/api/corpfitt/leaderboard').then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))])
      .then(([c, l]) => { setChallenges(c.challenges ?? []); setLeaderboard(l.scores ?? []); setLoading(false) })
      .catch(e => { setError(String(e)); setLoading(false) })
  }, [])

  return { challenges, leaderboard, loading, error }
}

export default function CorpFittView() {
  const { challenges, leaderboard, loading, error } = useCorpFittData()

  return (
    <div>
      <ModuleHeader
        route="/corpfitt-platform"
        label="CorpFitt"
        title="Team Fitness"
        description="Hälsoutmaningar och teamprestation"
        illustrationSize="md"
      />

      {!loading && !error && challenges.length === 0 && (
        <SectionIllustration route="/corpfitt-platform" title="Inga aktiva utmaningar" description="Skapa en hälsoutmaning för teamet" />
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
