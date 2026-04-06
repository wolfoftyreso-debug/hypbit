/**
 * OKR Dashboard — Google-modellen
 * Cream/Navy/Gold design system — reaktiv mot BRAND_GROUPS + CORP_ENTITIES
 */
import { useState, useMemo } from 'react'
import { BRAND_GROUPS, CORP_ENTITIES, TEAM_MEMBERS } from '../../shared/data/systemData'
import {
  OBJECTIVES, STATUS_CONFIG, CYCLE_OPTIONS, getOverallProgress,
  type Objective, type KeyResult, type OKRCycle,
} from './okrData'

// ── Progress ring SVG ────────────────────────────────────────────────────────
function ProgressRing({ progress, color, size = 60 }: { progress: number; color: string; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (progress / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EDE8DC" strokeWidth="6" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
      />
    </svg>
  )
}

// ── Key Result card ───────────────────────────────────────────────────────────
function KRCard({ kr }: { kr: KeyResult }) {
  const st = STATUS_CONFIG[kr.status]
  const owner = TEAM_MEMBERS.find(m => m.id === kr.owner)
  return (
    <div style={{ borderRadius: 12, background: '#F5F0E8', padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#0A3D62' }}>{kr.title}</div>
          {owner && <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>→ {owner.name}</div>}
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, flexShrink: 0,
          background: st.bg, color: st.color,
        }}>
          {st.icon} {st.label}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, height: 6, background: 'white', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 999, background: st.color, width: `${kr.current}%`, transition: 'width 0.4s ease' }} />
        </div>
        <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#6B7280', flexShrink: 0 }}>{kr.current}%</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>
        <span>{kr.currentValue}</span>
        <span>Mål: {kr.targetValue}</span>
      </div>
    </div>
  )
}

// ── Objective card ────────────────────────────────────────────────────────────
function ObjectiveCard({ objective, expanded, onToggle }: {
  objective: Objective
  expanded: boolean
  onToggle: () => void
}) {
  const st = STATUS_CONFIG[objective.status]
  const owner = TEAM_MEMBERS.find(m => m.id === objective.owner)
  return (
    <div style={{
      borderRadius: 16, border: '1.5px solid #DDD5C5', background: 'white',
      boxShadow: '0 2px 8px rgba(10,61,98,0.06)', overflow: 'hidden',
    }}>
      <div style={{ padding: '20px', cursor: 'pointer' }} onClick={onToggle}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          {/* Progress ring */}
          <div style={{ flexShrink: 0, textAlign: 'center' }}>
            <ProgressRing progress={objective.progress} color={st.color} size={56} />
            <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2, color: st.color }}>{objective.progress}%</div>
          </div>
          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0A3D62' }}>{objective.title}</h3>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                background: st.bg, color: st.color,
              }}>
                {st.icon} {st.label}
              </span>
            </div>
            <p style={{ margin: '0 0 8px', fontSize: 12, color: '#6B7280' }}>{objective.description}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 10, color: '#9CA3AF', flexWrap: 'wrap' }}>
              {owner && <span>Ägare: {owner.name}</span>}
              <span>{objective.keyResults.length} Key Results</span>
              <span style={{ color: '#E8B84B', fontWeight: 600 }}>{objective.cycle}</span>
            </div>
          </div>
          <span style={{ color: '#9CA3AF', flexShrink: 0, fontSize: 12 }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>
      {expanded && (
        <div style={{ borderTop: '1px solid #EDE8DC', padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {objective.keyResults.map(kr => <KRCard key={kr.id} kr={kr} />)}
        </div>
      )}
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function OkrDashboard() {
  const [selectedCycle, setSelectedCycle] = useState<OKRCycle>('Q2-2026')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [selectedEntityFilter, setSelectedEntityFilter] = useState<string>('alla')

  // Bygg entity-flikar dynamiskt från BRAND_GROUPS + CORP_ENTITIES
  const entityTabs = useMemo(() => [
    { id: 'alla', name: 'Alla', flag: '🌍', color: '#0A3D62' },
    ...BRAND_GROUPS.map(bg => ({ id: bg.id, name: bg.name, flag: bg.flag, color: bg.color })),
    ...CORP_ENTITIES.map(e => ({ id: e.id, name: e.shortName, flag: e.flag, color: e.color })),
  ], [])

  // Filtrera objectives
  const filteredObjectives = useMemo(() => {
    let objs = OBJECTIVES.filter(o => o.cycle === selectedCycle)
    if (selectedEntityFilter !== 'alla') {
      const bg = BRAND_GROUPS.find(b => b.id === selectedEntityFilter)
      if (bg) {
        objs = objs.filter(o => o.entityId === bg.id || bg.entityIds.includes(o.entityId))
      } else {
        objs = objs.filter(o => o.entityId === selectedEntityFilter)
      }
    }
    return objs
  }, [selectedCycle, selectedEntityFilter])

  const overallProgress = getOverallProgress(filteredObjectives)
  const onTrackCount = filteredObjectives.filter(o => o.status === 'on_track' || o.status === 'completed').length
  const atRiskCount = filteredObjectives.filter(o => o.status === 'at_risk').length
  const behindCount = filteredObjectives.filter(o => o.status === 'behind').length

  function toggleExpanded(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F5F0E8' }}>
      {/* ── Header ── */}
      <div style={{
        padding: '16px 24px', borderBottom: '1px solid #DDD5C5', background: '#FDFAF5', flexShrink: 0,
      }}>
        {/* Title + cycle selector */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0A3D62' }}>🎯 OKR & Mål</h1>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9CA3AF' }}>
              Objectives &amp; Key Results · Google-modellen · {selectedCycle}
            </p>
          </div>
          <select
            value={selectedCycle}
            onChange={e => setSelectedCycle(e.target.value as OKRCycle)}
            style={{
              padding: '8px 12px', borderRadius: 10, border: '1.5px solid #DDD5C5',
              background: 'white', fontSize: 12, color: '#0A3D62', outline: 'none', cursor: 'pointer',
            }}
          >
            {CYCLE_OPTIONS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
          {/* Overall progress */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
            borderRadius: 10, background: 'white', border: '1.5px solid #DDD5C5',
          }}>
            <ProgressRing progress={overallProgress} color="#0A3D62" size={32} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0A3D62' }}>{overallProgress}%</div>
              <div style={{ fontSize: 10, color: '#9CA3AF' }}>Totalt</div>
            </div>
          </div>
          {[
            { label: 'På spår', value: onTrackCount, color: '#2D7A4F' },
            { label: 'Risk', value: atRiskCount, color: '#B8760A' },
            { label: 'Efter', value: behindCount, color: '#C0392B' },
          ].map(s => (
            <div key={s.label} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
              borderRadius: 10, background: 'white', border: '1.5px solid #DDD5C5',
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.value}</span>
              <span style={{ fontSize: 11, color: '#6B7280' }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Entity filter tabs — dynamiska från BRAND_GROUPS + CORP_ENTITIES */}
        <div style={{ display: 'flex', gap: 6, marginTop: 12, overflowX: 'auto', paddingBottom: 2 }}>
          {entityTabs.slice(0, 8).map(tab => {
            const isActive = selectedEntityFilter === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedEntityFilter(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                  whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer', transition: 'all 0.15s',
                  border: isActive ? `2px solid ${tab.color}` : '1.5px solid #DDD5C5',
                  background: isActive ? tab.color : 'white',
                  color: isActive ? 'white' : '#374151',
                  outline: 'none',
                }}
              >
                <span>{tab.flag}</span>
                <span>{tab.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {filteredObjectives.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: 160, textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎯</div>
            <h3 style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: '#0A3D62' }}>
              Inga Objectives för {selectedCycle}
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>
              Välj en annan period eller lägg till objectives
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 900 }}>
            {filteredObjectives.map(obj => (
              <ObjectiveCard
                key={obj.id}
                objective={obj}
                expanded={expandedIds.has(obj.id)}
                onToggle={() => toggleExpanded(obj.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
