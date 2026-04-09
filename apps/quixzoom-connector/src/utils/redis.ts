// Redis client wrapper. Provides two connections: one for commands, one
// for Pub/Sub subscribes (ioredis requires a dedicated subscriber socket).

import Redis, { type RedisOptions } from 'ioredis';

import { config } from './config';
import { logger } from './logger';

let commandClient: Redis | null = null;
let subscriberClient: Redis | null = null;
let ready = false;

function baseOptions(): RedisOptions {
  return {
    lazyConnect: true,
    enableReadyCheck: true,
    maxRetriesPerRequest: 2,
    connectTimeout: 5000,
  };
}

export async function initRedis(): Promise<void> {
  if (commandClient) return;
  try {
    commandClient = new Redis(config.redisUrl, baseOptions());
    subscriberClient = new Redis(config.redisUrl, baseOptions());
    await commandClient.connect();
    await subscriberClient.connect();
    ready = true;
    logger.info('redis.connected', { url: sanitize(config.redisUrl) });
  } catch (err) {
    ready = false;
    logger.error('redis.connect_failed', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  commandClient?.on('error', (err) => {
    ready = false;
    logger.error('redis.error', { error: err.message });
  });
  commandClient?.on('ready', () => {
    ready = true;
    logger.info('redis.ready', {});
  });
}

export function getRedis(): Redis | null {
  return commandClient;
}

export function getSubscriber(): Redis | null {
  return subscriberClient;
}

export function isRedisReady(): boolean {
  return ready && commandClient !== null;
}

export async function shutdownRedis(): Promise<void> {
  await commandClient?.quit().catch(() => undefined);
  await subscriberClient?.quit().catch(() => undefined);
  commandClient = null;
  subscriberClient = null;
  ready = false;
}

function sanitize(url: string): string {
  return url.replace(/\/\/[^@]+@/, '//***@');
}
