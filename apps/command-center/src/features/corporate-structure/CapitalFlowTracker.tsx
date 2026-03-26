// ─── Capital Flow Tracker — Intercompany Money Movement ─────────────────────
// Visualizes all royalties, dividends, service fees, and revenue flows
// between entities. Bank-level ledger preparation.

import { useState } from 'react'
import { ENTITIES } from '../org-graph/data'
import { CAPITAL_FLOWS, type CapitalFlow, type FlowType, type FlowStatus } from './corporateData'

// ─── Colors ─────────────────────────────────────────────────────────────────

const FLOW_COLOR: Record<FlowType, string> = {
  royalty: '#F59E0B',
  dividend: '#8B5CF6',
  'service-fee': '#0EA5E9',
  revenue: '#10B981',
  intercompany: '#6B7280',
}

const STATUS_COLOR: Record<FlowStatus, string> = {
  active: '#10B981',
  planned: '#6B7280',
  'pending-agreement': '#F59E0B',
}

const STATUS_LABEL: Record<FlowStatus, string> = {
  active: 'Active',
  planned: 'Planned',
  'pending-agreement': 'Pending Agreement',
}

// ─── Summary Stats ──────────────────────────────────────────────────────────

function FlowSummary() {
  const byType = CAPITAL_FLOWS.reduce((acc, f) => {
    acc[f.flowType] = (acc[f.flowType] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const byStatus = CAPITAL_FLOWS.reduce((acc, f) => {
    acc[f.status] = (acc[f.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <div className="text-xs text-gray-600 mb-1">Total Flows</div>
        <div className="text-2xl font-bold text-white">{CAPITAL_FLOWS.length}</div>
      </div>
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <div className="text-xs text-gray-600 mb-1">Active</div>
        <div className="text-2xl font-bold text-[#10B981]">{byStatus['active'] ?? 0}</div>
      </div>
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <div className="text-xs text-gray-600 mb-1">Pending Agreement</div>
        <div className="text-2xl font-bold text-[#F59E0B]">{byStatus['pending-agreement'] ?? 0}</div>
      </div>
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <div className="text-xs text-gray-600 mb-1">Planned</div>
        <div className="text-2xl font-bold text-gray-500">{byStatus['planned'] ?? 0}</div>
      </div>
    </div>
  )
}

// ─── Flow Card ──────────────────────────────────────────────────────────────

function FlowCard({ flow, isExpanded, onToggle }: { flow: CapitalFlow; isExpanded: boolean; onToggle: () => void }) {
  const fromEntity = flow.fromEntityId === 'external' ? null : ENTITIES.find(e => e.id === flow.fromEntityId)
  const toEntity = ENTITIES.find(e => e.id === flow.toEntityId)
  const flowColor = FLOW_COLOR[flow.flowType]
  const statusColor = STATUS_COLOR[flow.status]

  return (
    <div
      className="rounded-xl border transition-all"
      style={{
        borderColor: isExpanded ? flowColor + '40' : 'rgba(255,255,255,0.06)',
        background: isExpanded ? flowColor + '06' : 'rgba(255,255,255,0.02)',
      }}
    >
      <button onClick={onToggle} className="w-full text-left px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Flow direction */}
          <div className="flex items-center gap-2 min-w-[200px]">
            <div className="flex items-center gap-1">
              {fromEntity ? (
                <span className="text-xs" style={{ color: fromEntity.color }}>{fromEntity.flag} {fromEntity.shortName}</span>
              ) : (
                <span className="text-xs text-gray-500">Customers</span>
              )}
            </div>
            <span className="text-gray-600">→</span>
            <div className="flex items-center gap-1">
              {toEntity ? (
                <span className="text-xs" style={{ color: toEntity.color }}>{toEntity.flag} {toEntity.shortName}</span>
              ) : (
                <span className="text-xs text-gray-500">???</span>
              )}
            </div>
          </div>

          {/* Label */}
          <span className="flex-1 text-sm text-gray-300 truncate">{flow.label}</span>

          {/* Type badge */}
          <span
            className="text-[10px] px-2 py-0.5 rounded font-mono flex-shrink-0"
            style={{ background: flowColor + '18', color: flowColor, border: `1px solid ${flowColor}25` }}
          >
            {flow.flowType}
          </span>

          {/* Status */}
          <span
            className="text-[10px] px-2 py-0.5 rounded font-mono flex-shrink-0"
            style={{ background: statusColor + '18', color: statusColor }}
          >
            {STATUS_LABEL[flow.status]}
          </span>

          {/* Frequency */}
          <span className="text-[10px] text-gray-600 font-mono w-16 text-right flex-shrink-0">
            {flow.frequency}
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-white/[0.04]">
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div>
              <div className="text-[10px] text-gray-600 mb-0.5">Amount</div>
              <div className="text-xs text-gray-300 font-mono">{flow.amount ?? 'TBD'}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-600 mb-0.5">Tax Impact</div>
              <div className="text-xs text-gray-300">{flow.taxImpact}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-600 mb-0.5">Notes</div>
              <div className="text-xs text-gray-300">{flow.notes}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sankey-style Flow Visualization ────────────────────────────────────────

function FlowSankey() {
  // Group flows by direction for visual
  const toDubai = CAPITAL_FLOWS.filter(f => f.toEntityId === 'wavult-group' || f.toEntityId === 'wavult-operations')
  const fromCustomers = CAPITAL_FLOWS.filter(f => f.fromEntityId === 'external')

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-4">Capital Flow Map</h3>

      <div className="space-y-4">
        {/* Revenue layer */}
        <div>
          <div className="text-[10px] text-gray-700 font-mono mb-2">REVENUE IN (from customers)</div>
          <div className="flex gap-2 flex-wrap">
            {fromCustomers.map(f => {
              const to = ENTITIES.find(e => e.id === f.toEntityId)
              return (
                <div key={f.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs"
                  style={{ borderColor: '#10B98125', background: '#10B98108' }}>
                  <span className="text-[#10B981] font-bold text-[10px]">$</span>
                  <span className="text-gray-600">→</span>
                  <span style={{ color: to?.color }}>{to?.flag} {to?.shortName}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center gap-2 ml-6">
          <div className="w-px h-6 bg-gradient-to-b from-[#10B981] to-[#F59E0B]" />
          <span className="text-[9px] text-gray-700 font-mono">royalties + service fees + dividends</span>
        </div>

        {/* To Dubai layer */}
        <div>
          <div className="text-[10px] text-gray-700 font-mono mb-2">CAPITAL EXTRACTION (to holding)</div>
          <div className="flex gap-2 flex-wrap">
            {toDubai.map(f => {
              const from = ENTITIES.find(e => e.id === f.fromEntityId)
              const color = FLOW_COLOR[f.flowType]
              return (
                <div key={f.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs"
                  style={{ borderColor: color + '25', background: color + '08' }}>
                  <span style={{ color: from?.color }}>{from?.flag} {from?.shortName}</span>
                  <span className="text-gray-600">→</span>
                  <span className="font-mono text-[10px]" style={{ color }}>{f.flowType}</span>
                  <span className="text-gray-600">→ WGH</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Result */}
        <div className="rounded-lg border border-[#8B5CF620] bg-[#8B5CF608] px-4 py-3 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🇦🇪</span>
            <div>
              <div className="text-sm font-bold text-[#8B5CF6]">Wavult Group (Dubai) — 0% tax</div>
              <div className="text-[10px] text-gray-600">Capital accumulates here. Reinvest or distribute as needed.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-white/[0.04]">
        {Object.entries(FLOW_COLOR).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: color }} />
            <span className="text-[10px] text-gray-600 font-mono">{type}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

type FilterType = 'all' | FlowType

export function CapitalFlowTracker() {
  const [filter, setFilter] = useState<FilterType>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = filter === 'all' ? CAPITAL_FLOWS : CAPITAL_FLOWS.filter(f => f.flowType === filter)

  const filters: { value: FilterType; label: string; color: string }[] = [
    { value: 'all', label: 'All', color: '#9CA3AF' },
    { value: 'revenue', label: 'Revenue', color: FLOW_COLOR.revenue },
    { value: 'royalty', label: 'Royalty', color: FLOW_COLOR.royalty },
    { value: 'service-fee', label: 'Service Fee', color: FLOW_COLOR['service-fee'] },
    { value: 'dividend', label: 'Dividend', color: FLOW_COLOR.dividend },
  ]

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-lg font-bold text-white">Capital Flow Tracker</h1>
          <p className="text-xs text-gray-600 mt-0.5">Intercompany money movements — royalties, dividends, service fees</p>
        </div>

        {/* Summary */}
        <FlowSummary />

        {/* Sankey visualization */}
        <FlowSankey />

        {/* Filter bar */}
        <div className="flex gap-2 mt-6 mb-4">
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className="text-[10px] px-3 py-1.5 rounded-lg border font-mono transition-all"
              style={{
                borderColor: filter === f.value ? f.color + '50' : 'rgba(255,255,255,0.06)',
                background: filter === f.value ? f.color + '15' : 'transparent',
                color: filter === f.value ? f.color : '#6B7280',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Flow list */}
        <div className="space-y-2">
          {filtered.map(flow => (
            <FlowCard
              key={flow.id}
              flow={flow}
              isExpanded={expandedId === flow.id}
              onToggle={() => setExpandedId(expandedId === flow.id ? null : flow.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
