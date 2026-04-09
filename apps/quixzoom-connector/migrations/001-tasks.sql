-- quixzoom-connector — Postgres schema.
-- Run against the existing quiXzoom DB or a dedicated schema.

CREATE SCHEMA IF NOT EXISTS quixzoom_connector;
SET search_path TO quixzoom_connector, public;

CREATE TABLE IF NOT EXISTS tasks (
  task_id          UUID PRIMARY KEY,
  query_id         UUID NOT NULL,
  state            TEXT NOT NULL,
  qvl              JSONB NOT NULL,
  location         JSONB NOT NULL,
  priority         TEXT NOT NULL CHECK (priority IN ('normal', 'high')),
  tokens_reserved  INTEGER NOT NULL,
  retries          INTEGER NOT NULL DEFAULT 0,
  max_retries      INTEGER NOT NULL DEFAULT 3,
  timeout_seconds  INTEGER NOT NULL DEFAULT 300,
  created_at       TIMESTAMPTZ NOT NULL,
  last_transition  TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_state ON tasks (state);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_query_id ON tasks (query_id);

-- Outbox pattern — every write to `tasks` in the same transaction
-- appends to `task_outbox`, and a background publisher drains it to
-- Kafka. Guarantees at-least-once event delivery even if Kafka is
-- unavailable at commit time.
CREATE TABLE IF NOT EXISTS task_outbox (
  id            BIGSERIAL PRIMARY KEY,
  task_id       UUID NOT NULL REFERENCES tasks (task_id),
  event_type    TEXT NOT NULL,
  payload       JSONB NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_outbox_unpublished
  ON task_outbox (created_at) WHERE published_at IS NULL;

-- Query log for training + eval.
CREATE TABLE IF NOT EXISTS query_log (
  id            BIGSERIAL PRIMARY KEY,
  trace_id      UUID,
  tenant_id     TEXT,
  user_id       TEXT,
  text          TEXT NOT NULL,
  intent        TEXT,
  confidence    REAL,
  engine        TEXT,
  cache_hit     BOOLEAN,
  took_ms       INTEGER,
  task_id       UUID,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_query_log_created_at
  ON query_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_query_log_tenant
  ON query_log (tenant_id, created_at DESC);
