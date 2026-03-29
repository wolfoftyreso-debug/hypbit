"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLog = auditLog;
const authService_1 = require("../services/authService");
/**
 * Audit middleware — logs all authenticated requests.
 * Attach after requireAuth() on sensitive routes.
 */
function auditLog(eventType) {
    return async (req, _res, next) => {
        if (req.user) {
            await (0, authService_1.logAuthEvent)(req.user.sub, eventType, req.ip || undefined, req.headers['user-agent'] || undefined, req.user.session_id, { method: req.method, path: req.path }).catch((err) => console.error('[Audit] Failed to log event:', err));
        }
        next();
    };
}
