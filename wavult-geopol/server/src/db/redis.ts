import Redis from "ioredis";
import { config } from "../config.js";

let client: Redis | null = null;

export function getRedis(): Redis {
  if (!client) {
    client = new Redis(config.REDIS_URL, {
      lazyConnect: false,
      maxRetriesPerRequest: 3,
    });
  }
  return client;
}

export async function pingRedis(): Promise<boolean> {
  try {
    const res = await getRedis().ping();
    return res === "PONG";
  } catch {
    return false;
  }
}

export async function closeRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}
