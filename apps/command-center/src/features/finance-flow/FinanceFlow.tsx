import { useState, useEffect } from 'react'

interface FlowItem { id: string; description: string; amount: number; currency: string; type: 'in' | 'out'; date: string; status: 'completed' | 'pending' | 'failed' }

function useFinanceFlow() {
  const [items, setItems] = useState<FlowItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    fetch('/api/finance/flow')
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(d => { setItems(d.items ?? []); setLoading(false) })
      .catch(e => { setError(String(e)); setLoading(false) })
  }, [])
  return { items, loading, error }
}

export default function FinanceFlow() {
  const { items, loading, error } = useFinanceFlow()

  const totalIn = items.filter(i => i.type === 'in' && i.status === 'completed').reduce((s, i) => s + i.amount, 0)
  const totalOut = items.filter(i => i.type === 'out' && i.status === 'completed').reduce((s, i) => s + i.amount, 0)

  return (
    <div>
      <div style={{ background: 'var(--color-brand)', borderRadius: 12, padding: '24px 28px', marginBottom: 24, color: 'var(--color-text-inverse)' }}>
        <div style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--color-accent)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 8 }}>Finance</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>Kapitalflöde</h2>
        <p style={{ fontSize: 13, color: 'rgba(245,240,232,.6)', margin: 0 }}>In- och utbetalningar i realtid</p>
      </div>

      {loading && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            {[1, 2].map(i => <div key={i} style={{ flex: 1, background: 'var(--color-bg-muted)', borderRadius: 10, height: 72, animation: 'pulse 1.5s ease-in-out infinite' }} />)}
          </div>
          {[1,2,3,4].map(i => <div key={i} style={{ background: 'var(--color-bg-muted)', borderRadius: 8, height: 52, marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />)}
        </div>
      )}

      {error && (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>Kunde inte hämta kapitalflöde</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{error}</div>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>💰</div>
          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>Inga transaktioner ännu</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Kapitalflödet visas här när transaktioner är kopplade</div>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '16px 20px' }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 6 }}>Totalt in</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a' }}>+{totalIn.toLocaleString('sv-SE')} kr</div>
            </div>
            <div style={{ flex: 1, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '16px 20px' }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 6 }}>Totalt ut</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-brand)' }}>-{totalOut.toLocaleString('sv-SE')} kr</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map(item => (
              <div key={item.id} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 18 }}>{item.type === 'in' ? '↓' : '↑'}</span>
                <span style={{ flex: 1, fontSize: 13, color: 'var(--color-text-primary)' }}>{item.description}</span>
                <span style={{ fontWeight: 700, fontSize: 14, color: item.type === 'in' ? '#16a34a' : 'var(--color-brand)' }}>
                  {item.type === 'in' ? '+' : '-'}{item.amount.toLocaleString('sv-SE')} {item.currency}
                </span>
                <span style={{ fontSize: 11, color: item.status === 'pending' ? 'var(--color-warning)' : item.status === 'failed' ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
