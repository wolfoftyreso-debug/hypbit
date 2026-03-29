-- ═══════════════════════════════════════════════════════════════
-- WAVULT GROUP — Master Financial & Operational Schema
-- Version: 1.0.0 | 2026-03-29
-- Rules:
--   1. No money without state
--   2. No payout without validation
--   3. No split without 100% total
--   4. No entity without country
--   5. No transaction without currency
-- ═══════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── ENTITIES ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS entities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  country TEXT NOT NULL,  -- ISO 3166-1 alpha-2
  city TEXT,
  type TEXT NOT NULL CHECK (type IN ('holding', 'operations', 'finance', 'data-platform', 'revenue')),
  role TEXT NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('SEK', 'USD', 'EUR', 'AED', 'GBP', 'CAD', 'TRY')),
  jurisdiction TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'forming' CHECK (status IN ('active', 'forming', 'pending', 'inactive')),
  owned_by TEXT REFERENCES entities(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── FX RATES ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fx_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  base_currency TEXT NOT NULL,
  quote_currency TEXT NOT NULL,
  rate NUMERIC(18, 8) NOT NULL,
  source TEXT NOT NULL DEFAULT 'ECB',
  valid_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (base_currency, quote_currency, valid_at)
);

CREATE INDEX IF NOT EXISTS idx_fx_rates_currencies ON fx_rates(base_currency, quote_currency);
CREATE INDEX IF NOT EXISTS idx_fx_rates_valid_at ON fx_rates(valid_at DESC);

-- ─── FEE CONFIGURATIONS ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fee_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fee_type TEXT NOT NULL CHECK (fee_type IN ('devops_fee', 'ip_royalty', 'data_cost', 'finance_fee', 'zoomer_share', 'creator_share', 'platform_fee')),
  entity_id TEXT REFERENCES entities(id),  -- NULL = global default
  rate_percent NUMERIC(5, 2) NOT NULL,
  min_rate NUMERIC(5, 2),
  max_rate NUMERIC(5, 2),
  override_requires_approval BOOLEAN DEFAULT false,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMPTZ,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed global fee defaults
INSERT INTO fee_configs (fee_type, rate_percent, min_rate, max_rate, override_requires_approval) VALUES
  ('devops_fee',      10.00, 8.00,  15.00, true),
  ('ip_royalty',       8.00, 5.00,  15.00, false),
  ('data_cost',        7.00, 3.00,  12.00, true),
  ('finance_fee',      2.50, 1.00,   5.00, true),
  ('zoomer_share',    75.00, 70.00, 80.00, true),
  ('creator_share',   40.00, 30.00, 50.00, false),
  ('platform_fee',    25.00, 20.00, 30.00, false)
ON CONFLICT DO NOTHING;

-- ─── TASKS (QuiXzoom assignments) ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id TEXT UNIQUE,
  zoomer_id UUID NOT NULL,
  entity_id TEXT NOT NULL REFERENCES entities(id) DEFAULT 'quixzoom-uab',

  -- Location
  lat NUMERIC(10, 7) NOT NULL,
  lng NUMERIC(10, 7) NOT NULL,
  address TEXT,
  municipality TEXT,

  -- Assignment
  description TEXT NOT NULL,
  instructions TEXT,
  reward_amount NUMERIC(12, 2) NOT NULL,
  reward_currency TEXT NOT NULL CHECK (reward_currency IN ('SEK', 'USD', 'EUR')),

  -- State machine
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN (
    'created', 'accepted', 'in_progress', 'uploaded',
    'validating', 'validated', 'approved', 'rejected', 'expired', 'cancelled'
  )),

  -- Validation
  quality_score NUMERIC(5, 2),
  fraud_flag BOOLEAN DEFAULT false,
  fraud_reason TEXT,
  validation_note TEXT,
  validated_by TEXT,
  validated_at TIMESTAMPTZ,

  -- Timing
  expires_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_zoomer ON tasks(zoomer_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_location ON tasks USING GIST (point(lng, lat));

-- ─── MEDIA (uploaded files) ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS task_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

  -- File
  s3_key TEXT NOT NULL,
  s3_bucket TEXT NOT NULL,
  cdn_url TEXT,
  file_type TEXT NOT NULL CHECK (file_type IN ('jpg', 'jpeg', 'png', 'heic', 'mp4')),
  file_size_bytes BIGINT,
  resolution_width INT,
  resolution_height INT,

  -- Metadata
  gps_lat NUMERIC(10, 7),
  gps_lng NUMERIC(10, 7),
  gps_accuracy_meters NUMERIC(8, 2),
  captured_at TIMESTAMPTZ,
  device_model TEXT,

  -- Validation
  gps_valid BOOLEAN,
  quality_score NUMERIC(5, 2),
  duplicate_hash TEXT,  -- SHA256 of file content
  fraud_flags JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idempotency_key TEXT UNIQUE NOT NULL,  -- Prevent duplicate processing

  -- Parties
  from_entity_id TEXT REFERENCES entities(id),
  to_entity_id TEXT REFERENCES entities(id),
  from_external TEXT,  -- e.g. 'customer:abc123'
  to_external TEXT,    -- e.g. 'zoomer:xyz789'

  -- Value
  gross_amount NUMERIC(18, 2) NOT NULL,
  gross_currency TEXT NOT NULL,
  net_amount NUMERIC(18, 2),
  net_currency TEXT NOT NULL,
  fx_rate NUMERIC(18, 8),
  fx_rate_id UUID REFERENCES fx_rates(id),

  -- Type & State
  type TEXT NOT NULL CHECK (type IN ('payment', 'payout', 'internal_transfer', 'fee', 'royalty', 'split')),
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN (
    'initiated', 'authorized', 'captured', 'settled',
    'split_executing', 'split_executed', 'completed', 'failed', 'refunded'
  )),

  -- Reference
  reference_type TEXT,  -- 'task', 'invoice', 'ads_purchase'
  reference_id UUID,

  -- Audit
  processor TEXT,  -- 'stripe', 'revolut', 'wise', 'internal'
  processor_ref TEXT,
  failure_reason TEXT,

  initiated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_transactions_idempotency ON transactions(idempotency_key);

-- ─── REVENUE SPLITS ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS revenue_splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES transactions(id),

  -- Recipient
  entity_id TEXT REFERENCES entities(id),
  external_recipient TEXT,  -- e.g. 'zoomer:xyz789'

  -- Amount
  fee_type TEXT NOT NULL,
  percentage NUMERIC(6, 3) NOT NULL,
  amount NUMERIC(18, 2) NOT NULL,
  currency TEXT NOT NULL,

  -- State
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'queued', 'executed', 'failed')),
  payout_transaction_id UUID REFERENCES transactions(id),

  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Constraint: splits for a transaction must sum to 100%
-- Enforced at application level (check before split_executed state)

-- ─── PAYOUTS ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idempotency_key TEXT UNIQUE NOT NULL,

  -- Recipient
  zoomer_id UUID NOT NULL,

  -- Amount
  amount NUMERIC(18, 2) NOT NULL,
  currency TEXT NOT NULL,
  method TEXT CHECK (method IN ('swish', 'sepa', 'wise', 'stripe_connect')),

  -- Reference
  task_id UUID REFERENCES tasks(id),
  split_id UUID REFERENCES revenue_splits(id),

  -- State
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'queued', 'executing', 'executed', 'failed', 'reversed'
  )),

  -- Guards
  task_approved BOOLEAN NOT NULL DEFAULT false,
  fraud_checked BOOLEAN NOT NULL DEFAULT false,

  -- Execution
  processor_ref TEXT,
  failure_reason TEXT,

  queued_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ADS PACKAGES ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ads_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Creator
  creator_entity_id TEXT REFERENCES entities(id),
  creator_id UUID,  -- user who created it

  -- Package
  title TEXT NOT NULL,
  description TEXT,
  geography JSONB,  -- GeoJSON
  data_type TEXT,   -- 'leads', 'market_data', 'analytics'
  record_count INT,

  -- Pricing
  price NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL,

  -- Validation
  verified BOOLEAN DEFAULT false,
  data_quality_score NUMERIC(5, 2),
  min_quality_threshold NUMERIC(5, 2) DEFAULT 70.0,

  -- State
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'active', 'sold', 'expired', 'rejected')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ADS PURCHASES ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ads_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idempotency_key TEXT UNIQUE NOT NULL,

  package_id UUID NOT NULL REFERENCES ads_packages(id),
  buyer_id UUID NOT NULL,
  buyer_entity TEXT,

  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL,

  transaction_id UUID REFERENCES transactions(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded', 'disputed')),

  -- Guard: package must be verified
  package_verified BOOLEAN NOT NULL DEFAULT false,

  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── EVENT LOG (IMMUTABLE) ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS financial_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idempotency_key TEXT UNIQUE NOT NULL,

  event_type TEXT NOT NULL,      -- 'task.approved', 'payment.initiated', 'split.executed', etc.
  aggregate_type TEXT NOT NULL,  -- 'task', 'transaction', 'payout', 'ads_purchase'
  aggregate_id UUID NOT NULL,

  -- Payload
  payload JSONB NOT NULL DEFAULT '{}',

  -- Context
  entity_id TEXT REFERENCES entities(id),
  actor_id TEXT,  -- who triggered it

  -- Integrity
  row_checksum TEXT,

  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Immutable: no UPDATE or DELETE
  CONSTRAINT no_future_events CHECK (occurred_at <= NOW() + INTERVAL '5 seconds')
);

CREATE INDEX IF NOT EXISTS idx_financial_events_type ON financial_events(event_type);
CREATE INDEX IF NOT EXISTS idx_financial_events_aggregate ON financial_events(aggregate_type, aggregate_id);
CREATE INDEX IF NOT EXISTS idx_financial_events_occurred ON financial_events(occurred_at DESC);

-- RLS: append-only
ALTER TABLE financial_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role only insert" ON financial_events FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "authenticated read" ON financial_events FOR SELECT TO authenticated USING (true);

-- ─── SNS/SQS EVENT TOPICS (documented as table) ───────────────────────────────

CREATE TABLE IF NOT EXISTS event_topics (
  topic TEXT PRIMARY KEY,
  description TEXT,
  triggers TEXT[],    -- what events are published here
  subscribers TEXT[]  -- which services subscribe
);

INSERT INTO event_topics VALUES
  ('wavult.task.created',      'New task created',          ARRAY['task_service'],         ARRAY['notification', 'analytics']),
  ('wavult.task.approved',     'Task approved by validator', ARRAY['validation_service'],   ARRAY['payout_engine', 'analytics', 'landvex']),
  ('wavult.task.rejected',     'Task rejected',             ARRAY['validation_service'],   ARRAY['notification', 'analytics']),
  ('wavult.payment.initiated', 'Payment started',           ARRAY['payment_service'],      ARRAY['finance_co', 'audit']),
  ('wavult.payment.completed', 'Payment completed',         ARRAY['payment_service'],      ARRAY['split_engine', 'audit']),
  ('wavult.split.executed',    'Revenue split executed',    ARRAY['finance_co'],           ARRAY['payout_engine', 'reporting']),
  ('wavult.payout.executed',   'Zoomer payout sent',        ARRAY['payout_engine'],        ARRAY['notification', 'audit']),
  ('wavult.ads.purchased',     'Ads package purchased',     ARRAY['ads_service'],          ARRAY['finance_co', 'creator_payout', 'analytics']),
  ('wavult.fx.updated',        'FX rates refreshed',        ARRAY['fx_service'],           ARRAY['all_services'])
ON CONFLICT DO NOTHING;
