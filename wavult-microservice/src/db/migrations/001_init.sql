-- Wavult microservice initial schema
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS events (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    type          TEXT        NOT NULL,
    source        TEXT        NOT NULL,
    subject       TEXT,
    payload       JSONB       NOT NULL,
    metadata      JSONB       NOT NULL DEFAULT '{}'::jsonb,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at  TIMESTAMPTZ,
    CONSTRAINT events_type_not_empty CHECK (length(type) > 0)
);

CREATE INDEX IF NOT EXISTS idx_events_type          ON events (type);
CREATE INDEX IF NOT EXISTS idx_events_source        ON events (source);
CREATE INDEX IF NOT EXISTS idx_events_created_at    ON events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_payload_gin   ON events USING gin (payload);

CREATE TABLE IF NOT EXISTS outbox (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id      UUID        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    topic         TEXT        NOT NULL,
    key           TEXT,
    value         JSONB       NOT NULL,
    status        TEXT        NOT NULL DEFAULT 'pending',
    attempts      INT         NOT NULL DEFAULT 0,
    last_error    TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at  TIMESTAMPTZ,
    CONSTRAINT outbox_status_valid CHECK (status IN ('pending', 'sent', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_outbox_status_created ON outbox (status, created_at)
    WHERE status = 'pending';
