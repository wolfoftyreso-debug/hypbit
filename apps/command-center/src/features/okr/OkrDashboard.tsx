/**
 * OKR Dashboard — Google-modellen
 * Cream/Navy/Gold design system
 */
import React, { useState } from 'react'
import { useOkrDashboard, useOkrCycles, useOkrObjectives } from './useOkrData'
import { ObjectiveCard } from './ObjectiveCard'
import type { OkrCycle, Confidence } from './okrTypes'

const ENTITIES = [
  { value: 'wavult-os', label: 'Wavult OS' },
  { value: 'quixzoom', label: 'quiXzoom' },
  { value: 'landvex', label: 'Landvex' },
  { value: 'holding', label: 'Holding' }]

const CONFIDENCE_CONFIG: Record<Confidence, { label: string; color: string }> = {
  at_risk:  { label: 'At Risk',   color: '#ef4444' },
  off_track: { label: 'Off Track', color: '#f97316' },
  on_track:  { label: 'On Track',  color: '#22c55e' },
  achieved:  { label: 'Achieved',  color: '#E8B84B' },
}

function scoreLabel(score: number | null | undefined): string {
  if (score == null) return '—'
  if (score >= 0.7) return '✅ On Track'
  if (score >= 0.4) return '⚠️ In Progress'
  return '❌ Behind'
}

function ScoreSummaryRing({ score }: { score: number | null | undefined }) {
  const s = score ?? 0
  const r = 40
  const circumference = 2 * Math.PI * r
  const dash = circumference * s
  const color = score == null ? 'rgba(10,61,98,0.2)'
    : score >= 0.7 ? '#22c55e'
    : score >= 0.4 ? '#f59e0b'
    : '#ef4444'

  return (
    <svg width={100} height={100}>
      <circle cx={50} cy={50} r={r} fill="none" stroke="rgba(10,61,98,0.08)" strokeWidth={8} />
      <circle
        cx={50} cy={50} r={r} fill="none"
        stroke={color} strokeWidth={8}
        strokeDasharray={`${dash} ${circumference}`}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x={50} y={46} textAnchor="middle" fontSize={20} fontWeight={800} fill={color}>
        {score !== null && score !== undefined ? s.toFixed(1) : '—'}
      </text>
      <text x={50} y={62} textAnchor="middle" fontSize={10} fill="#0A3D62" opacity={0.5}>
        score
      </text>
    </svg>
  )
}

export default function OkrDashboard() {
  const [entity, setEntity] = useState('wavult-os')
  const { dashboard, loading, error, refetch } = useOkrDashboard(entity)
  const { cycles } = useOkrCycles(entity)
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null)
  const { objectives: cycleObjectives, loading: objLoading, refetch: refetchObjs } = useOkrObjectives(selectedCycleId)

  const summary = dashboard?.summary
  const dashObjectives = dashboard?.objectives ?? []
  const showObjectives = selectedCycleId ? cycleObjectives : dashObjectives
  const isLoading = loading || (selectedCycleId ? objLoading : false)

  const handleRefresh = () => { refetch(); if (selectedCycleId) refetchObjs() }

  return (
    <div style={{ background: '#F5F0E8', minHeight: '100vh', padding: '28px 24px', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: '0 0 4px', color: '#0A3D62', fontSize: 26, fontWeight: 800 }}>OKR Dashboard</h1>
        <p style={{ margin: 0, color: '#0A3D62', opacity: 0.5, fontSize: 14 }}>
          Google-modellen · Objectives, Key Results, Check-ins
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {/* Entity filter */}
        <div style={{ display: 'flex', gap: 6 }}>
          {ENTITIES.map(e => (
            <button
              key={e.value}
              onClick={() => { setEntity(e.value); setSelectedCycleId(null) }}
              style={{
                padding: '7px 16px', borderRadius: 8, cursor: 'pointer',
                border: entity === e.value ? '2px solid #0A3D62' : '2px solid rgba(10,61,98,0.15)',
                background: entity === e.value ? '#0A3D62' : 'white',
                color: entity === e.value ? '#F5F0E8' : '#0A3D62',
                fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
              }}
            >
              {e.label}
            </button>
          ))}
        </div>

        {/* Cycle picker */}
        {cycles.length > 0 && (
          <select
            value={selectedCycleId ?? ''}
            onChange={e => setSelectedCycleId(e.target.value || null)}
            style={{
              padding: '7px 14px', borderRadius: 8,
              border: '2px solid rgba(10,61,98,0.15)', background: 'white',
              color: '#0A3D62', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <option value="">Alla aktiva cycles</option>
            {cycles.map((c: OkrCycle) => (
              <option key={c.id} value={c.id}>{c.label} ({c.cycle_type})</option>
            ))}
          </select>
        )}
      </div>

      {/* Summary cards */}
      {summary && !selectedCycleId && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
          {/* Overall score */}
          <div style={{
            background: 'white', borderRadius: 12, padding: '20px',
            border: '1.5px solid rgba(10,61,98,0.08)',
            display: 'flex', alignItems: 'center', gap: 16,
            boxShadow: '0 2px 8px rgba(10,61,98,0.05)',
          }}>
            <ScoreSummaryRing score={summary.overall_score} />
            <div>
              <p style={{ margin: '0 0 2px', fontSize: 12, color: '#0A3D62', opacity: 0.5, fontWeight: 600 }}>OVERALL SCORE</p>
              <p style={{ margin: 0, fontSize: 18, color: '#0A3D62', fontWeight: 800 }}>{scoreLabel(summary.overall_score)}</p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#0A3D62', opacity: 0.5 }}>
                {summary.total_objectives} Objectives · {summary.total_krs} KRs
              </p>
            </div>
          </div>

          {/* Confidence breakdown */}
          {(Object.entries(summary.confidence_distribution) as [Confidence, number][]).map(([conf, count]) => (
            <div key={conf} style={{
              background: 'white', borderRadius: 12, padding: '20px',
              border: '1.5px solid rgba(10,61,98,0.08)',
              boxShadow: '0 2px 8px rgba(10,61,98,0.05)',
            }}>
              <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: '#0A3D62', opacity: 0.5, textTransform: 'uppercase', letterSpacing: 1 }}>
                {CONFIDENCE_CONFIG[conf].label}
              </p>
              <p style={{ margin: 0, fontSize: 36, fontWeight: 800, color: CONFIDENCE_CONFIG[conf].color }}>{count}</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#0A3D62', opacity: 0.4 }}>Key Results</p>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 10, padding: '14px 18px', marginBottom: 20, color: '#ef4444', fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {/* Objectives */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#0A3D62', opacity: 0.4, fontSize: 14 }}>
          Laddar OKRs...
        </div>
      ) : showObjectives.length === 0 ? (
        <div style={{
          background: 'white', borderRadius: 12, padding: '40px',
          border: '1.5px solid rgba(10,61,98,0.08)', textAlign: 'center',
        }}>
          <p style={{ margin: 0, fontSize: 48 }}>🎯</p>
          <p style={{ margin: '12px 0 4px', fontSize: 16, fontWeight: 700, color: '#0A3D62' }}>Inga Objectives ännu</p>
          <p style={{ margin: 0, fontSize: 13, color: '#0A3D62', opacity: 0.5 }}>
            Skapa ett Objective för att börja sätta mål för {entity}.
          </p>
        </div>
      ) : (
        showObjectives.map(obj => (
          <ObjectiveCard key={obj.id} objective={obj} onRefresh={handleRefresh} />
        ))
      )}
    </div>
  )
}
