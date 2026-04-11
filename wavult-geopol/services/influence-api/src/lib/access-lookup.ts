import { getRedis } from "../db/redis.js";

/**
 * Access scores are persisted by the access-engine under
 * `access:score:<personId>`. Both services share the same Redis
 * instance, so influence-api can read them directly for the map
 * overlay without a cross-service round trip. The schema is the
 * canonical AccessScore from packages/events.
 */
const KEY = (id: string) => `access:score:${id}`;

export type AccessLite = {
  probability: number;
  band: "HIGH" | "MEDIUM" | "LOW";
  best_next_hop?: string;
};

export async function getAccessMap(
  personIds: readonly string[]
): Promise<Map<string, AccessLite>> {
  const out = new Map<string, AccessLite>();
  if (personIds.length === 0) return out;

  const keys = personIds.map(KEY);
  const values = await getRedis().mget(keys);

  for (let i = 0; i < personIds.length; i++) {
    const raw = values[i];
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as {
        probability?: number;
        band?: string;
        best_next_hop?: string;
      };
      if (
        typeof parsed.probability !== "number" ||
        (parsed.band !== "HIGH" && parsed.band !== "MEDIUM" && parsed.band !== "LOW")
      ) {
        continue;
      }
      out.set(personIds[i], {
        probability: parsed.probability,
        band: parsed.band,
        best_next_hop: parsed.best_next_hop,
      });
    } catch {
      /* skip corrupt entries */
    }
  }

  return out;
}
