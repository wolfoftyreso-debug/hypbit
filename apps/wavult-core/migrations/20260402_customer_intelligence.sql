CREATE TABLE IF NOT EXISTS customer_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL, source TEXT NOT NULL,
  value NUMERIC DEFAULT 50, metadata JSONB DEFAULT '{}',
  product_hint TEXT, timestamp TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_signals_customer ON customer_signals(customer_id);
CREATE INDEX IF NOT EXISTS idx_signals_source ON customer_signals(source);
CREATE INDEX IF NOT EXISTS idx_signals_time ON customer_signals(timestamp DESC);

CREATE TABLE IF NOT EXISTS customer_intelligence_profiles (
  customer_id TEXT PRIMARY KEY,
  payment_reliability NUMERIC DEFAULT 50,
  engagement_score NUMERIC DEFAULT 50,
  support_burden NUMERIC DEFAULT 0,
  churn_risk NUMERIC DEFAULT 0,
  referral_potential NUMERIC DEFAULT 50,
  predicted_ltv NUMERIC DEFAULT 0,
  current_mrr NUMERIC DEFAULT 0,
  ai_summary TEXT, next_best_action TEXT, optimal_contact_timing TEXT,
  product_fit JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
