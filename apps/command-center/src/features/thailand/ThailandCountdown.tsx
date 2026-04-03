import { useState, useEffect } from 'react'
import { ModuleHeader } from '../../shared/illustrations/ModuleIllustration'

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

function DigitBlock({ value, label }: { value: number; label: string }) {
  const [prev, setPrev] = useState(value)
  const [flip, setFlip] = useState(false)

  useEffect(() => {
    if (value !== prev) {
      setFlip(true)
      setTimeout(() => { setPrev(value); setFlip(false) }, 300)
    }
  }, [value, prev])

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 12,
      padding: '20px 16px',
      textAlign: 'center',
      flex: 1,
    }}>
      <div
        className={flip ? 'wv-digit-change' : ''}
        style={{ fontSize: 42, fontWeight: 800, color: 'var(--color-brand)', lineHeight: 1 }}
      >
        {String(value).padStart(2, '0')}
      </div>
      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 6, letterSpacing: '.12em', textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  )
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
      <div style={{ padding: 0 }}>
        <div className="wv-skeleton" style={{ height: 120, borderRadius: 12, marginBottom: 16 }} />
        <div style={{ display: 'flex', gap: 12 }}>
          {[1,2,3,4].map(i => <div key={i} className="wv-skeleton" style={{ flex: 1, height: 90, borderRadius: 12 }} />)}
        </div>
      </div>
    )
  }

  if (time.done) {
    return (
      <div className="wv-module-enter">
        <ModuleHeader
          route="/thailand"
          label="Thailand Workcamp"
          title="Vi är i Bangkok!"
          description="Workcamp pågår — bygg hårt, bygg rätt."
          illustrationSize="lg"
        />
      </div>
    )
  }

  return (
    <div className="wv-module-enter">
      <ModuleHeader
        route="/thailand"
        label="Thailand Workcamp"
        title="Bangkok · 11 april 2026"
        description="Nysa Hotel · Sukhumvit · Hela teamet"
        illustrationSize="lg"
      />

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <DigitBlock value={time.days}    label="Dagar" />
        <DigitBlock value={time.hours}   label="Timmar" />
        <DigitBlock value={time.minutes} label="Minuter" />
        <DigitBlock value={time.seconds} label="Sekunder" />
      </div>

      <div
        className="wv-card-enter wv-stagger-2"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderLeft: '4px solid var(--color-accent)',
          borderRadius: 10,
          padding: '14px 18px',
          fontSize: 13,
          color: 'var(--color-text-muted)',
        }}
      >
        📍 Nysa Hotel Bangkok · 73/7-8 Soi Sukhumvit 13 ·{' '}
        <strong style={{ color: 'var(--color-text-primary)' }}>{time.days} dagar kvar</strong>
      </div>
    </div>
  )
}
