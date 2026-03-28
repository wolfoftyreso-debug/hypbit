import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb'
import { dynamoClient, config } from '../config'
import { v4 as uuid } from 'uuid'

const ddb = DynamoDBDocumentClient.from(dynamoClient)

// Session lifecycle states — never add a fallback to unknown states
export type SessionState = 'active' | 'rotated' | 'revoked' | 'expired'

export interface Session {
  session_id: string
  user_id: string
  refresh_token_hash: string
  parent_token_hash?: string  // Chain tracking for replay detection
  refresh_count: number
  state: SessionState
  device_fingerprint?: string
  ip_address?: string
  user_agent?: string
  anomaly_flags: string[]
  created_at: string
  expires_at: string          // ISO string for app logic
  expires_at_ttl: number      // Unix epoch for DynamoDB TTL attribute
  revoked_at?: string
}

// NOTE: A GSI on user_id is required for revokeAllUserSessions().
// Create it manually:
//   aws dynamodb update-table --table-name ic-sessions \
//     --attribute-definitions AttributeName=user_id,AttributeType=S \
//     --global-secondary-indexes \
//       "[{\"IndexName\":\"user_id-index\",\"KeySchema\":[{\"AttributeName\":\"user_id\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]"

export async function createSession(
  session: Omit<Session, 'session_id' | 'created_at' | 'refresh_count' | 'state' | 'anomaly_flags' | 'expires_at_ttl'>
): Promise<Session> {
  const expiresAtTtl = Math.floor(new Date(session.expires_at).getTime() / 1000)
  const item: Session = {
    ...session,
    session_id: uuid(),
    created_at: new Date().toISOString(),
    refresh_count: 0,
    state: 'active',
    anomaly_flags: [],
    expires_at_ttl: expiresAtTtl,
  }

  try {
    await ddb.send(new PutCommand({
      TableName: config.dynamo.sessionsTable,
      Item: item,
      ConditionExpression: 'attribute_not_exists(session_id)',
    }))
  } catch (err) {
    console.error('[DynamoDB] createSession failed', { sessionId: item.session_id })
    throw new Error('SESSION_CREATE_FAILED')
  }

  return item
}

export async function getSession(sessionId: string): Promise<Session | null> {
  let result
  try {
    result = await ddb.send(new GetCommand({
      TableName: config.dynamo.sessionsTable,
      Key: { session_id: sessionId },
      ConsistentRead: true,  // Strong consistent reads — NEVER eventual for auth decisions
    }))
  } catch (err) {
    console.error('[DynamoDB] getSession failed', { sessionId })
    throw new Error('SESSION_LOOKUP_FAILED')  // Fail closed — never fail open
  }
  return (result.Item as Session) || null
}

export async function revokeSession(sessionId: string): Promise<void> {
  // Idempotent: succeeds even if already revoked
  try {
    await ddb.send(new UpdateCommand({
      TableName: config.dynamo.sessionsTable,
      Key: { session_id: sessionId },
      UpdateExpression: 'SET #s = :revoked, revoked_at = :now',
      ExpressionAttributeNames: { '#s': 'state' },
      ExpressionAttributeValues: {
        ':revoked': 'revoked',
        ':now': new Date().toISOString(),
      },
      // No condition — idempotent regardless of current state
    }))
  } catch (err) {
    console.error('[DynamoDB] revokeSession failed', { sessionId })
    throw new Error('SESSION_REVOKE_FAILED')
  }
}

/**
 * Atomically rotate a session:
 * 1. Marks old session as 'rotated' (ConditionExpression: state = 'active')
 * 2. Creates new session in same TransactWrite
 * If condition fails → SESSION_RACE_LOST (another process got there first → deny, NEVER retry)
 */
export async function rotateSession(
  oldSessionId: string,
  newSession: Omit<Session, 'session_id' | 'created_at' | 'refresh_count' | 'state' | 'anomaly_flags' | 'expires_at_ttl'>,
  newRefreshCount: number
): Promise<Session> {
  const expiresAtTtl = Math.floor(new Date(newSession.expires_at).getTime() / 1000)
  const newItem: Session = {
    ...newSession,
    session_id: uuid(),
    created_at: new Date().toISOString(),
    refresh_count: newRefreshCount,
    state: 'active',
    anomaly_flags: [],
    expires_at_ttl: expiresAtTtl,
  }

  try {
    await ddb.send(new TransactWriteCommand({
      TransactItems: [
        {
          Update: {
            TableName: config.dynamo.sessionsTable,
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
            TableName: config.dynamo.sessionsTable,
            Item: newItem,
            ConditionExpression: 'attribute_not_exists(session_id)',
          },
        },
      ],
    }))
  } catch (err: unknown) {
    const name = (err as { name?: string }).name
    if (name === 'TransactionCanceledException') {
      throw new Error('SESSION_RACE_LOST')
    }
    console.error('[DynamoDB] rotateSession transaction failed', { oldSessionId })
    throw new Error('ROTATION_TRANSACTION_FAILED')
  }

  return newItem
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  // SECURITY CRITICAL: Session fixation prevention. Must revoke all existing sessions at login.
  // Requires DynamoDB GSI on user_id. Create with:
  //   aws dynamodb update-table --table-name ic-sessions \
  //     --attribute-definitions AttributeName=user_id,AttributeType=S \
  //     --global-secondary-indexes '[{"IndexName":"user_id-index","KeySchema":[{"AttributeName":"user_id","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}}]' \
  //     --billing-mode PAY_PER_REQUEST
  
  try {
    const { QueryCommand, BatchWriteCommand } = await import('@aws-sdk/lib-dynamodb')
    
    // Query all active sessions for this user via GSI
    const queryResult = await ddb.send(new QueryCommand({
      TableName: config.dynamo.sessionsTable,
      IndexName: 'user_id-index',
      KeyConditionExpression: 'user_id = :uid',
      FilterExpression: '#s = :active',
      ExpressionAttributeNames: { '#s': 'state' },
      ExpressionAttributeValues: { ':uid': userId, ':active': 'active' },
    }))
    
    const activeSessions = queryResult.Items || []
    
    if (activeSessions.length === 0) return
    
    console.log(`[Session] Revoking ${activeSessions.length} sessions for user ${userId}`)
    
    // Batch revoke (DynamoDB batch max 25 per request)
    const now = new Date().toISOString()
    const chunks: typeof activeSessions[] = []
    for (let i = 0; i < activeSessions.length; i += 25) {
      chunks.push(activeSessions.slice(i, i + 25))
    }
    
    for (const chunk of chunks) {
      await Promise.all(chunk.map(session =>
        ddb.send(new UpdateCommand({
          TableName: config.dynamo.sessionsTable,
          Key: { session_id: session.session_id },
          UpdateExpression: 'SET #s = :revoked, revoked_at = :now',
          ExpressionAttributeNames: { '#s': 'state' },
          ConditionExpression: '#s = :active',
          ExpressionAttributeValues: { ':revoked': 'revoked', ':now': now, ':active': 'active' },
        }))
      ))
    }
    
  } catch (err) {
    // If GSI not provisioned yet: log critical warning but don't crash login
    // This is acceptable ONLY before Identity Core goes live
    console.error('[Session] CRITICAL: revokeAllUserSessions failed — GSI may not be provisioned', { userId, err })
    // In production with AUTH_MODE=identity-core-only: this MUST succeed. Re-throw then.
    if (process.env.AUTH_MODE === 'identity-core-only') {
      throw new Error('SESSION_REVOCATION_FAILED: Cannot proceed without session fixation protection')
    }
  }
}
