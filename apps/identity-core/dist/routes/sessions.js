"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionsRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const sessionService_1 = require("../services/sessionService");
exports.sessionsRouter = (0, express_1.Router)();
function asyncHandler(fn) {
    return (req, res, next) => fn(req, res, next).catch(next);
}
// GET /v1/sessions/:sessionId — get session info
exports.sessionsRouter.get('/:sessionId', auth_1.requireAuth, asyncHandler(async (req, res) => {
    const session = await (0, sessionService_1.getActiveSession)(req.params.sessionId);
    if (!session) {
        res.status(404).json({ error: 'SESSION_NOT_FOUND' });
        return;
    }
    // Only allow users to view their own sessions
    if (session.user_id !== req.user.sub) {
        res.status(403).json({ error: 'FORBIDDEN' });
        return;
    }
    res.json({ data: session });
}));
// DELETE /v1/sessions/:sessionId — revoke a session
exports.sessionsRouter.delete('/:sessionId', auth_1.requireAuth, asyncHandler(async (req, res) => {
    const session = await (0, sessionService_1.getActiveSession)(req.params.sessionId);
    if (!session) {
        res.status(404).json({ error: 'SESSION_NOT_FOUND' });
        return;
    }
    if (session.user_id !== req.user.sub) {
        res.status(403).json({ error: 'FORBIDDEN' });
        return;
    }
    await (0, sessionService_1.terminateSession)(req.params.sessionId);
    res.json({ data: { success: true } });
}));
// DELETE /v1/sessions — revoke all sessions for current user
exports.sessionsRouter.delete('/', auth_1.requireAuth, asyncHandler(async (req, res) => {
    await (0, sessionService_1.terminateAllSessions)(req.user.sub);
    res.json({ data: { success: true } });
}));
