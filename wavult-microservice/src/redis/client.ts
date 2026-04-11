import Redis from 'ioredis';
import { config } from '../config';
import { logger } from '../logger';
import { cacheOperations } from '../metrics';

export const redis = new Redis(config.REDIS_URL, {
  keyPrefix: config.REDIS_KEY_PREFIX,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
  connectTimeout: 5_000,
  retryStrategy: (times) => Math.min(times * 200, 2_000),
});

redis.on('connect', () => logger.info('Redis connecting'));
redis.on('ready', () => logger.info('Redis ready'));
redis.on('error', (err) => logger.error({ err }, 'Redis error'));
redis.on('close', () => logger.warn('Redis connection closed'));

export async function getJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await redis.get(key);
    if (!raw) {
      cacheOperations.inc({ operation: 'get', result: 'miss' });
      return null;
    }
    cacheOperations.inc({ operation: 'get', result: 'hit' });
    return JSON.parse(raw) as T;
  } catch (err) {
    cacheOperations.inc({ operation: 'get', result: 'error' });
    logger.error({ err, key }, 'Redis getJson failed');
    return null;
  }
}

export async function setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
  try {
    const payload = JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await redis.set(key, payload, 'EX', ttlSeconds);
    } else {
      await redis.set(key, payload);
    }
    cacheOperations.inc({ operation: 'set', result: 'ok' });
  } catch (err) {
    cacheOperations.inc({ operation: 'set', result: 'error' });
    logger.error({ err, key }, 'Redis setJson failed');
  }
}

export async function pingRedis(): Promise<boolean> {
  try {
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}

export async function closeRedis(): Promise<void> {
  await redis.quit();
  logger.info('Redis disconnected');
}
