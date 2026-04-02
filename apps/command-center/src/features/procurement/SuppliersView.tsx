import { useState } from 'react'
import { useSuppliers } from './hooks/useProcurement'
import { SupplierCategory, SupplierStatus } from './types'
import { useTranslation } from '../../shared/i18n/useTranslation'

const CATEGORY_COLORS: Record<SupplierCategory, string> = {
  'Tech/SaaS':      '#6366f1',
  'Juridik':        '#f59e0b',
  'Redovisning':    '#10b981',
  'Infrastruktur':  '#3b82f6',
  'Marknadsföring': '#ec4899',
}

const STATUS_BADGE: Record<SupplierStatus, { label: string; color: string; bg: string }> = {
  aktiv:   { label: 'Aktiv',   color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  inaktiv: { label: 'Inaktiv', color: '#9CA3AF', bg: 'rgba(107,114,128,0.12)' },
}

const ALL_CATEGORIES: Array<SupplierCategory | 'Alla'> = [
  'Alla', 'Tech/SaaS', 'Juridik', 'Redovisning', 'Infrastruktur', 'Marknadsföring',
]

// Hjälpare: formatera SEK-belopp
function fmtSEK(amount: number): string {
  if (amount === 0) return '–'
  if (amount >= 1000) return (amount / 1000).toFixed(1).replace('.0', '') + 'k'
  return amount.toFixed(0)
}

function fmtSEKFull(amount: number): string {
  if (amount === 0) return '–'
  return amount.toLocaleString('sv-SE') + ' kr'
}

// Beräkna periodsummor
function calcCosts(avgMonthly: number) {
  return {
    daily:    avgMonthly / 30,
    weekly:   avgMonthly / 4.33,
    monthly:  avgMonthly,
    yearly:   avgMonthly * 12,
    ytd:      avgMonthly * new Date().getMonth(), // månader hittills i år
  }
}

export function SuppliersView() {
  const { suppliers: SUPPLIERS } = useSuppliers()
  const { t: _t } = useTranslation()
  const [filterCategory, setFilterCategory] = useState<SupplierCategory | 'Alla'>('Alla')
  const [filterStatus, setFilterStatus] = useState<SupplierStatus | 'Alla'>('Alla')
  const [search, setSearch] = useState('')

  const filtered = SUPPLIERS.filter(s => {
    if (filterCategory !== 'Alla' && s.category !== filterCategory) return false
    if (filterStatus !== 'Alla' && s.status !== filterStatus) return false
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // Summera totaler
  const totals = filtered.reduce((acc, s) => {
    const avg = s.cost?.avgMonthlySEK ?? 0
    acc.monthly += avg
    acc.yearly  += avg * 12
    acc.ytd     += avg * new Date().getMonth()
    return acc
  }, { monthly: 0, yearly: 0, ytd: 0 })

  return (
    <div className="flex flex-col h-full">

      {/* Kostnadsöversikt — top summary */}
      <div className="flex gap-3 px-4 md:px-6 pt-4 pb-2 flex-wrap">
        {[
          { label: 'Per dag',     value: fmtSEKFull(totals.monthly / 30) },
          { label: 'Per vecka',   value: fmtSEKFull(totals.monthly / 4.33) },
          { label: 'Per månad',   value: fmtSEKFull(totals.monthly) },
          { label: 'Årsackum.',   value: fmtSEKFull(totals.ytd) },
          { label: 'Helår (est)', value: fmtSEKFull(totals.yearly) },
        ].map(({ label, value }) => (
          <div key={label} className="flex-1 min-w-[100px] bg-muted/40 border border-surface-border rounded-xl px-3 py-2.5">
            <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-1">{label}</div>
            <div className="text-sm font-semibold text-text-primary">{value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-surface-border flex-shrink-0 flex-wrap">
        <input
          type="text"
          placeholder="Sök leverantör…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-muted/30 border border-surface-border rounded-lg px-3 py-1.5 text-xs text-text-primary placeholder-gray-600 focus:outline-none focus:border-gray-300 w-44"
        />

        <div className="flex gap-1 flex-wrap">
          {ALL_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat as SupplierCategory | 'Alla')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterCategory === cat
                  ? 'bg-muted text-gray-900'
                  : 'text-gray-500 hover:text-gray-600'
              }`}
            >
              {cat !== 'Alla' && (
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full mr-1.5"
                  style={{ background: CATEGORY_COLORS[cat as SupplierCategory] }}
                />
              )}
              {cat}
            </button>
          ))}
        </div>

        <div className="flex gap-1 ml-auto">
          {(['Alla', 'aktiv', 'inaktiv'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s as SupplierStatus | 'Alla')}
              className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                filterStatus === s ? 'bg-muted text-gray-900' : 'text-gray-500 hover:text-gray-600'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-4 md:px-6 py-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="text-left border-b border-surface-border">
                {['Leverantör', 'Kategori', 'Land', 'Kontakt', 'Per dag', 'Per vecka', 'Per månad', 'YTD', 'Föregående år', 'Status'].map(h => (
                  <th key={h} className="pb-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider pr-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const avg = s.cost?.avgMonthlySEK ?? 0
                const c = calcCosts(avg)
                const prevYear = s.cost?.prevYearTotalSEK
                const badge = STATUS_BADGE[s.status]

                return (
                  <tr key={s.id} className="border-b border-white/[0.03] hover:bg-muted/30 transition-colors group">
                    <td className="py-3 pr-4">
                      <div className="text-sm font-semibold text-text-primary">{s.name}</div>
                      {s.cost?.note && (
                        <div className="text-[10px] text-gray-500 mt-0.5">{s.cost.note}</div>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className="text-xs px-2 py-0.5 rounded-md font-medium"
                        style={{ color: CATEGORY_COLORS[s.category], background: CATEGORY_COLORS[s.category] + '18' }}
                      >
                        {s.category}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-xs text-gray-500">{s.country}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-xs text-gray-500 font-mono">{s.email}</span>
                    </td>

                    {/* Kostnadsfält */}
                    <td className="py-3 pr-4">
                      <span className="text-xs font-mono text-text-primary">{fmtSEK(c.daily)}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-xs font-mono text-text-primary">{fmtSEK(c.weekly)}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-xs font-mono text-text-primary font-semibold">{fmtSEK(c.monthly)}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-xs font-mono text-text-primary">{fmtSEK(c.ytd)}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-xs font-mono text-gray-500">
                        {prevYear ? fmtSEK(prevYear) : '–'}
                      </span>
                    </td>

                    <td className="py-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ color: badge.color, background: badge.bg }}
                      >
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>

            {/* Summeringsrad */}
            {filtered.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-surface-border">
                  <td colSpan={4} className="py-3 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Totalt ({filtered.length} leverantörer)
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-xs font-mono font-semibold text-text-primary">{fmtSEK(totals.monthly / 30)}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-xs font-mono font-semibold text-text-primary">{fmtSEK(totals.monthly / 4.33)}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-xs font-mono font-semibold text-text-primary">{fmtSEK(totals.monthly)}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-xs font-mono font-semibold text-text-primary">{fmtSEK(totals.ytd)}</span>
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-500 text-sm">Inga leverantörer matchar filtret</div>
        )}

        <div className="mt-4 text-xs text-gray-600 font-mono">
          {filtered.length} av {SUPPLIERS.length} leverantörer
          {' · '}
          <span className="text-gray-400">Fyll i avgMonthlySEK i mockData.ts för att se verkliga kostnader</span>
        </div>
      </div>
    </div>
  )
}
