import { useState, useEffect } from 'react'
import { ModuleHeader } from '../../shared/illustrations/ModuleIllustration'

interface ApiRoute { method: string; path: string; description: string; status: 'live' | 'draft' }

function useApiflyRoutes() {
  const [routes, setRoutes] = useState<ApiRoute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/apifly/routes')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(d => { setRoutes(d.routes ?? []); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  return { routes, loading, error }
}

const methodColor: Record<string, string> = {
  GET: '#16a34a', POST: '#2563eb', PUT: '#d97706', DELETE: '#dc2626', PATCH: '#7c3aed',
}

export default function ApiflyView() {
  const { routes, loading, error } = useApiflyRoutes()

  return (
    <div>
      <ModuleHeader
        route="/apifly"
        label="Apifly"
        title="API Gateway"
        description="Hantera och övervaka alla API-rutter"
        illustrationSize="md"
      />
      )}

      {!loading && !error && routes.length === 0 && (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔌</div>
          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>Inga rutter konfigurerade</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Lägg till din första API-rutt för att komma igång</div>
        </div>
      )}

      {!loading && !error && routes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {routes.map((r, i) => (
            <div key={i} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ background: methodColor[r.method] ?? '#666', color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700, fontFamily: 'monospace', minWidth: 52, textAlign: 'center' }}>{r.method}</span>
              <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--color-text-primary)', flex: 1 }}>{r.path}</span>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{r.description}</span>
              <span style={{ fontSize: 11, color: r.status === 'live' ? '#16a34a' : 'var(--color-text-muted)', fontWeight: 600 }}>{r.status === 'live' ? '● Live' : '○ Draft'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
