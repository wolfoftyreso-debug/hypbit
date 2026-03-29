import { Router, Request, Response, NextFunction } from 'express'
import { generateSecret, generate, verify as otpVerify, generateURI } from 'otplib'
import QRCode from 'qrcode'
import { db } from '../db/postgres'
import { requireAuth } from '../middleware/auth'
import { logAuthEvent } from '../services/authService'

export const mfaRouter = Router()

const ISSUER = 'Wavult OS'

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next)
}

async function checkTotp(code: string, secret: string): Promise<boolean> {
  try {
    const result = await otpVerify({ secret, token: code })
    return typeof result === 'object' ? result.valid : false
  } catch {
    return false
  }
}

// POST /v1/mfa/setup — generate TOTP secret, store as pending until verified
mfaRouter.post('/setup', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user?.sub
  const email = req.user?.email || userId!
  if (!userId) { res.status(401).json({ error: 'UNAUTHORIZED' }); return }

  const secret = generateSecret()
  const otpauth = generateURI({ label: email, issuer: ISSUER, secret })

  await db.query(
    'UPDATE ic_users SET mfa_secret_pending = $1, updated_at = NOW() WHERE id = $2',
    [secret, userId]
  )

  const qrDataUrl = await QRCode.toDataURL(otpauth)

  await logAuthEvent(userId, 'mfa.setup_initiated', req.ip || undefined, req.headers['user-agent'] || undefined, undefined, { issuer: ISSUER }, req.requestId)

  res.json({ secret, qr: qrDataUrl, otpauth })
}))

// POST /v1/mfa/verify — verify code and activate MFA
mfaRouter.post('/verify', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user?.sub
  const { code } = req.body as { code?: string }
  if (!userId) { res.status(401).json({ error: 'UNAUTHORIZED' }); return }
  if (!code) { res.status(400).json({ error: 'MISSING_CODE' }); return }

  const result = await db.query(
    'SELECT mfa_secret_pending FROM ic_users WHERE id = $1',
    [userId]
  )
  const secret = result.rows[0]?.mfa_secret_pending as string | null
  if (!secret) { res.status(400).json({ error: 'NO_PENDING_MFA_SETUP' }); return }

  const valid = await checkTotp(code, secret)
  if (!valid) {
    await logAuthEvent(userId, 'mfa.verify_failed', req.ip || undefined, req.headers['user-agent'] || undefined, undefined, {}, req.requestId)
    res.status(400).json({ error: 'INVALID_CODE' }); return
  }

  // Generate 8 cryptographic backup codes
  const { randomBytes } = await import('crypto')
  const backupCodes = Array.from({ length: 8 }, () =>
    randomBytes(5).toString('hex').toUpperCase()
  )

  await db.query(
    `UPDATE ic_users
     SET mfa_enabled = true,
         mfa_secret = mfa_secret_pending,
         mfa_secret_pending = NULL,
         mfa_backup_codes = $1,
         updated_at = NOW()
     WHERE id = $2`,
    [JSON.stringify(backupCodes), userId]
  )

  await logAuthEvent(userId, 'mfa.enabled', req.ip || undefined, req.headers['user-agent'] || undefined, undefined, {}, req.requestId)

  res.json({ activated: true, backup_codes: backupCodes })
}))

// POST /v1/mfa/challenge — validate TOTP during login (no auth token required)
mfaRouter.post('/challenge', asyncHandler(async (req, res) => {
  const { user_id, code } = req.body as { user_id?: string; code?: string }
  if (!user_id || !code) { res.status(400).json({ error: 'MISSING_PARAMS' }); return }

  const result = await db.query(
    `SELECT mfa_secret, mfa_backup_codes
     FROM ic_users WHERE id = $1 AND mfa_enabled = true AND is_active = true`,
    [user_id]
  )

  if (!result.rows[0]) { res.status(400).json({ error: 'MFA_NOT_ENABLED' }); return }

  const { mfa_secret, mfa_backup_codes } = result.rows[0] as {
    mfa_secret: string
    mfa_backup_codes: string | null
  }

  const totpValid = await checkTotp(code, mfa_secret)
  const backupCodes: string[] = JSON.parse(mfa_backup_codes || '[]')
  const backupIndex = backupCodes.indexOf(code.toUpperCase())
  const backupValid = backupIndex >= 0

  if (!totpValid && !backupValid) {
    await logAuthEvent(user_id, 'mfa.challenge_failed', req.ip || undefined, req.headers['user-agent'] || undefined, undefined, {}, req.requestId)
    res.status(401).json({ error: 'INVALID_MFA_CODE' }); return
  }

  // Consume backup code if used (one-time use)
  if (backupValid) {
    backupCodes.splice(backupIndex, 1)
    await db.query(
      'UPDATE ic_users SET mfa_backup_codes = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(backupCodes), user_id]
    )
  }

  await logAuthEvent(user_id, 'mfa.verified', req.ip || undefined, req.headers['user-agent'] || undefined, undefined, { method: totpValid ? 'totp' : 'backup' }, req.requestId)

  res.json({ verified: true, method: totpValid ? 'totp' : 'backup' })
}))

// POST /v1/mfa/disable — disable MFA, requires valid TOTP code
mfaRouter.post('/disable', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user?.sub
  const { code } = req.body as { code?: string }
  if (!userId) { res.status(401).json({ error: 'UNAUTHORIZED' }); return }

  const result = await db.query(
    'SELECT mfa_secret, mfa_enabled FROM ic_users WHERE id = $1',
    [userId]
  )
  const row = result.rows[0] as { mfa_secret: string | null; mfa_enabled: boolean } | undefined
  if (!row) { res.status(404).json({ error: 'USER_NOT_FOUND' }); return }

  if (row.mfa_enabled) {
    if (!code) { res.status(400).json({ error: 'MISSING_CODE' }); return }
    const codeValid = row.mfa_secret ? await checkTotp(code, row.mfa_secret) : false
    if (!codeValid) {
      await logAuthEvent(userId, 'mfa.disable_failed', req.ip || undefined, req.headers['user-agent'] || undefined, undefined, {}, req.requestId)
      res.status(401).json({ error: 'INVALID_CODE' }); return
    }
  }

  await db.query(
    `UPDATE ic_users
     SET mfa_enabled = false,
         mfa_secret = NULL,
         mfa_secret_pending = NULL,
         mfa_backup_codes = NULL,
         updated_at = NOW()
     WHERE id = $1`,
    [userId]
  )

  await logAuthEvent(userId, 'mfa.disabled', req.ip || undefined, req.headers['user-agent'] || undefined, undefined, {}, req.requestId)

  res.json({ disabled: true })
}))

// GET /v1/mfa/status — check if MFA is enabled for current user
mfaRouter.get('/status', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user?.sub
  if (!userId) { res.status(401).json({ error: 'UNAUTHORIZED' }); return }

  const result = await db.query(
    `SELECT mfa_enabled,
            CASE WHEN mfa_backup_codes IS NOT NULL
                 THEN json_array_length(mfa_backup_codes::json)
                 ELSE 0 END AS backup_codes_remaining
     FROM ic_users WHERE id = $1`,
    [userId]
  )
  const row = result.rows[0] as { mfa_enabled: boolean; backup_codes_remaining: number } | undefined
  if (!row) { res.status(404).json({ error: 'USER_NOT_FOUND' }); return }

  res.json({ mfa_enabled: row.mfa_enabled, backup_codes_remaining: row.backup_codes_remaining })
}))

// Error handler for MFA router
mfaRouter.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[MFA] Unhandled error:', err.message)
  res.status(500).json({ error: 'INTERNAL_ERROR' })
})
