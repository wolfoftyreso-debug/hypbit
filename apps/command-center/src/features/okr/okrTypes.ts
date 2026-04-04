// OKR Types — Google-modellen

export type CycleType = 'annual' | 'quarterly'
export type CycleStatus = 'draft' | 'active' | 'scoring' | 'closed'
export type ObjectiveLevel = 'company' | 'team' | 'individual'
export type ObjectiveStatus = 'draft' | 'active' | 'closed' | 'cancelled'
export type KrType = 'metric' | 'milestone' | 'boolean'
export type KrStatus = 'active' | 'closed' | 'cancelled'
export type Confidence = 'at_risk' | 'off_track' | 'on_track' | 'achieved'
export type InitiativeStatus = 'not_started' | 'in_progress' | 'done' | 'cancelled'

export interface OkrCycle {
  id: string
  entity_slug: string
  cycle_type: CycleType
  label: string
  starts_at: string
  ends_at: string
  status: CycleStatus
  parent_cycle_id: string | null
  created_by: string | null
  created_at: string
}

export interface OkrObjective {
  id: string
  cycle_id: string
  entity_slug: string
  level: ObjectiveLevel
  owner_id: string | null
  team_id: string | null
  title: string
  description: string | null
  parent_objective_id: string | null
  status: ObjectiveStatus
  final_score: number | null
  sort_order: number
  created_at: string
  updated_at: string
  // Computed
  computed_score?: number | null
  key_results?: OkrKeyResult[]
}

export interface OkrKeyResult {
  id: string
  objective_id: string
  title: string
  description: string | null
  kr_type: KrType
  start_value: number | null
  target_value: number | null
  current_value: number | null
  unit: string | null
  milestone_description: string | null
  milestone_achieved: boolean
  score: number | null
  score_override: boolean
  owner_id: string | null
  status: KrStatus
  confidence: Confidence
  sort_order: number
  created_at: string
  updated_at: string
}

export interface OkrInitiative {
  id: string
  key_result_id: string
  title: string
  description: string | null
  owner_id: string | null
  status: InitiativeStatus
  due_date: string | null
  linked_task_id: string | null
  created_at: string
}

export interface OkrCheckin {
  id: string
  key_result_id: string
  checked_by: string
  current_value: number | null
  confidence: Confidence
  note: string | null
  blocker: string | null
  meeting_id: string | null
  checked_at: string
}

export interface OkrDashboard {
  entity: string
  cycles: OkrCycle[]
  objectives: OkrObjective[]
  summary: {
    total_objectives: number
    total_krs: number
    overall_score: number | null
    confidence_distribution: Record<Confidence, number>
  } | null
}
