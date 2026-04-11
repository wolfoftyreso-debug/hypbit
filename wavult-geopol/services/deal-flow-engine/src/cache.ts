import Redis from "ioredis";
import { config } from "./config.js";
import { DealOpportunitySchema, type DealOpportunity } from "./shared/schemas.js";

const ALL_KEY = "deals:recent";
const PERSON_KEY = (id: string) => `deals:person:${id}`;

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(config.REDIS_URL, { lazyConnect: false, maxRetriesPerRequest: 3 });
  }
  return redis;
}

export async function pingRedis(): Promise<boolean> {
  try {
    return (await getRedis().ping()) === "PONG";
  } catch {
    return false;
  }
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

export async function push(deal: DealOpportunity): Promise<void> {
  const payload = JSON.stringify(deal);
  await getRedis()
    .multi()
    .lpush(ALL_KEY, payload)
    .ltrim(ALL_KEY, 0, config.DEAL_CACHE_LIMIT - 1)
    .lpush(PERSON_KEY(deal.person_id), payload)
    .ltrim(PERSON_KEY(deal.person_id), 0, 49)
    .exec();
}

function parse(raw: string[]): DealOpportunity[] {
  const out: DealOpportunity[] = [];
  for (const s of raw) {
    try {
      out.push(DealOpportunitySchema.parse(JSON.parse(s)));
    } catch {
      /* skip malformed */
    }
  }
  return out;
}

export async function recent(limit = 50): Promise<DealOpportunity[]> {
  const raw = await getRedis().lrange(ALL_KEY, 0, limit - 1);
  return parse(raw);
}

export async function forPerson(personId: string, limit = 20): Promise<DealOpportunity[]> {
  const raw = await getRedis().lrange(PERSON_KEY(personId), 0, limit - 1);
  return parse(raw);
}
