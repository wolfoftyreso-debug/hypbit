import { useState, useEffect } from 'react'
import { ModuleHeader, SectionIllustration } from '../../shared/illustrations/ModuleIllustration'

interface Signal { id: string; title: string; summary: string; category: string; confidence: number; timestamp: string; source: string }

function useIntelligence() {
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    fetch('/api/intelligence/signals')
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(d => { setSignals(d.signals ?? []); setLoading(false) })
      .catch(e => { setError(String(e)); setLoading(false) })
  }, [])
  return { signals, loading, error }
}

const categoryColor: Record<string, string> = {
  market: '#2563eb', security: '#dc2626', competitor: '#d97706',
  opportunity: '#16a34a', risk: '#7c3aed',
}

export default function IntelligenceView() {
  const { signals, loading, error } = useIntelligence()

  return (
    <div className="wv-module-enter">
      <ModuleHeader
        route="/intelligence"
        label="Wavult Intelligence"
        title="System Intelligence"
        description="Signaler, mönster och insikter från hela systemet"
        illustrationSize="md"
      />

      {loading && [1,2,3].map(i => (
        <div key={i} className="wv-skeleton" style={{ height: 80, marginBottom: 10, borderRadius: 10 }} />
      ))}

      {error && (
        <div className="wv-card-enter" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>Signaler ej tillgängliga</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{error}</div>
        </div>
      )}

      {!loading && !error && signals.length === 0 && (
        <SectionIllustration route="/intelligence" title="Inga signaler detekterade" description="Systemet analyserar kontinuerligt och rapporterar insikter här när de uppstår" />
      )}

      {!loading && !error && signals.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {signals.map((s, i) => (
            <div
              key={s.id}
              className={`wv-list-item-enter wv-stagger-${Math.min(i + 1, 6)}`}
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '18px 20px', borderLeft: `4px solid ${categoryColor[s.category] ?? 'var(--color-accent)'}` }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)', marginBottom: 6 }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{s.summary}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div className="wv-count-up" style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-brand)' }}>{s.confidence}%</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>konfidens</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10, alignItems: 'center' }}>
                <span style={{ background: categoryColor[s.category] ?? 'var(--color-accent)', color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{s.category}</span>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{s.source}</span>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>{new Date(s.timestamp).toLocaleString('sv-SE')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
