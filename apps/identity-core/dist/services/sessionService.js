"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveSession = getActiveSession;
exports.terminateSession = terminateSession;
exports.terminateAllSessions = terminateAllSessions;
const dynamo_1 = require("../db/dynamo");
async function getActiveSession(sessionId) {
    const session = await (0, dynamo_1.getSession)(sessionId);
    if (!session)
        return null;
    switch (session.state) {
        case 'active':
            break;
        case 'rotated':
        case 'revoked':
        case 'expired':
            return null;
        default:
            // INVARIANT: unknown state must never silently pass
            throw new Error('UNKNOWN_SESSION_STATE: ' + session.state);
    }
    if (new Date(session.expires_at) < new Date())
        return null;
    return session;
}
async function terminateSession(sessionId) {
    await (0, dynamo_1.revokeSession)(sessionId); // Idempotent
}
async function terminateAllSessions(userId) {
    await (0, dynamo_1.revokeAllUserSessions)(userId);
}
