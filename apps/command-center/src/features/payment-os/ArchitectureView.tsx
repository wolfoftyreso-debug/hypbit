// ─── Architecture View — 4-Layer Payment OS ────────────────────────────────
// Layer 0: Payment Core (Hyperswitch)
// Layer 1: Clearing & Settlement (Mojaloop)
// Layer 2: Ledger & Billing (Lago + LedgerSMB)
// Layer 3: Integrations (Stripe, Adyen, Wise, BTCPay)

import { useState } from 'react'
import { ENTITIES } from '../org-graph/data'
import { ARCH_LAYERS, type SystemComponent, type ArchLayerMeta } from './paymentOsData'

const STATUS_COLOR: Record<string, string> = {
  live: '#10B981',
  deploying: '#22D3EE',
  planned: '#F59E0B',
  evaluating: '#6B7280',
}

const PRIORITY_COLOR: Record<string, string> = {
  critical: '#EF4444',
  high: '#F59E0B',
  medium: '#6B7280',
  low: '#3D4452',
}

function ComponentCard({
  comp,
  layerColor,
  isExpanded,
  onToggle,
}: {
  comp: SystemComponent
  layerColor: string
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <div
      className="rounded-xl border transition-all"
      style={{
        borderColor: isExpanded ? layerColor + '40' : 'rgba(255,255,255,0.06)',
        background: isExpanded ? layerColor + '06' : 'rgba(255,255,255,0.02)',
      }}
    >
      <button onClick={onToggle} className="w-full text-left px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0"
            style={{ background: layerColor + '20', color: layerColor }}
          >
            {comp.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-white">{comp.name}</span>
              <span className="text-[10px] font-mono text-gray-600">{comp.technology}</span>
              {comp.repo && (
                <span className="text-[9px] text-gray-700 font-mono">{comp.repo}</span>
              )}
            </div>
            <div className="text-[10px] text-gray-600 mt-0.5 truncate">{comp.description.slice(0, 80)}...</div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-mono"
              style={{ background: PRIORITY_COLOR[comp.priority] + '18', color: PRIORITY_COLOR[comp.priority] }}
            >
              {comp.priority}
            </span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-mono"
              style={{ background: STATUS_COLOR[comp.status] + '18', color: STATUS_COLOR[comp.status] }}
            >
              {comp.status}
            </span>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-white/[0.04] space-y-3">
          <p className="text-xs text-gray-400 leading-relaxed">{comp.description}</p>

          <div>
            <div className="text-[10px] text-gray-600 mb-1.5">Capabilities</div>
            <div className="flex flex-wrap gap-1.5">
              {comp.capabilities.map(cap => (
                <span key={cap} className="text-[9px] px-2 py-0.5 rounded-lg bg-white/[0.04] text-gray-500 font-mono">{cap}</span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] text-gray-600 mb-1">Entity Scope</div>
              <div className="flex flex-wrap gap-1">
                {comp.entityScope.map(eid => {
                  const entity = ENTITIES.find(e => e.id === eid)
                  return entity ? (
                    <span key={eid} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: entity.color + '15', color: entity.color }}>
                      {entity.flag} {entity.shortName}
                    </span>
                  ) : null
                })}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-gray-600 mb-1">Deploy Target</div>
              <div className="text-[10px] text-gray-400 font-mono">{comp.deployTarget}</div>
            </div>
          </div>

          {comp.notes && (
            <div className="text-[10px] text-gray-600 bg-white/[0.02] rounded-lg px-3 py-2 border border-white/[0.04]">
              {comp.notes}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function LayerSection({
  layer,
  isExpanded,
  onToggle,
  expandedComp,
  onToggleComp,
}: {
  layer: ArchLayerMeta
  isExpanded: boolean
  onToggle: () => void
  expandedComp: string | null
  onToggleComp: (id: string) => void
}) {
  const liveCount = layer.components.filter(c => c.status === 'live').length
  const critCount = layer.components.filter(c => c.priority === 'critical').length

  return (
    <div className="rounded-xl border border-white/[0.06] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-4 transition-all"
        style={{ background: isExpanded ? layer.color + '06' : 'rgba(255,255,255,0.02)' }}
      >
        <div className="flex items-center gap-4">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0"
            style={{ background: layer.color + '20', color: layer.color }}
          >
            {layer.layer}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{layer.label}</span>
              <span className="text-[10px] text-gray-600 font-mono">{layer.subtitle}</span>
            </div>
            <div className="text-xs text-gray-600 mt-0.5">{layer.description.slice(0, 100)}...</div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 text-[10px] font-mono">
            <span className="text-gray-600">{layer.components.length} components</span>
            {liveCount > 0 && <span className="text-[#10B981]">{liveCount} live</span>}
            {critCount > 0 && <span className="text-[#EF4444]">{critCount} critical</span>}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-5 pb-4 space-y-2 border-t border-white/[0.04]">
          <div className="pt-3" />
          {layer.components.map(comp => (
            <ComponentCard
              key={comp.id}
              comp={comp}
              layerColor={layer.color}
              isExpanded={expandedComp === comp.id}
              onToggle={() => onToggleComp(comp.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── System Diagram ─────────────────────────────────────────────────────────

function SystemDiagram() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 mb-6">
      <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-4">System Architecture</h3>

      {/* ASCII-style diagram */}
      <div className="font-mono text-[10px] leading-relaxed space-y-1 text-gray-500">
        <div className="text-gray-400">{'                 ┌──────────────────────────┐'}</div>
        <div className="text-gray-400">{'                 │'} <span className="text-white font-bold">FRONTENDS</span> {'             │'}</div>
        <div className="text-gray-400">{'                 │  Apps / APIs / Admin     │'}</div>
        <div className="text-gray-400">{'                 └──────────┬───────────────┘'}</div>
        <div className="text-gray-400">{'                            │'}</div>
        <div className="text-gray-400">{'                  ┌─────────▼─────────┐'}</div>
        <div className="text-gray-400">{'                  │'} <span className="text-[#22D3EE]">API GATEWAY</span> {'      │'}</div>
        <div className="text-gray-400">{'                  └─────────┬─────────┘'}</div>
        <div className="text-gray-400">{'           ┌────────────────┼────────────────┐'}</div>
        <div>
          <span className="text-[#EF4444]">{'   ┌───────▼───────┐'}</span>
          {'  '}
          <span className="text-[#F59E0B]">{'┌───────▼────────┐'}</span>
          {'  '}
          <span className="text-[#10B981]">{'┌──────▼────────┐'}</span>
        </div>
        <div>
          <span className="text-[#EF4444]">{'   │ MODULAR MONO  │'}</span>
          {'  '}
          <span className="text-[#F59E0B]">{'│  EVENT BUS     │'}</span>
          {'  '}
          <span className="text-[#10B981]">{'│ MICROSERVICES │'}</span>
        </div>
        <div>
          <span className="text-[#EF4444]">{'   │ (CORE LOGIC)  │'}</span>
          {'  '}
          <span className="text-[#F59E0B]">{'│ (EventBridge)  │'}</span>
          {'  '}
          <span className="text-[#10B981]">{'│ (Adapters)    │'}</span>
        </div>
        <div>
          <span className="text-[#EF4444]">{'   └───────┬───────┘'}</span>
          {'  '}
          <span className="text-[#F59E0B]">{'└───────┬────────┘'}</span>
          {'  '}
          <span className="text-[#10B981]">{'└──────┬────────┘'}</span>
        </div>
        <div>
          <span className="text-[#EF4444]">{'           │'}</span>
          {'           '}
          <span className="text-[#F59E0B]">{'│'}</span>
          {'                '}
          <span className="text-[#10B981]">{'│'}</span>
        </div>
        <div>
          <span className="text-[#EF4444]">{'      Ledger DB'}</span>
          {'      '}
          <span className="text-[#F59E0B]">{'Kafka/MSK'}</span>
          {'       '}
          <span className="text-[#10B981]">{'PSP / Bank / KYC'}</span>
        </div>
        <div>
          <span className="text-[#EF4444]">{'    (Aurora PG)'}</span>
          {'      '}
          <span className="text-[#F59E0B]">{'Streams'}</span>
          {'          '}
          <span className="text-[#10B981]">{'Integrations'}</span>
        </div>
      </div>

      {/* Principle box */}
      <div className="mt-4 pt-3 border-t border-white/[0.04]">
        <div className="text-[10px] text-gray-700 font-mono">PRINCIPLE:</div>
        <div className="text-xs text-gray-400 mt-1">
          <span className="text-[#EF4444] font-bold">Modular monolith</span> = business logic + determinism.{' '}
          <span className="text-[#10B981] font-bold">Microservices</span> = integrations + external dependencies.{' '}
          <span className="text-gray-600">NEVER the other way around.</span>
        </div>
      </div>
    </div>
  )
}

// ─── Main ───────────────────────────────────────────────────────────────────

export function ArchitectureView() {
  const [expandedLayer, setExpandedLayer] = useState<number | null>(0)
  const [expandedComp, setExpandedComp] = useState<string | null>(null)

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto">
        <SystemDiagram />

        <div className="space-y-3">
          {ARCH_LAYERS.map(layer => (
            <LayerSection
              key={layer.layer}
              layer={layer}
              isExpanded={expandedLayer === layer.layer}
              onToggle={() => setExpandedLayer(expandedLayer === layer.layer ? null : layer.layer)}
              expandedComp={expandedComp}
              onToggleComp={(id) => setExpandedComp(expandedComp === id ? null : id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
