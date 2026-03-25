import { useState, useRef, useCallback } from 'react'
import {
  ENTITIES, RELATIONSHIPS,
  getChildren, getRelationships, getRoleMappings,
  Entity, EntityRelationship, RelationshipType,
} from './data'

// ─── Layout constants ──────────────────────────────────────────────────────────

const LAYER_Y: Record<number, number> = { 0: 60, 1: 220, 2: 400, 3: 590 }
const LAYER_LABEL: Record<number, string> = {
  0: 'HOLDING / IP',
  1: 'OPERATIONS',
  2: 'PRODUCT ENTITIES',
  3: 'SYSTEMS',
}
const CARD_W = 172
const CARD_H = 90
const SVG_W = 1100
const SVG_H = 720

// ─── Compute node positions ────────────────────────────────────────────────────

function layoutNodes(): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()
  const byLayer: Record<number, Entity[]> = {}
  ENTITIES.forEach(e => {
    if (!byLayer[e.layer]) byLayer[e.layer] = []
    byLayer[e.layer].push(e)
  })
  Object.entries(byLayer).forEach(([layer, nodes]) => {
    const ly = parseInt(layer)
    const count = nodes.length
    const gap = SVG_W / (count + 1)
    nodes.forEach((node, i) => {
      positions.set(node.id, { x: gap * (i + 1) - CARD_W / 2, y: LAYER_Y[ly] })
    })
  })
  return positions
}

const NODE_POSITIONS = layoutNodes()

// ─── Relationship style ────────────────────────────────────────────────────────

const REL_STYLE: Record<RelationshipType, { stroke: string; dash: string; label: string; arrow: string }> = {
  ownership:      { stroke: '#8B5CF6', dash: 'none',        label: 'Ownership',      arrow: '▶' },
  financial_flow: { stroke: '#10B981', dash: 'none',        label: 'Financial flow', arrow: '▶' },
  licensing:      { stroke: '#F59E0B', dash: '6 4',         label: 'IP License',     arrow: '▶' },
  service:        { stroke: '#0EA5E9', dash: '4 3',         label: 'Service',        arrow: '▷' },
  control:        { stroke: '#EF4444', dash: 'none',        label: 'Control',        arrow: '▶' },
}

// ─── SVG Edge ─────────────────────────────────────────────────────────────────

function Edge({
  rel,
  positions,
  highlighted,
  onClick,
}: {
  rel: EntityRelationship
  positions: Map<string, { x: number; y: number }>
  highlighted: boolean
  onClick: () => void
}) {
  const from = positions.get(rel.from_entity_id)
  const to = positions.get(rel.to_entity_id)
  if (!from || !to) return null

  const style = REL_STYLE[rel.type]
  const fx = from.x + CARD_W / 2
  const fy = from.y + CARD_H
  const tx = to.x + CARD_W / 2
  const ty = to.y

  // Curve control points
  const midY = (fy + ty) / 2
  const d = `M ${fx} ${fy} C ${fx} ${midY}, ${tx} ${midY}, ${tx} ${ty}`

  const id = `arr-${rel.id}`

  return (
    <g onClick={onClick} className="cursor-pointer" style={{ opacity: highlighted ? 1 : 0.35 }}>
      <defs>
        <marker id={id} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={style.stroke} />
        </marker>
      </defs>
      {/* Hit area */}
      <path d={d} fill="none" stroke="transparent" strokeWidth={14} />
      {/* Visible line */}
      <path
        d={d}
        fill="none"
        stroke={style.stroke}
        strokeWidth={highlighted ? 2.5 : 1.5}
        strokeDasharray={style.dash}
        markerEnd={`url(#${id})`}
        style={{ filter: highlighted ? `drop-shadow(0 0 4px ${style.stroke})` : 'none' }}
      />
    </g>
  )
}

// ─── Node Card ────────────────────────────────────────────────────────────────

function NodeCard({
  entity,
  position,
  selected,
  onClick,
}: {
  entity: Entity
  position: { x: number; y: number }
  selected: boolean
  onClick: () => void
}) {
  const statusColor = entity.active_status === 'live' ? '#10B981' : entity.active_status === 'forming' ? '#F59E0B' : '#6B7280'
  const statusLabel = entity.active_status === 'live' ? 'Live' : entity.active_status === 'forming' ? 'Forming' : 'Planned'

  return (
    <g
      transform={`translate(${position.x}, ${position.y})`}
      onClick={onClick}
      className="cursor-pointer"
      style={{ filter: selected ? `drop-shadow(0 0 10px ${entity.color})` : 'none' }}
    >
      {/* Card background */}
      <rect
        width={CARD_W}
        height={CARD_H}
        rx={10}
        fill="#0F1117"
        stroke={selected ? entity.color : entity.color + '50'}
        strokeWidth={selected ? 2 : 1}
      />
      {/* Top color bar */}
      <rect width={CARD_W} height={3} rx={2} fill={entity.color} />

      {/* Flag + shortname */}
      <text x={12} y={24} fontSize={13} fill={entity.color} fontWeight="700">
        {entity.flag} {entity.shortName}
      </text>

      {/* Full name */}
      <text x={12} y={42} fontSize={9.5} fill="#9CA3AF">
        {entity.name}
      </text>

      {/* Jurisdiction */}
      <text x={12} y={58} fontSize={9} fill="#6B7280">
        {entity.jurisdiction}  ·  {entity.type.toUpperCase()}
      </text>

      {/* Status dot */}
      <circle cx={CARD_W - 16} cy={18} r={5} fill={statusColor} />
      <text x={CARD_W - 10} y={28} fontSize={7.5} fill={statusColor} textAnchor="middle">{statusLabel}</text>

      {/* Team avatars */}
      {getRoleMappings(entity.id)
        .slice(0, 4)
        .map((rm, i) => (
          <g key={rm.person} transform={`translate(${12 + i * 18}, 68)`}>
            <circle r={8} fill={rm.color + '33'} stroke={rm.color} strokeWidth={1} />
            <text x={0} y={3.5} textAnchor="middle" fontSize={7} fill={rm.color} fontWeight="700">
              {rm.initials[0]}
            </text>
          </g>
        ))
      }
    </g>
  )
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-gray-500 px-2">
      {(Object.entries(REL_STYLE) as [RelationshipType, typeof REL_STYLE[RelationshipType]][]).map(([type, s]) => (
        <div key={type} className="flex items-center gap-1.5">
          <svg width={28} height={10}>
            <line x1={0} y1={5} x2={28} y2={5}
              stroke={s.stroke}
              strokeWidth={1.5}
              strokeDasharray={s.dash === 'none' ? undefined : s.dash}
            />
          </svg>
          <span style={{ color: s.stroke }}>{s.label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({ entity, onClose }: { entity: Entity; onClose: () => void }) {
  const rels = getRelationships(entity.id)
  const roles = getRoleMappings(entity.id)
  const children = getChildren(entity.id)
  const statusColor = entity.active_status === 'live' ? '#10B981' : entity.active_status === 'forming' ? '#F59E0B' : '#6B7280'

  const outgoing = rels.filter(r => r.from_entity_id === entity.id)
  const incoming = rels.filter(r => r.to_entity_id === entity.id)

  return (
    <div className="h-full flex flex-col bg-surface-raised border-l border-surface-border overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-surface-border sticky top-0 bg-surface-raised z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{entity.flag}</span>
            <span className="text-lg font-bold text-white">{entity.shortName}</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: statusColor + '20', color: statusColor }}>
              {entity.active_status}
            </span>
          </div>
          <div className="text-sm text-gray-300 font-medium">{entity.name}</div>
          <div className="text-xs text-gray-500 mt-0.5">{entity.type.toUpperCase()} · {entity.jurisdiction}</div>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-lg leading-none">✕</button>
      </div>

      <div className="flex-1 p-5 space-y-6">
        {/* Description */}
        <p className="text-sm text-gray-400 leading-relaxed">{entity.description}</p>

        {/* Metadata */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Key Facts</h3>
          <div className="space-y-2">
            {Object.entries(entity.metadata).map(([k, v]) => (
              <div key={k} className="flex gap-3">
                <span className="text-xs text-gray-600 w-28 flex-shrink-0">{k}</span>
                <span className="text-xs text-gray-300">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Roles */}
        {roles.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Linked Roles</h3>
            <div className="space-y-2">
              {roles.map(r => (
                <div key={r.person} className="flex items-center gap-2.5 bg-surface-overlay rounded-lg px-3 py-2.5">
                  <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: r.color + '25', color: r.color }}>
                    {r.initials}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">{r.person}</div>
                    <div className="text-xs text-gray-500">{r.role_type} · {r.scope}</div>
                  </div>
                  <div className="ml-auto flex gap-1">
                    {r.permissions.map(p => (
                      <span key={p} className="text-xs px-1.5 py-0.5 rounded" style={{ background: r.color + '15', color: r.color }}>{p}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Outgoing relationships */}
        {outgoing.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Outgoing Relationships</h3>
            <div className="space-y-2">
              {outgoing.map(r => {
                const s = REL_STYLE[r.type]
                const target = ENTITIES.find(e => e.id === r.to_entity_id)
                return (
                  <div key={r.id} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.stroke }} />
                    <span className="text-gray-400">{s.label}</span>
                    <span className="text-gray-600">→</span>
                    <span className="text-white font-medium">{target?.shortName ?? r.to_entity_id}</span>
                    <span className="text-gray-600">·</span>
                    <span className="text-gray-500">{r.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Incoming relationships */}
        {incoming.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Incoming Relationships</h3>
            <div className="space-y-2">
              {incoming.map(r => {
                const s = REL_STYLE[r.type]
                const source = ENTITIES.find(e => e.id === r.from_entity_id)
                return (
                  <div key={r.id} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.stroke }} />
                    <span className="text-white font-medium">{source?.shortName ?? r.from_entity_id}</span>
                    <span className="text-gray-600">→</span>
                    <span className="text-gray-400">{s.label}</span>
                    <span className="text-gray-600">·</span>
                    <span className="text-gray-500">{r.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Children */}
        {children.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Subsidiaries / Children</h3>
            <div className="space-y-2">
              {children.map(c => (
                <div key={c.id} className="flex items-center gap-2 bg-surface-overlay rounded-lg px-3 py-2">
                  <span>{c.flag}</span>
                  <span className="text-xs font-semibold" style={{ color: c.color }}>{c.shortName}</span>
                  <span className="text-xs text-gray-500">{c.name}</span>
                  <span className="ml-auto text-xs text-gray-600">{c.jurisdiction}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

type RelFilter = RelationshipType | 'all'

function FilterBar({ active, onChange }: { active: RelFilter; onChange: (f: RelFilter) => void }) {
  const options: { value: RelFilter; label: string; color: string }[] = [
    { value: 'all', label: 'All', color: '#9CA3AF' },
    { value: 'ownership', label: 'Ownership', color: REL_STYLE.ownership.stroke },
    { value: 'financial_flow', label: 'Financial flow', color: REL_STYLE.financial_flow.stroke },
    { value: 'licensing', label: 'IP License', color: REL_STYLE.licensing.stroke },
    { value: 'service', label: 'Service', color: REL_STYLE.service.stroke },
  ]
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className="text-xs px-3 py-1.5 rounded-full border transition-all"
          style={{
            borderColor: active === o.value ? o.color : o.color + '40',
            background: active === o.value ? o.color + '20' : 'transparent',
            color: active === o.value ? o.color : o.color + 'AA',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function OrgGraph() {
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null)
  const [highlightedRel, setHighlightedRel] = useState<string | null>(null)
  const [relFilter, setRelFilter] = useState<RelFilter>('all')
  const svgRef = useRef<SVGSVGElement>(null)

  const handleNodeClick = useCallback((entity: Entity) => {
    setSelectedEntity(prev => prev?.id === entity.id ? null : entity)
    setHighlightedRel(null)
  }, [])

  const visibleRels = RELATIONSHIPS.filter(r =>
    relFilter === 'all' || r.type === relFilter
  )

  const entityRels = selectedEntity
    ? new Set(getRelationships(selectedEntity.id).map(r => r.id))
    : null

  return (
    <div className="flex h-full gap-0 min-h-0">
      {/* Graph canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-surface-border flex-shrink-0">
          <div>
            <h1 className="text-base font-bold text-white">Corporate Structure</h1>
            <p className="text-xs text-gray-500">Wavult Ecosystem — {ENTITIES.length} entities · {RELATIONSHIPS.length} relationships</p>
          </div>
          <FilterBar active={relFilter} onChange={setRelFilter} />
        </div>

        {/* SVG */}
        <div className="flex-1 overflow-auto bg-[#060810] relative">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            width="100%"
            style={{ minHeight: SVG_H, minWidth: 700 }}
          >
            {/* Layer labels */}
            {Object.entries(LAYER_LABEL).map(([layer, label]) => (
              <text
                key={layer}
                x={12}
                y={LAYER_Y[parseInt(layer)] + 14}
                fontSize={9}
                fill="#374151"
                fontWeight="700"
                letterSpacing="2"
              >
                {label}
              </text>
            ))}

            {/* Horizontal layer dividers */}
            {Object.values(LAYER_Y).map((y, i) => (
              <line key={i} x1={0} y1={y - 12} x2={SVG_W} y2={y - 12} stroke="#1F2937" strokeWidth={1} />
            ))}

            {/* Edges */}
            {visibleRels.map(rel => (
              <Edge
                key={rel.id}
                rel={rel}
                positions={NODE_POSITIONS}
                highlighted={
                  highlightedRel === rel.id ||
                  (entityRels != null && entityRels.has(rel.id)) ||
                  (!highlightedRel && entityRels == null)
                }
                onClick={() => setHighlightedRel(prev => prev === rel.id ? null : rel.id)}
              />
            ))}

            {/* Nodes */}
            {ENTITIES.map(entity => {
              const pos = NODE_POSITIONS.get(entity.id)
              if (!pos) return null
              return (
                <NodeCard
                  key={entity.id}
                  entity={entity}
                  position={pos}
                  selected={selectedEntity?.id === entity.id}
                  onClick={() => handleNodeClick(entity)}
                />
              )
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex-shrink-0 px-4 py-2 border-t border-surface-border bg-surface-base">
          <Legend />
        </div>
      </div>

      {/* Detail panel */}
      {selectedEntity && (
        <div className="w-80 flex-shrink-0">
          <DetailPanel entity={selectedEntity} onClose={() => setSelectedEntity(null)} />
        </div>
      )}
    </div>
  )
}
