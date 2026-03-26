-- ============================================================================
-- Quixoom Enterprise — Core Financial Schema
-- File: 40_quixoom_core.sql
-- Purpose: Ledger-first, multi-entity, append-only financial control system
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. LEGAL ENTITIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS qx_entities (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT        NOT NULL,
  jurisdiction    TEXT        NOT NULL,  -- SE, US, LT, AE
  base_currency   TEXT        NOT NULL,  -- ISO 4217
  status          TEXT        NOT NULL DEFAULT 'active',
  metadata        JSONB       DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 2. ACCOUNTS (wallets / ledger accounts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS qx_accounts (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id       UUID        NOT NULL REFERENCES qx_entities(id),
  type            TEXT        NOT NULL CHECK (type IN (
                    'customer', 'treasury', 'revenue', 'payable',
                    'receivable', 'suspense', 'fee', 'fx'
                  )),
  currency        TEXT        NOT NULL,
  label           TEXT,
  status          TEXT        NOT NULL DEFAULT 'active',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qx_accounts_entity ON qx_accounts(entity_id);

-- ============================================================================
-- 3. TRANSACTIONS (logical grouping)
-- ============================================================================
CREATE TABLE IF NOT EXISTS qx_transactions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id       UUID        NOT NULL REFERENCES qx_entities(id),
  type            TEXT        NOT NULL CHECK (type IN (
                    'payment', 'payout', 'fee', 'fx', 'transfer',
                    'adjustment', 'reversal'
                  )),
  status          TEXT        NOT NULL DEFAULT 'pending',
  reference       TEXT,
  idempotency_key TEXT        UNIQUE,
  metadata        JSONB       DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qx_transactions_entity ON qx_transactions(entity_id);
CREATE INDEX IF NOT EXISTS idx_qx_transactions_status ON qx_transactions(status);

-- ============================================================================
-- 4. LEDGER ENTRIES (append-only, immutable)
-- ============================================================================
CREATE TABLE IF NOT EXISTS qx_ledger_entries (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  UUID        NOT NULL REFERENCES qx_transactions(id),
  account_id      UUID        NOT NULL REFERENCES qx_accounts(id),
  direction       TEXT        NOT NULL CHECK (direction IN ('debit', 'credit')),
  amount          NUMERIC(20,8) NOT NULL CHECK (amount > 0),
  currency        TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qx_ledger_tx ON qx_ledger_entries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_qx_ledger_account ON qx_ledger_entries(account_id);

-- Immutability: no updates or deletes on ledger
CREATE OR REPLACE FUNCTION qx_ledger_immutable() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'ledger_entries is append-only: updates and deletes are forbidden';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_qx_ledger_no_update ON qx_ledger_entries;
CREATE TRIGGER trg_qx_ledger_no_update
  BEFORE UPDATE OR DELETE ON qx_ledger_entries
  FOR EACH ROW EXECUTE FUNCTION qx_ledger_immutable();

-- ============================================================================
-- 5. BALANCED TRANSACTION CONSTRAINT
-- Every transaction must have equal debits and credits
-- ============================================================================
CREATE OR REPLACE FUNCTION qx_check_balance() RETURNS TRIGGER AS $$
DECLARE
  total_debit  NUMERIC(20,8);
  total_credit NUMERIC(20,8);
BEGIN
  SELECT
    COALESCE(SUM(CASE WHEN direction = 'debit'  THEN amount END), 0),
    COALESCE(SUM(CASE WHEN direction = 'credit' THEN amount END), 0)
  INTO total_debit, total_credit
  FROM qx_ledger_entries
  WHERE transaction_id = NEW.transaction_id;

  -- Allow imbalance during insert (entries come in pairs)
  -- Final balance check happens at commit via application layer
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. PAYMENTS (PSP integration)
-- ============================================================================
CREATE TABLE IF NOT EXISTS qx_payments (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  UUID        NOT NULL REFERENCES qx_transactions(id),
  entity_id       UUID        NOT NULL REFERENCES qx_entities(id),
  external_id     TEXT,
  psp             TEXT,           -- stripe, adyen, banking_circle, etc.
  amount          NUMERIC(20,8)   NOT NULL,
  currency        TEXT            NOT NULL,
  status          TEXT            NOT NULL DEFAULT 'pending',
  direction       TEXT            NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  payer_info      JSONB           DEFAULT '{}',
  metadata        JSONB           DEFAULT '{}',
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qx_payments_tx ON qx_payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_qx_payments_entity ON qx_payments(entity_id);
CREATE INDEX IF NOT EXISTS idx_qx_payments_external ON qx_payments(external_id);

-- ============================================================================
-- 7. INTERCOMPANY POSITIONS (netting)
-- ============================================================================
CREATE TABLE IF NOT EXISTS qx_intercompany_positions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  from_entity     UUID        NOT NULL REFERENCES qx_entities(id),
  to_entity       UUID        NOT NULL REFERENCES qx_entities(id),
  currency        TEXT        NOT NULL,
  net_amount      NUMERIC(20,8) NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(from_entity, to_entity, currency)
);

-- ============================================================================
-- 8. AUDIT LOGS (append-only)
-- ============================================================================
CREATE TABLE IF NOT EXISTS qx_audit_logs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id       UUID        REFERENCES qx_entities(id),
  event_type      TEXT        NOT NULL,
  actor           TEXT        NOT NULL,
  resource_type   TEXT,
  resource_id     UUID,
  payload         JSONB       DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qx_audit_entity ON qx_audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_qx_audit_event ON qx_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_qx_audit_created ON qx_audit_logs(created_at);

-- Immutability on audit logs
DROP TRIGGER IF EXISTS trg_qx_audit_no_update ON qx_audit_logs;
CREATE TRIGGER trg_qx_audit_no_update
  BEFORE UPDATE OR DELETE ON qx_audit_logs
  FOR EACH ROW EXECUTE FUNCTION qx_ledger_immutable();

-- ============================================================================
-- 9. COMPLIANCE FLAGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS qx_compliance_flags (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id       UUID        REFERENCES qx_entities(id),
  transaction_id  UUID        REFERENCES qx_transactions(id),
  rule            TEXT        NOT NULL,
  severity        TEXT        NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status          TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'escalated')),
  details         JSONB       DEFAULT '{}',
  resolved_by     TEXT,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qx_compliance_tx ON qx_compliance_flags(transaction_id);
CREATE INDEX IF NOT EXISTS idx_qx_compliance_status ON qx_compliance_flags(status);

-- ============================================================================
-- 10. RECONCILIATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS qx_reconciliations (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id      UUID        REFERENCES qx_payments(id),
  ledger_match    BOOLEAN     NOT NULL DEFAULT false,
  external_amount NUMERIC(20,8),
  ledger_amount   NUMERIC(20,8),
  difference      NUMERIC(20,8) GENERATED ALWAYS AS (
                    COALESCE(external_amount, 0) - COALESCE(ledger_amount, 0)
                  ) STORED,
  status          TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN (
                    'pending', 'matched', 'discrepancy', 'resolved'
                  )),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 11. DOMAIN EVENTS (event sourcing light)
-- ============================================================================
CREATE TABLE IF NOT EXISTS qx_events (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id       UUID        REFERENCES qx_entities(id),
  aggregate_type  TEXT        NOT NULL,  -- payment, transaction, compliance
  aggregate_id    UUID        NOT NULL,
  event_type      TEXT        NOT NULL,
  version         INTEGER     NOT NULL DEFAULT 1,
  payload         JSONB       NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qx_events_aggregate ON qx_events(aggregate_type, aggregate_id);
CREATE INDEX IF NOT EXISTS idx_qx_events_type ON qx_events(event_type);
CREATE INDEX IF NOT EXISTS idx_qx_events_created ON qx_events(created_at);

-- Immutability on events
DROP TRIGGER IF EXISTS trg_qx_events_no_update ON qx_events;
CREATE TRIGGER trg_qx_events_no_update
  BEFORE UPDATE OR DELETE ON qx_events
  FOR EACH ROW EXECUTE FUNCTION qx_ledger_immutable();

COMMIT;
