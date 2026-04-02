-- Tax Declarations table
-- Jurisdictions: SE (Skatteverket), UAE (FTA), LT (VMI), US-DE (IRS/Delaware), US-TX (IRS/Texas)
-- Status flow: draft → prepared → submitted → confirmed | overdue

CREATE TABLE IF NOT EXISTS tax_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,        -- SE, US-DE, US-TX, UAE, LT
  declaration_type TEXT NOT NULL,    -- moms, agd, vat, corporate_tax, payroll, ink2
  period_from DATE NOT NULL,
  period_to DATE NOT NULL,
  deadline DATE,
  status TEXT DEFAULT 'draft',       -- draft, prepared, submitted, confirmed, overdue
  amount_due NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'SEK',
  reference TEXT,
  submission_ref TEXT,               -- Skatteverkets ärendenummer, FTA ref, etc
  submitted_at TIMESTAMPTZ,
  submitted_by TEXT,
  auto_calculated BOOLEAN DEFAULT true,
  notes TEXT,
  data JSONB DEFAULT '{}',           -- full declaration payload
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tax_entity   ON tax_declarations(entity_id);
CREATE INDEX IF NOT EXISTS idx_tax_deadline ON tax_declarations(deadline ASC);
CREATE INDEX IF NOT EXISTS idx_tax_status   ON tax_declarations(status);
CREATE INDEX IF NOT EXISTS idx_tax_juris    ON tax_declarations(jurisdiction);
