// Feature flags with hot-reload.
//
// Source of truth: a JSON file at `config/feature-flags.json` by
// default, or `FEATURE_FLAGS_PATH` via env. The file is re-read every
// 30 seconds so a simple `aws ssm get-parameter --name /flags/... >
// config/feature-flags.json && kill -HUP $PID` redeploy-free update
// is possible. Production hooks this to GrowthBook or Unleash by
// replacing the loadFromDisk() body — the public API stays the same.
//
// Flags supported:
//   - `engine`: keyword | haiku | cached-haiku | shadow | cached-shadow
//   - `image_understanding`: boolean
//   - `matching_enabled`: boolean
//   - tenant overrides: { "tenant:enterprise-foo": { "engine": "haiku" } }

import { readFileSync, statSync } from 'fs';
import { join } from 'path';

import { logger } from '../utils/logger';

export interface FlagState {
  engine: string;
  image_understanding: boolean;
  matching_enabled: boolean;
  overrides: Record<string, Partial<FlagState>>;
}

const DEFAULTS: FlagState = {
  engine: 'keyword',
  image_understanding: true,
  matching_enabled: true,
  overrides: {},
};

let current: FlagState = { ...DEFAULTS };
let lastLoadedMtime = 0;
let pollTimer: NodeJS.Timeout | null = null;

function filePath(): string {
  return (
    process.env.FEATURE_FLAGS_PATH ??
    join(process.cwd(), 'config', 'feature-flags.json')
  );
}

function loadFromDisk(): void {
  const path = filePath();
  try {
    const st = statSync(path);
    if (st.mtimeMs === lastLoadedMtime) return;
    lastLoadedMtime = st.mtimeMs;
    const raw = readFileSync(path, 'utf8');
    const parsed = JSON.parse(raw) as Partial<FlagState>;
    current = { ...DEFAULTS, ...parsed };
    logger.info('feature_flags.loaded', { path, engine: current.engine });
  } catch (err) {
    const code =
      typeof err === 'object' && err && 'code' in err
        ? (err as { code: string }).code
        : '';
    if (code !== 'ENOENT') {
      logger.warn('feature_flags.load_error', {
        path,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

/** Returns the current flag state, applying any tenant override. */
export function getFlags(tenant_id?: string): FlagState {
  if (!tenant_id) return current;
  const key = `tenant:${tenant_id}`;
  const override = current.overrides[key];
  return override ? { ...current, ...override } : current;
}

export function startFeatureFlagPoller(intervalMs = 30_000): void {
  loadFromDisk();
  if (pollTimer) return;
  pollTimer = setInterval(loadFromDisk, intervalMs);
  // SIGHUP triggers an immediate re-read.
  process.on('SIGHUP', () => {
    lastLoadedMtime = 0;
    loadFromDisk();
  });
}

export function stopFeatureFlagPoller(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

/** Test helper. */
export function __setFlags(next: Partial<FlagState>): void {
  current = { ...current, ...next };
}
