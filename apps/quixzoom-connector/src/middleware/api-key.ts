// API-key authentication middleware.
//
// The connector accepts a list of API keys from the env var
// QUIXZOOM_API_KEYS (comma separated), plus an optional single key from
// QUIXZOOM_API_KEY. Each key may have a name baked in via `name:key`
// syntax for log attribution.
//
// Public paths (health, ready, root) bypass the check.

import type { NextFunction, Request, Response } from 'express';

import { config } from '../utils/config';
import { logger } from '../utils/logger';

const PUBLIC_PATHS = new Set(['/health', '/ready']);

interface ApiKey {
  name: string;
  key: string;
}

function parseKeys(): ApiKey[] {
  const list: ApiKey[] = [];
  const seen = new Set<string>();

  const add = (raw: string): void => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    let name = 'default';
    let key = trimmed;
    const colon = trimmed.indexOf(':');
    if (colon > 0) {
      name = trimmed.slice(0, colon);
      key = trimmed.slice(colon + 1);
    }
    if (!key || seen.has(key)) return;
    seen.add(key);
    list.push({ name, key });
  };

  if (config.apiKey) {
    add(config.apiKey);
  }
  const many = process.env.QUIXZOOM_API_KEYS ?? '';
  for (const raw of many.split(',')) {
    add(raw);
  }
  return list;
}

let cachedKeys: ApiKey[] | null = null;

function getKeys(): ApiKey[] {
  if (cachedKeys === null) {
    cachedKeys = parseKeys();
  }
  return cachedKeys;
}

/** Test helper to clear the cached key list between cases. */
export function __resetApiKeys(): void {
  cachedKeys = null;
}

/** Express middleware. If no keys are configured the middleware is
 *  a no-op so local development and tests work without ceremony. In
 *  production, set QUIXZOOM_API_KEYS and the service rejects requests
 *  that lack a matching `X-API-Key` header. */
export function apiKeyAuth() {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (PUBLIC_PATHS.has(req.path)) {
      next();
      return;
    }

    const keys = getKeys();
    if (keys.length === 0) {
      // Auth disabled (dev/test).
      next();
      return;
    }

    const provided =
      (req.header('x-api-key') as string | undefined) ??
      (req.header('X-API-Key') as string | undefined);
    if (!provided) {
      res.status(401).json({ error: 'missing_api_key' });
      return;
    }
    const match = keys.find((k) => k.key === provided);
    if (!match) {
      logger.warn('auth.rejected', {
        path: req.path,
        trace_id: (req as Request & { trace_id?: string }).trace_id,
      });
      res.status(403).json({ error: 'invalid_api_key' });
      return;
    }
    (req as Request & { api_key_name?: string }).api_key_name = match.name;
    next();
  };
}
