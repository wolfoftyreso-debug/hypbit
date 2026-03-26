// ─── Operations — Active Work, Issues, Capacity ────────────────────────────
// Replaces: Incident Center, Tasks, Command Chain.
// Every item answers: what, who, when, and what's it worth in SEK.

import { useState } from 'react'

// ─── Data ───────────────────────────────────────────────────────────────────

type WorkStatus = 'active' | 'blocked' | 'queued' | 'done'
type IssuePriority = 'high' | 'medium' | 'low'

interface WorkItem {
  id: string
  title: string
  owner: string
  status: WorkStatus
  deadline: string
  impact: string
}

interface Issue {
  id: string
  problem: string
  impact: string
  impactSEK: number | null
  owner: string
  nextAction: string
  deadline: string
  priority: IssuePriority
}

interface CapacityPerson {
  name: string
  role: string
  utilization: number
  activeItems: number
}

const WORK_ITEMS: WorkItem[] = [
  { id: 'w1', title: 'LandveX beta launch — SE market', owner: 'Erik', status: 'active', deadline: '2026-04-15', impact: 'First paying customers' },
  { id: 'w2', title: 'Stripe US entity setup', owner: 'Winston', status: 'blocked', deadline: '2026-04-30', impact: 'US revenue blocked until EIN' },
  { id: 'w3', title: 'QuiXzoom MVP — image capture pipeline', owner: 'Johan', status: 'active', deadline: '2026-05-01', impact: 'Core product for task engine' },
  { id: 'w4', title: 'Dubai FZCO registration', owner: 'Dennis', status: 'active', deadline: '2026-06-01', impact: 'Holding structure' },
  { id: 'w5', title: 'Fortnox integration (accounting sync)', owner: 'Johan', status: 'queued', deadline: '2026-05-15', impact: 'Live finance data' },
  { id: 'w6', title: 'Customer onboarding flow', owner: 'Leon', status: 'queued', deadline: '2026-04-30', impact: 'Conversion rate' },
]

const ISSUES: Issue[] = [
  { id: 'i1', problem: 'No revenue from US market', impact: '0 SEK inflow from US', impactSEK: 0, owner: 'Erik', nextAction: 'Complete EIN + bank setup', deadline: '2026-04-30', priority: 'high' },
  { id: 'i2', problem: 'No GTM launched for LandveX', impact: 'Zero paying customers', impactSEK: null, owner: 'Erik', nextAction: 'Launch beta to 3 municipalities', deadline: '2026-04-15', priority: 'high' },
  { id: 'i3', problem: 'Transfer pricing docs missing', impact: 'Royalty structure at risk', impactSEK: null, owner: 'Dennis', nextAction: 'Engage TP advisor', deadline: '2026-Q3', priority: 'medium' },
]

const CAPACITY: CapacityPerson[] = [
  { name: 'Erik Svensson', role: 'CEO', utilization: 95, activeItems: 4 },
  { name: 'Leon Russo De Cerame', role: 'COO', utilization: 70, activeItems: 2 },
  { name: 'Winston Bjarnemark', role: 'CFO', utilization: 60, activeItems: 2 },
  { name: 'Dennis Bjarnemark', role: 'Legal', utilization: 50, activeItems: 2 },
  { name: 'Johan Berglund', role: 'CTO', utilization: 85, activeItems: 3 },
]

const STATUS_STYLE: Record<WorkStatus, { bg: string; text: string }> = {
  active: { bg: '#1A2A1E', text: '#4A7A5B' },
  blocked: { bg: '#2A1A1A', text: '#B04040' },
  queued: { bg: '#1A1C24', text: '#6B7280' },
  done: { bg: '#1A1C24', text: '#3D4452' },
}

const PRIORITY_STYLE: Record<IssuePriority, { bg: string; text: string }> = {
  high: { bg: '#2A1A1A', text: '#B04040' },
  medium: { bg: '#2A2418', text: '#9A7A30' },
  low: { bg: '#1A1C24', text: '#6B7280' },
}

type TabId = 'work' | 'issues' | 'capacity'

export function OperationsView() {
  const [tab, setTab] = useState<TabId>('work')

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'work', label: 'Active Work', count: WORK_ITEMS.filter(w => w.status !== 'done').length },
    { id: 'issues', label: 'Issues', count: ISSUES.length },
    { id: 'capacity', label: 'Capacity' },
  ]

  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b border-[#1A1C24] px-6 pt-5 pb-0 bg-[#0C0D12]">
        <h1 className="text-[15px] font-semibold text-[#E0E1E4]">Operations</h1>
        <p className="text-[12px] text-[#4A4F5C] mt-0.5 mb-4">Active work, issues, team capacity</p>
        <div className="flex gap-0 -mb-px">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="text-[12px] pb-2.5 mr-5 border-b-2 transition-colors flex items-center gap-1.5"
              style={{ color: tab === t.id ? '#E0E1E4' : '#4A4F5C', borderColor: tab === t.id ? '#4A7A9B' : 'transparent', fontWeight: tab === t.id ? 600 : 400 }}>
              {t.label}
              {t.count !== undefined && <span className="text-[10px] text-[#4A4F5C] font-mono">{t.count}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 max-w-5xl">
        {tab === 'work' && (
          <div className="space-y-1.5">
            {WORK_ITEMS.map(w => {
              const s = STATUS_STYLE[w.status]
              return (
                <div key={w.id} className="flex items-center gap-3 rounded-lg border border-[#1A1C24] px-4 py-3" style={{ background: '#0E0F14' }}>
                  <span className="text-[11px] px-2 py-0.5 rounded font-mono" style={{ background: s.bg, color: s.text }}>{w.status}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-[#E0E1E4]">{w.title}</div>
                    <div className="text-[11px] text-[#3D4452] mt-0.5">{w.impact}</div>
                  </div>
                  <span className="text-[12px] text-[#6B7280]">{w.owner}</span>
                  <span className="text-[11px] text-[#3D4452] font-mono">{w.deadline}</span>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'issues' && (
          <div className="space-y-2">
            {ISSUES.map(issue => {
              const p = PRIORITY_STYLE[issue.priority]
              return (
                <div key={issue.id} className="rounded-lg border border-[#1A1C24] bg-[#0E0F14] px-4 py-3">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[11px] px-2 py-0.5 rounded font-mono" style={{ background: p.bg, color: p.text }}>{issue.priority}</span>
                    <span className="text-[13px] font-medium text-[#E0E1E4]">{issue.problem}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3 text-[12px]">
                    <div><span className="text-[#3D4452]">Impact:</span> <span className="text-[#9CA3AF]">{issue.impact}</span></div>
                    <div><span className="text-[#3D4452]">Owner:</span> <span className="text-[#9CA3AF]">{issue.owner}</span></div>
                    <div><span className="text-[#3D4452]">Next:</span> <span className="text-[#9CA3AF]">{issue.nextAction}</span></div>
                    <div><span className="text-[#3D4452]">Deadline:</span> <span className="text-[#9CA3AF] font-mono">{issue.deadline}</span></div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'capacity' && (
          <div className="space-y-1.5">
            {CAPACITY.map(p => (
              <div key={p.name} className="flex items-center gap-3 rounded-lg border border-[#1A1C24] bg-[#0E0F14] px-4 py-3">
                <div className="flex-1">
                  <div className="text-[13px] text-[#E0E1E4]">{p.name}</div>
                  <div className="text-[11px] text-[#3D4452]">{p.role} — {p.activeItems} active items</div>
                </div>
                <div className="w-32">
                  <div className="h-1.5 rounded-full bg-[#1A1C24] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${p.utilization}%`, background: p.utilization > 85 ? '#B04040' : p.utilization > 60 ? '#9A7A30' : '#4A7A5B' }} />
                  </div>
                  <div className="text-[10px] text-[#4A4F5C] font-mono mt-0.5 text-right">{p.utilization}%</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
