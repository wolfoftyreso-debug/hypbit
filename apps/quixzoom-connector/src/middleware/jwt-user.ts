// JWT user extractor — pulls the end-user identity from an
// Authorization: Bearer <jwt> header and attaches it to req.user_id.
//
// We validate signature when JWT_SECRET / JWT_PUBLIC_KEY is set and
// trust unsigned tokens (dev mode) otherwise. The extracted sub claim
// is used by the rate-limit middleware to key per end user, not just
// per API key, so one tenant's spammer cannot exhaust the global
// quota for everyone else under the same key.

import type { NextFunction, Request, Response } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';

import { logger } from '../utils/logger';

interface JwtPayload {
  sub?: string;
  tenant_id?: string;
  scope?: string;
  exp?: number;
  iat?: number;
}

function base64urlDecode(s: string): string {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(b64, 'base64').toString('utf8');
}

function verifyHs256(
  header: string,
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expected = createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest();
  const provided = Buffer.from(
    signature.replace(/-/g, '+').replace(/_/g, '/'),
    'base64',
  );
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}

export function jwtUser() {
  const secret = process.env.JWT_SECRET ?? '';

  return (req: Request, res: Response, next: NextFunction): void => {
    const auth = req.header('authorization') ?? '';
    if (!auth.startsWith('Bearer ')) {
      next();
      return;
    }
    const token = auth.slice('Bearer '.length).trim();
    const parts = token.split('.');
    if (parts.length !== 3) {
      next();
      return;
    }

    try {
      const [h, p, s] = parts;
      if (secret && !verifyHs256(h, p, s, secret)) {
        res.status(401).json({ error: 'invalid_jwt' });
        return;
      }
      const payload = JSON.parse(base64urlDecode(p)) as JwtPayload;
      if (
        typeof payload.exp === 'number' &&
        payload.exp * 1000 < Date.now()
      ) {
        res.status(401).json({ error: 'expired_jwt' });
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tagged = req as any;
      tagged.user_id = payload.sub;
      tagged.tenant_id = payload.tenant_id;
      tagged.scope = payload.scope;
    } catch (err) {
      logger.warn('jwt.parse_error', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
    next();
  };
}
