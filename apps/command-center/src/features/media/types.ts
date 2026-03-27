// ─── Wavult Media Domain — TypeScript Data Models ────────────────────────────
// Capability-complete, feature-light (Fas 1)

export interface Campaign {
  id: string
  name: string
  objective: 'awareness' | 'conversion' | 'retention' | 'leads'
  geo_scope: 'local' | 'national' | 'global'
  budget_total: number
  currency: string
  start_date: string
  end_date: string
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived'
  entity_id: string // vilket Wavult-bolag
  created_by: string
  created_at: string
}

export interface MediaChannel {
  id: string
  type: 'audio' | 'video' | 'display' | 'social' | 'programmatic'
  provider: 'spotify' | 'youtube' | 'meta' | 'trade_desk' | 'google_dv360' | 'acast' | 'manual'
  account_id?: string
  api_adapter: string
  status: 'connected' | 'pending' | 'disconnected'
  daily_budget?: number
}

export interface CreativeVariant {
  id: string
  label: string
  asset_url?: string
  performance_score?: number
}

export interface Creative {
  id: string
  campaign_id: string
  type: 'audio' | 'video' | 'image' | 'text'
  hook: string
  message: string
  cta: string
  variants: CreativeVariant[]
  status: 'draft' | 'review' | 'approved' | 'live' | 'paused'
}

export interface Audience {
  id: string
  campaign_id: string
  geo: string[]
  age_range?: [number, number]
  interests?: string[]
  custom_data?: string // CRM-segment
  lookalike_seed?: string
}

export interface BudgetAllocation {
  id: string
  campaign_id: string
  channel_id: string
  daily_budget: number
  total_spent: number
  performance_score: number // 0-100
  auto_optimize: boolean
}

export interface AttributionEvent {
  id: string
  user_id?: string
  session_id: string
  touchpoint: string // channel/provider
  campaign_id: string
  event_type: 'impression' | 'click' | 'conversion'
  timestamp: string
  conversion_value?: number
  crm_contact_id?: string
}

export interface PerformanceData {
  campaign_id: string
  impressions: number
  clicks: number
  conversions: number
  spend: number
  ctr: number
  cpa: number
  roas: number
  fetched_at: string
}

export interface MediaProvider {
  name: string
  createCampaign(campaign: Campaign): Promise<string>
  updateBudget(campaignId: string, budget: number): Promise<void>
  fetchPerformance(campaignId: string): Promise<PerformanceData>
  uploadCreative(creative: Creative): Promise<string>
  pauseCampaign(campaignId: string): Promise<void>
}

export type MediaEvent =
  | { type: 'CampaignCreated'; payload: Campaign }
  | { type: 'BudgetUpdated'; payload: { campaignId: string; newBudget: number } }
  | { type: 'PerformanceFetched'; payload: PerformanceData }
  | { type: 'ConversionTracked'; payload: AttributionEvent }
  | { type: 'CreativeApproved'; payload: Creative }
  | { type: 'BudgetAutoAdjusted'; payload: { channelId: string; reason: string } }
