// ─── Split Engine View — Real-Time Payment Splitting ────────────────────────
// Visualizes the split logic: Customer payment → entity split → settlement.
// This is the Uber-style money flow diagram.

import { useState } from 'react'
import { ENTITIES } from '../org-graph/data'

// ─── Split Rules ────────────────────────────────────────────────────────────

interface SplitRule {
  id: string
  name: string
  trigger: string
  sourceEntity: string
  splits: SplitAllocation[]
  totalPct: number
  notes: string
}

interface SplitAllocation {
  entityId: string
  percentage: number
  type: 'revenue' | 'royalty' | 'service-fee' | 'tax-reserve' | 'profit'
  label: string
}

const SPLIT_RULES: SplitRule[] = [
  {
    id: 'sr-1',
    name: 'US Customer → LandveX Inc',
    trigger: 'Customer jurisdiction = US',
    sourceEntity: 'landvex-inc',
    totalPct: 100,
    splits: [
      { entityId: 'landvex-inc', percentage: 55, type: 'revenue', label: 'US OpCo net revenue' },
      { entityId: 'wavult-group', percentage: 10, type: 'royalty', label: 'IP royalty (Dubai)' },
      { entityId: 'wavult-operations', percentage: 14, type: 'service-fee', label: 'Service fee (Dubai ops)' },
      { entityId: 'landvex-inc', percentage: 21, type: 'tax-reserve', label: 'Federal + state tax reserve' },
    ],
    notes: '$100 payment → $55 retained, $10 royalty (0% UAE), $14 service fee (0% UAE), $21 tax reserve',
  },
  {
    id: 'sr-2',
    name: 'EU Customer → LandveX AB (SE)',
    trigger: 'Customer jurisdiction = SE/EU',
    sourceEntity: 'landvex-ab',
    totalPct: 100,
    splits: [
      { entityId: 'landvex-ab', percentage: 49.4, type: 'revenue', label: 'SE OpCo net revenue' },
      { entityId: 'wavult-group', percentage: 10, type: 'royalty', label: 'IP royalty (Dubai)' },
      { entityId: 'wavult-operations', percentage: 14, type: 'service-fee', label: 'Service fee (Dubai ops)' },
      { entityId: 'landvex-ab', percentage: 20.6, type: 'tax-reserve', label: 'Swedish corporate tax reserve' },
      { entityId: 'landvex-ab', percentage: 6, type: 'profit', label: 'VAT reserve (25% on taxable)' },
    ],
    notes: '1000 SEK → 494 retained, 100 royalty, 140 service fee, 206 tax, 60 VAT reserve',
  },
  {
    id: 'sr-3',
    name: 'EU Customer → QuiXzoom UAB (LT)',
    trigger: 'Customer jurisdiction = EU (quiXzoom)',
    sourceEntity: 'quixzoom-uab',
    totalPct: 100,
    splits: [
      { entityId: 'quixzoom-uab', percentage: 61, type: 'revenue', label: 'LT OpCo net revenue' },
      { entityId: 'wavult-group', percentage: 10, type: 'royalty', label: 'IP royalty (Dubai)' },
      { entityId: 'wavult-operations', percentage: 14, type: 'service-fee', label: 'Service fee (Dubai ops)' },
      { entityId: 'quixzoom-uab', percentage: 15, type: 'tax-reserve', label: 'Lithuanian corporate tax' },
    ],
    notes: '€100 → €61 retained, €10 royalty, €14 service fee, €15 tax. LT = 15% (lower than SE 20.6%)',
  },
  {
    id: 'sr-4',
    name: 'US Customer → QuiXzoom Inc (DE)',
    trigger: 'Customer jurisdiction = US (quiXzoom)',
    sourceEntity: 'quixzoom-inc',
    totalPct: 100,
    splits: [
      { entityId: 'quixzoom-inc', percentage: 55, type: 'revenue', label: 'US OpCo net revenue' },
      { entityId: 'wavult-group', percentage: 10, type: 'royalty', label: 'IP royalty (Dubai)' },
      { entityId: 'wavult-operations', percentage: 14, type: 'service-fee', label: 'Service fee (Dubai ops)' },
      { entityId: 'quixzoom-inc', percentage: 21, type: 'tax-reserve', label: 'Federal + DE state tax' },
    ],
    notes: '$100 → $55 retained, $10 royalty (0% UAE), $14 service fee (0% UAE), $21 tax',
  },
]

// ─── Colors ─────────────────────────────────────────────────────────────────

const SPLIT_TYPE_COLOR: Record<string, string> = {
  revenue: '#10B981',
  royalty: '#8B5CF6',
  'service-fee': '#0EA5E9',
  'tax-reserve': '#EF4444',
  profit: '#F59E0B',
}

// ─── Live Split Simulator ───────────────────────────────────────────────────

function SplitSimulator() {
  const [amount, setAmount] = useState(1000)
  const [ruleId, setRuleId] = useState('sr-1')

  const rule = SPLIT_RULES.find(r => r.id === ruleId)!

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 mb-6">
      <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-4">Split Simulator</h3>

      <div className="flex gap-4 mb-4">
        <div>
          <label className="text-[10px] text-gray-600 block mb-1">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(Number(e.target.value))}
            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white font-mono w-32 focus:outline-none focus:border-white/[0.2]"
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-600 block mb-1">Split Rule</label>
          <select
            value={ruleId}
            onChange={e => setRuleId(e.target.value)}
            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white font-mono focus:outline-none appearance-none"
          >
            {SPLIT_RULES.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Visual split */}
      <div className="space-y-2">
        {rule.splits.map((split, i) => {
          const entity = ENTITIES.find(e => e.id === split.entityId)
          const splitAmount = Math.round(amount * split.percentage) / 100
          const color = SPLIT_TYPE_COLOR[split.type]

          return (
            <div key={i} className="flex items-center gap-3">
              {/* Bar */}
              <div className="flex-1 h-8 rounded-lg overflow-hidden bg-white/[0.02] border border-white/[0.04] relative">
                <div
                  className="h-full rounded-lg transition-all duration-300"
                  style={{ width: `${split.percentage}%`, background: color + '30' }}
                />
                <div className="absolute inset-0 flex items-center px-3 justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold" style={{ color }}>{split.percentage}%</span>
                    <span className="text-[10px] text-gray-400">{split.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {entity && (
                      <span className="text-[9px]" style={{ color: entity.color }}>{entity.flag} {entity.shortName}</span>
                    )}
                    <span className="text-[10px] font-mono text-white font-bold">${splitAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
        <div className="text-[10px] text-gray-600">
          To Dubai (0% tax): <span className="text-[#8B5CF6] font-bold">
            ${Math.round(amount * (rule.splits.filter(s => ENTITIES.find(e => e.id === s.entityId)?.jurisdiction === 'Dubai').reduce((sum, s) => sum + s.percentage, 0)) / 100).toLocaleString()}
          </span>
        </div>
        <div className="text-[10px] text-gray-600 font-mono">{rule.notes}</div>
      </div>
    </div>
  )
}

// ─── Flow Diagram ───────────────────────────────────────────────────────────

function SplitFlowDiagram() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 mb-6">
      <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-4">Payment Split Flow</h3>

      <div className="font-mono text-[10px] leading-relaxed space-y-1 text-gray-500">
        <div><span className="text-white">[Customer US]</span></div>
        <div>{'     │'}</div>
        <div>{'     ▼'}</div>
        <div>(1) <span className="text-[#10B981]">Payment Intent</span></div>
        <div>{'     │'}</div>
        <div>{'     ▼'}</div>
        <div>[<span className="text-[#635BFF]">PSP US - Stripe</span>]</div>
        <div>{'     │'}</div>
        <div>{'     ▼'}</div>
        <div>(2) <span className="text-[#22D3EE]">Authorization OK</span></div>
        <div>{'     │'}</div>
        <div>{'     ▼'}</div>
        <div>(3) <span className="text-[#F59E0B]">Ledger Entry (REAL-TIME)</span></div>
        <div>{'     │'}</div>
        <div>{'     ▼'}</div>
        <div className="text-white font-bold">Split Engine:</div>
        <div>{'  '}├─ <span className="text-[#10B981]">US OpCo: $55</span> <span className="text-gray-700">(net revenue)</span></div>
        <div>{'  '}├─ <span className="text-[#8B5CF6]">Dubai HoldCo: $10</span> <span className="text-gray-700">(IP royalty, 0% tax)</span></div>
        <div>{'  '}├─ <span className="text-[#0EA5E9]">Dubai Ops: $14</span> <span className="text-gray-700">(service fee, 0% tax)</span></div>
        <div>{'  '}└─ <span className="text-[#EF4444]">Tax Reserve: $21</span> <span className="text-gray-700">(federal + state)</span></div>
        <div>{'     │'}</div>
        <div>{'     ▼'}</div>
        <div>(4) <span className="text-[#F59E0B]">Internal Settlement Graph</span></div>
        <div>{'     │'}</div>
        <div>{'     ▼'}</div>
        <div>(5) <span className="text-[#10B981]">Payout scheduling / instant payout</span></div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-white/[0.04]">
        {Object.entries(SPLIT_TYPE_COLOR).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: color }} />
            <span className="text-[10px] text-gray-600 font-mono">{type}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Split Rules Table ──────────────────────────────────────────────────────

function SplitRulesTable() {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Split Rules ({SPLIT_RULES.length})</h3>
      <div className="space-y-2">
        {SPLIT_RULES.map(rule => {
          const sourceEntity = ENTITIES.find(e => e.id === rule.sourceEntity)
          const isExpanded = expandedId === rule.id

          return (
            <div key={rule.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <button onClick={() => setExpandedId(isExpanded ? null : rule.id)} className="w-full text-left px-4 py-3">
                <div className="flex items-center gap-3">
                  {sourceEntity && (
                    <span className="text-base flex-shrink-0">{sourceEntity.flag}</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">{rule.name}</div>
                    <div className="text-[10px] text-gray-600 font-mono mt-0.5">{rule.trigger}</div>
                  </div>
                  <span className="text-[10px] text-gray-600 font-mono">{rule.splits.length} splits</span>
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-white/[0.04] pt-3 space-y-1.5">
                  {rule.splits.map((split, i) => {
                    const entity = ENTITIES.find(e => e.id === split.entityId)
                    const color = SPLIT_TYPE_COLOR[split.type]
                    return (
                      <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-white/[0.04]">
                        <span className="text-[10px] font-mono font-bold w-10" style={{ color }}>{split.percentage}%</span>
                        <span className="text-xs text-gray-300 flex-1">{split.label}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                          style={{ background: color + '18', color }}>
                          {split.type}
                        </span>
                        {entity && (
                          <span className="text-[9px]" style={{ color: entity.color }}>{entity.flag} {entity.shortName}</span>
                        )}
                      </div>
                    )
                  })}
                  <div className="text-[10px] text-gray-600 mt-2 bg-white/[0.02] rounded-lg px-3 py-2">
                    {rule.notes}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main ───────────────────────────────────────────────────────────────────

export function SplitEngineView() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-white">Split Engine</h2>
          <p className="text-[10px] text-gray-600 mt-0.5">
            Real-time payment splitting — every dollar routed to the correct entity, tax-optimized
          </p>
        </div>

        <SplitFlowDiagram />
        <SplitSimulator />
        <SplitRulesTable />
      </div>
    </div>
  )
}
