import { useState, useEffect } from 'react'

interface MLCSMetric { id: string; name: string; value: number; unit: string; trend: 'up' | 'down' | 'stable'; status: 'healthy' | 'warning' | 'critical' }

function useMLCSData() {
  const [metrics, setMetrics] = useState<MLCSMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    fetch('/api/mlcs/metrics')
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(d => { setMetrics(d.metrics ?? []); setLoading(false) })
      .catch(e => { setError(String(e)); setLoading(false) })
  }, [])
  return { metrics, loading, error }
}

export default function MLCSView() {
  const { metrics, loading, error } = useMLCSData()

  return (
    <div>
      <div style={{ background: 'var(--color-brand)', borderRadius: 12, padding: '24px 28px', marginBottom: 24, color: 'var(--color-text-inverse)' }}>
        <div style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--color-accent)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 8 }}>MLCS Platform</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>Machine Learning Control System</h2>
        <p style={{ fontSize: 13, color: 'rgba(245,240,232,.6)', margin: 0 }}>Modell-prestanda och systemmått i realtid</p>
      </div>

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 12 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ background: 'var(--color-bg-muted)', borderRadius: 10, height: 90, animation: 'pulse 1.5s ease-in-out infinite' }} />)}
        </div>
      )}

      {error && (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>MLCS-data ej tillgänglig</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{error}</div>
        </div>
      )}

      {!loading && !error && metrics.length === 0 && (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '64px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🤖</div>
          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8, fontSize: 16 }}>Inga modeller aktiva</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Koppla in en ML-modell för att se mätvärden här</div>
        </div>
      )}

      {!loading && !error && metrics.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 12 }}>
          {metrics.map(m => (
            <div key={m.id} style={{ background: 'var(--color-surface)', border: `1px solid ${m.status === 'critical' ? 'var(--color-danger)' : m.status === 'warning' ? 'var(--color-warning)' : 'var(--color-border)'}`, borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>{m.name}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-brand)' }}>{m.value}<span style={{ fontSize: 13, fontWeight: 400, marginLeft: 4 }}>{m.unit}</span></div>
              <div style={{ fontSize: 11, marginTop: 6, color: m.trend === 'up' ? '#16a34a' : m.trend === 'down' ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
                {m.trend === 'up' ? '↑' : m.trend === 'down' ? '↓' : '→'} {m.status}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
