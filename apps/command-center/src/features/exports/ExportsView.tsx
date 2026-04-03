import { useState, useEffect } from 'react'

interface ExportJob { id: string; name: string; type: string; status: 'ready' | 'processing' | 'failed'; createdAt: string; downloadUrl?: string }

function useExports() {
  const [jobs, setJobs] = useState<ExportJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    fetch('/api/exports')
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(d => { setJobs(d.jobs ?? []); setLoading(false) })
      .catch(e => { setError(String(e)); setLoading(false) })
  }, [])
  return { jobs, loading, error }
}

const typeIcon: Record<string, string> = { csv: '📊', pdf: '📄', json: '🗂️', xlsx: '📈' }

export default function ExportsView() {
  const { jobs, loading, error } = useExports()
  const [creating, setCreating] = useState(false)

  const createExport = async (type: string) => {
    setCreating(true)
    try {
      await fetch('/api/exports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type }) })
    } finally { setCreating(false) }
  }

  return (
    <div>
      <div style={{ background: 'var(--color-brand)', borderRadius: 12, padding: '24px 28px', marginBottom: 24, color: 'var(--color-text-inverse)' }}>
        <div style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--color-accent)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 8 }}>Wavult OS</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>Exporter</h2>
        <p style={{ fontSize: 13, color: 'rgba(245,240,232,.6)', margin: 0 }}>Generera och ladda ned dataexporter</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {['csv', 'pdf', 'json', 'xlsx'].map(type => (
          <button key={type} onClick={() => createExport(type)} disabled={creating}
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 6, opacity: creating ? 0.5 : 1 }}>
            {typeIcon[type]} {type.toUpperCase()}
          </button>
        ))}
      </div>

      {loading && [1,2,3].map(i => <div key={i} style={{ background: 'var(--color-bg-muted)', borderRadius: 8, height: 56, marginBottom: 10, animation: 'pulse 1.5s ease-in-out infinite' }} />)}

      {error && (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>Kunde inte hämta exporter</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{error}</div>
        </div>
      )}

      {!loading && !error && jobs.length === 0 && (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📦</div>
          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>Inga exporter ännu</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Skapa din första export med knapparna ovan</div>
        </div>
      )}

      {!loading && !error && jobs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {jobs.map(job => (
            <div key={job.id} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 20 }}>{typeIcon[job.type] ?? '📄'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{job.name}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{new Date(job.createdAt).toLocaleString('sv-SE')}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: job.status === 'ready' ? '#16a34a' : job.status === 'failed' ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                {job.status === 'ready' ? '● Klar' : job.status === 'processing' ? '○ Bearbetar...' : '✕ Misslyckades'}
              </span>
              {job.status === 'ready' && job.downloadUrl && (
                <a href={job.downloadUrl} style={{ background: 'var(--color-brand)', color: '#fff', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Ladda ned</a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
