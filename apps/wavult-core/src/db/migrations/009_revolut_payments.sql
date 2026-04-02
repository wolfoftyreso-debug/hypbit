-- Migration 009: revolut_payments table
-- Tracks all Revolut Business API payment initiations and their status
-- Run against: wavult schema in Supabase

CREATE TABLE IF NOT EXISTS wavult.revolut_payments (
  id              TEXT PRIMARY KEY,          -- Revolut transaction ID or generated UUID
  request_id      TEXT NOT NULL,             -- Idempotency key (wavult-{reference}-{ts})
  amount          INTEGER NOT NULL,          -- In smallest currency unit (cents)
  currency        VARCHAR(3) NOT NULL,       -- ISO 4217 (USD, EUR, SEK)
  description     TEXT NOT NULL,
  reference       TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending',   -- pending | completed | failed | declined
  revolut_response JSONB,                    -- Full Revolut API response
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS revolut_payments_reference_idx ON wavult.revolut_payments (reference);
CREATE INDEX IF NOT EXISTS revolut_payments_status_idx ON wavult.revolut_payments (status);
CREATE INDEX IF NOT EXISTS revolut_payments_created_idx ON wavult.revolut_payments (created_at DESC);

COMMENT ON TABLE wavult.revolut_payments IS 
  'Revolut Business API payment records — all outbound payments initiated from Wavult OS';

-- DynamoDB table (create via AWS CLI or Terraform):
-- aws dynamodb create-table \
--   --table-name wavult-payment-receipts \
--   --attribute-definitions AttributeName=id,AttributeType=S \
--   --key-schema AttributeName=id,KeyType=HASH \
--   --billing-mode PAY_PER_REQUEST \
--   --region eu-north-1
