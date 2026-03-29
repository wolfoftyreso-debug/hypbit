import { useState } from 'react'
import { useEntityScope } from '../../shared/scope/EntityScopeContext'
import { TransactionDetail } from './TransactionDetail'

const DEMO_TX_LIST = [
  { id: 'kund-faktura-1042', title: 'Kund-faktura #1042 — konsulttjänster', date: '2026-03-24', amount: 125000, currency: 'SEK', status: 'approved', category: 'Intäkt' },
  { id: 'loneutbetalning',   title: 'Löneutbetalning mars',                 date: '2026-03-26', amount: -160000, currency: 'SEK', status: 'paid',     category: 'Lön' },
]

const STATUS_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  pending:   { color: '#FF9500', bg: '#FF950015', label: 'Väntar' },
  approved:  { color: '#34C759', bg: '#34C75915', label: 'Godkänd' },
  paid:      { color: '#007AFF', bg: '#007AFF15', label: 'Betald' },
  overdue:   { color: '#FF3B30', bg: '#FF3B3015', label: 'Förfallen' },
  cancelled: { color: '#8E8E93', bg: '#8E8E9315', label: 'Annullerad' },
}

export function TransactionFeed() {
  const { activeEntity } = useEntityScope()
  const isRoot = activeEntity.layer === 0
  const [selectedTx, setSelectedTx] = useState<string | null>(null)

  const ledgerLabel = isRoot
    ? 'Group-wide ledger'
    : `Showing ledger for ${activeEntity.name}`

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-500 mt-1">{ledgerLabel}</p>
        {/* Scope banner */}
        {!isRoot && (
          <div
            className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{
              background: activeEntity.color + '15',
              border: `1px solid ${activeEntity.color}30`,
              color: activeEntity.color,
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: activeEntity.color }} />
            {activeEntity.name}
          </div>
        )}
      </div>

      {/* Transaction list */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="grid grid-cols-12 px-4 py-2 text-[9px] font-mono text-gray-500 uppercase tracking-wider border-b border-gray-200">
          <span className="col-span-5">Transaktion</span>
          <span className="col-span-2">Datum</span>
          <span className="col-span-2 text-right">Belopp</span>
          <span className="col-span-2">Kategori</span>
          <span className="col-span-1">Status</span>
        </div>
        {DEMO_TX_LIST.map(tx => {
          const st = STATUS_STYLES[tx.status]
          const isIncome = tx.amount > 0
          return (
            <div
              key={tx.id}
              onClick={() => setSelectedTx(tx.id)}
              className="grid grid-cols-12 px-4 py-3 items-center border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <span className="col-span-5 text-xs text-gray-900 font-medium truncate pr-2">{tx.title}</span>
              <span className="col-span-2 text-xs font-mono text-gray-500">{tx.date}</span>
              <span className="col-span-2 text-right text-xs font-mono font-semibold" style={{ color: isIncome ? '#34C759' : '#FF3B30' }}>
                {isIncome ? '+' : ''}{(tx.amount / 1000).toFixed(0)}k {tx.currency}
              </span>
              <span className="col-span-2 text-xs text-gray-500">{tx.category}</span>
              <span className="col-span-1">
                <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{ color: st.color, background: st.bg }}>
                  {st.label}
                </span>
              </span>
            </div>
          )
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
        <div className="text-3xl mb-3">↕</div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Full Ledger Core — Rullar ut i v2.1 (Q2 2026)</h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          Multi-entity, multi-currency transaction engine med intercompany clearing.
        </p>
        <div className="mt-4 flex gap-3 justify-center">
          <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs rounded-full">SEK · EUR · USD · AED</span>
          <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 text-xs rounded-full">TX ↔ LT ↔ DIFC</span>
        </div>
      </div>

      {/* Transaction detail panel */}
      {selectedTx && (
        <TransactionDetail
          transactionId={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </div>
  )
}
