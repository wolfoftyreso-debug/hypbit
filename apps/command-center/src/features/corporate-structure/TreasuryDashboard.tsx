// ─── Treasury Dashboard — Payment Processing Prep ───────────────────────────
// Prepares the system for bank-level payment routing.
// Shows: accounts, PSPs, routing rules, compliance gates.
// All data is mock/planned — will connect to real APIs in bank-level phase.

import { ENTITIES } from '../org-graph/data'
import { HOLDING_NODES } from './corporateData'

// ─── Types ──────────────────────────────────────────────────────────────────

type AccountStatus = 'active' | 'pending' | 'planned'
type PSPProvider = 'stripe' | 'adyen' | 'wise' | 'revolut' | 'bank-transfer'

interface TreasuryAccount {
  entityId: string
  bankName: string
  currency: string
  accountType: string
  status: AccountStatus
  iban: string | null
  routingNote: string
}

interface PSPConnection {
  entityId: string
  provider: PSPProvider
  status: AccountStatus
  mode: 'live' | 'test' | 'planned'
  capabilities: string[]
  notes: string
}

interface RoutingRule {
  id: string
  condition: string
  destination: string
  psp: PSPProvider
  notes: string
}

// ─── Data ───────────────────────────────────────────────────────────────────

const TREASURY_ACCOUNTS: TreasuryAccount[] = [
  {
    entityId: 'landvex-ab', bankName: 'SEB', currency: 'SEK/EUR',
    accountType: 'Business Current', status: 'active',
    iban: 'SE** **** **** ****', routingNote: 'Primary SE operations account',
  },
  {
    entityId: 'wavult-group', bankName: 'Emirates NBD', currency: 'USD/AED',
    accountType: 'Free Zone Account', status: 'pending',
    iban: null, routingNote: 'Holding capital accumulation — receives all royalties + dividends',
  },
  {
    entityId: 'wavult-operations', bankName: 'Emirates NBD', currency: 'USD/AED',
    accountType: 'Operations Account', status: 'pending',
    iban: null, routingNote: 'Service fee collection from all subsidiaries',
  },
  {
    entityId: 'landvex-inc', bankName: 'Mercury / Chase', currency: 'USD',
    accountType: 'Business Checking', status: 'planned',
    iban: null, routingNote: 'US operations — customer payments + vendor disbursements',
  },
  {
    entityId: 'quixzoom-uab', bankName: 'Revolut Business', currency: 'EUR',
    accountType: 'Business Account', status: 'planned',
    iban: null, routingNote: 'EU operations — SEPA payments',
  },
  {
    entityId: 'quixzoom-inc', bankName: 'Mercury', currency: 'USD',
    accountType: 'Business Checking', status: 'planned',
    iban: null, routingNote: 'US quiXzoom operations',
  },
]

const PSP_CONNECTIONS: PSPConnection[] = [
  {
    entityId: 'landvex-ab', provider: 'stripe', status: 'active', mode: 'live',
    capabilities: ['card', 'invoice', 'subscription', 'connect'],
    notes: 'Primary SE payment processing — Stripe SE entity',
  },
  {
    entityId: 'landvex-inc', provider: 'stripe', status: 'planned', mode: 'planned',
    capabilities: ['card', 'ach', 'subscription'],
    notes: 'US Stripe entity — needs EIN + bank account first',
  },
  {
    entityId: 'quixzoom-uab', provider: 'stripe', status: 'planned', mode: 'planned',
    capabilities: ['card', 'sepa', 'subscription'],
    notes: 'EU Stripe entity — SEPA direct debit for EU customers',
  },
  {
    entityId: 'wavult-operations', provider: 'wise', status: 'planned', mode: 'planned',
    capabilities: ['multi-currency', 'batch-payments', 'fx'],
    notes: 'Intercompany transfers — low FX fees',
  },
  {
    entityId: 'wavult-group', provider: 'revolut', status: 'planned', mode: 'planned',
    capabilities: ['multi-currency', 'fx', 'corporate-cards'],
    notes: 'Holding treasury management',
  },
]

const ROUTING_RULES: RoutingRule[] = [
  { id: 'rr1', condition: 'Customer in EU (SEPA zone)', destination: 'quixzoom-uab / landvex-ab', psp: 'stripe', notes: 'Route to EU entity — GDPR + VAT compliant' },
  { id: 'rr2', condition: 'Customer in US', destination: 'landvex-inc / quixzoom-inc', psp: 'stripe', notes: 'Route to US C-Corp — domestic ACH/card' },
  { id: 'rr3', condition: 'Intercompany royalty', destination: 'wavult-group', psp: 'wise', notes: 'Quarterly royalty 10% — Wise multi-currency' },
  { id: 'rr4', condition: 'Intercompany service fee', destination: 'wavult-operations', psp: 'wise', notes: 'Monthly service fee — cost + 5% margin' },
  { id: 'rr5', condition: 'Vendor payout (contractors)', destination: 'wavult-operations', psp: 'wise', notes: 'Global contractor payments via Wise' },
  { id: 'rr6', condition: 'Dividend distribution', destination: 'wavult-group', psp: 'bank-transfer', notes: 'Annual — after board approval' },
]

// ─── Colors ─────────────────────────────────────────────────────────────────

const ACCOUNT_STATUS_COLOR: Record<AccountStatus, string> = {
  active: '#10B981',
  pending: '#F59E0B',
  planned: '#6B7280',
}

const PSP_COLOR: Record<PSPProvider, string> = {
  stripe: '#635BFF',
  adyen: '#0ABF53',
  wise: '#9FE870',
  revolut: '#0075EB',
  'bank-transfer': '#6B7280',
}

// ─── Components ─────────────────────────────────────────────────────────────

function AccountsSection() {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Bank Accounts ({TREASURY_ACCOUNTS.length})</h3>
      <div className="space-y-2">
        {TREASURY_ACCOUNTS.map(acc => {
          const entity = ENTITIES.find(e => e.id === acc.entityId)
          const statusColor = ACCOUNT_STATUS_COLOR[acc.status]
          return (
            <div key={acc.entityId} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-base flex-shrink-0">{entity?.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{entity?.shortName}</span>
                    <span className="text-xs text-gray-500">{acc.bankName}</span>
                    <span className="text-[10px] font-mono text-gray-600">{acc.currency}</span>
                  </div>
                  <div className="text-[10px] text-gray-600 mt-0.5">{acc.routingNote}</div>
                </div>
                <span
                  className="text-[10px] px-2 py-0.5 rounded font-mono flex-shrink-0"
                  style={{ background: statusColor + '18', color: statusColor }}
                >
                  {acc.status}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PSPSection() {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Payment Service Providers ({PSP_CONNECTIONS.length})</h3>
      <div className="space-y-2">
        {PSP_CONNECTIONS.map((psp, i) => {
          const entity = ENTITIES.find(e => e.id === psp.entityId)
          const pspColor = PSP_COLOR[psp.provider]
          const statusColor = ACCOUNT_STATUS_COLOR[psp.status]
          return (
            <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <div className="flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{ background: pspColor + '20', color: pspColor }}
                >
                  {psp.provider.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: pspColor }}>{psp.provider}</span>
                    <span className="text-xs text-gray-500">{entity?.flag} {entity?.shortName}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {psp.capabilities.map(cap => (
                      <span key={cap} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-gray-600 font-mono">{cap}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                    style={{ background: statusColor + '18', color: statusColor }}
                  >
                    {psp.mode}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RoutingSection() {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Payment Routing Rules ({ROUTING_RULES.length})</h3>
      <div className="space-y-2">
        {ROUTING_RULES.map(rule => {
          const pspColor = PSP_COLOR[rule.psp]
          return (
            <div key={rule.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <div className="flex items-start gap-3">
                <span className="text-xs text-gray-600 font-mono w-6 flex-shrink-0 pt-0.5">{rule.id.replace('rr', '#')}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-200">{rule.condition}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-gray-600">→ {rule.destination}</span>
                    <span className="text-[10px] text-gray-600">via</span>
                    <span className="text-[10px] font-mono" style={{ color: pspColor }}>{rule.psp}</span>
                  </div>
                  <div className="text-[10px] text-gray-700 mt-0.5">{rule.notes}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function APIReadiness() {
  const apis = [
    { name: 'POST /api/treasury/payment-intent', status: 'planned', desc: 'Create payment intent with entity routing' },
    { name: 'POST /api/treasury/payout', status: 'planned', desc: 'Initiate payout to vendor/contractor' },
    { name: 'GET /api/treasury/accounts', status: 'planned', desc: 'List all entity bank accounts + balances' },
    { name: 'GET /api/treasury/flows', status: 'planned', desc: 'Intercompany flow ledger' },
    { name: 'POST /api/treasury/intercompany-invoice', status: 'planned', desc: 'Generate royalty/service fee invoice' },
    { name: 'GET /api/treasury/routing-rules', status: 'planned', desc: 'Active payment routing configuration' },
    { name: 'POST /api/treasury/reconcile', status: 'planned', desc: 'Reconcile bank statement vs internal ledger' },
    { name: 'GET /api/treasury/compliance-gates', status: 'planned', desc: 'Check KYC/AML/sanctions gates' },
  ]

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">API Endpoints (Bank-Level Prep)</h3>
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        {apis.map((api, i) => (
          <div key={api.name} className={`flex items-center gap-3 px-4 py-2.5 ${i > 0 ? 'border-t border-white/[0.03]' : ''}`}>
            <span className="text-[10px] font-mono text-gray-400 flex-1 min-w-0 truncate">{api.name}</span>
            <span className="text-[10px] text-gray-600 flex-shrink-0 max-w-[200px] truncate">{api.desc}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-white/[0.04] text-gray-600 flex-shrink-0">
              {api.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main ───────────────────────────────────────────────────────────────────

export function TreasuryDashboard() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-lg font-bold text-white">Treasury & Payment Infrastructure</h1>
          <p className="text-xs text-gray-600 mt-0.5">
            Bank-level payment processing preparation — accounts, PSPs, routing, compliance
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <div className="text-xs text-gray-600 mb-1">Bank Accounts</div>
            <div className="text-2xl font-bold text-white">{TREASURY_ACCOUNTS.length}</div>
            <div className="text-[10px] text-[#10B981]">{TREASURY_ACCOUNTS.filter(a => a.status === 'active').length} active</div>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <div className="text-xs text-gray-600 mb-1">PSP Connections</div>
            <div className="text-2xl font-bold text-white">{PSP_CONNECTIONS.length}</div>
            <div className="text-[10px] text-[#F59E0B]">{PSP_CONNECTIONS.filter(p => p.status === 'active').length} live</div>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <div className="text-xs text-gray-600 mb-1">Routing Rules</div>
            <div className="text-2xl font-bold text-white">{ROUTING_RULES.length}</div>
            <div className="text-[10px] text-gray-600">Payment flows defined</div>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <div className="text-xs text-gray-600 mb-1">API Readiness</div>
            <div className="text-2xl font-bold text-[#F59E0B]">Prep</div>
            <div className="text-[10px] text-gray-600">8 endpoints defined</div>
          </div>
        </div>

        <AccountsSection />
        <PSPSection />
        <RoutingSection />
        <APIReadiness />
      </div>
    </div>
  )
}
