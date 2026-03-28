// ─── People & Governance — Type Definitions ────────────────────────────────────
// Varje person är tre saker simultant:
//   1. Prestationsenhet  (delivery rate, deadline accuracy, decision quality)
//   2. Kostnadsenhet     (lön + overhead / värde genererat)
//   3. Beslutsenhet      (beslut fattade, utfall av beslut)

export type PerformanceTier = 'critical' | 'low' | 'meeting' | 'exceeding' | 'exceptional'
// critical < 50 | low 50-69 | meeting 70-84 | exceeding 85-94 | exceptional 95+

// ─── OKR ──────────────────────────────────────────────────────────────────────

export interface KeyResult {
  id: string
  description: string
  targetValue: number
  currentValue: number
  unit: string          // '%', 'SEK', 'count', 'days'
  dueDate: string
  status: 'on-track' | 'at-risk' | 'missed' | 'completed'
}

export interface OKR {
  id: string
  personId: string      // vems OKR
  teamId?: string       // eller teams OKR
  objective: string
  keyResults: KeyResult[]
  quarter: string       // 'Q2-2026'
  score?: number        // 0-100, beräknas automatiskt
  lastUpdated?: string
}

// ─── Delivery ─────────────────────────────────────────────────────────────────

export interface DeliveryRecord {
  id: string
  personId: string
  description: string
  plannedDate: string
  actualDate: string | null
  status: 'pending' | 'delivered' | 'missed' | 'cancelled'
  impact: 'low' | 'medium' | 'high' | 'critical'
  linkedOKRId?: string
  linkedDecisionId?: string
}

// ─── PersonNode ───────────────────────────────────────────────────────────────

export interface PersonNode {
  id: string
  name: string
  role: string
  email: string
  phone?: string
  monthlyCost: number         // SEK (lön + overhead)
  revenueImpact: number       // SEK/mån — estimerat värde personen genererar
  okrs: OKR[]
  deliveryHistory: DeliveryRecord[]

  // Beräknas av performanceEngine
  performanceScore?: number   // 0-100
  performanceTier?: PerformanceTier
  deliveryRate?: number       // % levererade i tid
  deadlineAccuracy?: number   // genomsnittlig dagars avvikelse

  // Konsekvenser
  activeConsequence?: {
    type: 'flag' | 'mandatory-meeting' | 'action-plan' | 'bonus-eligible' | 'options-increase' | 'expanded-responsibility'
    triggeredAt: string
    resolvedAt?: string
    description: string
  }
}

// ─── 1:1 System ───────────────────────────────────────────────────────────────

export interface OneOnOneDecision {
  description: string
  linkedOKRId?: string
  budgetImpact?: number       // SEK
}

export interface OneOnOneNextStep {
  description: string
  ownerId: string
  dueDate: string
  status: 'open' | 'done'
}

export interface OneOnOne {
  id: string
  hostId: string              // alltid Erik eller Leon
  subjectId: string           // personen det gäller
  date: string
  status: 'scheduled' | 'completed' | 'cancelled'

  // TVINGAD STRUKTUR — alla 4 fält måste fyllas i för att markera completed
  goalStatus: string          // Status på personens OKR/mål
  problems: string            // Problem/blockers
  decisions: OneOnOneDecision[]
  nextSteps: OneOnOneNextStep[]

  linkedOKRIds: string[]      // vilka OKR detta 1:1 berör
}

// ─── Governance Meetings ──────────────────────────────────────────────────────

export interface MeetingDecision {
  id: string
  description: string
  category: 'financial' | 'legal' | 'strategic' | 'operational'
  budgetImpact?: number       // SEK
  liquidityImpact?: number
  linkedOKRId?: string
  responsible: string         // personId
  deadline: string
  status: 'open' | 'done'
}

export interface GovernanceMeeting {
  id: string
  type: 'board' | 'management' | 'team-retro' | 'strategy' | 'annual-general'
  title: string
  date: string
  entityId?: string
  participants: Array<{ personId: string; role: 'chair' | 'member' | 'secretary' }>

  // TVINGAD — styrelsemöte utan beslut kan inte markeras completed
  decisions: MeetingDecision[]

  status: 'scheduled' | 'completed' | 'cancelled'
  isLegal: boolean
  minutesApproved: boolean    // protokoll godkänt
}

// ─── Consequence Engine ───────────────────────────────────────────────────────

export interface ConsequenceEvent {
  id: string
  personId: string
  type: 'flag' | 'mandatory-meeting' | 'action-plan' | 'bonus-eligible' | 'options-increase'
  severity: 'low' | 'medium' | 'high'
  triggeredBy: string         // varför: 'delivery-rate-below-60' etc
  triggeredAt: string
  description: string
  requiredAction?: string
  resolvedAt?: string
}
