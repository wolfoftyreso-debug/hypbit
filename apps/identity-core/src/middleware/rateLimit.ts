import rateLimit from 'express-rate-limit'
import { config } from '../config'

// Layer 1: Per-IP limiter (20 req/min) — broad abuse prevention
export const ipLoginLimiter = rateLimit({
  windowMs: config.rateLimit.ipWindowMs,
  max: config.rateLimit.ipMaxAttempts,
  message: { error: 'RATE_LIMIT_EXCEEDED' },
  keyGenerator: (req) => req.ip || 'unknown',
  standardHeaders: true,
  legacyHeaders: false,
})

// Layer 2: Per-email limiter (5 req/15min) — credential stuffing prevention
export const emailLoginLimiter = rateLimit({
  windowMs: config.rateLimit.loginWindowMs,
  max: config.rateLimit.loginMaxAttempts,
  message: { error: 'TOO_MANY_ATTEMPTS', retryAfter: 900 },
  keyGenerator: (req) => (req.body as { email?: string })?.email?.toLowerCase() || req.ip || 'unknown',
  standardHeaders: true,
  legacyHeaders: false,
})

// Backwards-compat alias (used in existing route)
export const loginLimiter = emailLoginLimiter

export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.apiWindowMs,
  max: config.rateLimit.apiMaxRequests,
  message: { error: 'RATE_LIMIT_EXCEEDED' },
  standardHeaders: true,
  legacyHeaders: false,
})
