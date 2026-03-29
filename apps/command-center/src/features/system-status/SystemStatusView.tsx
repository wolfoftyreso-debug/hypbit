// ─── Wavult OS — System Status View ──────────────────────────────────────────
// Förenklad systemstatus-vy — embeddar Infrastructure Operations Center
// samt behåller legacy-modulregistret för bakåtkompatibilitet

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Server, ArrowRight } from 'lucide-react'
import {
  MODULE_REGISTRY,
  MATURITY_COLORS,
  MATURITY_LABELS,
  MATURITY_DESCRIPTION,
  MATURITY_BG,
  MaturityLevel,
} from '../../shared/maturity/maturityModel'
import { MaturityBadge } from '../../shared/maturity/MaturityBadge'

const LEVEL_ORDER: MaturityLevel[] = ['enterprise', 'production', 'beta', 'alpha', 'skeleton']

function countByLevel(level: MaturityLevel) {
  return MODULE_REGISTRY.filter(m => m.level === level).length
}

function LegendDot({ level }: { level: MaturityLevel }) {
  const color = MATURITY_COLORS[level]
  const label = MATURITY_LABELS[level]
  const count = countByLevel(level)
  if (count === 0) return null
  return (
    <div className="flex items-center gap-1.5">
      <span className="rounded-full" style={{ width: 7, height: 7, background: color, flexShrink: 0 }} />
      <span className="text-xs font-mono" style={{ color }}>
        {label}
      </span>
      <span className="text-[9px] font-mono text-gray-600">×{count}</span>
    </div>
  )
}

export function SystemStatusView() {
  const navigate = useNavigate()
  const total = MODULE_REGISTRY.length
  const sortedModules = [...MODULE_REGISTRY].sort(
    (a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level)
  )

  return (
    <div className="flex flex-col h-full bg-gray-50 text-gray-900 overflow-auto">

      {/* ── Banner: länk till fullt Infra-center ─────────────────────────── */}
      <div className="flex-shrink-0 mx-6 mt-5 mb-3">
        <button
          onClick={() => navigate('/infrastructure')}
          className="w-full flex items-center justify-between gap-3 px-5 py-4 rounded-xl border border-blue-500/30 bg-blue-950/40 hover:bg-blue-900/40 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <Server size={20} className="text-blue-700" />
            <div>
              <div className="text-sm font-semibold text-gray-900">Infrastructure Operations Center</div>
              <div className="text-xs text-blue-700/70 font-mono mt-0.5">
                Live health checks · Larm · Fakturering · Failover
              </div>
            </div>
          </div>
          <ArrowRight size={16} className="text-blue-700" />
        </button>
      </div>

      {/* ── Header — Modulmatriset ─────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900 tracking-wide">WAVULT OS — SYSTEMSTATUS</h1>
            <p className="text-xs text-gray-9000 font-mono mt-1">
              {total} moduler
              {(['enterprise', 'production', 'beta', 'alpha', 'skeleton'] as MaturityLevel[]).map(level => {
                const count = countByLevel(level)
                if (!count) return null
                return (
                  <React.Fragment key={level}>
                    {' · '}
                    <span style={{ color: MATURITY_COLORS[level] }}>
                      {count} {MATURITY_LABELS[level].toUpperCase()}
                    </span>
                  </React.Fragment>
                )
              })}
            </p>
          </div>

          {/* Health bar */}
          <div className="hidden sm:flex flex-col items-end gap-1">
            <span className="text-[9px] font-mono text-gray-9000 uppercase tracking-wider">Systemhälsa</span>
            <div className="flex gap-0.5 items-center">
              {sortedModules.map(m => (
                <div
                  key={m.id}
                  className="rounded-sm"
                  style={{
                    width: 8,
                    height: 20,
                    background: MATURITY_COLORS[m.level],
                    opacity: 0.8,
                  }}
                  title={`${m.name}: ${MATURITY_LABELS[m.level]}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modulkort ─────────────────────────────────────────────────────── */}
      <div className="flex-1 px-6 py-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {sortedModules.map(mod => {
            const color = MATURITY_COLORS[mod.level]
            const bg    = MATURITY_BG[mod.level]
            return (
              <button
                key={mod.id}
                onClick={() => navigate(mod.path)}
                className="flex flex-col gap-2 p-4 rounded-xl border transition-all text-left hover:scale-[1.02] active:scale-[0.99] cursor-pointer"
                style={{ background: `${bg}BB`, borderColor: `${color}33` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl leading-none">{mod.icon}</span>
                    <span className="text-sm font-semibold text-gray-900">{mod.name}</span>
                  </div>
                  <MaturityBadge level={mod.level} size="sm" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="rounded-full" style={{ width: 5, height: 5, background: '#22C55E', flexShrink: 0 }} />
                    <span className="text-xs text-gray-9000 font-mono">{mod.liveFeatures.length} live</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="rounded-full" style={{ width: 5, height: 5, background: '#F59E0B', flexShrink: 0 }} />
                    <span className="text-xs text-gray-9000 font-mono">{mod.mockFeatures.length} mock</span>
                  </div>
                  <span className="text-[9px] font-mono text-gray-600 ml-auto">Fas {mod.phase}</span>
                </div>
                <p className="text-xs text-gray-9000 font-mono leading-relaxed">
                  {MATURITY_DESCRIPTION[mod.level]}
                </p>
                <div className="flex items-center gap-1 mt-auto">
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                    style={{
                      background: mod.dataSource === 'live' ? '#052e1666' : mod.dataSource === 'partial' ? '#0D1B3E66' : '#1C110766',
                      color:      mod.dataSource === 'live' ? '#34D399'   : mod.dataSource === 'partial' ? '#60A5FA'   : '#F59E0B',
                    }}
                  >
                    {mod.dataSource === 'live' ? '● LIVE DATA' : mod.dataSource === 'partial' ? '◐ PARTIAL' : '○ MOCK DATA'}
                  </span>
                  <span className="text-[8px] text-gray-600 font-mono ml-auto">{mod.lastUpdated}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Legend ──────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[9px] font-mono text-gray-9000 uppercase tracking-wider">LEGEND</span>
          <div className="flex-1 border-t border-gray-100" />
        </div>
        <div className="flex flex-wrap gap-4">
          {LEVEL_ORDER.map(level => (
            <LegendDot key={level} level={level} />
          ))}
        </div>
      </div>
    </div>
  )
}
