import { useState, useEffect } from 'react'
import { ModuleHeader, SectionIllustration } from '../../shared/illustrations/ModuleIllustration'

interface DISSGNode { id: string; name: string; type: string; status: 'active' | 'inactive' | 'processing'; signalStrength: number }

function useDISSGData() {
  const [nodes, setNodes] = useState<DISSGNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    fetch('/api/dissg/nodes')
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(d => { setNodes(d.nodes ?? []); setLoading(false) })
      .catch(e => { setError(String(e)); setLoading(false) })
  }, [])
  return { nodes, loading, error }
}

export default function DISSGView() {
  const { nodes, loading, error } = useDISSGData()

  return (
    <div className="wv-module-enter">
      <ModuleHeader
        route="/dissg"
        label="DISSG Platform"
        title="Distributed Signal Intelligence"
        description="Distributed intelligence and signal processing platform"
        illustrationSize="md"
      />

      {loading && [1,2,3].map(i => (
        <div key={i} className="wv-skeleton" style={{ height: 60, marginBottom: 10, borderRadius: 8 }} />
      ))}

      {error && (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>DISSG backend ej tillgänglig</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{error}</div>
        </div>
      )}

      {!loading && !error && nodes.length === 0 && (
        <SectionIllustration route="/dissg" title="Inga noder aktiva" description="DISSG-plattformen är under uppbyggnad. Noder visas här när systemet är aktivt." />
      )}

      {!loading && !error && nodes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {nodes.map((n, i) => (
            <div key={n.id} className={`wv-list-item-enter wv-stagger-${Math.min(i+1,6)}`} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className={`wv-live-dot${n.status !== 'active' ? ' warning' : ''}`} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text-primary)' }}>{n.name}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{n.type}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-brand)' }}>{n.signalStrength}%</div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{n.status}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
