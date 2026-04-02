/**
 * IllustrationHeader — Page header with embedded illustration
 * Navy background, illustration breathes on the right, gold accents
 */
import React from 'react'
import { IllustrationModule } from '../ui/IllustrationModule'

interface Props {
  title: string
  subtitle?: string
  module: string
  scenario?: number
  actions?: React.ReactNode
  badge?: string
}

export function IllustrationHeader({ title, subtitle, module, scenario, actions, badge }: Props) {
  return (
    <div className="page-header-with-illus reveal">
      <div style={{ flex: 1 }}>
        {badge && (
          <div style={{
            display: 'inline-block', fontSize: 9, fontWeight: 700,
            letterSpacing: '.15em', textTransform: 'uppercase',
            color: 'rgba(232,184,75,.8)', marginBottom: 10,
            background: 'rgba(232,184,75,.1)', padding: '3px 10px',
            borderRadius: 3,
          }}>
            {badge}
          </div>
        )}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
        {actions && <div style={{ marginTop: 20 }}>{actions}</div>}
      </div>
      <div className="header-illus illus-breathe">
        <IllustrationModule module={module} scenario={scenario} size={100} />
      </div>
    </div>
  )
}
