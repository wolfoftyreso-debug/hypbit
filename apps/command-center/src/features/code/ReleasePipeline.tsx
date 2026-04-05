/**
 * ReleasePipeline — Fullskärmsvy för release-flödet i Wavult OS
 * Draft → Review (auto-checks) → Checklista → Väntar grundare → Godkänt → Live
 */

import { useState } from 'react'
import {
  CheckCircle, XCircle, Clock, Loader2, ChevronRight,
  Rocket, Shield, Zap, FileText, Scale, Star,
  AlertTriangle, Send, ThumbsUp, ThumbsDown, ArrowLeft,
} from 'lucide-react'
import type { Release, ReleaseStatus, ProductionChecklist } from './releaseTypes'
import { useRole } from '../../shared/auth/RoleContext'

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ReleaseStatus, { color: string; label: string; icon: string }> = {
  draft:            { color: '#6B7280', label: 'Utkast',          icon: '✏️' },
  review:           { color: '#3B82F6', label: 'Granskning',      icon: '⟳' },
  checklist:        { color: '#F59E0B', label: 'Checklista',      icon: '📋' },
  pending_approval: { color: '#8B5CF6', label: 'Väntar grundare', icon: '⏳' },
  approved:         { color: '#10B981', label: 'Godkänt',         icon: '✓' },
  live:             { color: '#2D7A4F', label: 'Live 🚀',         icon: '🚀' },
  rejected:         { color: '#EF4444', label: 'Avvisad',         icon: '✗' },
}

const PIPELINE_STEPS: ReleaseStatus[] = ['draft', 'review', 'checklist', 'pending_approval', 'approved', 'live']

const CATEGORY_META: Record<ProductionChecklist['category'], { label: string; icon: React.ReactNode; color: string }> = {
  security:      { label: 'Säkerhet',      icon: <Shield size={14} />,   color: '#EF4444' },
  quality:       { label: 'Kvalitet',      icon: <Star size={14} />,     color: '#F59E0B' },
  performance:   { label: 'Performance',   icon: <Zap size={14} />,      color: '#3B82F6' },
  documentation: { label: 'Dokumentation', icon: <FileText size={14} />, color: '#10B981' },
  legal:         { label: 'Legal/Brand',   icon: <Scale size={14} />,    color: '#8B5CF6' },
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface ReleasePipelineProps {
  release: Release
  onBack: () => void
  onUpdateChecklist: (releaseId: string, itemId: string, checked: boolean) => void
  onSubmitForApproval: (releaseId: string) => void
  onApprove: (releaseId: string, note?: string) => void
  onReject: (releaseId: string, reason: string) => void
  onDeployLive: (releaseId: string) => void
  // live release list for syncing (state is in parent)
  releases: Release[]
}

// ─── Pipeline progress bar ──────────────────────────────────────────────────────

function PipelineProgress({ status }: { status: ReleaseStatus }) {
  const currentIdx = PIPELINE_STEPS.indexOf(status)
  return (
    <div className="flex items-center gap-0 w-full">
      {PIPELINE_STEPS.map((step, idx) => {
        const cfg = STATUS_CONFIG[step]
        const isActive = step === status
        const isDone = currentIdx > idx
        const isRejected = status === 'rejected'
        return (
          <div key={step} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center min-w-0 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  isActive
                    ? 'border-[#E8B84B] shadow-md scale-110'
                    : isDone
                    ? 'border-transparent'
                    : 'border-[#D8CFC4] opacity-40'
                }`}
                style={{
                  background: isDone ? cfg.color : isActive ? cfg.color : '#F5F0E8',
                  color: isDone || isActive ? 'white' : '#999',
                }}
              >
                {isDone ? '✓' : cfg.icon}
              </div>
              <span
                className="text-[9px] mt-1 font-medium text-center truncate w-full px-1"
                style={{ color: isActive ? cfg.color : isDone ? cfg.color : '#9CA3AF' }}
              >
                {cfg.label}
              </span>
            </div>
            {idx < PIPELINE_STEPS.length - 1 && (
              <div
                className="h-0.5 flex-1 mx-1 mt-[-10px] transition-all"
                style={{ background: isDone && !isRejected ? STATUS_CONFIG[PIPELINE_STEPS[idx]].color : '#E5E7EB' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Auto-checks panel ──────────────────────────────────────────────────────────

function AutoChecksPanel({ release }: { release: Release }) {
  return (
    <div className="bg-white rounded-xl border border-[#D8CFC4] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#EDE8DF] flex items-center gap-2">
        <span className="text-sm font-bold text-[#0A3D62]">⟳ Automatiska checks</span>
        {release.checks.some(c => c.status === 'pending') && (
          <Loader2 size={13} className="animate-spin text-[#3B82F6] ml-auto" />
        )}
        {release.checks.every(c => c.status === 'pass' || c.status === 'skipped') && (
          <CheckCircle size={13} className="text-green-500 ml-auto" />
        )}
      </div>
      <div className="divide-y divide-[#F5F0E8]">
        {release.checks.map(check => (
          <div key={check.id} className="flex items-center gap-3 px-4 py-2.5">
            <div className="shrink-0">
              {check.status === 'pending' && <Clock size={15} className="text-[#9CA3AF]" />}
              {check.status === 'running' && <Loader2 size={15} className="animate-spin text-[#3B82F6]" />}
              {check.status === 'pass'    && <CheckCircle size={15} className="text-green-500" />}
              {check.status === 'fail'    && <XCircle size={15} className="text-red-500" />}
              {check.status === 'skipped' && <Clock size={15} className="text-[#9CA3AF] opacity-50" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#212121] font-medium">{check.label}</span>
                {check.required && (
                  <span className="text-[9px] text-red-500 font-bold uppercase">Krävs</span>
                )}
              </div>
              {check.detail && (
                <p className="text-[10px] text-[#6B7280] mt-0.5">{check.detail}</p>
              )}
            </div>
            <span
              className="text-[10px] font-bold uppercase shrink-0"
              style={{
                color:
                  check.status === 'pass' ? '#10B981' :
                  check.status === 'fail' ? '#EF4444' :
                  check.status === 'running' ? '#3B82F6' : '#9CA3AF',
              }}
            >
              {check.status === 'pending' ? '—' :
               check.status === 'running' ? 'Kör...' :
               check.status === 'pass'    ? 'OK' :
               check.status === 'fail'    ? 'FAIL' : 'Skip'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Checklist panel ───────────────────────────────────────────────────────────

function ChecklistPanel({
  release,
  onToggle,
  readonly,
}: {
  release: Release
  onToggle: (itemId: string, checked: boolean) => void
  readonly: boolean
}) {
  const categories: ProductionChecklist['category'][] = ['security', 'quality', 'performance', 'documentation', 'legal']

  return (
    <div className="space-y-3">
      {categories.map(cat => {
        const items = release.checklist.filter(c => c.category === cat)
        if (!items.length) return null
        const meta = CATEGORY_META[cat]
        const allChecked = items.every(i => i.checked)

        return (
          <div key={cat} className="bg-white rounded-xl border border-[#D8CFC4] overflow-hidden">
            <div
              className="flex items-center gap-2 px-4 py-2.5 border-b"
              style={{ borderColor: `${meta.color}22`, background: `${meta.color}08` }}
            >
              <span style={{ color: meta.color }}>{meta.icon}</span>
              <span className="text-xs font-bold" style={{ color: meta.color }}>{meta.label}</span>
              {allChecked && <CheckCircle size={12} className="ml-auto" style={{ color: meta.color }} />}
            </div>
            <div className="divide-y divide-[#F5F0E8]">
              {items.map(item => (
                <label
                  key={item.id}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    readonly ? 'cursor-default' : 'hover:bg-[#FAFAF8]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    disabled={readonly}
                    onChange={e => onToggle(item.id, e.target.checked)}
                    className="mt-0.5 accent-[#0A3D62] w-4 h-4 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${item.checked ? 'line-through text-gray-400' : 'text-[#212121]'}`}>
                        {item.label}
                      </span>
                      {item.required && !item.checked && (
                        <span className="text-[9px] text-red-500 font-bold uppercase shrink-0">Krävs</span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#6B7280] mt-0.5">{item.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Founder approval panel ────────────────────────────────────────────────────

function FounderApprovalPanel({
  release,
  onApprove,
  onReject,
}: {
  release: Release
  onApprove: (note?: string) => void
  onReject: (reason: string) => void
}) {
  const [approvalNote, setApprovalNote] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  return (
    <div className="bg-white rounded-xl border-2 border-[#8B5CF6] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#8B5CF622] bg-[#8B5CF608]">
        <span className="text-lg">👑</span>
        <span className="text-sm font-bold text-[#8B5CF6]">Grundargodkännande krävs</span>
      </div>
      <div className="p-4 space-y-4">
        <div className="bg-[#F5F0E8] rounded-lg p-3 text-xs text-[#444] leading-relaxed">
          <strong className="text-[#0A3D62]">{release.repo_name}</strong> branch{' '}
          <code className="bg-white px-1 py-0.5 rounded text-[#E8B84B] border border-[#D8CFC4]">{release.branch}</code>
          {' '}väntar på ditt godkännande för att deployas live.
          <br />
          <span className="text-[#6B7280] mt-1 block">Commit: {release.commit_message}</span>
        </div>

        {!showRejectForm ? (
          <div className="space-y-3">
            <textarea
              value={approvalNote}
              onChange={e => setApprovalNote(e.target.value)}
              placeholder="Kommentar (valfritt)…"
              rows={2}
              className="w-full text-xs border border-[#C8BFB4] rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#10B981]"
            />
            <div className="flex gap-2">
              <button
                onClick={() => onApprove(approvalNote.trim() || undefined)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#10B981] text-white font-bold text-sm hover:bg-[#059669] transition-colors"
              >
                <ThumbsUp size={15} />
                Godkänn release
              </button>
              <button
                onClick={() => setShowRejectForm(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#EF4444] text-[#EF4444] font-bold text-sm hover:bg-[#FEF2F2] transition-colors"
              >
                <ThumbsDown size={15} />
                Avvisa
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Beskriv varför releasen avvisas…"
              rows={3}
              className="w-full text-xs border border-[#EF4444] rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#EF4444]"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => { if (rejectReason.trim()) onReject(rejectReason.trim()) }}
                disabled={!rejectReason.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#EF4444] text-white font-bold text-sm hover:bg-[#DC2626] disabled:opacity-40 transition-colors"
              >
                <XCircle size={15} />
                Bekräfta avvisning
              </button>
              <button
                onClick={() => setShowRejectForm(false)}
                className="px-4 py-2.5 rounded-lg border border-[#C8BFB4] text-gray-600 text-sm hover:bg-[#F5F0E8] transition-colors"
              >
                Avbryt
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main ReleasePipeline ──────────────────────────────────────────────────────

export function ReleasePipeline({
  release: releaseProp,
  releases,
  onBack,
  onUpdateChecklist,
  onSubmitForApproval,
  onApprove,
  onReject,
  onDeployLive,
}: ReleasePipelineProps) {
  // Always use the latest version from releases array (live updates from auto-checks)
  const release = releases.find(r => r.id === releaseProp.id) ?? releaseProp

  const { role } = useRole()
  const isFounder = role?.id === 'group-ceo' || role?.id === 'admin'
  const isDev = ['cto', 'admin', 'group-ceo'].includes(role?.id ?? '')

  const status = release.status
  const cfg = STATUS_CONFIG[status]

  const requiredChecklist = release.checklist.filter(c => c.required)
  const allRequiredChecked = requiredChecklist.every(c => c.checked)
  const checksAllDone = release.checks.every(c => c.status === 'pass' || c.status === 'skipped' || c.status === 'fail')

  const [deploying, setDeploying] = useState(false)

  const handleDeploy = async () => {
    setDeploying(true)
    await onDeployLive(release.id)
    setDeploying(false)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#F5F0E8]">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[#D8CFC4] bg-[#EDE8DF] shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-[#0A3D62] hover:text-[#072E4A] font-medium"
        >
          <ArrowLeft size={14} />
          Tillbaka
        </button>
        <div className="w-px h-4 bg-[#C8BFB4]" />
        <Rocket size={15} className="text-[#0A3D62]" />
        <span className="text-sm font-bold text-[#0A3D62]">Release Pipeline</span>
        <span className="text-xs text-[#6B7280]">·</span>
        <code className="text-xs font-mono text-[#444] bg-white px-2 py-0.5 rounded border border-[#D8CFC4]">
          {release.repo_name}@{release.branch}
        </code>
        <div className="flex-1" />
        <div
          className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ background: `${cfg.color}18`, color: cfg.color }}
        >
          <span>{cfg.icon}</span>
          <span>{cfg.label}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

          {/* Pipeline progress */}
          <div className="bg-white rounded-xl border border-[#D8CFC4] p-4">
            <PipelineProgress status={status === 'rejected' ? 'pending_approval' : status} />
            {status === 'rejected' && (
              <div className="mt-3 flex items-center gap-2 text-xs text-[#EF4444] bg-[#FEF2F2] rounded-lg px-3 py-2 border border-[#FECACA]">
                <AlertTriangle size={13} />
                <span>Release avvisad{release.rejected_reason ? `: ${release.rejected_reason}` : ''}</span>
              </div>
            )}
          </div>

          {/* Release meta */}
          <div className="bg-white rounded-xl border border-[#D8CFC4] px-4 py-3">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
              <div>
                <span className="text-[#9CA3AF] font-medium">Repo</span>
                <p className="text-[#0A3D62] font-mono mt-0.5">{release.repo_full_name}</p>
              </div>
              <div>
                <span className="text-[#9CA3AF] font-medium">Version</span>
                <p className="text-[#0A3D62] font-bold mt-0.5">{release.version}</p>
              </div>
              <div>
                <span className="text-[#9CA3AF] font-medium">Commit</span>
                <p className="text-[#444] font-mono mt-0.5">{release.commit_sha}</p>
              </div>
              <div>
                <span className="text-[#9CA3AF] font-medium">Skapad</span>
                <p className="text-[#444] mt-0.5">{new Date(release.created_at).toLocaleString('sv-SE')}</p>
              </div>
              <div className="col-span-2">
                <span className="text-[#9CA3AF] font-medium">Commit-meddelande</span>
                <p className="text-[#444] mt-0.5 italic">"{release.commit_message}"</p>
              </div>
            </div>
          </div>

          {/* STEG 1 — Auto-checks (alltid synlig) */}
          <AutoChecksPanel release={release} />

          {/* STEG 2 — Checklista (visas när status = checklist eller senare) */}
          {(['checklist', 'pending_approval', 'approved', 'live', 'rejected'] as ReleaseStatus[]).includes(status) && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-bold text-[#0A3D62]">📋 Produktionsberedning</span>
                {allRequiredChecked && (
                  <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">
                    Klar ✓
                  </span>
                )}
              </div>
              <ChecklistPanel
                release={release}
                onToggle={(itemId, checked) => onUpdateChecklist(release.id, itemId, checked)}
                readonly={status !== 'checklist' || !isDev}
              />
            </div>
          )}

          {/* STEG 3 — Skicka för godkännande */}
          {status === 'checklist' && isDev && (
            <div className="bg-white rounded-xl border border-[#D8CFC4] p-4">
              {!allRequiredChecked && (
                <div className="flex items-center gap-2 text-xs text-[#F59E0B] bg-[#FFFBEB] rounded-lg px-3 py-2 border border-[#FDE68A] mb-3">
                  <AlertTriangle size={13} />
                  <span>
                    {requiredChecklist.filter(c => !c.checked).length} obligatoriska punkter återstår
                  </span>
                </div>
              )}
              <button
                onClick={() => onSubmitForApproval(release.id)}
                disabled={!allRequiredChecked || !checksAllDone}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[#8B5CF6] text-white font-bold text-sm hover:bg-[#7C3AED] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={15} />
                Skicka för grundargodkännande
              </button>
            </div>
          )}

          {/* STEG 4 — Väntar på grundare */}
          {status === 'pending_approval' && !isFounder && (
            <div className="bg-white rounded-xl border border-[#8B5CF6] p-4 text-center">
              <div className="text-3xl mb-2">⏳</div>
              <p className="text-sm font-bold text-[#8B5CF6]">Väntar på grundarens godkännande</p>
              <p className="text-xs text-[#6B7280] mt-1">Erik granskar och godkänner releasen</p>
            </div>
          )}

          {status === 'pending_approval' && isFounder && (
            <FounderApprovalPanel
              release={release}
              onApprove={note => onApprove(release.id, note)}
              onReject={reason => onReject(release.id, reason)}
            />
          )}

          {/* STEG 5 — Approved — Dev kan deploya */}
          {status === 'approved' && (
            <div className="bg-white rounded-xl border-2 border-[#10B981] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-[#10B98108] border-b border-[#10B98122]">
                <CheckCircle size={16} className="text-[#10B981]" />
                <span className="text-sm font-bold text-[#10B981]">Godkänt av grundaren</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="text-xs text-[#444] bg-[#F5F0E8] rounded-lg px-3 py-2">
                  <strong className="text-[#0A3D62]">Godkänt av:</strong> {release.approved_by}
                  <br />
                  <strong className="text-[#0A3D62]">Tidpunkt:</strong>{' '}
                  {release.approved_at ? new Date(release.approved_at).toLocaleString('sv-SE') : '—'}
                  {release.approval_note && (
                    <>
                      <br />
                      <strong className="text-[#0A3D62]">Kommentar:</strong> {release.approval_note}
                    </>
                  )}
                </div>
                {isDev && (
                  <button
                    onClick={handleDeploy}
                    disabled={deploying}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[#0A3D62] text-white font-bold text-sm hover:bg-[#072E4A] disabled:opacity-50 transition-colors"
                  >
                    {deploying ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Rocket size={15} />
                    )}
                    {deploying ? 'Deployer…' : '🚀 Deploy live'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEG 6 — Live */}
          {status === 'live' && (
            <div className="bg-white rounded-xl border-2 border-[#2D7A4F] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-[#2D7A4F08] border-b border-[#2D7A4F22]">
                <span className="text-lg">🚀</span>
                <span className="text-sm font-bold text-[#2D7A4F]">Live i produktion!</span>
              </div>
              <div className="p-4 text-xs text-[#444]">
                <p>
                  <strong className="text-[#0A3D62]">{release.repo_name}</strong> är nu live.
                  Deployad: {new Date(release.updated_at).toLocaleString('sv-SE')}
                </p>
                {release.deploy_url && (
                  <a
                    href={release.deploy_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-[#0A3D62] underline hover:text-[#072E4A]"
                  >
                    {release.deploy_url} →
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Spacer */}
          <div className="h-6" />
        </div>
      </div>
    </div>
  )
}
