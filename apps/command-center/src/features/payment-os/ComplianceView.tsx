// ─── Compliance View — Regulatory Map + Automation ──────────────────────────
// Shows compliance status per jurisdiction, automation pipeline,
// and the "Touchless Finance" automation checklist.

import { useState } from 'react'
import { ENTITIES } from '../org-graph/data'
import { COMPLIANCE_MAP, type ComplianceRequirement } from './paymentOsData'

const STATUS_COLOR: Record<string, string> = {
  compliant: '#10B981',
  'in-progress': '#F59E0B',
  'not-started': '#EF4444',
  'not-applicable': '#3D4452',
  planned: '#6B7280',
}

const STATUS_ICON: Record<string, string> = {
  compliant: '✓',
  'in-progress': '◎',
  'not-started': '✕',
  'not-applicable': '—',
}

// ─── Touchless Finance Checklist ────────────────────────────────────────────

interface AutomationItem {
  id: string
  category: string
  label: string
  status: 'live' | 'building' | 'planned'
  target: string
  notes: string
}

const AUTOMATION_CHECKLIST: AutomationItem[] = [
  { id: 'a1', category: 'Invoice', label: '100% auto-booking', status: 'planned', target: 'Every invoice → ledger entry automatically', notes: 'OCR + AI classification → double-entry posting' },
  { id: 'a2', category: 'Invoice', label: '3-way matching engine', status: 'planned', target: 'Invoice ↔ Order ↔ Delivery', notes: 'Auto-match or flag for review' },
  { id: 'a3', category: 'Invoice', label: 'OCR + parsing pipeline', status: 'planned', target: 'PDF/EDI → structured data', notes: 'AWS Textract + custom models' },
  { id: 'a4', category: 'Approval', label: '95%+ auto-approval', status: 'planned', target: 'Rule-based approval engine', notes: 'Amount thresholds, vendor trust scores, SoD enforcement' },
  { id: 'a5', category: 'Approval', label: 'Segregation of Duties', status: 'planned', target: 'No single person can create+approve+pay', notes: 'Built into rule engine' },
  { id: 'a6', category: 'Payment', label: 'Auto-payment execution', status: 'building', target: 'Approved invoices → SEPA/ACH/Wire', notes: 'Via bank adapters (microservices)' },
  { id: 'a7', category: 'Reconciliation', label: '100% auto-reconciliation', status: 'planned', target: 'Invoice ↔ Payment ↔ Ledger = 0 diff', notes: 'Real-time matching, exception flagging' },
  { id: 'a8', category: 'Reporting', label: '0 manual reports', status: 'planned', target: 'P&L, BS, CF generated from ledger', notes: 'Real-time financial state' },
  { id: 'a9', category: 'Reporting', label: 'Jurisdiction reporting', status: 'planned', target: 'VAT (EU), Sales Tax (US), IC reports', notes: 'Auto-generated per entity' },
  { id: 'a10', category: 'Audit', label: 'Full audit trail', status: 'building', target: 'Every action logged immutably', notes: 'Append-only event log, replay capability' },
  { id: 'a11', category: 'Audit', label: 'Continuous compliance engine', status: 'planned', target: 'Nightly compliance checks', notes: 'Deviations, broken rules, missing approvals' },
  { id: 'a12', category: 'AML', label: 'AML/Risk automation', status: 'planned', target: 'Auto-flag unusual amounts/vendors', notes: 'Triggers: new vendors, cross-border, high amounts' },
]

const AUTOMATION_STATUS_COLOR: Record<string, string> = {
  live: '#10B981',
  building: '#F59E0B',
  planned: '#6B7280',
}

// ─── Invoice Flow Diagram ───────────────────────────────────────────────────

function InvoiceFlowDiagram() {
  const steps = [
    { num: 1, label: 'Invoice in (PDF/API/EDI)', color: '#6B7280' },
    { num: 2, label: 'OCR + parsing', color: '#22D3EE' },
    { num: 3, label: 'Classification (AI + rules)', color: '#0EA5E9' },
    { num: 4, label: 'Matching (order / contract / entity)', color: '#F59E0B' },
    { num: 5, label: 'Booking (ledger entry)', color: '#8B5CF6' },
    { num: 6, label: 'Approval (rule-based)', color: '#EC4899' },
    { num: 7, label: 'Payment (auto)', color: '#10B981' },
    { num: 8, label: 'Reconciliation (0 diff)', color: '#10B981' },
  ]

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 mb-6">
      <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-4">Touchless Invoice Flow</h3>
      <div className="flex flex-wrap gap-0">
        {steps.map((step, i) => (
          <div key={step.num} className="flex items-center">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border"
              style={{ borderColor: step.color + '30', background: step.color + '08' }}>
              <span className="text-[10px] font-bold font-mono" style={{ color: step.color }}>{step.num}</span>
              <span className="text-[10px] text-gray-400">{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <span className="text-gray-700 mx-1 text-xs">→</span>
            )}
          </div>
        ))}
      </div>
      <div className="text-[10px] text-gray-700 mt-3 font-mono">
        TARGET: 0 manual handling of invoices, payments, and reports
      </div>
    </div>
  )
}

// ─── Compliance Table ───────────────────────────────────────────────────────

function ComplianceTable() {
  const byJurisdiction = COMPLIANCE_MAP.reduce((acc, cr) => {
    if (!acc[cr.jurisdiction]) acc[cr.jurisdiction] = []
    acc[cr.jurisdiction].push(cr)
    return acc
  }, {} as Record<string, ComplianceRequirement[]>)

  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Regulatory Compliance Map</h3>
      <div className="space-y-4">
        {Object.entries(byJurisdiction).map(([jurisdiction, reqs]) => (
          <div key={jurisdiction}>
            <div className="text-[10px] text-gray-700 font-mono mb-2">{jurisdiction}</div>
            <div className="space-y-1.5">
              {reqs.map(cr => {
                const statusColor = STATUS_COLOR[cr.status]
                return (
                  <div key={cr.id} className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold flex-shrink-0" style={{ color: statusColor }}>
                        {STATUS_ICON[cr.status]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-200">{cr.regulation}</span>
                          {cr.deadline && (
                            <span className="text-[10px] text-gray-600 font-mono">{cr.deadline}</span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-600 mt-0.5">{cr.notes}</div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {cr.applies_to.map(eid => {
                          const entity = ENTITIES.find(e => e.id === eid)
                          return entity ? (
                            <span key={eid} className="text-[9px] px-1 py-0.5 rounded"
                              style={{ background: entity.color + '15', color: entity.color }}>
                              {entity.shortName}
                            </span>
                          ) : null
                        })}
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono flex-shrink-0"
                        style={{ background: statusColor + '18', color: statusColor }}>
                        {cr.status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Automation Checklist ───────────────────────────────────────────────────

function AutomationChecklist() {
  const byCategory = AUTOMATION_CHECKLIST.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, AutomationItem[]>)

  const stats = {
    total: AUTOMATION_CHECKLIST.length,
    live: AUTOMATION_CHECKLIST.filter(a => a.status === 'live').length,
    building: AUTOMATION_CHECKLIST.filter(a => a.status === 'building').length,
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
          Touchless Finance Checklist
        </h3>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="text-[#10B981]">{stats.live} live</span>
          <span className="text-[#F59E0B]">{stats.building} building</span>
          <span className="text-gray-600">{stats.total - stats.live - stats.building} planned</span>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(byCategory).map(([category, items]) => (
          <div key={category}>
            <div className="text-[10px] text-gray-700 font-mono mb-2">{category.toUpperCase()}</div>
            <div className="space-y-1.5">
              {items.map(item => {
                const color = AUTOMATION_STATUS_COLOR[item.status]
                return (
                  <div key={item.id} className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: color }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-200">{item.label}</div>
                        <div className="text-[10px] text-gray-600 mt-0.5">{item.target}</div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono flex-shrink-0"
                        style={{ background: color + '18', color }}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* German-level checklist */}
      <div className="rounded-xl border border-[#F59E0B25] bg-[#F59E0B08] px-5 py-3 mt-6">
        <h4 className="text-xs font-bold text-[#F59E0B] mb-2">"Tysk Niva" Target</h4>
        <div className="space-y-1 text-[10px] text-gray-400">
          <div className="flex items-center gap-2"><span className="text-gray-600">[ ]</span> 100% auto-booking</div>
          <div className="flex items-center gap-2"><span className="text-gray-600">[ ]</span> 95%+ auto-approval</div>
          <div className="flex items-center gap-2"><span className="text-gray-600">[ ]</span> 100% reconciliation</div>
          <div className="flex items-center gap-2"><span className="text-gray-600">[ ]</span> 0 manual reports</div>
          <div className="flex items-center gap-2"><span className="text-gray-600">[ ]</span> Full audit trail on everything</div>
          <div className="flex items-center gap-2"><span className="text-gray-600">[ ]</span> Real-time financial state</div>
        </div>
      </div>
    </div>
  )
}

// ─── TSP Strategy ───────────────────────────────────────────────────────────

function TSPStrategy() {
  return (
    <div className="rounded-xl border border-[#8B5CF625] bg-[#8B5CF608] px-5 py-4 mb-6">
      <h3 className="text-xs font-bold text-[#8B5CF6] mb-2">Compliance Strategy: Technical Service Provider</h3>
      <div className="space-y-2 text-xs text-gray-400">
        <p>You operate as a <span className="text-white font-bold">Technical Service Provider (TSP)</span>, NOT a financial institution.</p>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="rounded-lg border border-[#10B98120] bg-[#10B98108] p-3">
            <div className="text-[10px] text-[#10B981] font-bold mb-1">YOU DO</div>
            <ul className="text-[10px] text-gray-500 space-y-0.5">
              <li>Store metadata + ledger mirror</li>
              <li>Orchestrate payment routing</li>
              <li>Generate invoices + reports</li>
              <li>Run compliance automation</li>
            </ul>
          </div>
          <div className="rounded-lg border border-[#EF444420] bg-[#EF444408] p-3">
            <div className="text-[10px] text-[#EF4444] font-bold mb-1">YOU DON'T</div>
            <ul className="text-[10px] text-gray-500 space-y-0.5">
              <li>Hold customer funds</li>
              <li>Act as money transmitter</li>
              <li>Need banking license</li>
              <li>Need EMI license</li>
            </ul>
          </div>
        </div>
        <p className="text-[10px] text-gray-600 mt-2">Funds always sit with licensed PSPs (Stripe/Adyen) or banks (SEB/ENBD/Mercury). You only manage orchestration.</p>
      </div>
    </div>
  )
}

// ─── Main ───────────────────────────────────────────────────────────────────

export function ComplianceView() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-white">Compliance & Automation</h2>
          <p className="text-[10px] text-gray-600 mt-0.5">Regulatory map + touchless finance automation — audit-ready at all times</p>
        </div>

        <TSPStrategy />
        <InvoiceFlowDiagram />
        <ComplianceTable />
        <AutomationChecklist />
      </div>
    </div>
  )
}
