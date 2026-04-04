import React, { useState } from 'react'
import type { OkrKeyResult, Confidence } from './okrTypes'
import { CheckinModal } from './CheckinModal'

interface Props {
  kr: OkrKeyResult
  onRefresh: () => void
}

const CONFIDENCE_CONFIG: Record<Confidence, { label: string; bg: string; color: string }> = {
  at_risk:  { label: 'At Risk',   bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
  off_track: { label: 'Off Track', bg: 'rgba(249,115,22,0.12)',  color: '#f97316' },
  on_track:  { label: 'On Track',  bg: 'rgba(34,197,94,0.12)',   color: '#16a34a' },
  achieved:  { label: 'Achieved',  bg: 'rgba(232,184,75,0.18)',  color: '#b45309' },
}

function scoreColor(score: number): string {
  if (score >= 0.7) return '#22c55e'
  if (score >= 0.4) return '#f59e0b'
  return '#ef4444'
}

export function KeyResultRow({ kr, onRefresh }: Props) {
  const [checkinOpen, setCheckinOpen] = useState(false)
  const score = kr.score ?? 0
  const conf = CONFIDENCE_CONFIG[kr.confidence] ?? CONFIDENCE_CONFIG.on_track

  // Progress percentage for bar
  const start = kr.start_value ?? 0
  const target = kr.target_value ?? 1
  const current = kr.current_value ?? 0
  const pct = target !== start
    ? Math.max(0, Math.min(100, ((current - start) / (target - start)) * 100))
    : current >= target ? 100 : 0

  return (
    <>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(10,61,98,0.06)',
        display: 'flex', gap: 12, alignItems: 'center',
      }}>
        {/* Score badge */}
        <div style={{
          width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
          border: `3px solid ${scoreColor(score)}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'white',
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor(score) }}>
            {score.toFixed(1)}
          </span>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0A3D62' }}>{kr.title}</span>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
              background: conf.bg, color: conf.color,
            }}>
              {conf.label}
            </span>
          </div>

          {/* Progress bar */}
          {kr.kr_type === 'metric' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: '#0A3D62', opacity: 0.5, whiteSpace: 'nowrap' }}>
                {start}{kr.unit ? ` ${kr.unit}` : ''}
              </span>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(10,61,98,0.1)', position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, height: '100%',
                  width: `${pct}%`, borderRadius: 3,
                  background: scoreColor(score),
                  transition: 'width 0.4s ease',
                }} />
              </div>
              <span style={{ fontSize: 11, color: '#0A3D62', opacity: 0.5, whiteSpace: 'nowrap' }}>
                {target}{kr.unit ? ` ${kr.unit}` : ''}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0A3D62', minWidth: 40, textAlign: 'right' }}>
                {current}{kr.unit ? ` ${kr.unit}` : ''}
              </span>
            </div>
          )}
          {kr.kr_type === 'milestone' && (
            <p style={{ margin: 0, fontSize: 12, color: '#0A3D62', opacity: 0.6 }}>
              {kr.milestone_description} {kr.milestone_achieved ? '✅' : ''}
            </p>
          )}
        </div>

        {/* Check-in button */}
        <button
          onClick={() => setCheckinOpen(true)}
          style={{
            padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
            border: '1.5px solid rgba(10,61,98,0.3)', background: 'transparent',
            color: '#0A3D62', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Check in
        </button>
      </div>

      {checkinOpen && (
        <CheckinModal kr={kr} onClose={() => setCheckinOpen(false)} onSuccess={onRefresh} />
      )}
    </>
  )
}
