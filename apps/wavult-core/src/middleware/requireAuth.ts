/**
 * requireAuth — JWT verification middleware for wavult-core
 *
 * Stateless verification: validates signature, expiry, issuer, audience.
 * Token revocation (token_version) is enforced by identity-core at issuance.
 * Access token TTL is 10 minutes — sufficient for stateless consumers.
 *
 * Production: RS256 via KMS public key (fetched once, cached in-process).
 * Development: HS256 with JWT_SECRET env var.
 */

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { KMSClient, GetPublicKeyCommand } from '@aws-sdk/client-kms'

const REGION = process.env.AWS_REGION || 'eu-north-1'
const KMS_KEY_ID = process.env.KMS_KEY_ID || ''
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'
const JWT_ISSUER = process.env.JWT_ISSUER || 'identity.wavult.com'
// Each service declares which audience it accepts — prevents token reuse across services
const SERVICE_AUDIENCE = process.env.SERVICE_AUDIENCE || 'wavult-os'
const USE_KMS = !!KMS_KEY_ID && process.env.NODE_ENV === 'production'

const kmsClient = new KMSClient({ region: REGION })

// Public key cache — fetched once per process lifetime
let cachedPublicKey: string | null = null

async function getPublicKey(): Promise<string> {
  if (cachedPublicKey) return cachedPublicKey
  const { PublicKey } = await kmsClient.send(new GetPublicKeyCommand({ KeyId: KMS_KEY_ID }))
  if (!PublicKey) throw new Error('KMS_PUBLIC_KEY_UNAVAILABLE')
  cachedPublicKey = `-----BEGIN PUBLIC KEY-----\n${Buffer.from(PublicKey).toString('base64').match(/.{1,64}/g)!.join('\n')}\n-----END PUBLIC KEY-----`
  return cachedPublicKey
}

export interface AuthUser {
  sub: string
  email: string
  org: string
  roles: string[]
  session_id: string
  tv: number
  se?: number
  iat: number
  exp: number
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

function rejectToken(res: Response, code: string, status = 401): void {
  res.status(status).json({ error: code })
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    rejectToken(res, 'MISSING_TOKEN')
    return
  }

  const token = auth.slice(7)

  if (USE_KMS) {
    // RS256: verify against KMS public key
    getPublicKey()
      .then((pubKey) => {
        try {
          const payload = jwt.verify(token, pubKey, {
            algorithms: ['RS256'],
            issuer: JWT_ISSUER,
            audience: SERVICE_AUDIENCE,
          }) as AuthUser

          const now = Math.floor(Date.now() / 1000)
          if (payload.exp < now) { rejectToken(res, 'TOKEN_EXPIRED'); return }

          req.user = payload
          next()
        } catch (err) {
          const name = err instanceof Error ? err.name : ''
          if (name === 'TokenExpiredError') { rejectToken(res, 'TOKEN_EXPIRED'); return }
          if (name === 'JsonWebTokenError') { rejectToken(res, 'INVALID_TOKEN'); return }
          rejectToken(res, 'INVALID_TOKEN')
        }
      })
      .catch(() => {
        // KMS unreachable — fail closed
        res.status(503).json({ error: 'AUTH_UNAVAILABLE' })
      })
    return
  }

  // Dev: HS256
  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: JWT_ISSUER,
      audience: SERVICE_AUDIENCE,
    }) as AuthUser

    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) { rejectToken(res, 'TOKEN_EXPIRED'); return }

    req.user = payload
    next()
  } catch (err) {
    const name = err instanceof Error ? err.name : ''
    if (name === 'TokenExpiredError') { rejectToken(res, 'TOKEN_EXPIRED'); return }
    rejectToken(res, 'INVALID_TOKEN')
  }
}

/** Role guard — must be used after requireAuth */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) { res.status(401).json({ error: 'UNAUTHORIZED' }); return }
    if (!roles.some(r => req.user!.roles.includes(r))) {
      res.status(403).json({ error: 'FORBIDDEN' }); return
    }
    next()
  }
}
