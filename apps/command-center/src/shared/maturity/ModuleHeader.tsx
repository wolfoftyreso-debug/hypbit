import {
  MODULE_REGISTRY,
  MATURITY_DESCRIPTION,
} from './maturityModel'
import { MaturityBadge } from './MaturityBadge'

interface ModuleHeaderProps {
  moduleId: string
}

export function ModuleHeader({ moduleId }: ModuleHeaderProps) {
  const mod = MODULE_REGISTRY.find(m => m.id === moduleId)
  if (!mod) return null

  const description = MATURITY_DESCRIPTION[mod.level]

  return (
    <div className="flex items-center gap-3 px-5 pb-4 pt-4 border-b border-gray-200 mb-6 flex-shrink-0">
      {/* Module name + badge */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold text-gray-900">{mod.name}</span>
          <MaturityBadge level={mod.level} size="md" />
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-gray-50 text-gray-600 flex-shrink-0">
            Fas {mod.phase}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-sm text-gray-9000">{description}</p>
          {mod.dataSource === 'mock' && (
            <span className="text-[9px] font-mono text-amber-600/70">· mockdata</span>
          )}
          {mod.dataSource === 'partial' && (
            <span className="text-[9px] font-mono text-blue-500/60">· delvis live</span>
          )}
          {mod.dataSource === 'live' && (
            <span className="text-[9px] font-mono text-green-500/60">· live data</span>
          )}
        </div>
      </div>

      {/* Live features preview */}
      {mod.liveFeatures.length > 0 && (
        <div className="flex-shrink-0 text-right hidden md:block">
          <div className="text-[9px] text-gray-600 font-mono uppercase tracking-wider mb-0.5">
            Live-features
          </div>
          <div className="text-xs text-gray-9000">
            {mod.liveFeatures.slice(0, 3).join(', ')}
            {mod.liveFeatures.length > 3 ? `… +${mod.liveFeatures.length - 3}` : ''}
          </div>
        </div>
      )}

      {mod.liveFeatures.length === 0 && (
        <div className="flex-shrink-0 text-right hidden md:block">
          <div className="text-[9px] text-gray-600 font-mono uppercase tracking-wider mb-0.5">
            Live-features
          </div>
          <div className="text-xs text-gray-600 italic">Inga aktiva ännu</div>
        </div>
      )}

      {/* Notes */}
      {mod.notes && (
        <div className="text-[9px] font-mono px-2 py-1 rounded flex-shrink-0 hidden lg:block bg-gray-50 text-gray-9000">
          {mod.notes}
        </div>
      )}
    </div>
  )
}
