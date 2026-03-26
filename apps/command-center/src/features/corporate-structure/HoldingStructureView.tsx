// ─── Holding Structure View — Interactive Corporate Graph ───────────────────
// Visual representation of the multi-jurisdictional holding structure.
// Dubai → US → EU → IP flows rendered as a layered tree.

import { useState } from 'react'
import { ENTITIES } from '../org-graph/data'
import { HOLDING_NODES, CAPITAL_FLOWS, type HoldingNode, type CapitalFlow } from './corporateData'

// ─── Colors ─────────────────────────────────────────────────────────────────

const TIER_COLOR: Record<string, string> = {
  'top-holding': '#8B5CF6',
  'ip-company': '#A78BFA',
  'us-operations': '#22D3EE',
  'eu-operations': '#10B981',
  'service-company': '#0EA5E9',
}

const FLOW_TYPE_COLOR: Record<string, string> = {
  royalty: '#F59E0B',
  dividend: '#8B5CF6',
  'service-fee': '#0EA5E9',
  revenue: '#10B981',
  intercompany: '#6B7280',
}

const STATUS_COLOR: Record<string, string> = {
  active: '#10B981',
  pending: '#F59E0B',
  'not-started': '#6B7280',
  complete: '#10B981',
  'in-progress': '#F59E0B',
  planned: '#6B7280',
}

// ─── Node Card ──────────────────────────────────────────────────────────────

function NodeCard({
  node,
  isSelected,
  onClick,
}: {
  node: HoldingNode
  isSelected: boolean
  onClick: () => void
}) {
  const entity = ENTITIES.find(e => e.id === node.entityId)
  if (!entity) return null

  const tierColor = TIER_COLOR[node.tier] ?? '#6B7280'

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border px-4 py-3.5 transition-all hover:scale-[1.01]"
      style={{
        borderColor: isSelected ? entity.color + '60' : 'rgba(255,255,255,0.06)',
        background: isSelected ? entity.color + '10' : 'rgba(255,255,255,0.02)',
        boxShadow: isSelected ? `0 0 20px ${entity.color}15` : undefined,
      }}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">{entity.flag}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-white">{entity.shortName}</span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-mono"
              style={{ background: tierColor + '18', color: tierColor, border: `1px solid ${tierColor}25` }}
            >
              {node.tier}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{entity.name}</div>
          <div className="text-xs text-gray-600 font-mono mt-1">{node.tierLabel}</div>

          {/* Key stats row */}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-600">Tax:</span>
              <span className="text-[10px] font-mono font-bold" style={{ color: node.taxRate === '0%' ? '#10B981' : '#F59E0B' }}>
                {node.taxRate}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_COLOR[node.bankStatus] }} />
              <span className="text-[10px] text-gray-600">Bank: {node.bankStatus}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_COLOR[node.incorporationStatus] }} />
              <span className="text-[10px] text-gray-600">Inc: {node.incorporationStatus}</span>
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}

// ─── Detail Panel ───────────────────────────────────────────────────────────

function NodeDetail({ node }: { node: HoldingNode }) {
  const entity = ENTITIES.find(e => e.id === node.entityId)
  if (!entity) return null

  const inflows = CAPITAL_FLOWS.filter(f => f.toEntityId === node.entityId)
  const outflows = CAPITAL_FLOWS.filter(f => f.fromEntityId === node.entityId)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{entity.flag}</span>
          <h2 className="text-lg font-bold text-white">{entity.name}</h2>
        </div>
        <p className="text-xs text-gray-500">{node.tierDescription}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <div className="text-xs text-gray-600 mb-1">Jurisdiction</div>
          <div className="text-sm font-semibold text-white">{entity.jurisdiction}</div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <div className="text-xs text-gray-600 mb-1">Tax Rate</div>
          <div className="text-sm font-bold" style={{ color: node.taxRate === '0%' ? '#10B981' : '#F59E0B' }}>
            {node.taxRate}
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <div className="text-xs text-gray-600 mb-1">Bank</div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLOR[node.bankStatus] }} />
            <span className="text-sm text-gray-200">{node.bankName ?? 'Not set up'}</span>
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <div className="text-xs text-gray-600 mb-1">Incorporation</div>
          <div className="text-sm font-semibold" style={{ color: STATUS_COLOR[node.incorporationStatus] }}>
            {node.incorporationStatus}
          </div>
        </div>
      </div>

      {/* Key Functions */}
      <div>
        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Key Functions</h3>
        <div className="flex flex-wrap gap-1.5">
          {node.keyFunctions.map(fn => (
            <span key={fn} className="text-[10px] px-2 py-1 rounded-lg bg-white/[0.04] text-gray-400 font-mono">{fn}</span>
          ))}
        </div>
      </div>

      {/* Capital Flows */}
      {inflows.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Inflows ({inflows.length})</h3>
          <div className="space-y-1.5">
            {inflows.map(flow => {
              const from = flow.fromEntityId === 'external' ? null : ENTITIES.find(e => e.id === flow.fromEntityId)
              return (
                <div key={flow.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs"
                  style={{ borderColor: '#10B98120', background: '#10B98108' }}>
                  <span className="text-[#10B981] font-bold">IN</span>
                  <span className="text-gray-300">{from ? `${from.flag} ${from.shortName}` : 'Customers'}</span>
                  <span className="text-gray-600 flex-1 truncate">{flow.label}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                    style={{ background: FLOW_TYPE_COLOR[flow.flowType] + '18', color: FLOW_TYPE_COLOR[flow.flowType] }}>
                    {flow.flowType}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {outflows.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Outflows ({outflows.length})</h3>
          <div className="space-y-1.5">
            {outflows.map(flow => {
              const to = ENTITIES.find(e => e.id === flow.toEntityId)
              return (
                <div key={flow.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs"
                  style={{ borderColor: '#F59E0B20', background: '#F59E0B08' }}>
                  <span className="text-[#F59E0B] font-bold">OUT</span>
                  <span className="text-gray-300">{to ? `${to.flag} ${to.shortName}` : '???'}</span>
                  <span className="text-gray-600 flex-1 truncate">{flow.label}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                    style={{ background: FLOW_TYPE_COLOR[flow.flowType] + '18', color: FLOW_TYPE_COLOR[flow.flowType] }}>
                    {flow.flowType}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Flow Diagram (SVG) ─────────────────────────────────────────────────────

function FlowDiagram({ selectedEntityId }: { selectedEntityId: string | null }) {
  // Simplified visual: layered boxes with arrows
  const layers = [
    { label: 'HOLDING (Dubai)', entities: ['wavult-group'], y: 0 },
    { label: 'OPERATIONS (Dubai)', entities: ['wavult-operations'], y: 1 },
    { label: 'SUBSIDIARIES', entities: ['landvex-ab', 'landvex-inc', 'quixzoom-uab', 'quixzoom-inc'], y: 2 },
  ]

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-4">Structure Overview</h3>
      <div className="space-y-3">
        {layers.map((layer, li) => (
          <div key={layer.label}>
            <div className="text-[10px] text-gray-600 font-mono mb-1.5">{layer.label}</div>
            <div className="flex gap-2 flex-wrap">
              {layer.entities.map(eid => {
                const entity = ENTITIES.find(e => e.id === eid)
                if (!entity) return null
                const isSelected = selectedEntityId === eid
                return (
                  <div
                    key={eid}
                    className="px-3 py-2 rounded-lg border text-xs font-semibold transition-all"
                    style={{
                      background: isSelected ? entity.color + '18' : entity.color + '08',
                      borderColor: isSelected ? entity.color + '50' : entity.color + '20',
                      color: entity.color,
                      boxShadow: isSelected ? `0 0 12px ${entity.color}20` : undefined,
                    }}
                  >
                    {entity.flag} {entity.shortName}
                  </div>
                )
              })}
            </div>
            {li < layers.length - 1 && (
              <div className="flex items-center gap-2 mt-2 ml-4">
                <div className="w-px h-4 bg-white/10" />
                <span className="text-[9px] text-gray-700 font-mono">
                  {li === 0 ? 'owns 100% + IP license' : 'service fee + royalty'}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Flow legend */}
      <div className="flex flex-wrap gap-3 mt-5 pt-3 border-t border-white/[0.04]">
        {Object.entries(FLOW_TYPE_COLOR).map(([type, color]) => (
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

export function HoldingStructureView() {
  const [selectedNode, setSelectedNode] = useState<string>('wavult-group')

  const selected = HOLDING_NODES.find(n => n.entityId === selectedNode) ?? HOLDING_NODES[0]

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left — Node list */}
      <div className="w-80 flex-shrink-0 border-r border-white/[0.06] overflow-y-auto p-4 space-y-2">
        <div className="mb-3">
          <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Holding Structure</h2>
          <p className="text-[10px] text-gray-700 mt-0.5">Multi-jurisdictional corporate architecture</p>
        </div>
        {HOLDING_NODES.map(node => (
          <NodeCard
            key={node.entityId}
            node={node}
            isSelected={selectedNode === node.entityId}
            onClick={() => setSelectedNode(node.entityId)}
          />
        ))}
      </div>

      {/* Right — Detail + diagram */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <FlowDiagram selectedEntityId={selectedNode} />
        <NodeDetail node={selected} />
      </div>
    </div>
  )
}
