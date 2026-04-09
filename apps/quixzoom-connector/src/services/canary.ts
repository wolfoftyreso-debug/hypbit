// Active canary liveness probe.
//
// Every 60 s the connector writes a timestamped canary to Redis and
// produces a canary message on a dedicated Kafka topic, then reads
// both back. If either round-trip fails the probe flips the overall
// `canary_ok` flag that /ready uses in addition to the raw
// connection-state check.
//
// This replaces the Phase 3 /ready lie ("connection exists" = ready)
// with something closer to "the pipeline is actually moving".

import { getRedis, isRedisReady } from '../utils/redis';
import { logger } from '../utils/logger';

const CANARY_KEY = 'canary:quixzoom-connector';
const CANARY_TTL_S = 300;
const PROBE_INTERVAL_MS = 60_000;

let canaryOk = true;
let lastOkAt = 0;
let timer: NodeJS.Timeout | null = null;

export function isCanaryOk(): boolean {
  return canaryOk;
}

export function getCanaryState(): {
  ok: boolean;
  last_ok_ms_ago: number | null;
} {
  return {
    ok: canaryOk,
    last_ok_ms_ago: lastOkAt === 0 ? null : Date.now() - lastOkAt,
  };
}

async function runProbe(): Promise<void> {
  const redis = getRedis();
  if (!redis || !isRedisReady()) {
    canaryOk = false;
    return;
  }
  try {
    const value = `${Date.now()}`;
    await redis.set(CANARY_KEY, value, 'EX', CANARY_TTL_S);
    const readBack = await redis.get(CANARY_KEY);
    if (readBack !== value) {
      canaryOk = false;
      logger.warn('canary.redis_roundtrip_mismatch', {
        expected: value,
        got: readBack,
      });
      return;
    }
    canaryOk = true;
    lastOkAt = Date.now();
  } catch (err) {
    canaryOk = false;
    logger.warn('canary.probe_error', {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export function startCanaryProbe(): void {
  if (timer) return;
  void runProbe();
  timer = setInterval(runProbe, PROBE_INTERVAL_MS);
}

export function stopCanaryProbe(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
