-- ─── Treasury Schema — Bank-Level Payment Infrastructure ─────────────────────
-- Multi-entity treasury management: accounts, flows, routing, compliance.
-- Supports intercompany billing, payment routing, and reconciliation.

-- ─── Treasury Accounts ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS treasury_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id TEXT NOT NULL,                    -- wavult-group, landvex-ab, etc.
  bank_name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  account_type TEXT NOT NULL DEFAULT 'business',
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('active', 'pending', 'planned', 'closed')),
  iban TEXT,
  swift_bic TEXT,
  account_number TEXT,
  routing_number TEXT,                        -- US ACH routing
  balance DECIMAL(18,2),
  last_synced TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_treasury_accounts_entity ON treasury_accounts(entity_id);

-- ─── Treasury Flows (Intercompany Ledger) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS treasury_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_entity_id TEXT NOT NULL,
  to_entity_id TEXT NOT NULL,
  flow_type TEXT NOT NULL CHECK (flow_type IN ('royalty', 'dividend', 'service-fee', 'revenue', 'payout', 'intercompany')),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound', 'intercompany')),
  amount DECIMAL(18,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  exchange_rate DECIMAL(12,6),               -- FX rate at time of transfer
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'failed', 'cancelled')),
  approved_by TEXT,                           -- User who approved (for intercompany)
  approved_at TIMESTAMPTZ,
  reference TEXT,                             -- External reference (bank ref, invoice no)
  psp TEXT,                                   -- stripe, wise, revolut, bank-transfer
  psp_reference TEXT,                         -- PSP transaction ID
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_treasury_flows_from ON treasury_flows(from_entity_id);
CREATE INDEX IF NOT EXISTS idx_treasury_flows_to ON treasury_flows(to_entity_id);
CREATE INDEX IF NOT EXISTS idx_treasury_flows_type ON treasury_flows(flow_type);
CREATE INDEX IF NOT EXISTS idx_treasury_flows_status ON treasury_flows(status);
CREATE INDEX IF NOT EXISTS idx_treasury_flows_created ON treasury_flows(created_at DESC);

-- ─── Intercompany Invoices ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS intercompany_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  from_entity_id TEXT NOT NULL,               -- Who sends the invoice
  to_entity_id TEXT NOT NULL,                 -- Who pays
  invoice_type TEXT NOT NULL CHECK (invoice_type IN ('royalty', 'service-fee', 'management-fee', 'cost-allocation')),
  period TEXT NOT NULL,                       -- '2026-Q1', '2026-03', etc.
  amount DECIMAL(18,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  tax_amount DECIMAL(18,2) DEFAULT 0,
  withholding_tax DECIMAL(18,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'paid', 'disputed', 'cancelled')),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  transfer_pricing_rate DECIMAL(5,2),        -- e.g., 10.00 for 10%
  transfer_pricing_doc_ref TEXT,             -- Reference to TP documentation
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ic_invoices_from ON intercompany_invoices(from_entity_id);
CREATE INDEX IF NOT EXISTS idx_ic_invoices_to ON intercompany_invoices(to_entity_id);

-- ─── Payment Routing Rules ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condition_expr TEXT NOT NULL,               -- e.g., "customer_jurisdiction == 'EU'"
  destination_entity_id TEXT NOT NULL,
  psp TEXT NOT NULL,                          -- stripe, wise, bank-transfer
  priority INT NOT NULL DEFAULT 100,
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_routing_active ON payment_routing_rules(active, priority);

-- ─── Compliance Gates ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS treasury_compliance_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id TEXT NOT NULL,
  gate_type TEXT NOT NULL CHECK (gate_type IN ('kyc', 'aml', 'sanctions', 'transfer-pricing', 'substance', 'tax-residency')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pass', 'fail', 'pending', 'not-applicable', 'expired')),
  last_checked TIMESTAMPTZ,
  next_review DATE,
  evidence_ref TEXT,                          -- Link to documentation
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compliance_entity ON treasury_compliance_gates(entity_id);
CREATE INDEX IF NOT EXISTS idx_compliance_status ON treasury_compliance_gates(status);

-- ─── Bank Reconciliation ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS treasury_reconciliation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES treasury_accounts(id),
  period TEXT NOT NULL,                       -- '2026-03'
  bank_balance DECIMAL(18,2),
  ledger_balance DECIMAL(18,2),
  difference DECIMAL(18,2),
  unmatched_items INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'reconciled', 'exception')),
  reconciled_by TEXT,
  reconciled_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── RLS Policies (placeholder) ─────────────────────────────────────────────
-- In production: enable RLS and scope by org_id / entity_id
-- ALTER TABLE treasury_accounts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE treasury_flows ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE intercompany_invoices ENABLE ROW LEVEL SECURITY;
