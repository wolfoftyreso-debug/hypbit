/**
 * MetricCard — Metric display with illustration
 * The illustration makes the number immediately understood
 */
import React from 'react'
import { IllustrationModule } from '../ui/IllustrationModule'

interface Props {
  label: string
  value: string | number
  delta?: string
  deltaPositive?: boolean
  module: string
  scenario?: number
  onClick?: () => void
}

export function MetricCard({ label, value, delta, deltaPositive = true, module, scenario, onClick }: Props) {
  return (
    <div
      className={`metric-card card-interactive reveal ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="metric-illus illus-container" style={{ width: 52, height: 52 }}>
        <IllustrationModule module={module} scenario={scenario} size={44} />
      </div>
      <div>
        <div className="metric-value">{value}</div>
        <div className="metric-label">{label}</div>
        {delta && (
          <div className={`metric-delta ${deltaPositive ? 'pos' : 'neg'}`}>
            {deltaPositive ? '↑' : '↓'} {delta}
          </div>
        )}
      </div>
    </div>
  )
}
