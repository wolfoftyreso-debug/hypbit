/**
 * ExecutionPanel — Live-visning av Wavult Execution Engine
 * Visar constraint scan + quality checks med realtids-progress
 */

import { useState, useCallback } from 'react'
import {
  runExecutionPipeline,
  type CheckResult,
  type ExecutionReport,
  type Violation,
} from './executionEngine'

interface ExecutionPanelProps {
  repoFullName: string
  onComplete?: (report: ExecutionReport) => void
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#C0392B',
  error:    '#E67E22',
  warning:  '#F59E0B',
  info:     '#3B82F6',
}

const STATUS_ICONS: Record<CheckResult['status'], string> = {
  pending: '○',
  running: '⟳',
  pass:    '✓',
  fail:    '✗',
  skipped: '—',
}

export function ExecutionPanel({ repoFullName, onComplete }: ExecutionPanelProps) {
  const [running, setRunning] = useState(false)
  const [report, setReport] = useState<ExecutionReport | null>(null)
  const [liveChecks, setLiveChecks] = useState<CheckResult[]>([])
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null)

  const runChecks = useCallback(async () => {
    setRunning(true)
    setReport(null)
    setLiveChecks([])

    const result = await runExecutionPipeline(repoFullName, (check) => {
      setLiveChecks((prev) => {
        const idx = prev.findIndex((c) => c.id === check.id)
        if (idx >= 0) {
          const updated = [...prev]
          updated[idx] = check
          return updated
        }
        return [...prev, check]
      })
    })

    setReport(result)
    setRunning(false)
    onComplete?.(result)
  }, [repoFullName, onComplete])

  const checksToShow = report?.checks ?? liveChecks

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#0A3D62]">Execution Engine</h3>
          <p className="text-xs text-gray-500 mt-0.5">Wavult constraint scan + quality checks</p>
        </div>
        <button
          onClick={runChecks}
          disabled={running}
          className="px-4 py-2 text-xs font-bold rounded-lg bg-[#0A3D62] text-[#F5F0E8] hover:bg-[#072E4A] disabled:opacity-50 flex items-center gap-2 transition-colors"
        >
          {running ? (
            <span className="inline-block animate-spin">⟳</span>
          ) : (
            <span>▶</span>
          )}
          {running ? 'Kör...' : 'Kör alla checks'}
        </button>
      </div>

      {/* Live checks list */}
      {checksToShow.length > 0 && (
        <div className="rounded-xl border border-[#D8CFC4] overflow-hidden">
          {checksToShow.map((check) => (
            <div
              key={check.id}
              className={`flex items-center gap-3 px-4 py-2.5 border-b border-[#D8CFC4]/50 last:border-0 ${
                check.status === 'fail'
                  ? 'bg-red-50'
                  : check.status === 'pass'
                    ? 'bg-green-50/30'
                    : 'bg-white'
              }`}
            >
              <span
                className={`text-sm font-mono font-bold flex-shrink-0 ${
                  check.status === 'pass'
                    ? 'text-green-600'
                    : check.status === 'fail'
                      ? 'text-red-600'
                      : check.status === 'running'
                        ? 'text-blue-600'
                        : 'text-gray-400'
                } ${check.status === 'running' ? 'inline-block animate-spin' : ''}`}
              >
                {STATUS_ICONS[check.status]}
              </span>

              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-800">{check.name}</div>
                {check.detail && (
                  <div className="text-[10px] text-gray-500 mt-0.5 truncate">{check.detail}</div>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {check.duration_ms !== undefined && (
                  <span className="text-[9px] font-mono text-gray-400">{check.duration_ms}ms</span>
                )}
                <span
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                  style={{
                    background: (SEVERITY_COLORS[check.severity] ?? '#999') + '15',
                    color: SEVERITY_COLORS[check.severity] ?? '#999',
                  }}
                >
                  {check.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {report && (
        <div
          className={`rounded-xl p-4 border ${
            report.status === 'pass'
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div
            className={`text-sm font-bold ${
              report.status === 'pass' ? 'text-green-800' : 'text-red-800'
            }`}
          >
            {report.summary}
          </div>

          {report.violations.length > 0 && (
            <div className="mt-3 space-y-1">
              <div className="text-xs font-semibold text-gray-600 mb-2">
                {report.violations.length} violations (
                {report.violations.filter((v) => v.severity === 'critical').length} kritiska)
              </div>
              {report.violations.slice(0, 5).map((v, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedViolation(v)}
                  className="flex items-start gap-2 text-[11px] cursor-pointer hover:bg-white/50 rounded p-1"
                >
                  <span
                    style={{ color: SEVERITY_COLORS[v.severity] ?? '#999' }}
                    className="font-bold flex-shrink-0"
                  >
                    [{v.severity.toUpperCase()}]
                  </span>
                  <span className="font-mono text-gray-600">
                    {v.file}
                    {v.line ? `:${v.line}` : ''}
                  </span>
                  <span className="text-gray-700">{v.message}</span>
                  {v.auto_fixable && (
                    <span className="text-green-600 flex-shrink-0">⚡ auto-fix</span>
                  )}
                </div>
              ))}
              {report.violations.length > 5 && (
                <div className="text-xs text-gray-400 pl-1">
                  +{report.violations.length - 5} fler violations
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Violation detail modal */}
      {selectedViolation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setSelectedViolation(null)}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span
                className="text-sm font-bold"
                style={{ color: SEVERITY_COLORS[selectedViolation.severity] ?? '#999' }}
              >
                {selectedViolation.rule}
              </span>
              <button
                onClick={() => setSelectedViolation(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-gray-500">Fil:</span>{' '}
                <span className="font-mono">
                  {selectedViolation.file}
                  {selectedViolation.line ? `:${selectedViolation.line}` : ''}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Problem:</span>{' '}
                <span>{selectedViolation.message}</span>
              </div>
              {selectedViolation.auto_fixable && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-green-700 font-semibold mb-1">⚡ Auto-fix tillgänglig</div>
                  <div className="text-green-600">
                    Denna violation kan åtgärdas automatiskt av AI-agenten.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
