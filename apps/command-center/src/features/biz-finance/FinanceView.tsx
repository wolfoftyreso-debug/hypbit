// ─── Finance — Cash Flow, Revenue, Costs, Forecast, Transactions ────────────
// The financial nerve center. Every number is real or clearly marked projected.
// No badges, no drama. Just money in, money out, and what to do about it.

import { useState } from 'react'

// ─── Data (will connect to Fortnox/bank feeds) ─────────────────────────────

const CASH_POSITION = {
  accounts: [
    { name: 'SEB Företagskonto', entity: 'LandveX AB', currency: 'SEK', balance: 184_320, trend: '+12%' },
    { name: 'Stripe Balance', entity: 'LandveX AB', currency: 'SEK', balance: 23_450, trend: '+8%' },
    { name: 'Tax Reserve', entity: 'LandveX AB', currency: 'SEK', balance: 45_000, trend: '0%' },
  ],
  totalSEK: 252_770,
}

const REVENUE = {
  mtd: 67_400,
  lastMonth: 58_200,
  runRate: 808_800,
  growth: '+15.8%',
  sources: [
    { name: 'SaaS subscriptions', amount: 42_000, pct: 62 },
    { name: 'API usage', amount: 15_400, pct: 23 },
    { name: 'Professional services', amount: 10_000, pct: 15 },
  ],
}

const COSTS = {
  mtd: 52_100,
  fixed: [
    { name: 'Salaries + social', amount: 28_000 },
    { name: 'AWS infrastructure', amount: 8_200 },
    { name: 'Software licenses', amount: 3_400 },
    { name: 'Office / coworking', amount: 4_500 },
  ],
  variable: [
    { name: 'Stripe fees (2.9%)', amount: 1_950 },
    { name: 'Consulting', amount: 4_000 },
    { name: 'Marketing', amount: 2_050 },
  ],
}

const FORECAST = {
  burnRate: 52_100,
  netCashflow: 67_400 - 52_100,
  runway30: Math.round(252_770 / 52_100),
  runway60: Math.round(252_770 / (52_100 * 0.95)),
  runway90: Math.round(252_770 / (52_100 * 0.90)),
  breakeven: 'Jun 2026',
}

const TRANSACTIONS = [
  { date: '2026-03-25', desc: 'Stripe payout', amount: 12_400, type: 'in' as const },
  { date: '2026-03-24', desc: 'AWS invoice', amount: -8_200, type: 'out' as const },
  { date: '2026-03-23', desc: 'Client: Municipality X', amount: 25_000, type: 'in' as const },
  { date: '2026-03-22', desc: 'Salary payments', amount: -28_000, type: 'out' as const },
  { date: '2026-03-21', desc: 'API revenue', amount: 5_200, type: 'in' as const },
  { date: '2026-03-20', desc: 'Fortnox license', amount: -1_200, type: 'out' as const },
  { date: '2026-03-19', desc: 'Client: FastighetsAB', amount: 15_000, type: 'in' as const },
  { date: '2026-03-18', desc: 'Coworking rent', amount: -4_500, type: 'out' as const },
]

type TabId = 'overview' | 'revenue' | 'costs' | 'forecast' | 'transactions'

export function FinanceView() {
  const [tab, setTab] = useState<TabId>('overview')

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Cash Flow' },
    { id: 'revenue', label: 'Revenue' },
    { id: 'costs', label: 'Costs' },
    { id: 'forecast', label: 'Forecast' },
    { id: 'transactions', label: 'Transactions' },
  ]

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="border-b border-[#1A1C24] px-6 pt-5 pb-0 bg-[#0C0D12]">
        <h1 className="text-[15px] font-semibold text-[#E0E1E4]">Finance</h1>
        <p className="text-[12px] text-[#4A4F5C] mt-0.5 mb-4">Cash position, revenue, costs, forecast</p>
        <div className="flex gap-0 -mb-px">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="text-[12px] pb-2.5 mr-5 border-b-2 transition-colors"
              style={{ color: tab === t.id ? '#E0E1E4' : '#4A4F5C', borderColor: tab === t.id ? '#4A7A9B' : 'transparent', fontWeight: tab === t.id ? 600 : 400 }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-w-5xl">
        {tab === 'overview' && <CashFlowTab />}
        {tab === 'revenue' && <RevenueTab />}
        {tab === 'costs' && <CostsTab />}
        {tab === 'forecast' && <ForecastTab />}
        {tab === 'transactions' && <TransactionsTab />}
      </div>
    </div>
  )
}

function CashFlowTab() {
  return (
    <div className="space-y-6">
      {/* Total cash */}
      <div className="rounded-lg border border-[#1A1C24] bg-[#0E0F14] px-5 py-4">
        <div className="text-[12px] text-[#4A4F5C]">Total cash position</div>
        <div className="text-[28px] font-semibold text-[#E0E1E4] font-mono mt-1">
          {CASH_POSITION.totalSEK.toLocaleString('sv-SE')} <span className="text-[14px] text-[#4A4F5C]">SEK</span>
        </div>
        <div className="text-[12px] text-[#4A4F5C] mt-1">
          Net this month: <span className={FORECAST.netCashflow >= 0 ? 'text-[#4A7A5B]' : 'text-[#B04040]'}>{FORECAST.netCashflow >= 0 ? '+' : ''}{FORECAST.netCashflow.toLocaleString('sv-SE')} SEK</span>
        </div>
      </div>

      {/* Accounts */}
      <div>
        <h2 className="text-[12px] text-[#4A4F5C] font-medium mb-2">Accounts</h2>
        <div className="space-y-1.5">
          {CASH_POSITION.accounts.map(acc => (
            <div key={acc.name} className="flex items-center justify-between rounded-lg border border-[#1A1C24] bg-[#0E0F14] px-4 py-3">
              <div>
                <div className="text-[13px] text-[#E0E1E4]">{acc.name}</div>
                <div className="text-[11px] text-[#3D4452]">{acc.entity}</div>
              </div>
              <div className="text-right">
                <div className="text-[14px] font-mono text-[#E0E1E4]">{acc.balance.toLocaleString('sv-SE')}</div>
                <div className="text-[11px] text-[#4A4F5C]">{acc.currency}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function RevenueTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-[#1A1C24] bg-[#0E0F14] px-4 py-3">
          <div className="text-[11px] text-[#4A4F5C]">MTD Revenue</div>
          <div className="text-[20px] font-semibold text-[#E0E1E4] font-mono">{REVENUE.mtd.toLocaleString('sv-SE')}</div>
          <div className="text-[11px] text-[#4A7A5B]">{REVENUE.growth} vs last month</div>
        </div>
        <div className="rounded-lg border border-[#1A1C24] bg-[#0E0F14] px-4 py-3">
          <div className="text-[11px] text-[#4A4F5C]">Last Month</div>
          <div className="text-[20px] font-semibold text-[#E0E1E4] font-mono">{REVENUE.lastMonth.toLocaleString('sv-SE')}</div>
        </div>
        <div className="rounded-lg border border-[#1A1C24] bg-[#0E0F14] px-4 py-3">
          <div className="text-[11px] text-[#4A4F5C]">Annual Run Rate</div>
          <div className="text-[20px] font-semibold text-[#E0E1E4] font-mono">{REVENUE.runRate.toLocaleString('sv-SE')}</div>
        </div>
      </div>

      <div>
        <h2 className="text-[12px] text-[#4A4F5C] font-medium mb-2">Revenue sources</h2>
        <div className="space-y-1.5">
          {REVENUE.sources.map(s => (
            <div key={s.name} className="rounded-lg border border-[#1A1C24] bg-[#0E0F14] px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] text-[#E0E1E4]">{s.name}</span>
                <span className="text-[13px] font-mono text-[#E0E1E4]">{s.amount.toLocaleString('sv-SE')} SEK</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#1A1C24] overflow-hidden">
                <div className="h-full rounded-full bg-[#4A7A9B]" style={{ width: `${s.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CostsTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[#1A1C24] bg-[#0E0F14] px-5 py-4">
        <div className="text-[12px] text-[#4A4F5C]">Total costs MTD</div>
        <div className="text-[24px] font-semibold text-[#E0E1E4] font-mono">{COSTS.mtd.toLocaleString('sv-SE')} SEK</div>
      </div>

      <div>
        <h2 className="text-[12px] text-[#4A4F5C] font-medium mb-2">Fixed costs</h2>
        <div className="space-y-1">
          {COSTS.fixed.map(c => (
            <div key={c.name} className="flex items-center justify-between rounded-lg border border-[#1A1C24] bg-[#0E0F14] px-4 py-2.5">
              <span className="text-[13px] text-[#9CA3AF]">{c.name}</span>
              <span className="text-[13px] font-mono text-[#E0E1E4]">{c.amount.toLocaleString('sv-SE')}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-[12px] text-[#4A4F5C] font-medium mb-2">Variable costs</h2>
        <div className="space-y-1">
          {COSTS.variable.map(c => (
            <div key={c.name} className="flex items-center justify-between rounded-lg border border-[#1A1C24] bg-[#0E0F14] px-4 py-2.5">
              <span className="text-[13px] text-[#9CA3AF]">{c.name}</span>
              <span className="text-[13px] font-mono text-[#E0E1E4]">{c.amount.toLocaleString('sv-SE')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ForecastTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-[#1A1C24] bg-[#0E0F14] px-4 py-3">
          <div className="text-[11px] text-[#4A4F5C]">Monthly burn</div>
          <div className="text-[20px] font-semibold text-[#E0E1E4] font-mono">{FORECAST.burnRate.toLocaleString('sv-SE')}</div>
        </div>
        <div className="rounded-lg border border-[#1A1C24] bg-[#0E0F14] px-4 py-3">
          <div className="text-[11px] text-[#4A4F5C]">Net cashflow / mo</div>
          <div className="text-[20px] font-semibold font-mono" style={{ color: FORECAST.netCashflow >= 0 ? '#4A7A5B' : '#B04040' }}>
            {FORECAST.netCashflow >= 0 ? '+' : ''}{FORECAST.netCashflow.toLocaleString('sv-SE')}
          </div>
        </div>
        <div className="rounded-lg border border-[#1A1C24] bg-[#0E0F14] px-4 py-3">
          <div className="text-[11px] text-[#4A4F5C]">Breakeven est.</div>
          <div className="text-[20px] font-semibold text-[#E0E1E4]">{FORECAST.breakeven}</div>
        </div>
      </div>

      <div>
        <h2 className="text-[12px] text-[#4A4F5C] font-medium mb-2">Runway</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '30 days', months: FORECAST.runway30 },
            { label: '60 days', months: FORECAST.runway60 },
            { label: '90 days', months: FORECAST.runway90 },
          ].map(r => (
            <div key={r.label} className="rounded-lg border border-[#1A1C24] bg-[#0E0F14] px-4 py-3">
              <div className="text-[11px] text-[#4A4F5C]">Runway ({r.label} avg)</div>
              <div className="text-[24px] font-semibold text-[#E0E1E4] font-mono">{r.months}</div>
              <div className="text-[11px] text-[#4A4F5C]">months</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TransactionsTab() {
  return (
    <div>
      <div className="space-y-1">
        {TRANSACTIONS.map((tx, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border border-[#1A1C24] bg-[#0E0F14] px-4 py-2.5">
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-[#3D4452] font-mono w-20">{tx.date}</span>
              <span className="text-[13px] text-[#9CA3AF]">{tx.desc}</span>
            </div>
            <span className="text-[13px] font-mono" style={{ color: tx.type === 'in' ? '#4A7A5B' : '#9CA3AF' }}>
              {tx.type === 'in' ? '+' : ''}{tx.amount.toLocaleString('sv-SE')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
