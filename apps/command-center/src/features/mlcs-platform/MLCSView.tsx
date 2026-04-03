import { useState, useEffect } from 'react'
import { ModuleHeader, SectionIllustration } from '../../shared/illustrations/ModuleIllustration'

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
      <ModuleHeader
        route="/mlcs-platform"
        label="MLCS Platform"
        title="Machine Learning Control"
        description="Modell-prestanda och systemmått i realtid"
        illustrationSize="md"
      />

      {!loading && !error && metrics.length === 0 && (
        <SectionIllustration route="/mlcs-platform" title="Inga modeller aktiva" description="Koppla in en ML-modell för att se mätvärden här" />
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
