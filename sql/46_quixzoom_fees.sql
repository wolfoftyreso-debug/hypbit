-- ============================================================================
-- QuixZoom — Fee Engine & Platform Accounts
-- File: 46_quixzoom_fees.sql
-- Depends: 45_quixzoom_workflows.sql
--
-- Universal 5% take rate on all value flows.
-- Fees are split at ledger level — never in arrears.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. FEE CONFIGURATION (versionable, auditable)
-- ============================================================================
CREATE TABLE IF NOT EXISTS qz_fee_config (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT        NOT NULL UNIQUE,
  description     TEXT,
  transaction_type TEXT       NOT NULL,   -- task_payout, ir_sale, subscription, withdrawal, enterprise
  fee_pct         NUMERIC(6,4) NOT NULL,  -- 0.0500 = 5%
  min_fee         NUMERIC(10,2) DEFAULT 0,
  max_fee         NUMERIC(10,2),          -- NULL = no cap
  active          BOOLEAN     NOT NULL DEFAULT true,
  effective_from  TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_until TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Universal 5% on all flows
INSERT INTO qz_fee_config (slug, description, transaction_type, fee_pct, min_fee)
VALUES
  ('task-payout-fee',    'Platform fee on task payouts',       'task_payout',   0.0500, 0.50),
  ('ir-sale-fee',        'Platform fee on IR sales',           'ir_sale',       0.0500, 1.00),
  ('subscription-fee',   'Platform fee on subscriptions',      'subscription',  0.0500, 1.00),
  ('lead-sale-fee',      'Platform fee on lead-based sales',   'lead_sale',     0.0500, 0.50),
  ('withdrawal-fee',     'Fee on instant withdrawals',         'withdrawal',    0.0100, 5.00),
  ('enterprise-api-fee', 'Platform fee on enterprise API use', 'enterprise',    0.0500, 10.00)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 2. TIERED FEE OVERRIDES (per level — Elite gets lower fees)
-- ============================================================================
CREATE TABLE IF NOT EXISTS qz_fee_tiers (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_config_id   UUID        NOT NULL REFERENCES qz_fee_config(id),
  level_id        INTEGER     NOT NULL REFERENCES qz_levels(id),
  fee_pct         NUMERIC(6,4) NOT NULL,
  active          BOOLEAN     NOT NULL DEFAULT true,
  UNIQUE(fee_config_id, level_id)
);

-- Elite (level 6) gets 3%, Professional (level 5) gets 4%
INSERT INTO qz_fee_tiers (id, fee_config_id, level_id, fee_pct)
SELECT gen_random_uuid(), fc.id, l.id,
  CASE l.slug
    WHEN 'elite' THEN 0.0300
    WHEN 'professional' THEN 0.0400
    ELSE 0.0500
  END
FROM qz_fee_config fc
CROSS JOIN qz_levels l
WHERE fc.transaction_type IN ('task_payout', 'ir_sale')
ON CONFLICT (fee_config_id, level_id) DO NOTHING;

-- ============================================================================
-- 3. PLATFORM ACCOUNTS (where revenue accumulates)
-- ============================================================================
CREATE TABLE IF NOT EXISTS qz_platform_accounts (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT        NOT NULL UNIQUE,
  name            TEXT        NOT NULL,
  type            TEXT        NOT NULL CHECK (type IN (
                    'revenue', 'escrow', 'fee_collection', 'reserve', 'operational'
                  )),
  currency        TEXT        NOT NULL DEFAULT 'SEK',
  balance         NUMERIC(20,2) NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO qz_platform_accounts (slug, name, type, currency)
VALUES
  ('platform-revenue',     'Platform Revenue',        'revenue',        'SEK'),
  ('fee-collection',       'Fee Collection Account',  'fee_collection', 'SEK'),
  ('creator-escrow',       'Creator Escrow',          'escrow',         'SEK'),
  ('withdrawal-reserve',   'Withdrawal Reserve',      'reserve',        'SEK'),
  ('operational',          'Operational Account',     'operational',    'SEK')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 4. FEE LEDGER (every fee ever charged — append-only)
-- ============================================================================
CREATE TABLE IF NOT EXISTS qz_fee_ledger (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type TEXT       NOT NULL,
  reference_type  TEXT        NOT NULL,   -- task_assignment, ir_purchase, buyer_purchase, withdrawal
  reference_id    UUID        NOT NULL,
  gross_amount    NUMERIC(14,2) NOT NULL,
  fee_pct         NUMERIC(6,4) NOT NULL,
  fee_amount      NUMERIC(14,2) NOT NULL,
  net_amount      NUMERIC(14,2) NOT NULL, -- what creator receives
  currency        TEXT        NOT NULL DEFAULT 'SEK',
  creator_id      UUID,
  level_slug      TEXT,                    -- level at time of fee calculation
  platform_account_id UUID   REFERENCES qz_platform_accounts(id),
  metadata        JSONB       DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qz_fee_ledger_type ON qz_fee_ledger(transaction_type);
CREATE INDEX IF NOT EXISTS idx_qz_fee_ledger_ref ON qz_fee_ledger(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_qz_fee_ledger_creator ON qz_fee_ledger(creator_id);
CREATE INDEX IF NOT EXISTS idx_qz_fee_ledger_created ON qz_fee_ledger(created_at);

-- Immutable fee ledger
DROP TRIGGER IF EXISTS trg_qz_fee_ledger_immutable ON qz_fee_ledger;
CREATE TRIGGER trg_qz_fee_ledger_immutable
  BEFORE UPDATE OR DELETE ON qz_fee_ledger
  FOR EACH ROW EXECUTE FUNCTION qx_ledger_immutable();

-- ============================================================================
-- 5. REVENUE REPORTS (materialized daily)
-- ============================================================================
CREATE TABLE IF NOT EXISTS qz_revenue_daily (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  date            DATE        NOT NULL,
  transaction_type TEXT       NOT NULL,
  gross_volume    NUMERIC(20,2) NOT NULL DEFAULT 0,
  total_fees      NUMERIC(20,2) NOT NULL DEFAULT 0,
  net_to_creators NUMERIC(20,2) NOT NULL DEFAULT 0,
  transaction_count INTEGER   NOT NULL DEFAULT 0,
  currency        TEXT        NOT NULL DEFAULT 'SEK',
  UNIQUE(date, transaction_type, currency)
);

COMMIT;
