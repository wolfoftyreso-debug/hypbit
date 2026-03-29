/**
 * WAVULT GROUP — TypeScript Types
 * Generated from schema.sql v1.0.0 | 2026-03-29
 * Schema: wavult.*
 */

// ─── ENUMS ────────────────────────────────────────────────────────────────────

export type EntityType = 'holding' | 'operations' | 'finance' | 'data-platform' | 'revenue';
export type EntityStatus = 'active' | 'forming' | 'pending' | 'inactive';
export type Currency = 'SEK' | 'USD' | 'EUR' | 'AED' | 'GBP' | 'CAD' | 'TRY';
export type RewardCurrency = 'SEK' | 'USD' | 'EUR';

export type FeeType =
  | 'devops_fee'
  | 'ip_royalty'
  | 'data_cost'
  | 'finance_fee'
  | 'zoomer_share'
  | 'creator_share'
  | 'platform_fee';

export type TaskStatus =
  | 'created'
  | 'accepted'
  | 'in_progress'
  | 'uploaded'
  | 'validating'
  | 'validated'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'cancelled';

export type MediaFileType = 'jpg' | 'jpeg' | 'png' | 'heic' | 'mp4';

export type TransactionType =
  | 'payment'
  | 'payout'
  | 'internal_transfer'
  | 'fee'
  | 'royalty'
  | 'split';

export type TransactionStatus =
  | 'initiated'
  | 'authorized'
  | 'captured'
  | 'settled'
  | 'split_executing'
  | 'split_executed'
  | 'completed'
  | 'failed'
  | 'refunded';

export type SplitStatus = 'pending' | 'approved' | 'queued' | 'executed' | 'failed';

export type PayoutStatus =
  | 'pending'
  | 'approved'
  | 'queued'
  | 'executing'
  | 'executed'
  | 'failed'
  | 'reversed';

export type PayoutMethod = 'swish' | 'sepa' | 'wise' | 'stripe_connect';

export type AdsPackageStatus = 'draft' | 'pending_review' | 'active' | 'sold' | 'expired' | 'rejected';
export type AdsPurchaseStatus = 'pending' | 'completed' | 'refunded' | 'disputed';

// ─── ENTITIES ─────────────────────────────────────────────────────────────────

export interface Entity {
  id: string;
  name: string;
  short_name: string;
  country: string;          // ISO 3166-1 alpha-2
  city: string | null;
  type: EntityType;
  role: string;
  currency: Currency;
  jurisdiction: string;
  status: EntityStatus;
  owned_by: string | null;  // FK → entities.id
  created_at: string;       // TIMESTAMPTZ as ISO string
}

export type EntityInsert = Omit<Entity, 'created_at'> & {
  created_at?: string;
};

// ─── FX RATES ─────────────────────────────────────────────────────────────────

export interface FxRate {
  id: string;               // UUID
  base_currency: string;
  quote_currency: string;
  rate: number;
  source: string;
  valid_at: string;         // TIMESTAMPTZ
  created_at: string;
}

export type FxRateInsert = Omit<FxRate, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

// ─── FEE CONFIGURATIONS ───────────────────────────────────────────────────────

export interface FeeConfig {
  id: string;               // UUID
  fee_type: FeeType;
  entity_id: string | null; // NULL = global default
  rate_percent: number;
  min_rate: number | null;
  max_rate: number | null;
  override_requires_approval: boolean;
  effective_from: string;   // TIMESTAMPTZ
  effective_to: string | null;
  created_by: string | null;
  created_at: string;
}

export type FeeConfigInsert = Omit<FeeConfig, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

// ─── TASKS ────────────────────────────────────────────────────────────────────

export interface Task {
  id: string;               // UUID
  external_id: string | null;
  zoomer_id: string;        // UUID
  entity_id: string;        // FK → entities.id, default 'quixzoom-uab'
  lat: number;
  lng: number;
  address: string | null;
  municipality: string | null;
  description: string;
  instructions: string | null;
  reward_amount: number;
  reward_currency: RewardCurrency;
  status: TaskStatus;
  quality_score: number | null;
  fraud_flag: boolean;
  fraud_reason: string | null;
  validation_note: string | null;
  validated_by: string | null;
  validated_at: string | null;
  expires_at: string | null;
  accepted_at: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskInsert = Omit<Task, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

// ─── TASK MEDIA ───────────────────────────────────────────────────────────────

export interface TaskMedia {
  id: string;               // UUID
  task_id: string;          // UUID → tasks.id
  s3_key: string;
  s3_bucket: string;
  cdn_url: string | null;
  file_type: MediaFileType;
  file_size_bytes: number | null;
  resolution_width: number | null;
  resolution_height: number | null;
  gps_lat: number | null;
  gps_lng: number | null;
  gps_accuracy_meters: number | null;
  captured_at: string | null;
  device_model: string | null;
  gps_valid: boolean | null;
  quality_score: number | null;
  duplicate_hash: string | null;  // SHA256
  fraud_flags: unknown[];         // JSONB array
  created_at: string;
}

export type TaskMediaInsert = Omit<TaskMedia, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

export interface Transaction {
  id: string;               // UUID
  idempotency_key: string;
  from_entity_id: string | null;
  to_entity_id: string | null;
  from_external: string | null;
  to_external: string | null;
  gross_amount: number;
  gross_currency: string;
  net_amount: number | null;
  net_currency: string;
  fx_rate: number | null;
  fx_rate_id: string | null;  // UUID → fx_rates.id
  type: TransactionType;
  status: TransactionStatus;
  reference_type: string | null;  // 'task' | 'invoice' | 'ads_purchase'
  reference_id: string | null;    // UUID
  processor: string | null;       // 'stripe' | 'revolut' | 'wise' | 'internal'
  processor_ref: string | null;
  failure_reason: string | null;
  initiated_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type TransactionInsert = Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'initiated_at'> & {
  id?: string;
  initiated_at?: string;
  created_at?: string;
  updated_at?: string;
};

// ─── REVENUE SPLITS ───────────────────────────────────────────────────────────

export interface RevenueSplit {
  id: string;               // UUID
  transaction_id: string;   // UUID → transactions.id
  entity_id: string | null;
  external_recipient: string | null;
  fee_type: string;
  percentage: number;
  amount: number;
  currency: string;
  status: SplitStatus;
  payout_transaction_id: string | null;  // UUID → transactions.id
  executed_at: string | null;
  created_at: string;
}

export type RevenueSplitInsert = Omit<RevenueSplit, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

// ─── PAYOUTS ──────────────────────────────────────────────────────────────────

export interface Payout {
  id: string;               // UUID
  idempotency_key: string;
  zoomer_id: string;        // UUID
  amount: number;
  currency: string;
  method: PayoutMethod | null;
  task_id: string | null;   // UUID → tasks.id
  split_id: string | null;  // UUID → revenue_splits.id
  status: PayoutStatus;
  task_approved: boolean;
  fraud_checked: boolean;
  processor_ref: string | null;
  failure_reason: string | null;
  queued_at: string | null;
  executed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type PayoutInsert = Omit<Payout, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

// ─── ADS PACKAGES ─────────────────────────────────────────────────────────────

export interface AdsPackage {
  id: string;               // UUID
  creator_entity_id: string | null;
  creator_id: string | null;  // UUID
  title: string;
  description: string | null;
  geography: Record<string, unknown> | null;  // GeoJSON
  data_type: string | null;   // 'leads' | 'market_data' | 'analytics'
  record_count: number | null;
  price: number;
  currency: string;
  verified: boolean;
  data_quality_score: number | null;
  min_quality_threshold: number;
  status: AdsPackageStatus;
  created_at: string;
  updated_at: string;
}

export type AdsPackageInsert = Omit<AdsPackage, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

// ─── ADS PURCHASES ────────────────────────────────────────────────────────────

export interface AdsPurchase {
  id: string;               // UUID
  idempotency_key: string;
  package_id: string;       // UUID → ads_packages.id
  buyer_id: string;         // UUID
  buyer_entity: string | null;
  amount: number;
  currency: string;
  transaction_id: string | null;  // UUID → transactions.id
  status: AdsPurchaseStatus;
  package_verified: boolean;
  purchased_at: string;
  created_at: string;
}

export type AdsPurchaseInsert = Omit<AdsPurchase, 'id' | 'created_at' | 'purchased_at'> & {
  id?: string;
  purchased_at?: string;
  created_at?: string;
};

// ─── FINANCIAL EVENTS (IMMUTABLE) ─────────────────────────────────────────────

export type AggregateType = 'task' | 'transaction' | 'payout' | 'ads_purchase';

export interface FinancialEvent {
  id: string;               // UUID
  idempotency_key: string;
  event_type: string;       // 'task.approved', 'payment.initiated', 'split.executed', etc.
  aggregate_type: AggregateType;
  aggregate_id: string;     // UUID
  payload: Record<string, unknown>;
  entity_id: string | null;
  actor_id: string | null;
  row_checksum: string | null;
  occurred_at: string;      // TIMESTAMPTZ — immutable
}

// Insert only — no update/delete
export type FinancialEventInsert = Omit<FinancialEvent, 'id' | 'occurred_at'> & {
  id?: string;
  occurred_at?: string;
};

// ─── EVENT TOPICS ─────────────────────────────────────────────────────────────

export type EventTopicName =
  | 'wavult.task.created'
  | 'wavult.task.approved'
  | 'wavult.task.rejected'
  | 'wavult.payment.initiated'
  | 'wavult.payment.completed'
  | 'wavult.split.executed'
  | 'wavult.payout.executed'
  | 'wavult.ads.purchased'
  | 'wavult.fx.updated';

export interface EventTopic {
  topic: EventTopicName;
  description: string | null;
  triggers: string[];       // which services publish
  subscribers: string[];    // which services consume
}

// ─── DATABASE SCHEMA TYPE MAP ─────────────────────────────────────────────────

export interface WavultSchema {
  entities: Entity;
  fx_rates: FxRate;
  fee_configs: FeeConfig;
  tasks: Task;
  task_media: TaskMedia;
  transactions: Transaction;
  revenue_splits: RevenueSplit;
  payouts: Payout;
  ads_packages: AdsPackage;
  ads_purchases: AdsPurchase;
  financial_events: FinancialEvent;
  event_topics: EventTopic;
}

// ─── GUARDS (runtime validation helpers) ─────────────────────────────────────

/** Rule 1: No money without state */
export function assertHasStatus(obj: { status: string }): void {
  if (!obj.status) throw new Error('WavultRule1: No money without state');
}

/** Rule 2: No payout without validation */
export function assertPayoutGuards(payout: Payout): void {
  if (!payout.task_approved) throw new Error('WavultRule2: task_approved must be true before payout');
  if (!payout.fraud_checked) throw new Error('WavultRule2: fraud_checked must be true before payout');
}

/** Rule 3: No split without 100% total */
export function assertSplitTotal(splits: RevenueSplit[]): void {
  const total = splits.reduce((sum, s) => sum + Number(s.percentage), 0);
  if (Math.abs(total - 100) > 0.001) {
    throw new Error(`WavultRule3: Split total is ${total}%, must be 100%`);
  }
}

/** Rule 4: No entity without country */
export function assertEntityCountry(entity: EntityInsert): void {
  if (!entity.country) throw new Error('WavultRule4: No entity without country');
}

/** Rule 5: No transaction without currency */
export function assertTransactionCurrency(tx: TransactionInsert): void {
  if (!tx.gross_currency || !tx.net_currency) {
    throw new Error('WavultRule5: No transaction without currency');
  }
}
