import { useState, useEffect } from 'react'
import { ModuleHeader, SectionIllustration } from '../../shared/illustrations/ModuleIllustration'

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
      <ModuleHeader
        route="/uapix"
        label="UAPIX"
        title="Unidentified Aerial Phenomena"
        description="Klassificerade observationer och rapporter"
        illustrationSize="md"
      />

      {!loading && !error && records.length === 0 && (
        <SectionIllustration route="/uapix" title="Inga observationer registrerade" description="Systemet övervakar och registrerar automatiskt" />
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
