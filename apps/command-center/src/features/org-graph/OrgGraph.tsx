// ─── Org Graph — Clean Entity Structure ──────────────────────────────────────
// Simple, readable hierarchy. No neon, no particles, no drama.
// Shows: entities by layer, ownership, team, and key relationships.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ENTITIES, RELATIONSHIPS, ROLE_MAPPINGS, type Entity, type EntityRelationship } from './data'

// ─── Status ─────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  live: { bg: '#1A2A1E', text: '#4A7A5B' },
  forming: { bg: '#2A2418', text: '#9A7A30' },
  planned: { bg: '#1A1C24', text: '#6B7280' },
}

const REL_TYPE_LABEL: Record<string, string> = {
  ownership: 'Owns',
  licensing: 'IP License',
  service: 'Service',
  financial_flow: 'Financial',
  control: 'Control',
}

// ─── Layer grouping ─────────────────────────────────────────────────────────

const LAYERS = [
  { layer: 0, label: 'Holding' },
  { layer: 1, label: 'Operations' },
  { layer: 2, label: 'Product Entities' },
  { layer: 3, label: 'Systems' },
]

// ─── Entity Card ────────────────────────────────────────────────────────────

function EntityCard({
  entity,
  isSelected,
  onClick,
}: {
  entity: Entity
  isSelected: boolean
  onClick: () => void
}) {
  const status = STATUS_STYLE[entity.active_status] ?? STATUS_STYLE.planned
  const children = ENTITIES.filter(e => e.parent_entity_id === entity.id)
  const people = ROLE_MAPPINGS.filter(r => r.entity_ids.includes(entity.id))

  return (
    <button
      onClick={onClick}
      className="text-left rounded-lg border px-4 py-3 transition-all w-full"
      style={{
        borderColor: isSelected ? '#4A7A9B' : '#1A1C24',
        background: isSelected ? '#0F1318' : '#0E0F14',
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[14px] font-semibold text-[#E0E1E4]">{entity.shortName}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: status.bg, color: status.text }}>
          {entity.active_status}
        </span>
        <span className="text-[10px] text-[#3D4452]">{entity.type}</span>
      </div>
      <div className="text-[12px] text-[#9CA3AF]">{entity.name}</div>
      <div className="text-[11px] text-[#3D4452] mt-0.5">{entity.jurisdiction}</div>

      {/* People */}
      {people.length > 0 && (
        <div className="flex gap-1 mt-2">
          {people.map(p => (
            <span key={p.person} className="text-[9px] px-1.5 py-0.5 rounded bg-[#1A1C24] text-[#6B7280]">
              {p.initials}
            </span>
          ))}
        </div>
      )}

      {/* Children count */}
      {children.length > 0 && (
        <div className="text-[10px] text-[#3D4452] mt-1">{children.length} subsidiaries</div>
      )}
    </button>
  )
}

// ─── Detail Panel ───────────────────────────────────────────────────────────

function EntityDetail({ entity }: { entity: Entity }) {
  const navigate = useNavigate()
  const parent = entity.parent_entity_id ? ENTITIES.find(e => e.id === entity.parent_entity_id) : null
  const children = ENTITIES.filter(e => e.parent_entity_id === entity.id)
  const people = ROLE_MAPPINGS.filter(r => r.entity_ids.includes(entity.id))
  const rels = RELATIONSHIPS.filter(r => r.from_entity_id === entity.id || r.to_entity_id === entity.id)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-[15px] font-semibold text-[#E0E1E4]">{entity.name}</h2>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono"
            style={{ background: (STATUS_STYLE[entity.active_status] ?? STATUS_STYLE.planned).bg, color: (STATUS_STYLE[entity.active_status] ?? STATUS_STYLE.planned).text }}>
            {entity.active_status}
          </span>
        </div>
        <div className="text-[12px] text-[#6B7280]">{entity.description}</div>
      </div>

      {/* Metadata */}
      <div>
        <h3 className="text-[11px] text-[#3D4452] font-medium mb-2">Details</h3>
        <div className="space-y-1">
          {Object.entries(entity.metadata).map(([k, v]) => (
            <div key={k} className="flex items-start gap-3 text-[12px]">
              <span className="text-[#3D4452] w-28 flex-shrink-0">{k}</span>
              <span className="text-[#9CA3AF]">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Parent */}
      {parent && (
        <div>
          <h3 className="text-[11px] text-[#3D4452] font-medium mb-2">Parent</h3>
          <div className="rounded-lg border border-[#1A1C24] bg-[#0E0F14] px-3 py-2 text-[12px] text-[#9CA3AF]">
            {parent.shortName} — {parent.name}
          </div>
        </div>
      )}

      {/* Children */}
      {children.length > 0 && (
        <div>
          <h3 className="text-[11px] text-[#3D4452] font-medium mb-2">Subsidiaries ({children.length})</h3>
          <div className="space-y-1">
            {children.map(c => (
              <div key={c.id} className="rounded-lg border border-[#1A1C24] bg-[#0E0F14] px-3 py-2 text-[12px]">
                <span className="text-[#E0E1E4]">{c.shortName}</span>
                <span className="text-[#3D4452] ml-2">{c.name} — {c.jurisdiction}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* People */}
      {people.length > 0 && (
        <div>
          <h3 className="text-[11px] text-[#3D4452] font-medium mb-2">People ({people.length})</h3>
          <div className="space-y-1">
            {people.map(p => (
              <div key={p.person} className="flex items-center gap-3 rounded-lg border border-[#1A1C24] bg-[#0E0F14] px-3 py-2 text-[12px]">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1A1C24] text-[#6B7280] font-mono">{p.initials}</span>
                <span className="text-[#E0E1E4]">{p.person}</span>
                <span className="text-[#3D4452]">{p.role_type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Relationships */}
      {rels.length > 0 && (
        <div>
          <h3 className="text-[11px] text-[#3D4452] font-medium mb-2">Relationships ({rels.length})</h3>
          <div className="space-y-1">
            {rels.map(r => {
              const other = ENTITIES.find(e => e.id === (r.from_entity_id === entity.id ? r.to_entity_id : r.from_entity_id))
              const dir = r.from_entity_id === entity.id ? 'to' : 'from'
              return (
                <div key={r.id} className="flex items-center gap-3 rounded-lg border border-[#1A1C24] bg-[#0E0F14] px-3 py-2 text-[12px]">
                  <span className="text-[10px] text-[#3D4452] font-mono w-16">{REL_TYPE_LABEL[r.type] ?? r.type}</span>
                  <span className="text-[#3D4452]">{dir === 'to' ? '->' : '<-'}</span>
                  <span className="text-[#9CA3AF]">{other?.shortName} — {other?.name}</span>
                  <span className="text-[#3D4452] text-[11px]">{r.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Navigate to entity detail */}
      <button
        onClick={() => navigate(`/entities/${entity.id}`)}
        className="text-[12px] text-[#4A7A9B] hover:text-[#6B9FBF] transition-colors"
      >
        Open full entity view
      </button>
    </div>
  )
}

// ─── Main ───────────────────────────────────────────────────────────────────

export function OrgGraph() {
  const [selectedId, setSelectedId] = useState<string>('wavult-group')
  const selected = ENTITIES.find(e => e.id === selectedId)

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left — Entity list by layer */}
      <div className="w-72 flex-shrink-0 border-r border-[#1A1C24] overflow-y-auto bg-[#0C0D12]">
        <div className="px-4 pt-4 pb-2">
          <h1 className="text-[15px] font-semibold text-[#E0E1E4]">Organization</h1>
          <p className="text-[11px] text-[#3D4452] mt-0.5">{ENTITIES.length} entities, {ROLE_MAPPINGS.length} people</p>
        </div>

        {LAYERS.map(({ layer, label }) => {
          const entities = ENTITIES.filter(e => e.layer === layer)
          if (entities.length === 0) return null
          return (
            <div key={layer} className="px-3 mb-3">
              <div className="px-1 mb-1.5">
                <span className="text-[10px] text-[#3D4452] font-medium uppercase tracking-wider">{label}</span>
              </div>
              <div className="space-y-1">
                {entities.map(entity => (
                  <EntityCard
                    key={entity.id}
                    entity={entity}
                    isSelected={selectedId === entity.id}
                    onClick={() => setSelectedId(entity.id)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Right — Detail */}
      <div className="flex-1 overflow-y-auto p-6">
        {selected ? (
          <EntityDetail entity={selected} />
        ) : (
          <div className="text-[13px] text-[#3D4452]">Select an entity to view details.</div>
        )}
      </div>
    </div>
  )
}
