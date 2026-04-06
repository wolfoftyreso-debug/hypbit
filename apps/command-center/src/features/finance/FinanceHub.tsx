import { useState, Component, type ReactNode, useEffect, useRef } from 'react'
import { useEntityScope } from '../../shared/scope/EntityScopeContext'
import { ModuleHeader } from '../../shared/maturity/ModuleHeader'
import { FinanceOverview } from './FinanceOverview'
import { LedgerView } from './LedgerView'
import { InvoiceHub } from './InvoiceHub'
import { TaxView } from './TaxView'
import { IntercompanyView } from './IntercompanyView'
import { PaymentProcessor } from './PaymentProcessor'
import { useTranslation } from '../../shared/i18n/useTranslation'

// ─── Error Boundary ───────────────────────────────────────────────────────────
class FinanceErrorBoundary extends Component<
  { children: ReactNode; tabLabel: string },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; tabLabel: string }) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-60 gap-4">
          <p className="text-sm font-semibold text-text-primary">{this.props.tabLabel} — data saknas</p>
          <p className="text-xs text-gray-500 max-w-sm text-center">
            Den här modulen behöver live-data från Supabase. Tabellerna är inte satta upp ännu.
          </p>
          <p className="text-xs text-gray-500 font-mono">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-xs px-4 py-2 rounded-lg bg-white border border-surface-border text-gray-500 hover:bg-[#F5F0E8] transition-colors"
          >
            Försök igen
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

type Tab = 'overview' | 'bookkeeping' | 'invoices' | 'payments' | 'intercompany' | 'tax'

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'overview',     label: 'Översikt',      icon: '📊' },
  { id: 'bookkeeping',  label: 'Bokföring',     icon: '📒' },
  { id: 'invoices',     label: 'Fakturor',      icon: '🧾' },
  { id: 'payments',     label: 'Betalningar',   icon: '💸' },
  { id: 'intercompany', label: 'Internprisning', icon: '🌍' },
  { id: 'tax',          label: 'Skatt & Moms',  icon: '🏦' }]

export function FinanceHub() {
  const { t: _t } = useTranslation()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [showIngress, setShowIngress] = useState(true)
  const prevTabRef = useRef<Tab>('overview')
  const { activeEntity, viewScope, setViewScope } = useEntityScope()
  const isRoot = activeEntity.layer === 0

  useEffect(() => {
    if (prevTabRef.current !== activeTab) {
      setShowIngress(true)
      prevTabRef.current = activeTab
      const id = setTimeout(() => setShowIngress(false), 6_000)
      return () => clearTimeout(id)
    }
  }, [activeTab])

  return (
    <div className="flex flex-col h-full bg-white text-text-primary rounded-xl border border-surface-border shadow-sm overflow-hidden">
      <ModuleHeader moduleId="finance" />

      {/* Entity context banner */}
      <div style={{
        padding: '10px 20px',
        borderBottom: '1px solid var(--color-border, #E5E7EB)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: activeEntity.color + '08',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 16 }}>{activeEntity.flag}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: activeEntity.color }}>
          {activeEntity.name}
        </span>
        <span style={{ fontSize: 11, color: '#6B7280', fontFamily: 'monospace' }}>
          {activeEntity.jurisdiction}
        </span>
        {activeEntity.metadata?.['Org. nummer'] && (
          <span style={{ fontSize: 11, color: '#6B7280' }}>
            · {activeEntity.metadata['Org. nummer']}
          </span>
        )}
        {activeEntity.metadata?.['Legal name'] && (
          <span style={{ fontSize: 11, color: '#6B7280' }}>
            · {activeEntity.metadata['Legal name']}
          </span>
        )}
        {!isRoot && (
          <div style={{ marginLeft: 'auto', display: 'flex', borderRadius: 8, overflow: 'hidden', border: `1px solid ${activeEntity.color}30` }}>
            <button
              onClick={() => setViewScope('group')}
              style={{
                padding: '4px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
                background: viewScope === 'group' ? activeEntity.color : 'transparent',
                color: viewScope === 'group' ? '#fff' : activeEntity.color,
                transition: 'all 0.15s',
              }}
            >
              Koncern
            </button>
            <button
              onClick={() => setViewScope('entity')}
              style={{
                padding: '4px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
                background: viewScope === 'entity' ? activeEntity.color : 'transparent',
                color: viewScope === 'entity' ? '#fff' : activeEntity.color,
                transition: 'all 0.15s',
              }}
            >
              {activeEntity.shortName}
            </button>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="px-4 md:px-6 py-4 border-b border-surface-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-semibold text-text-primary">Finance Hub</h1>
            <p className="text-xs text-gray-500 font-mono truncate">
              {isRoot
                ? 'Wavult Group — konsoliderad'
                : viewScope === 'group'
                  ? 'Koncernvy — alla bolag aggregerade'
                  : `${activeEntity.name} — ${activeEntity.jurisdiction}`}
            </p>
          </div>
          <div
            className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border"
            style={{
              background: activeEntity.color + '12',
              borderColor: activeEntity.color + '30',
              color: activeEntity.color,
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: activeEntity.color }} />
            {activeEntity.shortName}
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 px-4 md:px-6 border-b border-surface-border flex-shrink-0 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 border-b-2 -mb-px rounded-t-md ${
              activeTab === tab.id
                ? 'bg-[#0A3D62] text-white border-[#0A3D62]'
                : 'text-[#3A3530] hover:text-[#0A3D62] hover:bg-[#F5F0E8] border-transparent'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab ingress */}
      {showIngress && (() => {
        const INGRESS: Record<Tab, string> = {
          overview:     'Sammanfattning av ekonomin för valt bolag — KPI:er, senaste transaktioner och status i en vy.',
          bookkeeping:  'Transaktioner och kontoplan — kronologisk lista med filter per bolag, konto och period.',
          invoices:     'Utgående fakturor till kunder och inkommande leverantörsfakturor. Status: utkast, skickad, betald.',
          payments:     'Betalningsflöden via Stripe, Revolut och andra PSP:er — status och historik per transaktion.',
          intercompany: 'Betalningar och licensavgifter MELLAN bolagen i koncernen. Licensflöden samlas i Dubai-holding.',
          tax:          'Momsredovisning och skatteberäkning per jurisdiktion. Sverige, Litauen och UAE har olika regler.',
        }
        const ingress = INGRESS[activeTab]
        return ingress ? (
          <div className="px-6 py-2 border-b border-surface-border/50 flex-shrink-0 flex items-center gap-2 bg-[#F5F0E8]/50">
            <p className="text-xs text-gray-500 leading-snug">{ingress}</p>
            <button
              onClick={() => setShowIngress(false)}
              className="ml-auto text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              aria-label="Stäng beskrivning"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : null
      })()}

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 md:p-6 bg-[#F5F0E8]/20">
        <FinanceErrorBoundary tabLabel={TABS.find(t => t.id === activeTab)?.label ?? activeTab}>
          {activeTab === 'overview'     && <FinanceOverview />}
          {activeTab === 'bookkeeping'  && <LedgerView />}
          {activeTab === 'invoices'     && <InvoiceHub />}
          {activeTab === 'payments'     && <PaymentProcessor />}
          {activeTab === 'intercompany' && <IntercompanyView />}
          {activeTab === 'tax'          && <TaxView />}
        </FinanceErrorBoundary>
      </div>
    </div>
  )
}
