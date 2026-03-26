-- ─── Payment OS Schema — Enterprise Payment Operating System ────────────────
-- Immutable, append-only. Double-entry ledger. Event-driven audit trail.
-- Supports multi-entity, multi-currency, split engine, compliance automation.

-- ─── Payment Events (Immutable Audit Trail) ─────────────────────────────────
-- NEVER update or delete. Only INSERT.
CREATE TABLE IF NOT EXISTS payment_os_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT NOT NULL,
  event_type TEXT NOT NULL,                   -- PaymentCreated, PaymentRouted, PaymentAuthorized, SplitCalculated, LedgerWritten, PaymentSettled
  entity_id TEXT NOT NULL,
  amount DECIMAL(18,2),
  currency TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Immutable: no UPDATE or DELETE triggers
CREATE INDEX IF NOT EXISTS idx_pos_events_payment ON payment_os_events(payment_id);
CREATE INDEX IF NOT EXISTS idx_pos_events_type ON payment_os_events(event_type);
CREATE INDEX IF NOT EXISTS idx_pos_events_entity ON payment_os_events(entity_id);
CREATE INDEX IF NOT EXISTS idx_pos_events_created ON payment_os_events(created_at DESC);

-- ─── Double-Entry Ledger (Immutable) ────────────────────────────────────────
-- Every transaction creates balanced debit/credit entries.
-- SUM(debit) = SUM(credit) for every flow_id.
CREATE TABLE IF NOT EXISTS payment_os_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id TEXT NOT NULL,                      -- Links to payment_id or settlement_id
  entity_id TEXT NOT NULL,
  account TEXT NOT NULL,                      -- bank, revenue, ic-payable-royalty, ic-payable-service, tax-reserve, expense, etc.
  debit DECIMAL(18,2) NOT NULL DEFAULT 0,
  credit DECIMAL(18,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraint: entry must have either debit or credit, not both
  CONSTRAINT chk_debit_credit CHECK (
    (debit > 0 AND credit = 0) OR (debit = 0 AND credit > 0) OR (debit = 0 AND credit = 0)
  )
);

CREATE INDEX IF NOT EXISTS idx_pos_ledger_flow ON payment_os_ledger(flow_id);
CREATE INDEX IF NOT EXISTS idx_pos_ledger_entity ON payment_os_ledger(entity_id);
CREATE INDEX IF NOT EXISTS idx_pos_ledger_account ON payment_os_ledger(account);
CREATE INDEX IF NOT EXISTS idx_pos_ledger_created ON payment_os_ledger(created_at DESC);

-- ─── Split Allocations (per payment) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_os_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  split_type TEXT NOT NULL CHECK (split_type IN ('revenue', 'royalty', 'service-fee', 'tax-reserve', 'profit')),
  amount DECIMAL(18,2) NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  currency TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pos_splits_payment ON payment_os_splits(payment_id);
CREATE INDEX IF NOT EXISTS idx_pos_splits_entity ON payment_os_splits(entity_id);

-- ─── Compliance Checks (per transaction) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_os_compliance_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT,
  flow_id TEXT,
  rule_name TEXT NOT NULL,                    -- large_payment, cross_border, transfer_pricing, sanctions, sod
  status TEXT NOT NULL CHECK (status IN ('pass', 'flag', 'block')),
  reason TEXT NOT NULL,
  requires_approval BOOLEAN DEFAULT false,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pos_compliance_payment ON payment_os_compliance_checks(payment_id);
CREATE INDEX IF NOT EXISTS idx_pos_compliance_status ON payment_os_compliance_checks(status);

-- ─── Invoice Automation Pipeline ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_os_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE,
  entity_id TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound', 'intercompany')),

  -- Source data
  vendor_name TEXT,
  vendor_org_nr TEXT,
  vendor_iban TEXT,

  -- Parsed data (from OCR/API)
  gross_amount DECIMAL(18,2),
  vat_amount DECIMAL(18,2) DEFAULT 0,
  net_amount DECIMAL(18,2),
  currency TEXT NOT NULL DEFAULT 'SEK',
  reference TEXT,
  due_date DATE,

  -- Matching
  match_status TEXT NOT NULL DEFAULT 'unmatched' CHECK (match_status IN ('unmatched', 'matched', 'partial', 'disputed')),
  matched_order_id TEXT,
  matched_delivery_id TEXT,

  -- Processing pipeline
  pipeline_status TEXT NOT NULL DEFAULT 'received' CHECK (pipeline_status IN (
    'received', 'ocr-parsed', 'classified', 'matched', 'booked', 'approved', 'payment-scheduled', 'paid', 'reconciled', 'flagged'
  )),

  -- Approval
  auto_approved BOOLEAN DEFAULT false,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  approval_rule TEXT,                         -- Which rule auto-approved

  -- Booking
  ledger_entry_id UUID,
  booked_at TIMESTAMPTZ,
  account_code TEXT,                          -- Chart of accounts code

  -- Payment
  payment_method TEXT,                        -- sepa, ach, wire
  payment_reference TEXT,
  paid_at TIMESTAMPTZ,

  -- Reconciliation
  reconciled BOOLEAN DEFAULT false,
  reconciled_at TIMESTAMPTZ,
  reconciliation_diff DECIMAL(18,2) DEFAULT 0,

  -- Metadata
  source TEXT DEFAULT 'manual',               -- manual, api, email, edi
  ocr_confidence DECIMAL(3,2),
  raw_data JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pos_invoices_entity ON payment_os_invoices(entity_id);
CREATE INDEX IF NOT EXISTS idx_pos_invoices_pipeline ON payment_os_invoices(pipeline_status);
CREATE INDEX IF NOT EXISTS idx_pos_invoices_match ON payment_os_invoices(match_status);

-- ─── Compliance Rules (as code) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_os_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL UNIQUE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('approval', 'compliance', 'routing', 'split', 'alert')),
  condition_expr JSONB NOT NULL,              -- { "if": "amount > 50000", "then": "require_dual_approval" }
  actions JSONB NOT NULL,                     -- ["require_approval:2", "aml_check", "log:audit"]
  active BOOLEAN NOT NULL DEFAULT true,
  priority INT NOT NULL DEFAULT 100,
  jurisdiction TEXT,                          -- null = global
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Account Balances (materialized view concept) ───────────────────────────
-- Computed from ledger entries. Can be rebuilt at any time.
CREATE TABLE IF NOT EXISTS payment_os_account_balances (
  entity_id TEXT NOT NULL,
  account TEXT NOT NULL,
  currency TEXT NOT NULL,
  balance DECIMAL(18,2) NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (entity_id, account, currency)
);

-- ─── Useful Views ───────────────────────────────────────────────────────────

-- Entity P&L summary (revenue - expenses per entity)
CREATE OR REPLACE VIEW v_entity_pnl AS
SELECT
  entity_id,
  currency,
  SUM(CASE WHEN account = 'revenue' THEN credit - debit ELSE 0 END) AS total_revenue,
  SUM(CASE WHEN account LIKE 'ic-payable%' THEN credit - debit ELSE 0 END) AS total_ic_payables,
  SUM(CASE WHEN account = 'tax-reserve' THEN credit - debit ELSE 0 END) AS total_tax_reserve,
  SUM(credit - debit) AS net_position
FROM payment_os_ledger
GROUP BY entity_id, currency;

-- Global cash position
CREATE OR REPLACE VIEW v_global_cash_position AS
SELECT
  entity_id,
  currency,
  SUM(CASE WHEN account = 'bank' THEN debit - credit ELSE 0 END) AS cash_balance
FROM payment_os_ledger
GROUP BY entity_id, currency;

-- Intercompany balances
CREATE OR REPLACE VIEW v_intercompany_balances AS
SELECT
  entity_id,
  account,
  currency,
  SUM(credit - debit) AS balance
FROM payment_os_ledger
WHERE account LIKE 'ic-%'
GROUP BY entity_id, account, currency;
