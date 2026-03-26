// ─── Transaction Flow View — Uber-style Money Flows ─────────────────────────
// Visualizes every payment flow: inbound, outbound, intercompany.
// Each flow shows step-by-step system traversal.

import { useState } from 'react'
import { ENTITIES } from '../org-graph/data'
import {
  TRANSACTION_FLOWS, type TransactionFlow, type FlowDirection,
  getComponentById,
} from './paymentOsData'

const DIR_COLOR: Record<FlowDirection, string> = {
  inbound: '#10B981',
  outbound: '#EF4444',
  intercompany: '#F59E0B',
}

const DIR_ICON: Record<FlowDirection, string> = {
  inbound: '↓',
  outbound: '↑',
  intercompany: '↔',
}

function FlowCard({ flow, isExpanded, onToggle }: { flow: TransactionFlow; isExpanded: boolean; onToggle: () => void }) {
  const dirColor = DIR_COLOR[flow.direction]

  return (
    <div
      className="rounded-xl border transition-all"
      style={{
        borderColor: isExpanded ? dirColor + '40' : 'rgba(255,255,255,0.06)',
        background: isExpanded ? dirColor + '04' : 'rgba(255,255,255,0.02)',
      }}
    >
      <button onClick={onToggle} className="w-full text-left px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ background: dirColor + '20', color: dirColor }}
          >
            {DIR_ICON[flow.direction]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{flow.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                style={{ background: dirColor + '18', color: dirColor }}>
                {flow.direction}
              </span>
            </div>
            <div className="text-xs text-gray-600 mt-0.5">{flow.description}</div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 text-[10px] font-mono text-gray-600">
            <span>{flow.frequency}</span>
            <span>{flow.estimatedVolume}</span>
            <span>{flow.steps.length} steps</span>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 border-t border-white/[0.04]">
          {/* Entities involved */}
          <div className="flex gap-2 mt-3 mb-4">
            {flow.entities.map(eid => {
              const entity = ENTITIES.find(e => e.id === eid)
              return entity ? (
                <span key={eid} className="text-[10px] px-2 py-0.5 rounded"
                  style={{ background: entity.color + '15', color: entity.color }}>
                  {entity.flag} {entity.shortName}
                </span>
              ) : null
            })}
          </div>

          {/* Step-by-step flow */}
          <div className="space-y-0">
            {flow.steps.map((step, i) => {
              const comp = getComponentById(step.system)
              const entity = ENTITIES.find(e => e.id === step.entity)
              const isLast = i === flow.steps.length - 1

              return (
                <div key={i} className="flex gap-3">
                  {/* Timeline */}
                  <div className="flex flex-col items-center w-6 flex-shrink-0">
                    <div
                      className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ background: dirColor + '20', color: dirColor }}
                    >
                      {step.order}
                    </div>
                    {!isLast && <div className="w-px flex-1 min-h-[24px]" style={{ background: dirColor + '20' }} />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-3">
                    <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white">{step.action}</span>
                        {comp && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] text-gray-500 font-mono">
                            {comp.name}
                          </span>
                        )}
                        {entity && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded"
                            style={{ background: entity.color + '15', color: entity.color }}>
                            {entity.flag} {entity.shortName}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-600 mt-1">{step.notes}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function TransactionFlowView() {
  const [filter, setFilter] = useState<FlowDirection | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>('tf-1')

  const filtered = filter === 'all' ? TRANSACTION_FLOWS : TRANSACTION_FLOWS.filter(f => f.direction === filter)

  const filters: { value: FlowDirection | 'all'; label: string; color: string }[] = [
    { value: 'all', label: 'All Flows', color: '#9CA3AF' },
    { value: 'inbound', label: 'Inbound', color: DIR_COLOR.inbound },
    { value: 'outbound', label: 'Outbound', color: DIR_COLOR.outbound },
    { value: 'intercompany', label: 'Intercompany', color: DIR_COLOR.intercompany },
  ]

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-white">Transaction Flows</h2>
          <p className="text-[10px] text-gray-600 mt-0.5">End-to-end money movement — every step logged, every system traced</p>
        </div>

        {/* Event flow principle */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-3 mb-5">
          <div className="text-[10px] text-gray-700 font-mono mb-1">EVENT-DRIVEN FLOW PRINCIPLE</div>
          <div className="font-mono text-[10px] text-gray-500 space-x-2">
            <span className="text-[#10B981]">PaymentCreated</span>
            <span className="text-gray-700">→</span>
            <span className="text-[#22D3EE]">PaymentRouted</span>
            <span className="text-gray-700">→</span>
            <span className="text-[#F59E0B]">PaymentAuthorized</span>
            <span className="text-gray-700">→</span>
            <span className="text-[#8B5CF6]">LedgerWritten</span>
            <span className="text-gray-700">→</span>
            <span className="text-[#10B981]">PaymentSettled</span>
          </div>
          <div className="text-[10px] text-gray-700 mt-1">Every event: logged, replayable, auditable. Immutable append-only.</div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
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
              {f.label} ({f.value === 'all' ? TRANSACTION_FLOWS.length : TRANSACTION_FLOWS.filter(fl => fl.direction === f.value).length})
            </button>
          ))}
        </div>

        {/* Flows */}
        <div className="space-y-3">
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
