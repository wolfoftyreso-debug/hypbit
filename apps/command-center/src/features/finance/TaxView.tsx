import { useEntityScope } from '../../shared/scope/EntityScopeContext'
import { useFinanceTaxPeriods, useFinanceEntities } from './hooks/useFinance'
import type { FinanceTaxPeriod } from '../../lib/supabase'

type TaxStatus = FinanceTaxPeriod['status']

const STATUS_CONFIG: Record<TaxStatus, { label: string; color: string; bg: string; icon: string }> = {
  unreported: { label: 'Ej rapporterad', color: '#EF4444', bg: '#EF444415', icon: '⚠️' },
  submitted:  { label: 'Inlämnad',       color: '#F59E0B', bg: '#F59E0B15', icon: '📤' },
  paid:       { label: 'Betald',         color: '#10B981', bg: '#10B98115', icon: '✅' },
}

type JurisdictionInfo = {
  flag: string
  vatLabel: string
  rates: { rate: string; desc: string; examples: string; color: string }[]
  nextDeadlineLabel: string
  nextDeadline: string
  ossNote?: string
  notes: string
}

const JURISDICTION_INFO: Record<string, JurisdictionInfo> = {
  'Sverige': {
    flag: '🇸🇪',
    vatLabel: 'Svenska momssatser',
    rates: [
      { rate: '25%', desc: 'Standardmoms', examples: 'De flesta varor och tjänster', color: '#EF4444' },
      { rate: '12%', desc: 'Reducerad sats', examples: 'Mat, restaurang, hotell, böcker', color: '#F59E0B' },
      { rate: '6%',  desc: 'Lägsta sats', examples: 'Tidningar, persontransport, konst', color: '#10B981' },
      { rate: '0%',  desc: 'Momsfri', examples: 'Export, finansiella tjänster, sjukvård, utbildning', color: '#6B7280' },
    ],
    nextDeadlineLabel: 'Nästa momsdeadline (SE)',
    nextDeadline: (() => {
      const d = new Date(); d.setMonth(d.getMonth() + 1); d.setDate(26);
      return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })
    })(),
    notes: 'gäller tvåmånadersperioder för mindre bolag',
    ossNote: 'Om ni säljer digitala tjänster (appar, SaaS, streaming) till privatpersoner i EU gäller OSS (One Stop Shop) — momsen betalas i köparens land. Gräns: 10 000 EUR/år.',
  },
  'UAE (DIFC)': {
    flag: '🇦🇪',
    vatLabel: 'UAE VAT — Federal Tax Authority',
    rates: [
      { rate: '5%', desc: 'Standard VAT', examples: 'De flesta varor och tjänster', color: '#F59E0B' },
      { rate: '0%', desc: 'Zero-rated', examples: 'Export, internationella tjänster, vissa livsmedel', color: '#10B981' },
      { rate: '0%', desc: 'Exempt', examples: 'Finansiella tjänster, bostadshyra, hälso- & sjukvård', color: '#6B7280' },
    ],
    nextDeadlineLabel: 'Nästa VAT-retur (UAE)',
    nextDeadline: (() => {
      const d = new Date(); d.setMonth(d.getMonth() + 1); d.setDate(28);
      return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })
    })(),
    notes: 'kvartalsvis VAT-retur via FTA e-Services (taxperiod Q1/Q2/Q3/Q4)',
    ossNote: 'DIFC är en fri handelszon (free zone). Transaktioner inom DIFC är generellt zero-rated. VAT tillkommer vid försäljning till fastlandet (mainland UAE).',
  },
  'Litauen': {
    flag: '🇱🇹',
    vatLabel: 'Litauisk moms (PVM)',
    rates: [
      { rate: '21%', desc: 'Standardsats', examples: 'De flesta varor och tjänster', color: '#EF4444' },
      { rate: '9%',  desc: 'Reducerad sats', examples: 'Böcker, periodiska publikationer, hotell', color: '#F59E0B' },
      { rate: '5%',  desc: 'Reducerad sats', examples: 'Läkemedel, medicinsk utrustning', color: '#10B981' },
      { rate: '0%',  desc: 'Nollsats',  examples: 'Export utanför EU, internationell transport', color: '#6B7280' },
    ],
    nextDeadlineLabel: 'Nästa momsdeadline (LT)',
    nextDeadline: (() => {
      const d = new Date(); d.setMonth(d.getMonth() + 1); d.setDate(25);
      return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })
    })(),
    notes: 'månadsvis deklaration för de flesta bolag, kvartalsvis om omsättning < 300 000 EUR/år',
    ossNote: 'EU-bolag — OSS gäller för digitala tjänster till EU-konsumenter. Litauen är registreringsstat.',
  },
  'Texas, USA': {
    flag: '🇺🇸',
    vatLabel: 'Texas Sales & Use Tax',
    rates: [
      { rate: '6.25%', desc: 'State tax', examples: 'Tangible personal property & taxable services', color: '#EF4444' },
      { rate: '2%',    desc: 'Local tax (max)', examples: 'City/county/transit — varierar per område', color: '#F59E0B' },
      { rate: '0%',    desc: 'Exempt', examples: 'SaaS (delvis), professionella tjänster, export', color: '#6B7280' },
    ],
    nextDeadlineLabel: 'Nästa sales tax-retur (TX)',
    nextDeadline: (() => {
      const d = new Date(); d.setMonth(d.getMonth() + 1); d.setDate(20);
      return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })
    })(),
    notes: 'månadsvis om skatt > $1 500/mån, kvartalsvis annars — via Texas Comptroller',
    ossNote: 'Obs: SaaS är delvis skattefritt i Texas. "Data processing services" är beskattningsbart. Juridisk genomgång rekommenderas.',
  },
  'Delaware, USA': {
    flag: '🇺🇸',
    vatLabel: 'Delaware — ingen moms',
    rates: [
      { rate: '0%', desc: 'Ingen moms', examples: 'Delaware har ingen statlig sales tax — en av anledningarna till att bolag registreras här', color: '#10B981' },
    ],
    nextDeadlineLabel: 'Gross Receipts Tax (DE)',
    nextDeadline: (() => {
      const d = new Date(); d.setMonth(d.getMonth() + 1); d.setDate(20);
      return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })
    })(),
    notes: 'månadsvis Gross Receipts Tax (GRT) via Delaware Division of Revenue — gäller omsättning, inte vinst',
  },
}

const VAT_RATE_MAP: Record<string, string> = {
  'Sverige': '25%',
  'UAE (DIFC)': '5%',
  'Litauen': '21%',
  'Texas, USA': '8.25%',
  'Delaware, USA': '0%',
}

function fmt(n: number, currency: string) {
  if (n === 0) return `0 ${currency}`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M ${currency}`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k ${currency}`
  return `${n.toLocaleString()} ${currency}`
}

export function TaxView() {
  const { activeEntity, scopedEntities } = useEntityScope()
  const isRoot = activeEntity.layer === 0
  const scopedIds = new Set(scopedEntities.map(e => e.id))

  const { data: entities = [], isLoading: entitiesLoading } = useFinanceEntities()
  const { data: taxPeriods = [], isLoading: taxLoading } = useFinanceTaxPeriods()

  const isLoading = entitiesLoading || taxLoading

  const filteredPeriods = taxPeriods.filter(
    tp => isRoot || scopedIds.has(tp.entity_id)
  )

  const unreported = filteredPeriods.filter(t => t.status === 'unreported')
  const submitted  = filteredPeriods.filter(t => t.status === 'submitted')
  const paid       = filteredPeriods.filter(t => t.status === 'paid')

  const availableJurisdictions = entities.filter(
    fe => isRoot || scopedIds.has(fe.id)
  )

  // Determine primary jurisdiction from active entity
  const primaryJurisdiction = activeEntity.jurisdiction ?? availableJurisdictions[0]?.jurisdiction ?? 'Sverige'
  const jurisdictionInfo = JURISDICTION_INFO[primaryJurisdiction]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-9000 text-xs">
        Laddar skatte- och momsdata...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-text-primary">Moms &amp; Skatt</h2>
        <p className="text-xs text-gray-9000 mt-0.5">
          Skatteöversikt — {activeEntity.name ?? 'Wavult Group'}
          {jurisdictionInfo ? ` · ${jurisdictionInfo.flag} ${primaryJurisdiction}` : ''}
        </p>
      </div>

      {/* Deadline for active jurisdiction */}
      {jurisdictionInfo && (
        <div className="rounded-xl border border-surface-border bg-[#F0EBE1] px-4 py-3 flex items-start gap-3">
          <span className="text-text-secondary text-lg flex-shrink-0">📅</span>
          <div>
            <p className="text-xs font-semibold text-text-secondary">{jurisdictionInfo.nextDeadlineLabel}</p>
            <p className="text-xs text-gray-700/70 mt-0.5">
              Nästa deklaration: <strong className="text-text-secondary">{jurisdictionInfo.nextDeadline}</strong>
              {' '}— {jurisdictionInfo.notes}. Missa inte — förseningsavgift tillkommer.
            </p>
          </div>
        </div>
      )}

      {/* VAT rates for active jurisdiction */}
      {jurisdictionInfo ? (
        <div className="rounded-xl border border-surface-border bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-surface-border">
            <span className="text-xs font-semibold text-text-primary">
              {jurisdictionInfo.flag} {jurisdictionInfo.vatLabel}
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {jurisdictionInfo.rates.map(row => (
              <div key={row.rate + row.desc} className="flex items-center gap-3 px-4 py-2.5">
                <span className="text-[15px] font-bold font-mono w-14 flex-shrink-0" style={{ color: row.color }}>{row.rate}</span>
                <div className="flex-1">
                  <span className="text-xs text-text-primary font-semibold">{row.desc}</span>
                  <span className="text-xs text-gray-9000 ml-2">{row.examples}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-surface-border bg-white px-4 py-6 text-center">
          <p className="text-xs text-gray-9000">Skatteinfo ej konfigurerad för jurisdiktion: <strong>{primaryJurisdiction}</strong></p>
        </div>
      )}

      {/* OSS/special note */}
      {jurisdictionInfo?.ossNote && (
        <div className="rounded-xl border border-[#0A3D62]/30 bg-[#0A3D62]/08 px-4 py-3">
          <p className="text-xs font-semibold text-[#E8B84B] mb-1">🌍 Notering</p>
          <p className="text-xs text-[#E8B84B]/70 leading-relaxed">{jurisdictionInfo.ossNote}</p>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Ej rapporterade', value: unreported.length, color: '#EF4444', icon: '⚠️' },
          { label: 'Inlämnade',       value: submitted.length,  color: '#F59E0B', icon: '📤' },
          { label: 'Betalda',         value: paid.length,       color: '#10B981', icon: '✅' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 border text-center"
            style={{ background: s.color + '08', borderColor: s.color + '20' }}>
            <span className="text-xl">{s.icon}</span>
            <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[9px] text-gray-9000 font-mono uppercase mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Jurisdiction overview */}
      <div className="rounded-xl border border-surface-border bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-surface-border">
          <span className="text-xs font-semibold text-text-primary">Momssatser per jurisdiktion</span>
        </div>
        <div className="divide-y divide-gray-100">
          {availableJurisdictions.map(fe => {
            const info = JURISDICTION_INFO[fe.jurisdiction]
            const rate = VAT_RATE_MAP[fe.jurisdiction] ?? '—'
            return (
              <div key={fe.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-lg flex-shrink-0">{info?.flag ?? '🌍'}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-text-primary">{fe.jurisdiction}</span>
                    <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: fe.color }} />
                    <span className="text-[9px] font-mono text-gray-9000">{fe.short_name}</span>
                  </div>
                  <p className="text-xs text-gray-9000 mt-0.5">{info?.notes ?? '—'}</p>
                </div>
                <span className="text-[14px] font-bold font-mono" style={{ color: fe.color }}>{rate}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tax periods */}
      <div className="rounded-xl border border-surface-border bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-surface-border">
          <span className="text-xs font-semibold text-text-primary">Momsperioder</span>
        </div>

        {filteredPeriods.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-9000 text-xs">
            Inga momsperioder registrerade ännu
          </div>
        ) : (
          <>
            {unreported.length > 0 && (
              <div className="mx-4 mt-3 mb-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-xs font-semibold text-red-300">
                  ⚠️ {unreported.length} period{unreported.length > 1 ? 'er' : ''} ej rapporterade
                </p>
                <p className="text-xs text-red-600/80 mt-0.5">Kräver åtgärd inom angiven deadline</p>
              </div>
            )}

            <div className="divide-y divide-gray-100 pb-2">
              <div className="grid grid-cols-12 px-4 py-2 text-[9px] font-mono text-gray-9000 uppercase tracking-wider">
                <span className="col-span-2">Bolag</span>
                <span className="col-span-2">Jurisdiktion</span>
                <span className="col-span-2">Period</span>
                <span className="col-span-1 text-right">Sats</span>
                <span className="col-span-2 text-right">Beskattningsbar</span>
                <span className="col-span-2 text-right">Moms skuld</span>
                <span className="col-span-1">Status</span>
              </div>

              {filteredPeriods.map(tp => {
                const fe = entities.find(e => e.id === tp.entity_id)
                const st = STATUS_CONFIG[tp.status]
                const isUrgent  = tp.status === 'unreported'
                const isOverdue = isUrgent && tp.due_date != null && tp.due_date < new Date().toISOString().slice(0, 10)
                return (
                  <div key={tp.id}
                    className={`grid grid-cols-12 px-4 py-3 items-center hover:bg-[#F0EBE1] transition-colors ${isUrgent ? 'border-l-2 border-red-500/50' : ''}`}
                  >
                    <div className="col-span-2 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: fe?.color }} />
                      <span className="text-xs text-gray-9000 font-mono truncate">{fe?.short_name}</span>
                    </div>
                    <span className="col-span-2 text-xs text-gray-9000">{tp.jurisdiction}</span>
                    <span className="col-span-2 text-xs font-mono text-gray-600">{tp.period}</span>
                    <span className="col-span-1 text-right text-xs font-mono font-semibold text-text-primary">{tp.vat_rate}%</span>
                    <span className="col-span-2 text-right text-xs font-mono text-gray-9000">
                      {fmt(tp.taxable_revenue, tp.currency)}
                    </span>
                    <span className="col-span-2 text-right text-xs font-mono font-bold"
                      style={{ color: tp.vat_owed === 0 ? '#6B7280' : isUrgent ? '#EF4444' : '#F59E0B' }}>
                      {fmt(tp.vat_owed, tp.currency)}
                    </span>
                    <div className="col-span-1">
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ color: st.color, background: st.bg }}>
                        {st.label}
                      </span>
                      {isOverdue && <p className="text-[8px] text-red-700 mt-0.5 font-mono">FÖRSENAD</p>}
                      {!isOverdue && tp.due_date && <p className="text-[8px] text-gray-600 mt-0.5 font-mono">→ {tp.due_date.slice(5)}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
