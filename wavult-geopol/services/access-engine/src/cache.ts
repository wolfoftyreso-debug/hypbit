import Redis from "ioredis";
import { config } from "./config.js";
import { AccessScoreSchema, type AccessScore } from "./shared/schemas.js";

const KEY_PREFIX = "access:score:";
const INDEX_KEY = "access:index";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(config.REDIS_URL, { lazyConnect: false, maxRetriesPerRequest: 3 });
  }
  return redis;
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

export async function pingRedis(): Promise<boolean> {
  try {
    return (await getRedis().ping()) === "PONG";
  } catch {
    return false;
  }
}

export async function putScore(score: AccessScore): Promise<void> {
  const key = KEY_PREFIX + score.target_person_id;
  await getRedis()
    .multi()
    .set(key, JSON.stringify(score), "EX", config.ACCESS_CACHE_TTL_SECONDS)
    .zadd(INDEX_KEY, score.probability, score.target_person_id)
    .exec();
}

export async function getScore(personId: string): Promise<AccessScore | null> {
  const raw = await getRedis().get(KEY_PREFIX + personId);
  if (!raw) return null;
  try {
    return AccessScoreSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function topByAccess(limit = 20): Promise<AccessScore[]> {
  const ids = await getRedis().zrevrange(INDEX_KEY, 0, limit - 1);
  if (ids.length === 0) return [];
  const vals = await getRedis().mget(ids.map((id) => KEY_PREFIX + id));
  const out: AccessScore[] = [];
  for (const v of vals) {
    if (!v) continue;
    try {
      out.push(AccessScoreSchema.parse(JSON.parse(v)));
    } catch {
      /* skip */
    }
  }
  return out;
}
