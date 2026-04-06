import React, { useState } from 'react'
import type { OkrKeyResult, Confidence } from './okrTypes'
import { useOkrActions } from './useOkrData'

interface Props {
  kr: OkrKeyResult
  onClose: () => void
  onSuccess: () => void
}

const CONFIDENCE_OPTIONS: { value: Confidence; label: string; color: string }[] = [
  { value: 'at_risk', label: '🔴 At Risk', color: '#ef4444' },
  { value: 'off_track', label: '🟠 Off Track', color: '#f97316' },
  { value: 'on_track', label: '🟢 On Track', color: '#22c55e' },
  { value: 'achieved', label: '🏆 Achieved', color: '#E8B84B' }]

export function CheckinModal({ kr, onClose, onSuccess }: Props) {
  const { checkin } = useOkrActions()
  const [currentValue, setCurrentValue] = useState<string>(
    kr.current_value !== null ? String(kr.current_value) : ''
  )
  const [confidence, setConfidence] = useState<Confidence>(kr.confidence)
  const [note, setNote] = useState('')
  const [blocker, setBlocker] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const showBlocker = confidence === 'at_risk' || confidence === 'off_track'

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await checkin(kr.id, {
        checked_by: 'erik', // TODO: auth context
        current_value: currentValue !== '' ? parseFloat(currentValue) : undefined,
        confidence,
        note: note || undefined,
        blocker: blocker || undefined,
      })
      onSuccess()
      onClose()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(10,61,98,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#F5F0E8', borderRadius: 12, padding: 28, width: 480, maxWidth: '95vw',
        boxShadow: '0 8px 32px rgba(10,61,98,0.2)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 11, color: '#0A3D62', opacity: 0.6, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 1 }}>Check-in</p>
            <h3 style={{ margin: 0, color: '#0A3D62', fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>{kr.title}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0A3D62', opacity: 0.4, fontSize: 20, padding: 0 }}>×</button>
        </div>

        {/* Current value */}
        {kr.kr_type === 'metric' && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0A3D62', marginBottom: 6 }}>
              Nytt värde {kr.unit ? `(${kr.unit})` : ''}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#0A3D62', opacity: 0.5 }}>{kr.start_value ?? 0} →</span>
              <input
                type="number"
                value={currentValue}
                onChange={e => setCurrentValue(e.target.value)}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 8,
                  border: '1.5px solid rgba(10,61,98,0.2)', background: 'white',
                  color: '#0A3D62', fontSize: 15, fontWeight: 600,
                }}
              />
              <span style={{ fontSize: 12, color: '#0A3D62', opacity: 0.5 }}>→ {kr.target_value ?? '?'}</span>
            </div>
          </div>
        )}

        {/* Confidence */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0A3D62', marginBottom: 8 }}>Confidence</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {CONFIDENCE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setConfidence(opt.value)}
                style={{
                  padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                  border: confidence === opt.value ? `2px solid ${opt.color}` : '2px solid rgba(10,61,98,0.15)',
                  background: confidence === opt.value ? `${opt.color}15` : 'white',
                  color: '#0A3D62', fontSize: 13, fontWeight: confidence === opt.value ? 700 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div style={{ marginBottom: showBlocker ? 16 : 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0A3D62', marginBottom: 6 }}>
            Kommentar (valfritt)
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            placeholder="Vad hände sedan förra check-in?"
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 8,
              border: '1.5px solid rgba(10,61,98,0.2)', background: 'white',
              color: '#0A3D62', fontSize: 13, resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Blocker (only if at_risk / off_track) */}
        {showBlocker && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#ef4444', marginBottom: 6 }}>
              Blocker / hinder
            </label>
            <textarea
              value={blocker}
              onChange={e => setBlocker(e.target.value)}
              rows={2}
              placeholder="Vad blockerar progress?"
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8,
                border: '1.5px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.04)',
                color: '#0A3D62', fontSize: 13, resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>
        )}

        {error && <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 12 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 8, cursor: 'pointer',
              border: '1.5px solid rgba(10,61,98,0.2)', background: 'transparent',
              color: '#0A3D62', fontSize: 14,
            }}
          >
            Avbryt
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              flex: 2, padding: '10px 0', borderRadius: 8, cursor: submitting ? 'not-allowed' : 'pointer',
              border: 'none', background: '#0A3D62',
              color: '#F5F0E8', fontSize: 14, fontWeight: 700,
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? 'Sparar...' : 'Spara check-in'}
          </button>
        </div>
      </div>
    </div>
  )
}
