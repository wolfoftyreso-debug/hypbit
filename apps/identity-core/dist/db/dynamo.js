"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSession = createSession;
exports.getSession = getSession;
exports.revokeSession = revokeSession;
exports.rotateSession = rotateSession;
exports.revokeAllUserSessions = revokeAllUserSessions;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const config_1 = require("../config");
const uuid_1 = require("uuid");
const ddb = lib_dynamodb_1.DynamoDBDocumentClient.from(config_1.dynamoClient);
// NOTE: A GSI on user_id is required for revokeAllUserSessions().
// Create it manually:
//   aws dynamodb update-table --table-name ic-sessions \
//     --attribute-definitions AttributeName=user_id,AttributeType=S \
//     --global-secondary-indexes \
//       "[{\"IndexName\":\"user_id-index\",\"KeySchema\":[{\"AttributeName\":\"user_id\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]"
async function createSession(session) {
    const expiresAtTtl = Math.floor(new Date(session.expires_at).getTime() / 1000);
    const item = {
        ...session,
        session_id: (0, uuid_1.v4)(),
        created_at: new Date().toISOString(),
        refresh_count: 0,
        state: 'active',
        anomaly_flags: [],
        expires_at_ttl: expiresAtTtl,
    };
    try {
        await ddb.send(new lib_dynamodb_1.PutCommand({
            TableName: config_1.config.dynamo.sessionsTable,
            Item: item,
            ConditionExpression: 'attribute_not_exists(session_id)',
        }));
    }
    catch (err) {
        console.error('[DynamoDB] createSession failed', { sessionId: item.session_id });
        throw new Error('SESSION_CREATE_FAILED');
    }
    return item;
}
async function getSession(sessionId) {
    let result;
    try {
        result = await ddb.send(new lib_dynamodb_1.GetCommand({
            TableName: config_1.config.dynamo.sessionsTable,
            Key: { session_id: sessionId },
            ConsistentRead: true, // Strong consistent reads — NEVER eventual for auth decisions
        }));
    }
    catch (err) {
        console.error('[DynamoDB] getSession failed', { sessionId });
        throw new Error('SESSION_LOOKUP_FAILED'); // Fail closed — never fail open
    }
    return result.Item || null;
}
async function revokeSession(sessionId) {
    // Idempotent: succeeds even if already revoked
    try {
        await ddb.send(new lib_dynamodb_1.UpdateCommand({
            TableName: config_1.config.dynamo.sessionsTable,
            Key: { session_id: sessionId },
            UpdateExpression: 'SET #s = :revoked, revoked_at = :now',
            ExpressionAttributeNames: { '#s': 'state' },
            ExpressionAttributeValues: {
                ':revoked': 'revoked',
                ':now': new Date().toISOString(),
            },
            // No condition — idempotent regardless of current state
        }));
    }
    catch (err) {
        console.error('[DynamoDB] revokeSession failed', { sessionId });
        throw new Error('SESSION_REVOKE_FAILED');
    }
}
/**
 * Atomically rotate a session:
 * 1. Marks old session as 'rotated' (ConditionExpression: state = 'active')
 * 2. Creates new session in same TransactWrite
 * If condition fails → SESSION_RACE_LOST (another process got there first → deny, NEVER retry)
 */
async function rotateSession(oldSessionId, newSession, newRefreshCount) {
    const expiresAtTtl = Math.floor(new Date(newSession.expires_at).getTime() / 1000);
    const newItem = {
        ...newSession,
        session_id: (0, uuid_1.v4)(),
        created_at: new Date().toISOString(),
        refresh_count: newRefreshCount,
        state: 'active',
        anomaly_flags: [],
        expires_at_ttl: expiresAtTtl,
    };
    try {
        await ddb.send(new lib_dynamodb_1.TransactWriteCommand({
            TransactItems: [
                {
                    Update: {
                        TableName: config_1.config.dynamo.sessionsTable,
                        Key: { session_id: oldSessionId },
                        UpdateExpression: 'SET #s = :rotated, revoked_at = :now',
                        ConditionExpression: '#s = :active',
                        ExpressionAttributeNames: { '#s': 'state' },
                        ExpressionAttributeValues: {
                            ':rotated': 'rotated',
                            ':active': 'active',
                            ':now': new Date().toISOString(),
                        },
                    },
                },
                {
                    Put: {
                        TableName: config_1.config.dynamo.sessionsTable,
                        Item: newItem,
                        ConditionExpression: 'attribute_not_exists(session_id)',
                    },
                },
            ],
        }));
    }
    catch (err) {
        const name = err.name;
        if (name === 'TransactionCanceledException') {
            throw new Error('SESSION_RACE_LOST');
        }
        console.error('[DynamoDB] rotateSession transaction failed', { oldSessionId });
        throw new Error('ROTATION_TRANSACTION_FAILED');
    }
    return newItem;
}
async function revokeAllUserSessions(userId) {
    // SECURITY CRITICAL: Session fixation prevention. Must revoke all existing sessions at login.
    // Requires DynamoDB GSI on user_id. Create with:
    //   aws dynamodb update-table --table-name ic-sessions \
    //     --attribute-definitions AttributeName=user_id,AttributeType=S \
    //     --global-secondary-indexes '[{"IndexName":"user_id-index","KeySchema":[{"AttributeName":"user_id","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}}]' \
    //     --billing-mode PAY_PER_REQUEST
    try {
        const { QueryCommand, BatchWriteCommand } = await Promise.resolve().then(() => __importStar(require('@aws-sdk/lib-dynamodb')));
        // Query all active sessions for this user via GSI
        const queryResult = await ddb.send(new QueryCommand({
            TableName: config_1.config.dynamo.sessionsTable,
            IndexName: 'user_id-index',
            KeyConditionExpression: 'user_id = :uid',
            FilterExpression: '#s = :active',
            ExpressionAttributeNames: { '#s': 'state' },
            ExpressionAttributeValues: { ':uid': userId, ':active': 'active' },
        }));
        const activeSessions = queryResult.Items || [];
        if (activeSessions.length === 0)
            return;
        console.log(`[Session] Revoking ${activeSessions.length} sessions for user ${userId}`);
        // Batch revoke (DynamoDB batch max 25 per request)
        const now = new Date().toISOString();
        const chunks = [];
        for (let i = 0; i < activeSessions.length; i += 25) {
            chunks.push(activeSessions.slice(i, i + 25));
        }
        for (const chunk of chunks) {
            await Promise.all(chunk.map(session => ddb.send(new lib_dynamodb_1.UpdateCommand({
                TableName: config_1.config.dynamo.sessionsTable,
                Key: { session_id: session.session_id },
                UpdateExpression: 'SET #s = :revoked, revoked_at = :now',
                ExpressionAttributeNames: { '#s': 'state' },
                ConditionExpression: '#s = :active',
                ExpressionAttributeValues: { ':revoked': 'revoked', ':now': now, ':active': 'active' },
            }))));
        }
    }
    catch (err) {
        // If GSI not provisioned yet: log critical warning but don't crash login
        // This is acceptable ONLY before Identity Core goes live
        console.error('[Session] CRITICAL: revokeAllUserSessions failed — GSI may not be provisioned', { userId, err });
        // In production with AUTH_MODE=identity-core-only: this MUST succeed. Re-throw then.
        if (process.env.AUTH_MODE === 'identity-core-only') {
            throw new Error('SESSION_REVOCATION_FAILED: Cannot proceed without session fixation protection');
        }
    }
}
