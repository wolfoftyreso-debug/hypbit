"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeEmail = normalizeEmail;
/**
 * Canonical email normalization.
 * Apply at ALL entry points: login, registration, magic link, password reset, API calls.
 * Never use raw email — always normalize first.
 */
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
