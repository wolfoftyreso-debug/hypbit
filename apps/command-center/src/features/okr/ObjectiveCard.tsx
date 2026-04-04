import React, { useState } from 'react'
import type { OkrObjective } from './okrTypes'
import { KeyResultRow } from './KeyResultRow'

interface Props {
  objective: OkrObjective
  onRefresh: () => void
}

function scoreColor(score: number | null | undefined): string {
  if (score == null) return 'rgba(10,61,98,0.2)'
  if (score >= 0.7) return '#22c55e'
  if (score >= 0.4) return '#f59e0b'
  return '#ef4444'
}

function ScoreRing({ score }: { score: number | null | undefined }) {
  const s = score ?? 0
  const r = 22
  const circumference = 2 * Math.PI * r
  const dash = circumference * s
  const color = scoreColor(score)

  return (
    <svg width={56} height={56} style={{ flexShrink: 0 }}>
      {/* Background track */}
      <circle cx={28} cy={28} r={r} fill="none" stroke="rgba(10,61,98,0.1)" strokeWidth={5} />
      {/* Progress arc */}
      <circle
        cx={28} cy={28} r={r} fill="none"
        stroke={color} strokeWidth={5}
        strokeDasharray={`${dash} ${circumference}`}
        strokeLinecap="round"
        transform="rotate(-90 28 28)"
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
      />
      {/* Score text */}
      <text x={28} y={33} textAnchor="middle" fontSize={13} fontWeight={700} fill={color}>
        {score !== null && score !== undefined ? s.toFixed(1) : '—'}
      </text>
    </svg>
  )
}

export function ObjectiveCard({ objective, onRefresh }: Props) {
  const [expanded, setExpanded] = useState(true)
  const krs = objective.key_results ?? []
  const score = objective.computed_score

  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      border: '1.5px solid rgba(10,61,98,0.1)',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(10,61,98,0.05)',
      marginBottom: 16,
    }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 20px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 14,
          borderBottom: expanded ? '1px solid rgba(10,61,98,0.08)' : 'none',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <ScoreRing score={score} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
              color: '#0A3D62', opacity: 0.4,
            }}>
              {objective.level} · {objective.entity_slug}
            </span>
            {objective.owner_id && (
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 12,
                background: 'rgba(10,61,98,0.08)', color: '#0A3D62',
              }}>
                @{objective.owner_id}
              </span>
            )}
          </div>
          <h3 style={{
            margin: 0, color: '#0A3D62', fontSize: 15, fontWeight: 700,
            lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {objective.title}
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#0A3D62', opacity: 0.5 }}>
            {krs.length} Key Result{krs.length !== 1 ? 's' : ''}
          </p>
        </div>
        <span style={{ color: '#0A3D62', opacity: 0.4, fontSize: 18, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          ▾
        </span>
      </div>

      {/* Key Results */}
      {expanded && (
        <div>
          {krs.length === 0 ? (
            <p style={{ margin: 0, padding: '16px 20px', fontSize: 13, color: '#0A3D62', opacity: 0.4, fontStyle: 'italic' }}>
              Inga Key Results ännu.
            </p>
          ) : (
            krs.map(kr => <KeyResultRow key={kr.id} kr={kr} onRefresh={onRefresh} />)
          )}
        </div>
      )}
    </div>
  )
}
