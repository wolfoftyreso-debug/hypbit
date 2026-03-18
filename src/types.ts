// ============================================================================
// Hypbit OMS — TypeScript Interfaces
// 40 tables across Execution, Capability, Process, and Currency domains
// ============================================================================

// ---------------------------------------------------------------------------
// Common scalar types
// ---------------------------------------------------------------------------

export type UUID = string;
export type ISOTimestamp = string; // ISO-8601
export type ISODate = string; // YYYY-MM-DD
export type CurrencyCode = 'EUR' | 'USD' | 'SEK' | 'GBP' | 'NOK' | 'DKK' | 'PLN' | 'CHF';

// ---------------------------------------------------------------------------
// Enums (string unions)
// ---------------------------------------------------------------------------

export type UserRole = 'ADMIN' | 'MANAGER' | 'SALES' | 'FINANCE' | 'OPS';

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'UNQUALIFIED'
  | 'NURTURING'
  | 'CONVERTED'
  | 'LOST';

export type DealStatus =
  | 'PROSPECTING'
  | 'QUALIFICATION'
  | 'PROPOSAL'
  | 'NEGOTIATION'
  | 'CLOSED_WON'
  | 'CLOSED_LOST'
  | 'ON_HOLD';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE' | 'CANCELLED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type MeetingStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export type AttendeeRole = 'ORGANIZER' | 'REQUIRED' | 'OPTIONAL';

export type AttendeeResponse = 'ACCEPTED' | 'DECLINED' | 'TENTATIVE' | 'PENDING';

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'CREDITED';

export type TransactionType = 'DEBIT' | 'CREDIT';

export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED';

export type PayoutStatus = 'PENDING' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type ChannelType = 'EMAIL' | 'SLACK' | 'TEAMS' | 'SMS' | 'IN_APP' | 'WEBHOOK';

export type MessageDirection = 'INBOUND' | 'OUTBOUND';

export type MessageStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export type DecisionStatus = 'PROPOSED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'DEFERRED';

export type KpiStatus = 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK' | 'NOT_STARTED' | 'COMPLETED';

export type KpiTrend = 'IMPROVING' | 'STABLE' | 'DECLINING';

export type KpiFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export type AssessmentStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEWED';

export type DevelopmentActionStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type GoalStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';

export type FeedbackType = 'PRAISE' | 'CONSTRUCTIVE' | 'REVIEW' | '360_FEEDBACK';

export type ProcessStatus = 'DRAFT' | 'ACTIVE' | 'DEPRECATED' | 'ARCHIVED';

export type ProcessExecutionStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'PAUSED';

export type NonConformanceSeverity = 'MINOR' | 'MAJOR' | 'CRITICAL';

export type NonConformanceStatus = 'OPEN' | 'INVESTIGATING' | 'CORRECTIVE_ACTION' | 'RESOLVED' | 'CLOSED';

export type ImprovementStatus = 'PROPOSED' | 'EVALUATING' | 'APPROVED' | 'IMPLEMENTING' | 'COMPLETED' | 'REJECTED';

export type ComplianceStatus = 'COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'NON_COMPLIANT' | 'NOT_ASSESSED';

export type DocumentStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'SUPERSEDED' | 'ARCHIVED';

export type AuditStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type AuditType = 'INTERNAL' | 'EXTERNAL' | 'SUPPLIER' | 'CERTIFICATION';

export type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RiskLikelihood = 'RARE' | 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'ALMOST_CERTAIN';

export type RiskStatus = 'IDENTIFIED' | 'ASSESSED' | 'MITIGATING' | 'ACCEPTED' | 'CLOSED';

export type TrainingStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'WAIVED';

export type FxAdjustmentType = 'REVALUATION' | 'TRANSLATION' | 'HEDGE' | 'MANUAL';

// ---------------------------------------------------------------------------
// Base row shape (shared by every table)
// ---------------------------------------------------------------------------

interface BaseRow {
  id: UUID;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

interface OrgScoped extends BaseRow {
  org_id: UUID;
}

// ============================================================================
// EXECUTION DOMAIN (18 tables)
// ============================================================================

// 1. organizations
export interface Organization extends BaseRow {
  name: string;
  slug: string;
  vat_number: string | null;
  org_number: string; // Swedish organisationsnummer
  reporting_currency: CurrencyCode;
  default_locale: string; // e.g. "sv-SE"
  timezone: string; // e.g. "Europe/Stockholm"
  logo_url: string | null;
  website: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postal_code: string | null;
  country: string; // ISO 3166-1 alpha-2
  is_active: boolean;
}

// 2. users
export interface User extends OrgScoped {
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  title: string | null;
  department: string | null;
  locale: string;
  timezone: string;
  is_active: boolean;
  last_login_at: ISOTimestamp | null;
  password_hash: string;
}

// 3. companies
export interface Company extends OrgScoped {
  name: string;
  org_number: string | null;
  vat_number: string | null;
  industry: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  annual_revenue: number | null;
  revenue_currency: CurrencyCode | null;
  employee_count: number | null;
  owner_id: UUID | null; // → users.id
  notes: string | null;
  is_customer: boolean;
  is_supplier: boolean;
}

// 4. contacts
export interface Contact extends OrgScoped {
  company_id: UUID | null; // → companies.id
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  title: string | null;
  department: string | null;
  linkedin_url: string | null;
  is_primary: boolean;
  owner_id: UUID | null; // → users.id
  notes: string | null;
}

// 5. leads
export interface Lead extends OrgScoped {
  contact_id: UUID | null; // → contacts.id
  company_id: UUID | null; // → companies.id
  source: string | null;
  status: LeadStatus;
  score: number | null; // 0-100
  assigned_to: UUID | null; // → users.id
  converted_deal_id: UUID | null; // → deals.id
  converted_at: ISOTimestamp | null;
  notes: string | null;
  estimated_value: number | null;
  estimated_value_currency: CurrencyCode | null;
}

// 6. deals
export interface Deal extends OrgScoped {
  name: string;
  company_id: UUID | null; // → companies.id
  contact_id: UUID | null; // → contacts.id
  owner_id: UUID; // → users.id
  status: DealStatus;
  amount: number | null;
  currency: CurrencyCode;
  amount_eur: number | null; // converted to reporting currency
  probability: number | null; // 0-100
  expected_close_date: ISODate | null;
  actual_close_date: ISODate | null;
  loss_reason: string | null;
  pipeline_stage: string | null;
  source: string | null;
  notes: string | null;
}

// 7. tasks
export interface Task extends OrgScoped {
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: UUID | null; // → users.id
  created_by: UUID; // → users.id
  due_date: ISODate | null;
  completed_at: ISOTimestamp | null;
  deal_id: UUID | null; // → deals.id
  company_id: UUID | null; // → companies.id
  contact_id: UUID | null; // → contacts.id
  parent_task_id: UUID | null; // → tasks.id (subtasks)
  estimated_hours: number | null;
  actual_hours: number | null;
  tags: string[];
}

// 8. meetings
export interface Meeting extends OrgScoped {
  title: string;
  description: string | null;
  status: MeetingStatus;
  organizer_id: UUID; // → users.id
  location: string | null;
  video_url: string | null;
  start_time: ISOTimestamp;
  end_time: ISOTimestamp;
  deal_id: UUID | null; // → deals.id
  company_id: UUID | null; // → companies.id
  notes: string | null;
  outcome: string | null;
}

// 9. meeting_attendees
export interface MeetingAttendee extends BaseRow {
  meeting_id: UUID; // → meetings.id
  user_id: UUID | null; // → users.id (internal)
  contact_id: UUID | null; // → contacts.id (external)
  email: string;
  role: AttendeeRole;
  response: AttendeeResponse;
}

// 10. invoices
export interface Invoice extends OrgScoped {
  invoice_number: string;
  company_id: UUID; // → companies.id
  contact_id: UUID | null; // → contacts.id
  deal_id: UUID | null; // → deals.id
  status: InvoiceStatus;
  issue_date: ISODate;
  due_date: ISODate;
  paid_date: ISODate | null;
  subtotal: number;
  tax_amount: number;
  tax_rate: number; // Swedish moms, e.g. 0.25
  total: number;
  currency: CurrencyCode;
  total_eur: number; // reporting-currency equivalent
  exchange_rate: number; // rate used at invoice time
  reference: string | null; // OCR / payment reference
  notes: string | null;
  pdf_url: string | null;
  created_by: UUID; // → users.id
}

// 11. transactions
export interface Transaction extends OrgScoped {
  invoice_id: UUID | null; // → invoices.id
  payout_id: UUID | null; // → payouts.id
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: CurrencyCode;
  amount_eur: number;
  exchange_rate: number;
  description: string | null;
  reference: string | null;
  transaction_date: ISODate;
  settled_at: ISOTimestamp | null;
  created_by: UUID; // → users.id
}

// 12. payouts
export interface Payout extends OrgScoped {
  recipient_company_id: UUID | null; // → companies.id
  recipient_user_id: UUID | null; // → users.id
  status: PayoutStatus;
  amount: number;
  currency: CurrencyCode;
  amount_eur: number;
  exchange_rate: number;
  payout_date: ISODate | null;
  bank_reference: string | null;
  description: string | null;
  approved_by: UUID | null; // → users.id
  approved_at: ISOTimestamp | null;
  created_by: UUID; // → users.id
}

// 13. channels
export interface Channel extends OrgScoped {
  name: string;
  type: ChannelType;
  config: Record<string, unknown>; // integration-specific JSON
  is_active: boolean;
  webhook_url: string | null;
  last_synced_at: ISOTimestamp | null;
}

// 14. messages
export interface Message extends OrgScoped {
  channel_id: UUID; // → channels.id
  direction: MessageDirection;
  status: MessageStatus;
  sender_user_id: UUID | null; // → users.id
  sender_contact_id: UUID | null; // → contacts.id
  recipient_email: string | null;
  subject: string | null;
  body: string;
  body_html: string | null;
  deal_id: UUID | null; // → deals.id
  company_id: UUID | null; // → companies.id
  contact_id: UUID | null; // → contacts.id
  external_id: string | null; // provider message id
  sent_at: ISOTimestamp | null;
  read_at: ISOTimestamp | null;
  metadata: Record<string, unknown> | null;
}

// 15. decisions
export interface Decision extends OrgScoped {
  title: string;
  description: string;
  status: DecisionStatus;
  proposed_by: UUID; // → users.id
  decided_by: UUID | null; // → users.id
  decided_at: ISOTimestamp | null;
  deal_id: UUID | null; // → deals.id
  rationale: string | null;
  impact: string | null;
  deadline: ISODate | null;
  tags: string[];
}

// 16. kpis
export interface Kpi extends OrgScoped {
  name: string;
  description: string | null;
  category: string;
  unit: string; // e.g. "SEK", "%", "count"
  target_value: number;
  current_value: number;
  previous_value: number | null;
  status: KpiStatus;
  trend: KpiTrend;
  frequency: KpiFrequency;
  owner_id: UUID; // → users.id
  start_date: ISODate;
  end_date: ISODate;
  last_measured_at: ISOTimestamp | null;
  currency: CurrencyCode | null;
  metadata: Record<string, unknown> | null;
}

// 17. configs
export interface Config extends OrgScoped {
  key: string;
  value: unknown; // JSON value
  category: string;
  description: string | null;
  is_secret: boolean;
  updated_by: UUID; // → users.id
}

// 18. audit_log
export interface AuditLog extends OrgScoped {
  user_id: UUID | null; // → users.id
  action: string; // e.g. "deal.updated"
  entity_type: string; // e.g. "deal"
  entity_id: UUID;
  changes: Record<string, { old: unknown; new: unknown }> | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
}

// ============================================================================
// CAPABILITY DOMAIN (9 tables)
// ============================================================================

// 19. capability_domains
export interface CapabilityDomain extends OrgScoped {
  name: string;
  description: string | null;
  parent_domain_id: UUID | null; // → capability_domains.id
  sort_order: number;
  is_active: boolean;
}

// 20. capabilities
export interface Capability extends OrgScoped {
  domain_id: UUID; // → capability_domains.id
  name: string;
  description: string | null;
  level_descriptors: Record<string, string>; // e.g. { "1": "Basic", "5": "Expert" }
  max_level: number;
  is_active: boolean;
}

// 21. role_capabilities
export interface RoleCapability extends OrgScoped {
  role: UserRole;
  capability_id: UUID; // → capabilities.id
  required_level: number;
  is_mandatory: boolean;
}

// 22. user_capabilities
export interface UserCapability extends OrgScoped {
  user_id: UUID; // → users.id
  capability_id: UUID; // → capabilities.id
  current_level: number;
  target_level: number | null;
  assessed_at: ISOTimestamp | null;
  assessed_by: UUID | null; // → users.id
  evidence: string | null;
  notes: string | null;
}

// 23. assessments
export interface Assessment extends OrgScoped {
  user_id: UUID; // → users.id
  assessor_id: UUID; // → users.id
  status: AssessmentStatus;
  assessment_date: ISODate;
  period_start: ISODate;
  period_end: ISODate;
  overall_rating: number | null; // e.g. 1-5
  strengths: string | null;
  areas_for_improvement: string | null;
  summary: string | null;
  completed_at: ISOTimestamp | null;
}

// 24. development_plans
export interface DevelopmentPlan extends OrgScoped {
  user_id: UUID; // → users.id
  title: string;
  description: string | null;
  manager_id: UUID; // → users.id
  start_date: ISODate;
  end_date: ISODate;
  is_active: boolean;
  assessment_id: UUID | null; // → assessments.id
  notes: string | null;
}

// 25. development_actions
export interface DevelopmentAction extends OrgScoped {
  plan_id: UUID; // → development_plans.id
  capability_id: UUID | null; // → capabilities.id
  title: string;
  description: string | null;
  status: DevelopmentActionStatus;
  action_type: string; // e.g. "TRAINING", "MENTORING", "PROJECT", "SELF_STUDY"
  due_date: ISODate | null;
  completed_at: ISOTimestamp | null;
  evidence: string | null;
  notes: string | null;
}

// 26. goals
export interface Goal extends OrgScoped {
  user_id: UUID; // → users.id
  title: string;
  description: string | null;
  status: GoalStatus;
  category: string | null; // e.g. "REVENUE", "PERSONAL", "TEAM"
  target_value: number | null;
  current_value: number | null;
  unit: string | null;
  start_date: ISODate;
  due_date: ISODate;
  completed_at: ISOTimestamp | null;
  parent_goal_id: UUID | null; // → goals.id
  kpi_id: UUID | null; // → kpis.id
  assigned_by: UUID | null; // → users.id
}

// 27. feedback
export interface Feedback extends OrgScoped {
  from_user_id: UUID; // → users.id
  to_user_id: UUID; // → users.id
  type: FeedbackType;
  content: string;
  is_anonymous: boolean;
  related_goal_id: UUID | null; // → goals.id
  related_assessment_id: UUID | null; // → assessments.id
  visibility: 'PRIVATE' | 'MANAGER_ONLY' | 'PUBLIC';
}

// ============================================================================
// PROCESS DOMAIN (10 tables)
// ============================================================================

// 28. processes
export interface Process extends OrgScoped {
  name: string;
  description: string | null;
  status: ProcessStatus;
  version: number;
  category: string | null;
  owner_id: UUID; // → users.id
  parent_process_id: UUID | null; // → processes.id
  sla_target_hours: number | null;
  steps: Record<string, unknown>[]; // ordered JSON steps
  is_automated: boolean;
}

// 29. process_executions
export interface ProcessExecution extends OrgScoped {
  process_id: UUID; // → processes.id
  status: ProcessExecutionStatus;
  started_by: UUID; // → users.id
  started_at: ISOTimestamp;
  completed_at: ISOTimestamp | null;
  current_step: number;
  context: Record<string, unknown>; // runtime data
  error_message: string | null;
  deal_id: UUID | null; // → deals.id
  invoice_id: UUID | null; // → invoices.id
  duration_seconds: number | null;
}

// 30. non_conformances
export interface NonConformance extends OrgScoped {
  title: string;
  description: string;
  severity: NonConformanceSeverity;
  status: NonConformanceStatus;
  reported_by: UUID; // → users.id
  assigned_to: UUID | null; // → users.id
  process_id: UUID | null; // → processes.id
  root_cause: string | null;
  corrective_action: string | null;
  preventive_action: string | null;
  due_date: ISODate | null;
  resolved_at: ISOTimestamp | null;
  cost_impact: number | null;
  cost_currency: CurrencyCode | null;
}

// 31. improvements
export interface Improvement extends OrgScoped {
  title: string;
  description: string;
  status: ImprovementStatus;
  proposed_by: UUID; // → users.id
  assigned_to: UUID | null; // → users.id
  process_id: UUID | null; // → processes.id
  non_conformance_id: UUID | null; // → non_conformances.id
  expected_benefit: string | null;
  estimated_cost: number | null;
  estimated_cost_currency: CurrencyCode | null;
  actual_cost: number | null;
  priority: TaskPriority;
  due_date: ISODate | null;
  completed_at: ISOTimestamp | null;
}

// 32. compliance_standards
export interface ComplianceStandard extends OrgScoped {
  name: string; // e.g. "ISO 9001:2015"
  description: string | null;
  version: string | null;
  issuing_body: string | null;
  effective_date: ISODate | null;
  expiry_date: ISODate | null;
  status: ComplianceStatus;
  certification_url: string | null;
  is_mandatory: boolean;
}

// 33. compliance_requirements
export interface ComplianceRequirement extends OrgScoped {
  standard_id: UUID; // → compliance_standards.id
  clause: string; // e.g. "4.1"
  title: string;
  description: string | null;
  status: ComplianceStatus;
  owner_id: UUID | null; // → users.id
  evidence: string | null;
  last_reviewed_at: ISOTimestamp | null;
  next_review_date: ISODate | null;
  notes: string | null;
}

// 34. documents
export interface Document extends OrgScoped {
  title: string;
  description: string | null;
  status: DocumentStatus;
  document_number: string;
  version: number;
  category: string | null;
  file_url: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  owner_id: UUID; // → users.id
  approved_by: UUID | null; // → users.id
  approved_at: ISOTimestamp | null;
  published_at: ISOTimestamp | null;
  review_date: ISODate | null;
  process_id: UUID | null; // → processes.id
  compliance_standard_id: UUID | null; // → compliance_standards.id
  tags: string[];
}

// 35. audits
export interface Audit extends OrgScoped {
  title: string;
  description: string | null;
  type: AuditType;
  status: AuditStatus;
  lead_auditor_id: UUID; // → users.id
  standard_id: UUID | null; // → compliance_standards.id
  scope: string | null;
  planned_start_date: ISODate;
  planned_end_date: ISODate;
  actual_start_date: ISODate | null;
  actual_end_date: ISODate | null;
  findings_count: number;
  non_conformances_count: number;
  report_url: string | null;
  summary: string | null;
}

// 36. risks
export interface Risk extends OrgScoped {
  title: string;
  description: string;
  status: RiskStatus;
  severity: RiskSeverity;
  likelihood: RiskLikelihood;
  risk_score: number; // severity × likelihood matrix
  category: string | null;
  owner_id: UUID; // → users.id
  process_id: UUID | null; // → processes.id
  mitigation_plan: string | null;
  contingency_plan: string | null;
  residual_severity: RiskSeverity | null;
  residual_likelihood: RiskLikelihood | null;
  financial_impact: number | null;
  financial_impact_currency: CurrencyCode | null;
  review_date: ISODate | null;
  last_reviewed_at: ISOTimestamp | null;
}

// 37. training_records
export interface TrainingRecord extends OrgScoped {
  user_id: UUID; // → users.id
  title: string;
  description: string | null;
  status: TrainingStatus;
  training_type: string; // e.g. "CLASSROOM", "E_LEARNING", "ON_THE_JOB"
  provider: string | null;
  capability_id: UUID | null; // → capabilities.id
  process_id: UUID | null; // → processes.id
  compliance_standard_id: UUID | null; // → compliance_standards.id
  scheduled_date: ISODate | null;
  completed_date: ISODate | null;
  expiry_date: ISODate | null;
  score: number | null; // pass mark / grade
  certificate_url: string | null;
  hours: number | null;
  cost: number | null;
  cost_currency: CurrencyCode | null;
  approved_by: UUID | null; // → users.id
}

// ============================================================================
// CURRENCY DOMAIN (3 tables)
// ============================================================================

// 38. currencies
export interface Currency extends BaseRow {
  code: CurrencyCode;
  name: string; // e.g. "Swedish Krona"
  symbol: string; // e.g. "kr"
  decimal_places: number;
  is_reporting_currency: boolean; // true only for EUR
  is_active: boolean;
}

// 39. exchange_rates
export interface ExchangeRate extends OrgScoped {
  base_currency: CurrencyCode; // typically EUR
  quote_currency: CurrencyCode;
  rate: number; // 1 base = rate quote
  inverse_rate: number;
  effective_date: ISODate;
  source: string; // e.g. "ECB", "MANUAL", "RIKSBANK"
  is_locked: boolean; // locked for period close
}

// 40. fx_adjustments
export interface FxAdjustment extends OrgScoped {
  type: FxAdjustmentType;
  base_currency: CurrencyCode;
  quote_currency: CurrencyCode;
  original_rate: number;
  adjusted_rate: number;
  adjustment_amount_eur: number; // P&L impact in reporting currency
  effective_date: ISODate;
  period_start: ISODate;
  period_end: ISODate;
  invoice_id: UUID | null; // → invoices.id
  transaction_id: UUID | null; // → transactions.id
  description: string | null;
  approved_by: UUID | null; // → users.id
  approved_at: ISOTimestamp | null;
  created_by: UUID; // → users.id
}
