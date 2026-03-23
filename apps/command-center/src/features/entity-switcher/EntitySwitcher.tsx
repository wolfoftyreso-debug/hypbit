import { useState } from 'react'

interface Entity {
  id: string
  name: string
  shortName: string
  jurisdiction: string
  type: 'holding' | 'operating'
  color: string
}

const WAVULT_ENTITIES: Entity[] = [
  {
    id: 'wavult-holding',
    name: 'Wavult Group Holding',
    shortName: 'WGH',
    jurisdiction: 'AE-DIFC',
    type: 'holding',
    color: '#8B5CF6',
  },
  {
    id: 'wavult-tech-llc',
    name: 'Wavult Technologies LLC',
    shortName: 'WTL',
    jurisdiction: 'US-TX',
    type: 'operating',
    color: '#3B82F6',
  },
  {
    id: 'wavult-intelligence-uab',
    name: 'Wavult Intelligence UAB',
    shortName: 'WIU',
    jurisdiction: 'LT',
    type: 'operating',
    color: '#06B6D4',
  },
]

const JURISDICTION_FLAGS: Record<string, string> = {
  'AE-DIFC': '🇦🇪',
  'US-TX': '🇺🇸',
  'LT': '🇱🇹',
}

export function EntitySwitcher() {
  const [activeEntity, setActiveEntity] = useState<Entity>(WAVULT_ENTITIES[0])
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-surface-overlay hover:bg-surface-border transition-colors text-left"
      >
        <div
          className="h-6 w-6 rounded-md flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style={{ backgroundColor: activeEntity.color }}
        >
          {activeEntity.shortName[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white truncate">{activeEntity.shortName}</p>
          <p className="text-xs text-gray-500">{JURISDICTION_FLAGS[activeEntity.jurisdiction]} {activeEntity.jurisdiction}</p>
        </div>
        <span className="text-gray-500 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface-overlay border border-surface-border rounded-xl shadow-xl z-50 overflow-hidden">
          <p className="px-3 py-2 text-xs text-gray-500 font-semibold uppercase tracking-wider border-b border-surface-border">
            Wavult Group
          </p>
          {WAVULT_ENTITIES.map((entity) => (
            <button
              key={entity.id}
              onClick={() => { setActiveEntity(entity); setOpen(false) }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-surface-border transition-colors text-left ${
                entity.id === activeEntity.id ? 'bg-brand-accent/10' : ''
              }`}
            >
              <div
                className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ backgroundColor: entity.color }}
              >
                {entity.shortName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{entity.name}</p>
                <p className="text-xs text-gray-500">
                  {JURISDICTION_FLAGS[entity.jurisdiction]} {entity.jurisdiction} · {entity.type}
                </p>
              </div>
              {entity.id === activeEntity.id && <span className="text-brand-accent text-xs">✓</span>}
            </button>
          ))}
          <div className="border-t border-surface-border px-3 py-2">
            <button className="text-xs text-gray-500 hover:text-brand-accent transition-colors">
              + Add entity
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
