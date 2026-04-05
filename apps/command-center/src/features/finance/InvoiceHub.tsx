import { useState } from 'react'
import { useEntityScope } from '../../shared/scope/EntityScopeContext'
import { useFinanceInvoices, useFinanceEntities } from './hooks/useFinance'
import type { FinanceInvoice } from '../../lib/supabase'
import { useTranslation } from '../../shared/i18n/useTranslation'
import { TransactionDetail } from '../transactions/TransactionDetail'

type InvoiceStatus = FinanceInvoice['status']

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string; bg: string }> = {
  draft:   { label: 'Utkast',   color: '#6B7280', bg: '#6B728015' },
  sent:    { label: 'Skickad',  color: '#0A3D62', bg: '#0A3D6215' },
  paid:    { label: 'Betald',   color: '#10B981', bg: '#10B98115' },
  overdue: { label: 'Förfallen', color: '#EF4444', bg: '#EF444415' },
}

function fmt(n: number, currency: string) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M ${currency}`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k ${currency}`
  return `${n.toLocaleString()} ${currency}`
}

const EMPTY_FORM = {
  recipient: '',
  recipientEmail: '',
  entityId: '',
  currency: 'SEK',
  dueDate: '',
  lines: [{ description: '', qty: 1, unitPrice: 0 }],
}

function InvoicePreview({ invoice, entityName, entityColor, entityOrgNr, entityJurisdiction }: {
  invoice: FinanceInvoice
  entityName?: string
  entityColor?: string
  entityOrgNr?: string
  entityJurisdiction?: string
}) {
  return (
    <div className="bg-white rounded-xl p-6 text-text-primary min-w-[400px] shadow-2xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-text-primary">FAKTURA</h2>
          <p className="text-sm text-gray-9000">#{invoice.number}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold" style={{ color: entityColor }}>{entityName}</p>
          {entityOrgNr && <p className="text-xs text-gray-9000">Org.nr: {entityOrgNr}</p>}
          <p className="text-xs text-gray-9000">{entityJurisdiction}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <p className="text-xs font-semibold text-gray-9000 uppercase tracking-wide mb-1">Mottagare</p>
          <p className="font-semibold text-text-primary">{invoice.recipient}</p>
          {invoice.recipient_email && <p className="text-gray-9000">{invoice.recipient_email}</p>}
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-gray-9000 uppercase tracking-wide mb-1">Datum</p>
          {invoice.issue_date && <p className="text-gray-600">Utfärdat: {invoice.issue_date}</p>}
          {invoice.due_date && <p className="text-gray-600">Förfaller: {invoice.due_date}</p>}
        </div>
      </div>
      {Array.isArray(invoice.lines) && invoice.lines.length > 0 && (
        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="border-b border-surface-border text-xs text-gray-9000 uppercase">
              <th className="text-left pb-2">Beskrivning</th>
              <th className="text-right pb-2">Summa</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-2 text-gray-600">{line.description}</td>
                <td className="py-2 text-right font-semibold">{line.total?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="text-right text-sm space-y-1">
        <div className="flex justify-between text-gray-9000">
          <span>Netto</span><span>{invoice.amount.toLocaleString()} {invoice.currency}</span>
        </div>
        {invoice.tax > 0 && (
          <div className="flex justify-between text-gray-9000">
            <span>Moms</span><span>{invoice.tax.toLocaleString()} {invoice.currency}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg border-t border-surface-border pt-2">
          <span>Totalt</span><span>{invoice.total.toLocaleString()} {invoice.currency}</span>
        </div>
      </div>
    </div>
  )
}

export function InvoiceHub() {
  const { t: _t } = useTranslation()
  const { activeEntity, scopedEntities } = useEntityScope()
  const isRoot = activeEntity.layer === 0
  const scopedIds = new Set(scopedEntities.map(e => e.id))

  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all')
  const [showNewForm, setShowNewForm] = useState(false)
  const [previewInvoice, setPreviewInvoice] = useState<FinanceInvoice | null>(null)
  const [selectedTx, setSelectedTx] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const { data: entities = [], isLoading: entitiesLoading } = useFinanceEntities()
  const { data: allInvoices = [], isLoading: invoicesLoading } = useFinanceInvoices()

  const isLoading = entitiesLoading || invoicesLoading

  const baseInvoices = allInvoices.filter(inv => isRoot || scopedIds.has(inv.entity_id))
  const filtered = statusFilter === 'all' ? baseInvoices : baseInvoices.filter(i => i.status === statusFilter)

  const statusCounts = {
    all: baseInvoices.length,
    draft: baseInvoices.filter(i => i.status === 'draft').length,
    sent: baseInvoices.filter(i => i.status === 'sent').length,
    paid: baseInvoices.filter(i => i.status === 'paid').length,
    overdue: baseInvoices.filter(i => i.status === 'overdue').length,
  }

  const updateLine = (idx: number, field: 'description' | 'qty' | 'unitPrice', value: string | number) => {
    setForm(f => {
      const lines = [...f.lines]
      lines[idx] = { ...lines[idx], [field]: value }
      return { ...f, lines }
    })
  }

  const lineTotal = form.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-9000 text-xs">
        Laddar fakturor...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Fakturor</h2>
          <p className="text-xs text-gray-9000 mt-0.5">Hantera utgående fakturor</p>
        </div>
        <button
          onClick={() => setShowNewForm(s => !s)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EDE8DC] hover:bg-[#EDE8DC] text-[#0A3D62] text-xs font-semibold transition-colors border border-[#0A3D62]/20"
        >
          + Ny faktura
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {(['all', 'draft', 'sent', 'paid', 'overdue'] as const).map(s => {
          const cfg = s === 'all' ? { label: 'Alla', color: '#ffffff', bg: '#ffffff15' } : STATUS_CONFIG[s]
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${statusFilter === s ? 'bg-muted text-gray-900' : 'text-gray-9000 hover:text-gray-9000'}`}
            >
              {s !== 'all' && <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.color }} />}
              {s === 'all' ? 'Alla' : STATUS_CONFIG[s as InvoiceStatus].label}
              <span className="text-[9px] font-mono">({statusCounts[s]})</span>
            </button>
          )
        })}
      </div>

      {/* New invoice form */}
      {showNewForm && (
        <div className="rounded-xl border border-surface-border bg-white p-4 space-y-3">
          <h3 className="text-sm font-bold text-text-primary">Ny faktura</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] text-gray-9000 font-mono uppercase tracking-wider block mb-1">Mottagare</label>
              <input value={form.recipient} onChange={e => setForm(f => ({ ...f, recipient: e.target.value }))}
                className="w-full bg-white border border-surface-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder-gray-700 focus:outline-none focus:border-gray-300"
                placeholder="Bolagsnamn..." />
            </div>
            <div>
              <label className="text-[9px] text-gray-9000 font-mono uppercase tracking-wider block mb-1">E-post</label>
              <input value={form.recipientEmail} onChange={e => setForm(f => ({ ...f, recipientEmail: e.target.value }))}
                className="w-full bg-white border border-surface-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder-gray-700 focus:outline-none focus:border-gray-300"
                placeholder="ekonomi@kund.se" />
            </div>
            <div>
              <label className="text-[9px] text-gray-9000 font-mono uppercase tracking-wider block mb-1">Utfärdande bolag</label>
              <select value={form.entityId} onChange={e => setForm(f => ({ ...f, entityId: e.target.value }))}
                className="w-full bg-white border border-surface-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none">
                <option value="">Välj bolag...</option>
                {entities.map(fe => <option key={fe.id} value={fe.id}>{fe.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] text-gray-9000 font-mono uppercase tracking-wider block mb-1">Valuta</label>
                <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                  className="w-full bg-white border border-surface-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none">
                  {['SEK', 'EUR', 'USD', 'AED'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] text-gray-9000 font-mono uppercase tracking-wider block mb-1">Förfallodatum</label>
                <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  className="w-full bg-white border border-surface-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none" />
              </div>
            </div>
          </div>
          {/* Lines */}
          <div>
            <label className="text-[9px] text-gray-9000 font-mono uppercase tracking-wider block mb-2">Rader</label>
            {form.lines.map((line, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-2 mb-2">
                <input value={line.description} onChange={e => updateLine(i, 'description', e.target.value)}
                  className="flex-1 bg-white border border-surface-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder-gray-700 focus:outline-none"
                  placeholder="Beskrivning..." />
                <div className="flex gap-2">
                  <input type="number" value={line.qty} onChange={e => updateLine(i, 'qty', Number(e.target.value))}
                    className="w-16 bg-white border border-surface-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none text-center"
                    min={1} />
                  <input type="number" value={line.unitPrice} onChange={e => updateLine(i, 'unitPrice', Number(e.target.value))}
                    className="w-24 bg-white border border-surface-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none"
                    placeholder="À-pris" />
                  <div className="w-20 flex items-center justify-center text-xs font-mono text-green-700">
                    {(line.qty * line.unitPrice).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
            <button onClick={() => setForm(f => ({ ...f, lines: [...f.lines, { description: '', qty: 1, unitPrice: 0 }] }))}
              className="text-xs text-gray-9000 hover:text-gray-9000 transition-colors">
              + Lägg till rad
            </button>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-surface-border">
            <span className="text-xs text-gray-9000">Totalt netto</span>
            <span className="text-[14px] font-bold text-text-primary">{lineTotal.toLocaleString()} {form.currency}</span>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowNewForm(false)}
              className="px-4 py-2 rounded-lg border border-surface-border text-gray-9000 text-xs hover:text-text-primary transition-colors">
              Avbryt
            </button>
            <button className="px-4 py-2 rounded-lg bg-[#EDE8DC] border border-[#0A3D62]/20 text-[#0A3D62] text-xs font-semibold hover:bg-[#EDE8DC] transition-colors">
              Spara utkast
            </button>
          </div>
        </div>
      )}

      {/* Invoice list */}
      <div className="rounded-xl border border-surface-border bg-white overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-gray-600 text-xs">
            Inga fakturor — skapa din första via knappen ovan.
          </div>
        ) : (
        <div className="overflow-x-auto">
          <div className="grid grid-cols-12 px-4 py-2 text-[9px] font-mono text-gray-9000 uppercase tracking-wider border-b border-surface-border min-w-[560px]">
            <span className="col-span-2">Nr</span>
            <span className="col-span-3">Mottagare</span>
            <span className="col-span-2">Bolag</span>
            <span className="col-span-2 text-right">Belopp</span>
            <span className="col-span-1">Förfaller</span>
            <span className="col-span-1">Status</span>
            <span className="col-span-1"></span>
          </div>
          {filtered.map(inv => {
            const fe = entities.find(e => e.id === inv.entity_id)
            const st = STATUS_CONFIG[inv.status]
            return (
              <div key={inv.id}
                onClick={() => setSelectedTx(inv.id)}
                className="grid grid-cols-12 px-4 py-3 items-center border-b border-surface-border/50 last:border-0 hover:bg-muted/30 transition-colors cursor-pointer min-w-[560px]">
                <span className="col-span-2 text-xs font-mono text-gray-9000">{inv.number}</span>
                <div className="col-span-3">
                  <p className="text-xs text-text-primary truncate">{inv.recipient}</p>
                  {inv.recipient_email && <p className="text-[9px] text-gray-9000 truncate">{inv.recipient_email}</p>}
                </div>
                <div className="col-span-2 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: fe?.color }} />
                  <span className="text-xs text-gray-9000 font-mono truncate">{fe?.short_name ?? inv.entity_id}</span>
                </div>
                <span className="col-span-2 text-right text-xs font-mono font-semibold text-text-primary">
                  {fmt(inv.total, inv.currency)}
                </span>
                <span className="col-span-1 text-xs font-mono text-gray-9000">{inv.due_date?.slice(5) ?? '—'}</span>
                <span className="col-span-1">
                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ color: st.color, background: st.bg }}>
                    {st.label}
                  </span>
                </span>
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={e => { e.stopPropagation(); setPreviewInvoice(inv) }}
                    className="text-xs text-gray-9000 hover:text-text-primary transition-colors px-2 py-1 rounded bg-muted/30 hover:bg-white/[0.08]"
                  >
                    Preview
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        )}
      </div>

      {/* Transaction detail panel */}
      {selectedTx && (
        <TransactionDetail
          transactionId={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}

      {/* Invoice preview modal */}
      {previewInvoice && (() => {
        const fe = entities.find(e => e.id === previewInvoice.entity_id)
        return (
          <div className="fixed inset-0 bg-white/70 flex items-center justify-center z-50 p-4" onClick={() => setPreviewInvoice(null)}>
            <div className="w-full max-w-[500px]" onClick={e => e.stopPropagation()}>
              <div className="overflow-x-auto">
                <InvoicePreview
                  invoice={previewInvoice}
                  entityName={fe?.name}
                  entityColor={fe?.color}
                  entityOrgNr={undefined}
                  entityJurisdiction={fe?.jurisdiction}
                />
              </div>
              <button
                onClick={() => setPreviewInvoice(null)}
                className="mt-3 w-full py-2 rounded-lg bg-white/[0.08] text-gray-900/60 text-xs hover:bg-white/[0.12] transition-colors"
              >
                Stäng
              </button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
