// Idempotency helpers — key format `idem:{event_id}` with 1-hour TTL.

import type Redis from 'ioredis';

const TTL_SECONDS = 3600;

export async function isProcessed(
  redis: Redis,
  key: string,
): Promise<boolean> {
  const val = await redis.get(`idem:${key}`);
  return val !== null;
}

export async function markProcessed(
  redis: Redis,
  key: string,
): Promise<void> {
  await redis.set(`idem:${key}`, '1', 'EX', TTL_SECONDS);
}

/** Atomically marks an event as processed. Returns true if this is the
 *  first time the key is seen, false if it was already processed. */
export async function claimOnce(
  redis: Redis,
  key: string,
): Promise<boolean> {
  const result = await redis.set(`idem:${key}`, '1', 'EX', TTL_SECONDS, 'NX');
  return result === 'OK';
}
