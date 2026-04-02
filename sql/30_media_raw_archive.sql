-- ─── Wavult OS — Media Raw Archive ───────────────────────────────────────────
-- MASTER PROMPT v3: Field Documentarian — Raw Capture / AWS / OS Integration
-- Authority: Absolute
--
-- All footage captured by Field Documentarian is stored in:
--   s3://quixzoom-media-prod/media/YYYY/MM/wWW/raw/
--
-- Naming convention: YYYY-MM-DD_TYPE_LOCATION_PERSON_TOPIC.mp4
-- Rule: If it is not uploaded → it does not exist.
-- ─────────────────────────────────────────────────────────────────────────────

-- Footage type enum
CREATE TYPE footage_type AS ENUM (
  'interview',
  'team_session',
  'decision_moment',
  'travel',
  'product_demo',
  'sales_call',
  'financial_review',
  'spontaneous',
  'meetup'
);

-- Raw archive table
CREATE TABLE IF NOT EXISTS media_raw_archive (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        timestamptz NOT NULL DEFAULT now(),

  -- File identity
  filename          text NOT NULL,                          -- YYYY-MM-DD_TYPE_LOCATION_PERSON_TOPIC.mp4
  s3_key            text NOT NULL UNIQUE,                   -- full S3 path
  s3_bucket         text NOT NULL DEFAULT 'quixzoom-media-prod',
  file_size_mb      numeric(10,2),
  duration_seconds  integer,
  format            text DEFAULT 'mp4',

  -- Required metadata (Master Prompt §6)
  filmed_at         date NOT NULL,
  location          text NOT NULL,
  people            text[] NOT NULL DEFAULT '{}',
  topic             text NOT NULL,
  tags              text[] NOT NULL DEFAULT '{}',
  footage_type      footage_type NOT NULL,

  -- Brand context
  brand             text CHECK (brand IN ('quixzoom', 'landvex', 'both', 'internal')),

  -- Upload compliance
  uploaded_at       timestamptz NOT NULL DEFAULT now(),
  upload_delay_hrs  numeric GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (uploaded_at - filmed_at::timestamptz)) / 3600
  ) STORED,
  same_day_compliant boolean GENERATED ALWAYS AS (
    filmed_at = uploaded_at::date
  ) STORED,

  -- Processing state
  indexed           boolean NOT NULL DEFAULT true,
  ai_processed      boolean NOT NULL DEFAULT false,
  episode_candidate boolean NOT NULL DEFAULT false,
  episode_id        text,                                   -- links to content pipeline

  -- Documentarian
  captured_by       text NOT NULL DEFAULT 'field-doc-01',

  -- Notes
  notes             text
);

-- Indexes for OS search
CREATE INDEX idx_media_filmed_at   ON media_raw_archive (filmed_at DESC);
CREATE INDEX idx_media_brand       ON media_raw_archive (brand);
CREATE INDEX idx_media_type        ON media_raw_archive (footage_type);
CREATE INDEX idx_media_people      ON media_raw_archive USING GIN (people);
CREATE INDEX idx_media_tags        ON media_raw_archive USING GIN (tags);
CREATE INDEX idx_media_compliant   ON media_raw_archive (same_day_compliant);
CREATE INDEX idx_media_episode     ON media_raw_archive (episode_candidate) WHERE episode_candidate = true;

-- Full-text search across topic + notes + tags
CREATE INDEX idx_media_fts ON media_raw_archive USING GIN (
  to_tsvector('english', coalesce(topic,'') || ' ' || coalesce(notes,'') || ' ' || array_to_string(tags,' '))
);

-- ─── Upload compliance view ───────────────────────────────────────────────────
-- "If it is not uploaded → it does not exist."

CREATE OR REPLACE VIEW media_compliance_summary AS
SELECT
  COUNT(*)                                            AS total_files,
  COUNT(*) FILTER (WHERE same_day_compliant)         AS same_day_uploads,
  COUNT(*) FILTER (WHERE NOT same_day_compliant)     AS late_uploads,
  ROUND(100.0 * COUNT(*) FILTER (WHERE same_day_compliant) / NULLIF(COUNT(*),0), 1) AS compliance_pct,
  SUM(file_size_mb)                                  AS total_gb_raw,
  SUM(duration_seconds) / 3600.0                     AS total_hours_filmed,
  MAX(filmed_at)                                     AS last_filming_date,
  COUNT(*) FILTER (WHERE episode_candidate)          AS episode_candidates,
  COUNT(*) FILTER (WHERE ai_processed)               AS ai_processed_count
FROM media_raw_archive;

-- ─── Weekly filming tracker ───────────────────────────────────────────────────
-- Rule: minimum 1 full filming day per week

CREATE OR REPLACE VIEW media_weekly_tracker AS
SELECT
  DATE_TRUNC('week', filmed_at)::date           AS week_start,
  TO_CHAR(filmed_at, 'IYYY"-W"IW')             AS iso_week,
  COUNT(DISTINCT filmed_at)                     AS filming_days,
  COUNT(*)                                      AS total_files,
  SUM(duration_seconds) / 60.0                 AS total_minutes,
  ARRAY_AGG(DISTINCT brand ORDER BY brand)      AS brands_covered,
  COUNT(*) FILTER (WHERE NOT same_day_compliant) AS late_files,
  COUNT(DISTINCT filmed_at) >= 1               AS minimum_met
FROM media_raw_archive
GROUP BY DATE_TRUNC('week', filmed_at), TO_CHAR(filmed_at, 'IYYY"-W"IW')
ORDER BY week_start DESC;

-- ─── OS search function ───────────────────────────────────────────────────────
-- Searchable in Wavult OS via topic, person, tag, or date range

CREATE OR REPLACE FUNCTION search_raw_archive(
  p_query    text    DEFAULT NULL,
  p_person   text    DEFAULT NULL,
  p_brand    text    DEFAULT NULL,
  p_from     date    DEFAULT NULL,
  p_to       date    DEFAULT NULL,
  p_limit    integer DEFAULT 50
)
RETURNS TABLE (
  id          uuid,
  filename    text,
  filmed_at   date,
  location    text,
  people      text[],
  topic       text,
  tags        text[],
  brand       text,
  footage_type footage_type,
  duration_seconds integer,
  s3_key      text,
  episode_candidate boolean
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id, filename, filmed_at, location, people, topic, tags,
    brand, footage_type, duration_seconds, s3_key, episode_candidate
  FROM media_raw_archive
  WHERE
    (p_query  IS NULL OR to_tsvector('english', topic || ' ' || coalesce(notes,'') || ' ' || array_to_string(tags,' '))
                         @@ plainto_tsquery('english', p_query))
    AND (p_person IS NULL OR p_person = ANY(people))
    AND (p_brand  IS NULL OR brand = p_brand)
    AND (p_from   IS NULL OR filmed_at >= p_from)
    AND (p_to     IS NULL OR filmed_at <= p_to)
  ORDER BY filmed_at DESC
  LIMIT p_limit;
$$;

-- ─── Trigger: auto-generate filename from metadata ────────────────────────────

CREATE OR REPLACE FUNCTION media_set_filename()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.filename IS NULL OR NEW.filename = '' THEN
    NEW.filename := TO_CHAR(NEW.filmed_at, 'YYYY-MM-DD')
      || '_' || UPPER(NEW.footage_type::text)
      || '_' || REGEXP_REPLACE(LOWER(NEW.location), '[^a-z0-9]', '-', 'g')
      || '_' || REGEXP_REPLACE(LOWER(array_to_string(NEW.people, '-')), '[^a-z0-9-]', '', 'g')
      || '_' || REGEXP_REPLACE(LOWER(LEFT(NEW.topic, 30)), '[^a-z0-9]', '-', 'g')
      || '.mp4';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_media_filename
  BEFORE INSERT ON media_raw_archive
  FOR EACH ROW EXECUTE FUNCTION media_set_filename();

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE media_raw_archive ENABLE ROW LEVEL SECURITY;

-- Internal Wavult OS only — no public access
CREATE POLICY "media_internal_read"  ON media_raw_archive FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "media_internal_write" ON media_raw_archive FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "media_internal_update" ON media_raw_archive FOR UPDATE USING (auth.role() = 'authenticated');
