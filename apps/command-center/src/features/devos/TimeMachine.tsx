import React, { useState, useEffect } from 'react'
import { useRole } from '../../shared/auth/RoleContext'

const API = import.meta.env.VITE_API_URL ?? 'https://api.wavult.com'

// ── Types ────────────────────────────────────────────────────────────────

interface RestoreAction {
  type: 'git_checkout' | 'redeploy' | 'db_rollback' | 'env_restore' | 'notify'
  label: string
  status: 'pending' | 'done' | 'failed'
  details: string
}

interface SystemSnapshot {
  id: string
  timestamp: string
  label: string
  trigger: 'manual' | 'auto' | 'pre_deploy' | 'post_deploy' | 'pre_migration'
  state: {
    repo_full_name: string
    branch: string
    commit_sha: string
    commit_message: string
    active_graph_id?: string
    task_statuses: Record<string, string>
    deployed_url?: string
    env_vars_hash: string
    migration_version?: string
    created_by: string
    graph_id?: string
  }
  restorable: boolean
  restore_actions: RestoreAction[]
}

// ── localStorage persistence ─────────────────────────────────────────────

const SNAPSHOT_KEY = 'devos_snapshots'

function loadSnapshots(): SystemSnapshot[] {
  try {
    return JSON.parse(localStorage.getItem(SNAPSHOT_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveSnapshot(snap: SystemSnapshot) {
  const existing = loadSnapshots()
  const updated = [snap, ...existing].slice(0, 100)
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(updated))
}

// ── Hook ─────────────────────────────────────────────────────────────────

export function useTimeMachine(repoFullName: string | null) {
  const [snapshots, setSnapshots] = useState<SystemSnapshot[]>(() => loadSnapshots())
  const [restoring, setRestoring] = useState<string | null>(null)

  function createSnapshot(
    label: string,
    trigger: SystemSnapshot['trigger'],
    extra?: Partial<SystemSnapshot['state']>
  ) {
    const snap: SystemSnapshot = {
      id: `snap_${Date.now()}`,
      timestamp: new Date().toISOString(),
      label,
      trigger,
      restorable: true,
      restore_actions: [
        {
          type: 'git_checkout',
          label: 'Återställ kod',
          status: 'pending',
          details: extra?.commit_sha ?? 'HEAD',
        },
        {
          type: 'redeploy',
          label: 'Redeploya',
          status: 'pending',
          details: extra?.deployed_url ?? '',
        }],
      state: {
        repo_full_name: repoFullName ?? '',
        branch: 'main',
        commit_sha: extra?.commit_sha ?? '',
        commit_message: extra?.commit_message ?? label,
        task_statuses: extra?.task_statuses ?? {},
        env_vars_hash: extra?.env_vars_hash ?? '',
        deployed_url: extra?.deployed_url,
        created_by: 'system',
        ...extra,
      },
    }
    saveSnapshot(snap)
    setSnapshots(prev => [snap, ...prev])
    return snap
  }

  async function restoreTo(snapshotId: string) {
    const snap = snapshots.find(s => s.id === snapshotId)
    if (!snap) return
    setRestoring(snapshotId)
    try {
      const res = await fetch(`${API}/api/devos/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer bypass',
        },
        body: JSON.stringify({ snapshot: snap }),
      })
      if (res.ok) {
        setSnapshots(prev =>
          prev.map(s =>
            s.id === snapshotId ? { ...s, label: `${s.label} [ÅTERSTÄLLD]` } : s
          )
        )
      }
    } catch {
      /* API offline — visa instruktion */
    }
    setRestoring(null)
  }

  return { snapshots, createSnapshot, restoreTo, restoring }
}

// ── Trigger config ────────────────────────────────────────────────────────

const TRIGGER_CONFIG: Record<
  SystemSnapshot['trigger'],
  { icon: string; color: string; label: string }
> = {
  manual:        { icon: '✋', color: '#6B7280', label: 'Manuell' },
  auto:          { icon: '🤖', color: '#3B82F6', label: 'Automatisk' },
  pre_deploy:    { icon: '📦', color: '#F59E0B', label: 'Före deploy' },
  post_deploy:   { icon: '🚀', color: '#10B981', label: 'Efter deploy' },
  pre_migration: { icon: '🗄️', color: '#8B5CF6', label: 'Före migration' },
}

// ── Time Machine View ─────────────────────────────────────────────────────

export function TimeMachineView({ repoFullName }: { repoFullName?: string }) {
  const { snapshots, restoreTo, restoring, createSnapshot } = useTimeMachine(
    repoFullName ?? null
  )
  const { role } = useRole()
  const canRestore =
    role?.id === 'group-ceo' || role?.id === 'cto' || role?.id === 'admin'
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  // ── Scrubber state ──────────────────────────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(0)

  // Keyboard: Ctrl+Z = bak (äldre), Ctrl+Y = fram (nyare)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') setCurrentIndex(i => Math.min(snapshots.length - 1, i + 1))
      if (e.ctrlKey && e.key === 'y') setCurrentIndex(i => Math.max(0, i - 1))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [snapshots.length])

  // ── Sandbox state ───────────────────────────────────────────────────────
  const [sandboxUrls, setSandboxUrls] = useState<Record<string, string>>({})
  const [sandboxing, setSandboxing] = useState<string | null>(null)

  async function handleSandbox(snap: SystemSnapshot) {
    setSandboxing(snap.id)
    try {
      const res = await fetch(`${API}/api/devos/sandbox`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer bypass' },
        body: JSON.stringify({
          repo: snap.state.repo_full_name,
          commit_sha: snap.state.commit_sha,
          branch: `sandbox/${snap.id.slice(0, 8)}`,
          label: snap.label,
        }),
      })
      const url = res.ok
        ? (await res.json()).url
        : (snap.state.deployed_url ?? 'https://wavult-os.pages.dev')
      setSandboxUrls(prev => ({ ...prev, [snap.id]: url }))
      window.open(url, '_blank')
    } catch {
      const url = snap.state.deployed_url ?? 'https://wavult-os.pages.dev'
      setSandboxUrls(prev => ({ ...prev, [snap.id]: url }))
      window.open(url, '_blank')
    }
    setSandboxing(null)
  }

  function handleRestore(snapId: string) {
    if (confirmId === snapId) {
      restoreTo(snapId)
      setConfirmId(null)
    } else {
      setConfirmId(snapId)
      setTimeout(() => setConfirmId(null), 5000)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-surface-border bg-[#FDFAF5] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">⏪</span>
          <div>
            <h2 className="text-sm font-bold text-[#0A3D62]">Time Machine</h2>
            <p className="text-[10px] text-gray-400">
              {snapshots.length} snapshots · Klicka för att återställa
            </p>
          </div>
        </div>
        <button
          onClick={() => createSnapshot('Manuell snapshot', 'manual')}
          className="text-xs px-3 py-1.5 rounded-lg border border-[#E8B84B] text-[#8B6914] hover:bg-[#E8B84B]/10 font-medium transition-colors"
        >
          📸 Ta snapshot nu
        </button>
      </div>

      {/* Scrubber */}
      <div className="px-4 py-2 border-b border-surface-border bg-[#FDFAF5] flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => setCurrentIndex(i => Math.min(snapshots.length - 1, i + 1))}
          className="text-[#0A3D62] font-bold text-sm"
        >
          ⏪
        </button>
        <input
          type="range"
          min={0}
          max={Math.max(0, snapshots.length - 1)}
          value={currentIndex}
          onChange={e => setCurrentIndex(Number(e.target.value))}
          className="flex-1 accent-[#E8B84B]"
        />
        <button
          onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
          className="text-[#0A3D62] font-bold text-sm"
        >
          ⏩
        </button>
        <span className="text-[10px] text-gray-400 w-24 text-right flex-shrink-0">
          v{snapshots.length - currentIndex}/{snapshots.length}
          {currentIndex === 0 && (
            <span className="text-[#E8B84B] font-bold ml-1">● LIVE</span>
          )}
        </span>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {snapshots.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <div className="text-3xl mb-2">⏱️</div>
            <div className="text-sm text-gray-500">Inga snapshots ännu</div>
            <div className="text-xs text-gray-400 mt-1">
              Snapshots tas automatiskt före varje deploy och migration
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Vertikal guld-linje */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#E8B84B] to-[#E8B84B]/10" />

            <div className="space-y-3">
              {snapshots.map((snap, i) => {
                const trigger = TRIGGER_CONFIG[snap.trigger]
                const isFirst = i === 0
                const isExpanded = expandedId === snap.id
                const isConfirming = confirmId === snap.id
                const isRestoring = restoring === snap.id
                const isCurrent = i === currentIndex

                return (
                  <div key={snap.id} className="relative pl-12">
                    {/* Dot på linjen */}
                    <div
                      className={`absolute left-3.5 top-3 w-3 h-3 rounded-full border-2 border-white z-10 ${
                        isFirst ? 'ring-2 ring-[#E8B84B]/50 animate-pulse' : ''
                      }`}
                      style={{ background: isFirst ? '#E8B84B' : trigger.color }}
                    />

                    {/* Snapshot card */}
                    <div
                      className={`rounded-xl border p-3 cursor-pointer transition-all ${
                        isFirst
                          ? 'border-[#E8B84B]/40 bg-[#E8B84B]/5'
                          : 'border-surface-border bg-white hover:border-[#0A3D62]/20'
                      } ${isCurrent ? 'ring-2 ring-[#E8B84B] ring-offset-1' : ''}`}
                      onClick={() => setExpandedId(isExpanded ? null : snap.id)}
                    >
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{trigger.icon}</span>
                          <div>
                            <div className="text-xs font-semibold text-gray-800">
                              {snap.label}
                            </div>
                            <div className="text-[9px] text-gray-400 font-mono">
                              {new Date(snap.timestamp).toLocaleString('sv-SE')}
                            </div>
                          </div>
                        </div>
                        {isFirst && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#E8B84B] text-[#0A3D62] font-bold flex-shrink-0">
                            AKTIV
                          </span>
                        )}
                      </div>

                      {/* Commit info */}
                      {snap.state.commit_sha && (
                        <div className="mt-1.5 text-[9px] font-mono text-gray-500 flex items-center gap-1.5">
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded">
                            {snap.state.commit_sha.slice(0, 7)}
                          </span>
                          <span className="truncate">{snap.state.commit_message}</span>
                        </div>
                      )}

                      {/* Trigger badge */}
                      <div className="mt-1.5">
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded font-semibold"
                          style={{
                            background: trigger.color + '20',
                            color: trigger.color,
                          }}
                        >
                          {trigger.label}
                        </span>
                        {snap.state.deployed_url && (
                          <span className="ml-1.5 text-[9px] text-gray-400 font-mono truncate">
                            {snap.state.deployed_url}
                          </span>
                        )}
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-surface-border space-y-2">
                          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                            Restore actions
                          </div>
                          {snap.restore_actions.map((action, j) => (
                            <div key={j} className="flex items-center gap-2 text-xs">
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-700">{action.label}</span>
                              {action.details && (
                                <span className="font-mono text-[9px] text-gray-400">
                                  {action.details.slice(0, 30)}
                                </span>
                              )}
                            </div>
                          ))}

                          {snap.state.migration_version && (
                            <div className="text-[9px] font-mono text-gray-400">
                              DB migration: {snap.state.migration_version}
                            </div>
                          )}

                          {/* Sandbox + Restore buttons */}
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={e => { e.stopPropagation(); handleSandbox(snap) }}
                              disabled={sandboxing === snap.id}
                              className="flex-1 py-1.5 text-xs font-bold rounded-lg border border-green-300 text-green-700 hover:bg-green-50 disabled:opacity-50"
                            >
                              {sandboxing === snap.id ? '⟳' : '🧪'} Sandboxa
                            </button>
                            {sandboxUrls[snap.id] && (
                              <a
                                href={sandboxUrls[snap.id]}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-green-500 text-white text-center hover:bg-green-600"
                              >
                                → Öppna
                              </a>
                            )}
                          </div>

                          {/* Restore button — bara om inte aktiv */}
                          {!isFirst && canRestore && (
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                handleRestore(snap.id)
                              }}
                              disabled={isRestoring}
                              className={`w-full mt-2 py-2 text-xs font-bold rounded-lg transition-all ${
                                isConfirming
                                  ? 'bg-red-500 text-white animate-pulse'
                                  : 'bg-[#0A3D62] text-[#F5F0E8] hover:bg-[#072E4A]'
                              } disabled:opacity-50`}
                            >
                              {isRestoring
                                ? '⟳ Återställer...'
                                : isConfirming
                                ? '⚠️ Klicka igen för att bekräfta'
                                : '⏪ Återställ till denna version'}
                            </button>
                          )}

                          {!isFirst && !canRestore && (
                            <div className="text-[9px] text-gray-400 text-center mt-2">
                              Kräver CEO / CTO-behörighet
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
