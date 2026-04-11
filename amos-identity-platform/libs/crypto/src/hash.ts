import { createHash, createHmac } from 'crypto';

export function sha256(input: string | Buffer): string {
  return createHash('sha256').update(input).digest('hex');
}

export function hmacSha256(secret: string | Buffer, message: string | Buffer): string {
  return createHmac('sha256', secret).update(message).digest('hex');
}

/**
 * Hash-chain a new entry onto a previous digest.
 * Used by audit-service for tamper-evident logs.
 */
export function chainHash(previousDigest: string, payload: unknown): string {
  return sha256(`${previousDigest}|${JSON.stringify(payload)}`);
}
