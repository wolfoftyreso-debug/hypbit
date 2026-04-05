import { useState } from 'react'
import { CORP_ENTITIES, BRAND_GROUPS } from '../../shared/data/systemData'
import { useEntityScope } from '../../shared/scope/EntityScopeContext'

export function EntitySwitcher() {
  const { level, activeEntityId, brandGroup, setScope } = useEntityScope()
  const [open, setOpen] = useState(false)

  // What to show in the trigger button
  const displayEntity =
    level === 'group'
      ? { name: 'Wavult Group', flag: '🏛️', color: '#0A3D62', sub: 'Hela koncernen' }
      : level === 'brand' && brandGroup
      ? { name: brandGroup.name, flag: brandGroup.flag, color: brandGroup.color, sub: 'Brand group' }
      : (() => {
          const e = CORP_ENTITIES.find(e => e.id === activeEntityId)
          return {
            name: e?.shortName ?? '?',
            flag: e?.flag ?? '',
            color: e?.color ?? '#0A3D62',
            sub: e?.jurisdiction ?? '',
          }
        })()

  // Brand groups that have their own sub-entity list (quiXzoom, landvex)
  const productBrandGroups = BRAND_GROUPS.filter(bg => bg.id !== 'wavult-holdings')

  return (
    <div className="relative" data-tour="entity-switcher">
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors text-left"
        style={{ background: 'rgba(245,240,232,0.10)', border: '1px solid rgba(245,240,232,0.08)' }}
      >
        <span className="text-lg flex-shrink-0">{displayEntity.flag}</span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold truncate" style={{ color: '#F5F0E8' }}>{displayEntity.name}</div>
          <div className="text-[10px] truncate" style={{ color: 'rgba(245,240,232,0.50)' }}>{displayEntity.sub}</div>
        </div>
        <span className="text-xs" style={{ color: 'rgba(245,240,232,0.40)' }}>{open ? '▲' : '▼'}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 top-full mt-1 w-64 rounded-2xl overflow-hidden z-50"
          style={{
            background: '#FDFAF5',
            border: '1px solid #DDD5C5',
            boxShadow: '0 8px 32px rgba(26,26,46,0.18)',
          }}
        >
          {/* ── Wavult Group (root) ── */}
          <button
            onClick={() => { setScope('group', 'wavult-group', null); setOpen(false) }}
            className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left"
            style={{
              borderBottom: '1px solid #EDE8DC',
              background: level === 'group' ? '#F5F0E8' : 'transparent',
            }}
            onMouseEnter={e => { if (level !== 'group') (e.currentTarget as HTMLButtonElement).style.background = '#F5F0E8' }}
            onMouseLeave={e => { if (level !== 'group') (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
          >
            <span className="text-lg">🏛️</span>
            <div className="flex-1">
              <div className="text-xs font-bold" style={{ color: '#0A3D62' }}>Wavult Group</div>
              <div className="text-[10px]" style={{ color: '#8A8278' }}>Hela koncernen · 6 bolag</div>
            </div>
            {level === 'group' && <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: '#E8B84B' }} />}
          </button>

          {/* ── Brand Groups (quiXzoom + LandveX) ── */}
          <div className="px-3 pt-2 pb-1">
            <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#8A8278' }}>Brand Groups</div>
          </div>

          {productBrandGroups.map(bg => (
            <div key={bg.id}>
              {/* Brand group row */}
              <button
                onClick={() => { setScope('brand', bg.id, bg); setOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left"
                style={{
                  background: level === 'brand' && brandGroup?.id === bg.id ? '#F5F0E8' : 'transparent',
                }}
                onMouseEnter={e => {
                  if (!(level === 'brand' && brandGroup?.id === bg.id))
                    (e.currentTarget as HTMLButtonElement).style.background = '#F5F0E8'
                }}
                onMouseLeave={e => {
                  if (!(level === 'brand' && brandGroup?.id === bg.id))
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                }}
              >
                <span className="text-base">{bg.flag}</span>
                <div className="flex-1">
                  <div className="text-xs font-semibold" style={{ color: '#0A3D62' }}>{bg.name}</div>
                  <div className="text-[10px]" style={{ color: '#8A8278' }}>{bg.entityIds.length} bolag · aggregerat</div>
                </div>
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: bg.color }} />
              </button>

              {/* Sub-entities (indented) */}
              {bg.entityIds.map(eid => {
                const e = CORP_ENTITIES.find(e => e.id === eid)
                if (!e) return null
                const isActive = level === 'entity' && activeEntityId === eid
                return (
                  <button
                    key={eid}
                    onClick={() => { setScope('entity', eid, null); setOpen(false) }}
                    className="w-full flex items-center gap-3 pr-4 py-2 transition-colors text-left"
                    style={{
                      paddingLeft: 40,
                      background: isActive ? '#F5F0E8' : 'transparent',
                    }}
                    onMouseEnter={ev => {
                      if (!isActive) (ev.currentTarget as HTMLButtonElement).style.background = '#F5F0E8'
                    }}
                    onMouseLeave={ev => {
                      if (!isActive) (ev.currentTarget as HTMLButtonElement).style.background = 'transparent'
                    }}
                  >
                    <span className="text-sm">{e.flag}</span>
                    <div className="flex-1">
                      <div className="text-[11px] font-medium" style={{ color: '#3A3530' }}>{e.shortName}</div>
                      <div className="text-[9px]" style={{ color: '#8A8278' }}>{e.jurisdiction}</div>
                    </div>
                    {e.status === 'forming' && (
                      <span
                        className="text-[8px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
                        style={{ background: '#FDF3E0', color: '#B8760A' }}
                      >
                        bildas
                      </span>
                    )}
                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: e.color }} />
                    )}
                  </button>
                )
              })}
            </div>
          ))}

          {/* ── Holdings (WGH + WOH) ── */}
          <div className="px-3 pt-2 pb-1" style={{ borderTop: '1px solid #EDE8DC' }}>
            <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#8A8278' }}>Holdings</div>
          </div>
          {['wgh', 'woh'].map(eid => {
            const e = CORP_ENTITIES.find(e => e.id === eid)
            if (!e) return null
            const isActive = level === 'entity' && activeEntityId === eid
            return (
              <button
                key={eid}
                onClick={() => { setScope('entity', eid, null); setOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-2 transition-colors"
                style={{
                  background: isActive ? '#F5F0E8' : 'transparent',
                  textAlign: 'left',
                }}
                onMouseEnter={ev => {
                  if (!isActive) (ev.currentTarget as HTMLButtonElement).style.background = '#F5F0E8'
                }}
                onMouseLeave={ev => {
                  if (!isActive) (ev.currentTarget as HTMLButtonElement).style.background = 'transparent'
                }}
              >
                <span className="text-sm">{e.flag}</span>
                <div className="flex-1">
                  <div className="text-[11px] font-medium" style={{ color: '#3A3530' }}>{e.shortName}</div>
                  <div className="text-[9px]" style={{ color: '#8A8278' }}>{e.jurisdiction}</div>
                </div>
                {isActive && (
                  <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: e.color }} />
                )}
              </button>
            )
          })}

          {/* bottom padding */}
          <div className="h-2" />
        </div>
      )}

      {/* Backdrop */}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  )
}
