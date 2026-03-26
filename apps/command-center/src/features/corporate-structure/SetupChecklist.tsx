// ─── Setup Checklist — Phase-by-Phase Corporate Structure Tracker ────────────
// Tracks progress from US C-Corp → Dubai Holding → IP → Scale

import { useState } from 'react'
import { ENTITIES } from '../org-graph/data'
import {
  SETUP_PHASES, SETUP_CHECKLIST, getChecklistForPhase, getChecklistProgress,
  type ChecklistItem, type ChecklistPhase, type ChecklistItemStatus,
} from './corporateData'

// ─── Colors ─────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<ChecklistItemStatus, string> = {
  done: '#10B981',
  'in-progress': '#F59E0B',
  blocked: '#EF4444',
  pending: '#6B7280',
}

const STATUS_ICON: Record<ChecklistItemStatus, string> = {
  done: '✓',
  'in-progress': '◎',
  blocked: '✕',
  pending: '○',
}

const PHASE_COLOR: Record<ChecklistPhase, string> = {
  1: '#22D3EE',
  2: '#8B5CF6',
  3: '#F59E0B',
  4: '#10B981',
}

// ─── Progress Bar ───────────────────────────────────────────────────────────

function OverallProgress() {
  const { total, done, inProgress, blocked } = getChecklistProgress()
  const pctDone = Math.round((done / total) * 100)
  const pctInProgress = Math.round((inProgress / total) * 100)

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-bold text-white">Corporate Setup Progress</h2>
          <p className="text-[10px] text-gray-600 mt-0.5">Sweden → Dubai → US → EU — full structure</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{pctDone}%</div>
          <div className="text-[10px] text-gray-600">{done}/{total} complete</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden flex">
        <div className="h-full bg-[#10B981] transition-all" style={{ width: `${pctDone}%` }} />
        <div className="h-full bg-[#F59E0B] transition-all" style={{ width: `${pctInProgress}%` }} />
        {blocked > 0 && (
          <div className="h-full bg-[#EF4444] transition-all" style={{ width: `${Math.round((blocked / total) * 100)}%` }} />
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#10B981]" />
          <span className="text-[10px] text-gray-600">Done ({done})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
          <span className="text-[10px] text-gray-600">In Progress ({inProgress})</span>
        </div>
        {blocked > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#EF4444]" />
            <span className="text-[10px] text-gray-600">Blocked ({blocked})</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Phase Card ─────────────────────────────────────────────────────────────

function PhaseSection({
  phase,
  isExpanded,
  onToggle,
}: {
  phase: ChecklistPhase
  isExpanded: boolean
  onToggle: () => void
}) {
  const phaseMeta = SETUP_PHASES.find(p => p.phase === phase)!
  const items = getChecklistForPhase(phase)
  const done = items.filter(i => i.status === 'done').length
  const color = PHASE_COLOR[phase]
  const allDone = done === items.length

  return (
    <div
      className="rounded-xl border transition-all"
      style={{
        borderColor: isExpanded ? color + '40' : 'rgba(255,255,255,0.06)',
        background: isExpanded ? color + '04' : 'rgba(255,255,255,0.02)',
      }}
    >
      <button onClick={onToggle} className="w-full text-left px-5 py-4">
        <div className="flex items-center gap-3">
          {/* Phase number */}
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
            style={{ background: color + '20', color }}
          >
            {phase}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{phaseMeta.label}</span>
              {allDone && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#10B98118] text-[#10B981] font-mono">COMPLETE</span>
              )}
            </div>
            <div className="text-xs text-gray-600 mt-0.5">{phaseMeta.description}</div>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-20 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${(done / items.length) * 100}%`, background: color }} />
            </div>
            <span className="text-[10px] text-gray-600 font-mono">{done}/{items.length}</span>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-5 pb-4 space-y-2">
          {items.map(item => (
            <ChecklistItemRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Checklist Item ─────────────────────────────────────────────────────────

function ChecklistItemRow({ item }: { item: ChecklistItem }) {
  const entity = item.entityId ? ENTITIES.find(e => e.id === item.entityId) : null
  const statusColor = STATUS_COLOR[item.status]
  const blockedByItem = item.blockedBy ? SETUP_CHECKLIST.find(c => c.id === item.blockedBy) : null

  return (
    <div
      className="rounded-lg border px-4 py-3 transition-all"
      style={{
        borderColor: item.status === 'in-progress' ? '#F59E0B25' : 'rgba(255,255,255,0.04)',
        background: item.status === 'in-progress' ? '#F59E0B06' : 'transparent',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <span className="text-xs font-bold mt-0.5 flex-shrink-0" style={{ color: statusColor }}>
          {STATUS_ICON[item.status]}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm ${item.status === 'done' ? 'line-through text-gray-600' : 'text-gray-200'}`}>
              {item.label}
            </span>
            {entity && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ background: entity.color + '15', color: entity.color }}
              >
                {entity.flag} {entity.shortName}
              </span>
            )}
          </div>

          {item.notes && (
            <div className="text-[10px] text-gray-600 mt-1">{item.notes}</div>
          )}

          <div className="flex items-center gap-3 mt-1.5">
            {item.dueDate && (
              <span className="text-[10px] text-gray-700 font-mono">Due: {item.dueDate}</span>
            )}
            {blockedByItem && (
              <span className="text-[10px] text-[#EF4444]">
                Blocked by: {blockedByItem.label}
              </span>
            )}
          </div>
        </div>

        {/* Status badge */}
        <span
          className="text-[10px] px-2 py-0.5 rounded font-mono flex-shrink-0"
          style={{ background: statusColor + '18', color: statusColor }}
        >
          {item.status}
        </span>
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function SetupChecklist() {
  const [expandedPhase, setExpandedPhase] = useState<ChecklistPhase | null>(1)

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-lg font-bold text-white">Corporate Setup Tracker</h1>
          <p className="text-xs text-gray-600 mt-0.5">Phase-by-phase progress — from foundation to global scale</p>
        </div>

        {/* Overall progress */}
        <OverallProgress />

        {/* Critical warnings */}
        <div className="rounded-xl border border-[#EF444425] bg-[#EF444408] px-5 py-3 mb-6">
          <h3 className="text-xs font-bold text-[#EF4444] mb-2">Critical Requirements</h3>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <span className="text-[#EF4444]">!</span>
              <span>Substance in Dubai — office/flex desk + board meetings required</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <span className="text-[#EF4444]">!</span>
              <span>Transfer pricing documentation — royalties must be arms-length (5-15%)</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <span className="text-[#EF4444]">!</span>
              <span>No Swedish connection remaining — CFC rules will collapse the structure</span>
            </div>
          </div>
        </div>

        {/* Phase sections */}
        <div className="space-y-3">
          {SETUP_PHASES.map(p => (
            <PhaseSection
              key={p.phase}
              phase={p.phase}
              isExpanded={expandedPhase === p.phase}
              onToggle={() => setExpandedPhase(expandedPhase === p.phase ? null : p.phase)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
