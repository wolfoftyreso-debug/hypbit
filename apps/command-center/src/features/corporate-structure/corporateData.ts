// ─── Corporate Structure Data Layer ──────────────────────────────────────────
// All holding structure, capital flow, and setup checklist data.
// Will move to Supabase when bank-level API is connected.

import { ENTITIES, RELATIONSHIPS, type Entity, type EntityRelationship } from '../org-graph/data'

// ─── HOLDING TIERS ──────────────────────────────────────────────────────────

export type HoldingTier = 'top-holding' | 'ip-company' | 'us-operations' | 'eu-operations' | 'service-company'

export interface HoldingNode {
  entityId: string
  tier: HoldingTier
  tierLabel: string
  tierDescription: string
  taxRate: string
  keyFunctions: string[]
  bankStatus: 'active' | 'pending' | 'not-started'
  bankName: string | null
  incorporationStatus: 'complete' | 'in-progress' | 'planned'
}

export const HOLDING_NODES: HoldingNode[] = [
  {
    entityId: 'wavult-group',
    tier: 'top-holding',
    tierLabel: 'Level 1 — Top Holding',
    tierDescription: 'Capital accumulation & control. Owns all entities. Receives dividends.',
    taxRate: '0%',
    keyFunctions: ['IP ownership', 'Board control', 'Dividend collection', 'Capital accumulation'],
    bankStatus: 'pending',
    bankName: 'Emirates NBD',
    incorporationStatus: 'in-progress',
  },
  {
    entityId: 'wavult-operations',
    tier: 'service-company',
    tierLabel: 'Level 2 — Service Hub',
    tierDescription: 'Internal operations. Employs team, runs Hypbit OS, invoices subsidiaries.',
    taxRate: '0%',
    keyFunctions: ['Team employment', 'Service delivery', 'Internal billing', 'System operations'],
    bankStatus: 'pending',
    bankName: 'Emirates NBD',
    incorporationStatus: 'in-progress',
  },
  {
    entityId: 'quixzoom-uab',
    tier: 'eu-operations',
    tierLabel: 'Level 3 — EU Operations',
    tierDescription: 'EU SaaS sales. GDPR-compliant. Pays royalties to Dubai holding.',
    taxRate: '15%',
    keyFunctions: ['EU SaaS sales', 'EU invoicing', 'GDPR compliance', 'Royalty payments to holding'],
    bankStatus: 'not-started',
    bankName: null,
    incorporationStatus: 'planned',
  },
  {
    entityId: 'quixzoom-inc',
    tier: 'us-operations',
    tierLabel: 'Level 3 — US Operations',
    tierDescription: 'US SaaS sales. Delaware C-Corp. Investor-ready. Pays royalties to holding.',
    taxRate: '21%',
    keyFunctions: ['US SaaS sales', 'Capital raising', 'US payments', 'Royalty payments to holding'],
    bankStatus: 'not-started',
    bankName: null,
    incorporationStatus: 'planned',
  },
  {
    entityId: 'landvex-inc',
    tier: 'us-operations',
    tierLabel: 'Level 3 — US Operations',
    tierDescription: 'US entity for LandveX. Texas LLC targeting infrastructure operators.',
    taxRate: '21%',
    keyFunctions: ['US infrastructure sales', 'Government contracts', 'Royalty payments to holding'],
    bankStatus: 'not-started',
    bankName: null,
    incorporationStatus: 'in-progress',
  },
  {
    entityId: 'landvex-ab',
    tier: 'eu-operations',
    tierLabel: 'Level 3 — EU Operations',
    tierDescription: 'Swedish operating entity. EU/SE sales. Licenses IP from Dubai holding.',
    taxRate: '20.6%',
    keyFunctions: ['SE/EU sales', 'Swedish operations', 'Royalty payments to holding'],
    bankStatus: 'active',
    bankName: 'SEB',
    incorporationStatus: 'complete',
  },
]

// ─── CAPITAL FLOWS ──────────────────────────────────────────────────────────

export type FlowType = 'royalty' | 'dividend' | 'service-fee' | 'revenue' | 'intercompany'
export type FlowStatus = 'active' | 'planned' | 'pending-agreement'

export interface CapitalFlow {
  id: string
  fromEntityId: string
  toEntityId: string
  flowType: FlowType
  label: string
  amount: string | null  // null = TBD
  frequency: 'monthly' | 'quarterly' | 'annual' | 'on-demand'
  status: FlowStatus
  taxImpact: string
  notes: string
}

export const CAPITAL_FLOWS: CapitalFlow[] = [
  // Revenue in
  {
    id: 'cf-1', fromEntityId: 'external', toEntityId: 'landvex-ab',
    flowType: 'revenue', label: 'SE/EU customer revenue',
    amount: null, frequency: 'monthly', status: 'active',
    taxImpact: '20.6% corporate tax SE', notes: 'Stripe + invoice payments',
  },
  {
    id: 'cf-2', fromEntityId: 'external', toEntityId: 'landvex-inc',
    flowType: 'revenue', label: 'US customer revenue',
    amount: null, frequency: 'monthly', status: 'planned',
    taxImpact: '21% federal + state', notes: 'Stripe US entity',
  },
  {
    id: 'cf-3', fromEntityId: 'external', toEntityId: 'quixzoom-uab',
    flowType: 'revenue', label: 'EU customer revenue (quiXzoom)',
    amount: null, frequency: 'monthly', status: 'planned',
    taxImpact: '15% corporate tax LT', notes: 'EU payment processing',
  },
  {
    id: 'cf-4', fromEntityId: 'external', toEntityId: 'quixzoom-inc',
    flowType: 'revenue', label: 'US customer revenue (quiXzoom)',
    amount: null, frequency: 'monthly', status: 'planned',
    taxImpact: '21% federal', notes: 'US C-Corp Stripe',
  },
  // Royalties to holding
  {
    id: 'cf-5', fromEntityId: 'landvex-ab', toEntityId: 'wavult-group',
    flowType: 'royalty', label: 'IP royalty 10%',
    amount: '10% of revenue', frequency: 'quarterly', status: 'pending-agreement',
    taxImpact: 'Deductible in SE, 0% in UAE', notes: 'Transfer pricing documentation required',
  },
  {
    id: 'cf-6', fromEntityId: 'landvex-inc', toEntityId: 'wavult-group',
    flowType: 'royalty', label: 'IP royalty 10%',
    amount: '10% of revenue', frequency: 'quarterly', status: 'pending-agreement',
    taxImpact: 'Deductible in US, 0% in UAE', notes: 'Transfer pricing documentation required',
  },
  {
    id: 'cf-7', fromEntityId: 'quixzoom-uab', toEntityId: 'wavult-group',
    flowType: 'royalty', label: 'IP royalty 10%',
    amount: '10% of revenue', frequency: 'quarterly', status: 'planned',
    taxImpact: 'Deductible in LT, 0% in UAE', notes: 'License agreement needed',
  },
  {
    id: 'cf-8', fromEntityId: 'quixzoom-inc', toEntityId: 'wavult-group',
    flowType: 'royalty', label: 'IP royalty 10%',
    amount: '10% of revenue', frequency: 'quarterly', status: 'planned',
    taxImpact: 'Deductible in US, 0% in UAE', notes: 'License agreement needed',
  },
  // Service fees to operations hub
  {
    id: 'cf-9', fromEntityId: 'landvex-ab', toEntityId: 'wavult-operations',
    flowType: 'service-fee', label: 'Operations service fee',
    amount: 'Cost + 5% margin', frequency: 'monthly', status: 'pending-agreement',
    taxImpact: 'Deductible in SE, 0% in UAE', notes: 'Hypbit OS + team services',
  },
  {
    id: 'cf-10', fromEntityId: 'landvex-inc', toEntityId: 'wavult-operations',
    flowType: 'service-fee', label: 'Operations service fee',
    amount: 'Cost + 5% margin', frequency: 'monthly', status: 'planned',
    taxImpact: 'Deductible in US, 0% in UAE', notes: 'Hypbit OS + team services',
  },
  // Dividends up
  {
    id: 'cf-11', fromEntityId: 'landvex-ab', toEntityId: 'wavult-group',
    flowType: 'dividend', label: 'Annual dividend',
    amount: null, frequency: 'annual', status: 'planned',
    taxImpact: 'WHT may apply SE→UAE', notes: 'After retained earnings threshold',
  },
  {
    id: 'cf-12', fromEntityId: 'landvex-inc', toEntityId: 'wavult-group',
    flowType: 'dividend', label: 'Annual dividend',
    amount: null, frequency: 'annual', status: 'planned',
    taxImpact: 'WHT 30% US→UAE (reducible via treaty)', notes: 'After profitability',
  },
]

// ─── SETUP CHECKLIST ────────────────────────────────────────────────────────

export type ChecklistPhase = 1 | 2 | 3 | 4
export type ChecklistItemStatus = 'done' | 'in-progress' | 'blocked' | 'pending'

export interface ChecklistItem {
  id: string
  phase: ChecklistPhase
  entityId: string | null
  label: string
  status: ChecklistItemStatus
  blockedBy: string | null
  notes: string
  dueDate: string | null
}

export const SETUP_PHASES: { phase: ChecklistPhase; label: string; description: string }[] = [
  { phase: 1, label: 'Foundation', description: 'US C-Corp + EIN + bank account' },
  { phase: 2, label: 'Holding Setup', description: 'Dubai holding + tax exit from Sweden' },
  { phase: 3, label: 'IP Structure', description: 'IP company + license agreements' },
  { phase: 4, label: 'Scale', description: 'EU entities + payment infrastructure' },
]

export const SETUP_CHECKLIST: ChecklistItem[] = [
  // Phase 1
  { id: 'c1', phase: 1, entityId: 'landvex-inc', label: 'Register US entity (Texas LLC)', status: 'in-progress', blockedBy: null, notes: 'EIN application submitted', dueDate: '2026-04' },
  { id: 'c2', phase: 1, entityId: 'landvex-inc', label: 'Get EIN from IRS', status: 'in-progress', blockedBy: null, notes: 'SS-4 filed', dueDate: '2026-04' },
  { id: 'c3', phase: 1, entityId: 'landvex-inc', label: 'Open US bank account (Mercury/Chase)', status: 'pending', blockedBy: 'c2', notes: 'Needs EIN first', dueDate: '2026-05' },
  { id: 'c4', phase: 1, entityId: 'landvex-inc', label: 'Setup Stripe US entity', status: 'pending', blockedBy: 'c3', notes: 'Needs bank account', dueDate: '2026-05' },

  // Phase 2
  { id: 'c5', phase: 2, entityId: 'wavult-group', label: 'Register Dubai FZCO (DMCC)', status: 'in-progress', blockedBy: null, notes: 'Application in progress', dueDate: '2026-06' },
  { id: 'c6', phase: 2, entityId: 'wavult-group', label: 'Open Emirates NBD account', status: 'pending', blockedBy: 'c5', notes: 'Needs DMCC license', dueDate: '2026-07' },
  { id: 'c7', phase: 2, entityId: null, label: 'Tax exit from Sweden (skattemässig utflyttning)', status: 'pending', blockedBy: null, notes: 'Skatteverket process — critical for 0% structure', dueDate: '2026-H2' },
  { id: 'c8', phase: 2, entityId: 'wavult-operations', label: 'Register operations entity (Dubai)', status: 'pending', blockedBy: 'c5', notes: 'After holding is live', dueDate: '2026-07' },

  // Phase 3
  { id: 'c9', phase: 3, entityId: 'wavult-group', label: 'Transfer IP to Dubai holding', status: 'pending', blockedBy: 'c5', notes: 'Code, trademarks, patents — requires valuation', dueDate: '2026-Q3' },
  { id: 'c10', phase: 3, entityId: 'wavult-group', label: 'Create IP license agreements (5-15%)', status: 'pending', blockedBy: 'c9', notes: 'One per subsidiary — transfer pricing docs', dueDate: '2026-Q3' },
  { id: 'c11', phase: 3, entityId: 'wavult-group', label: 'Transfer pricing documentation', status: 'pending', blockedBy: 'c10', notes: 'Must be arms-length — get advisor', dueDate: '2026-Q3' },
  { id: 'c12', phase: 3, entityId: null, label: 'Substance in Dubai (office/flex desk + board)', status: 'pending', blockedBy: 'c5', notes: 'CRITICAL — without this structure fails', dueDate: '2026-Q3' },

  // Phase 4
  { id: 'c13', phase: 4, entityId: 'quixzoom-uab', label: 'Register QuiXzoom UAB (Lithuania)', status: 'pending', blockedBy: null, notes: 'EU entity for quiXzoom', dueDate: '2026-Q4' },
  { id: 'c14', phase: 4, entityId: 'quixzoom-inc', label: 'Register QuiXzoom Inc (Delaware)', status: 'pending', blockedBy: null, notes: 'US entity for quiXzoom', dueDate: '2026-Q4' },
  { id: 'c15', phase: 4, entityId: null, label: 'Multi-entity payment routing (Stripe Connect)', status: 'pending', blockedBy: 'c4', notes: 'Route payments to correct entity per jurisdiction', dueDate: '2027-Q1' },
  { id: 'c16', phase: 4, entityId: null, label: 'Intercompany billing automation', status: 'pending', blockedBy: 'c10', notes: 'Auto-generate royalty invoices', dueDate: '2027-Q1' },
]

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export function getEntity(id: string): Entity | undefined {
  return ENTITIES.find(e => e.id === id)
}

export function getHoldingNode(entityId: string): HoldingNode | undefined {
  return HOLDING_NODES.find(n => n.entityId === entityId)
}

export function getFlowsForEntity(entityId: string): { inflows: CapitalFlow[]; outflows: CapitalFlow[] } {
  return {
    inflows: CAPITAL_FLOWS.filter(f => f.toEntityId === entityId),
    outflows: CAPITAL_FLOWS.filter(f => f.fromEntityId === entityId),
  }
}

export function getChecklistForPhase(phase: ChecklistPhase): ChecklistItem[] {
  return SETUP_CHECKLIST.filter(c => c.phase === phase)
}

export function getChecklistProgress(): { total: number; done: number; inProgress: number; blocked: number } {
  const total = SETUP_CHECKLIST.length
  const done = SETUP_CHECKLIST.filter(c => c.status === 'done').length
  const inProgress = SETUP_CHECKLIST.filter(c => c.status === 'in-progress').length
  const blocked = SETUP_CHECKLIST.filter(c => c.status === 'blocked').length
  return { total, done, inProgress, blocked }
}
