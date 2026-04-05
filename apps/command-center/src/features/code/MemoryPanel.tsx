import React, { useState } from 'react'
import type { ProjectMemory } from './projectMemory'

interface MemoryPanelProps {
  memory: ProjectMemory | null
  loading: boolean
}

export function MemoryPanel({ memory, loading }: MemoryPanelProps) {
  const [tab, setTab] = useState<'overview' | 'routes' | 'decisions' | 'constraints'>('overview')

  if (loading) return (
    <div className="flex items-center justify-center h-40 text-xs text-gray-400">
      Laddar projektminne...
    </div>
  )

  if (!memory) return (
    <div className="flex items-center justify-center h-40 text-xs text-gray-400">
      Välj ett projekt för att se dess minne
    </div>
  )

  const emptyRoutes = memory.routes.filter(r => r.status === 'empty')

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex gap-1 px-3 py-2 border-b border-surface-border bg-[#F5F0E8]">
        {(['overview', 'routes', 'decisions', 'constraints'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-colors ${
              tab === t ? 'bg-[#0A3D62] text-white' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {t === 'routes' && emptyRoutes.length > 0 ? `${t} ⚠️${emptyRoutes.length}` : t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {tab === 'overview' && (
          <>
            <div className="text-xs text-gray-400 font-mono">Senast uppdaterat: {memory.last_updated.slice(0, 16)}</div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Komponenter', value: memory.components.length },
                { label: 'Routes', value: memory.routes.length, warn: emptyRoutes.length > 0 },
                { label: 'Beslut', value: memory.decisions.length },
                { label: 'Öppna issues', value: memory.open_issues.length, warn: memory.open_issues.filter(i => i.priority === 'high').length > 0 },
              ].map(s => (
                <div key={s.label} className={`rounded-lg p-2.5 border ${s.warn ? 'border-amber-200 bg-amber-50' : 'border-surface-border bg-white'}`}>
                  <div className={`text-lg font-bold ${s.warn ? 'text-amber-700' : 'text-[#0A3D62]'}`}>{s.value}</div>
                  <div className="text-[10px] text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>

            {/* AI Context */}
            <div className="rounded-lg border border-surface-border bg-[#F5F0E8] p-3">
              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">AI-kontext</div>
              <pre className="text-[10px] text-gray-700 font-mono whitespace-pre-wrap">{memory.ai_context}</pre>
            </div>
          </>
        )}

        {tab === 'routes' && (
          <div className="space-y-1">
            {memory.routes.length === 0 ? (
              <div className="text-xs text-gray-400 text-center py-8">Inga routes hittade</div>
            ) : memory.routes.map(route => (
              <div key={route.id} className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${
                route.status === 'empty' ? 'border-amber-300 bg-amber-50' :
                route.status === 'broken' ? 'border-red-300 bg-red-50' :
                'border-surface-border bg-white'
              }`}>
                <span className={`font-mono flex-shrink-0 ${
                  route.status === 'empty' ? 'text-amber-600' :
                  route.status === 'broken' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {route.status === 'empty' ? '⚠' : route.status === 'broken' ? '✗' : '✓'}
                </span>
                <span className="font-mono text-gray-800">{route.path}</span>
                {route.status === 'empty' && <span className="ml-auto text-[10px] text-amber-600 font-semibold">TOM ROUTE</span>}
              </div>
            ))}
          </div>
        )}

        {tab === 'decisions' && (
          <div className="space-y-2">
            {memory.decisions.length === 0 ? (
              <div className="text-xs text-gray-400 text-center py-8">Inga beslut loggade ännu</div>
            ) : memory.decisions.map(d => (
              <div key={d.id} className="p-3 rounded-lg border border-surface-border bg-white">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-[#0A3D62]/10 text-[#0A3D62]">
                    {d.made_by === 'ai' ? '🤖 AI' : '👤 Human'}
                  </span>
                  <span className="text-[9px] text-gray-400 font-mono">{d.timestamp.slice(0, 16)}</span>
                </div>
                <div className="text-xs font-semibold text-gray-800">{d.decision}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">{d.rationale}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'constraints' && (
          <div className="space-y-1">
            {memory.constraints.map(c => (
              <div key={c.id} className="flex items-start gap-2 p-2 rounded-lg border border-surface-border bg-white text-xs">
                <span className="flex-shrink-0 font-mono text-[10px] px-1.5 py-0.5 rounded" style={{
                  background: c.severity === 'critical' ? '#C0392B15' : c.severity === 'error' ? '#E67E2215' : '#F59E0B15',
                  color: c.severity === 'critical' ? '#C0392B' : c.severity === 'error' ? '#E67E22' : '#F59E0B',
                }}>
                  {c.severity}
                </span>
                <div>
                  <div className="font-semibold text-gray-800">{c.rule}</div>
                  <div className="text-gray-500">{c.description}</div>
                </div>
                <span className="ml-auto text-[9px] text-gray-300 flex-shrink-0">{c.source}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
