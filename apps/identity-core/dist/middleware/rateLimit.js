"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiLimiter = exports.loginLimiter = exports.emailLoginLimiter = exports.ipLoginLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = require("../config");
// Layer 1: Per-IP limiter (20 req/min) — broad abuse prevention
exports.ipLoginLimiter = (0, express_rate_limit_1.default)({
    windowMs: config_1.config.rateLimit.ipWindowMs,
    max: config_1.config.rateLimit.ipMaxAttempts,
    message: { error: 'RATE_LIMIT_EXCEEDED' },
    keyGenerator: (req) => req.ip || 'unknown',
    standardHeaders: true,
    legacyHeaders: false,
});
// Layer 2: Per-email limiter (5 req/15min) — credential stuffing prevention
exports.emailLoginLimiter = (0, express_rate_limit_1.default)({
    windowMs: config_1.config.rateLimit.loginWindowMs,
    max: config_1.config.rateLimit.loginMaxAttempts,
    message: { error: 'TOO_MANY_ATTEMPTS', retryAfter: 900 },
    keyGenerator: (req) => req.body?.email?.toLowerCase() || req.ip || 'unknown',
    standardHeaders: true,
    legacyHeaders: false,
});
// Backwards-compat alias (used in existing route)
exports.loginLimiter = exports.emailLoginLimiter;
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: config_1.config.rateLimit.apiWindowMs,
    max: config_1.config.rateLimit.apiMaxRequests,
    message: { error: 'RATE_LIMIT_EXCEEDED' },
    standardHeaders: true,
    legacyHeaders: false,
});
