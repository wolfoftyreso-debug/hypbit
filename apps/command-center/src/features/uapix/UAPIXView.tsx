import { useState, useEffect } from 'react'

interface UAPIXRecord { id: string; designation: string; date: string; location: string; classification: string; confidence: number }

function useUAPIXData() {
  const [records, setRecords] = useState<UAPIXRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    fetch('/api/uapix/records')
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(d => { setRecords(d.records ?? []); setLoading(false) })
      .catch(e => { setError(String(e)); setLoading(false) })
  }, [])
  return { records, loading, error }
}

export default function UAPIXView() {
  const { records, loading, error } = useUAPIXData()

  return (
    <div>
      <div style={{ background: 'var(--color-brand)', borderRadius: 12, padding: '24px 28px', marginBottom: 24, color: 'var(--color-text-inverse)' }}>
        <div style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--color-accent)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 8 }}>UAPIX</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>Unidentified Aerial Phenomena</h2>
        <p style={{ fontSize: 13, color: 'rgba(245,240,232,.6)', margin: 0 }}>Klassificerade observationer och rapporter</p>
      </div>

      {loading && [1,2,3].map(i => <div key={i} style={{ background: 'var(--color-bg-muted)', borderRadius: 8, height: 60, marginBottom: 10, animation: 'pulse 1.5s ease-in-out infinite' }} />)}

      {error && (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>Data ej tillgänglig</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{error}</div>
        </div>
      )}

      {!loading && !error && records.length === 0 && (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '64px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🛸</div>
          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8, fontSize: 16 }}>Inga observationer registrerade</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Systemet övervakar och registrerar automatiskt</div>
        </div>
      )}

      {!loading && !error && records.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {records.map(r => (
            <div key={r.id} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '14px 18px', display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text-primary)' }}>{r.designation}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{r.location} · {r.date}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-brand)' }}>{r.classification}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{r.confidence}% konfidens</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
