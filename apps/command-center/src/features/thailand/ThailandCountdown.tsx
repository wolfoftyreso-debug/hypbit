import { useState, useEffect } from 'react'

const TARGET = new Date('2026-04-11T00:00:00+07:00')

function getTimeLeft() {
  const now = new Date()
  const diff = TARGET.getTime() - now.getTime()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    done: false,
  }
}

const unit: React.CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 12,
  padding: '20px 16px',
  textAlign: 'center',
  minWidth: 80,
  flex: 1,
}

export function ThailandCountdown() {
  const [time, setTime] = useState(getTimeLeft())
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(true)
    const id = setInterval(() => setTime(getTimeLeft()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!loaded) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ background: 'var(--color-bg-muted)', borderRadius: 12, height: 140, animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
    )
  }

  if (time.done) {
    return (
      <div style={{ background: 'var(--color-brand)', borderRadius: 12, padding: '32px 24px', textAlign: 'center', color: 'var(--color-text-inverse)' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🇹🇭</div>
        <div style={{ fontSize: 24, fontWeight: 800 }}>Vi är i Bangkok!</div>
        <div style={{ fontSize: 13, color: 'rgba(245,240,232,.6)', marginTop: 8 }}>Workcamp pågår — bygg hårt, bygg rätt.</div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ background: 'var(--color-brand)', borderRadius: 12, padding: '24px 28px', marginBottom: 20, color: 'var(--color-text-inverse)' }}>
        <div style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--color-accent)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 8 }}>Thailand Workcamp</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>Bangkok · 11 april 2026</h2>
        <p style={{ fontSize: 13, color: 'rgba(245,240,232,.6)', margin: 0 }}>Nysa Hotel · Sukhumvit · Hela teamet</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Dagar', value: time.days },
          { label: 'Timmar', value: time.hours },
          { label: 'Minuter', value: time.minutes },
          { label: 'Sekunder', value: time.seconds },
        ].map(({ label, value }) => (
          <div key={label} style={unit}>
            <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--color-brand)', lineHeight: 1 }}>{String(value).padStart(2, '0')}</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 6, letterSpacing: '.1em', textTransform: 'uppercase' }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '14px 18px', fontSize: 13, color: 'var(--color-text-muted)' }}>
        📍 Nysa Hotel Bangkok · 73/7-8 Soi Sukhumvit 13 · <strong style={{ color: 'var(--color-text-primary)' }}>{time.days} dagar kvar</strong>
      </div>
    </div>
  )
}
