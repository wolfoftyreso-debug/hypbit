import { config } from "./config.js";
import { getDriver } from "./db/neo4j.js";

/**
 * Exponential decay of CONNECTED.strength over time.
 *
 * Strength models "how alive" a relationship is. Without reinforcement
 * (new interactions, new co-mentions, new warm signals), a link should
 * fade — someone you met once three years ago is *not* the same as
 * someone you email every week, even if both started at strength 0.8.
 *
 * Model: strength(t) = strength(t0) * exp(-ln(2) * dt / half_life)
 *
 * We track `last_decay_ts` per relation so decay is applied at most
 * once per scheduler interval, no matter how often this runs.
 */

const LN2 = Math.log(2);

let timer: NodeJS.Timeout | null = null;
let running = false;

export function startDecayScheduler(): void {
  if (!config.DECAY_ENABLED) return;

  // Run shortly after boot so a fresh install shows decay quickly.
  setTimeout(() => {
    void runOnce();
  }, 60_000);

  timer = setInterval(() => {
    void runOnce();
  }, config.DECAY_INTERVAL_MS);
}

export function stopDecayScheduler(): void {
  if (timer) clearInterval(timer);
  timer = null;
}

export async function runOnce(): Promise<{
  scanned: number;
  updated: number;
  elapsed_ms: number;
}> {
  if (running) {
    return { scanned: 0, updated: 0, elapsed_ms: 0 };
  }
  running = true;
  const started = Date.now();

  const session = getDriver().session({ database: config.NEO4J_DATABASE });
  try {
    const result = await session.run(
      `
      MATCH ()-[r:CONNECTED]->()
      WHERE coalesce(r.strength, 0) > $minStrength
      WITH r,
           CASE
             WHEN r.last_decay_ts IS NULL THEN
               CASE WHEN r.createdAt IS NULL THEN 30.0
                    ELSE toFloat(timestamp() - r.createdAt) / 86400000.0
               END
             ELSE toFloat(timestamp() - r.last_decay_ts) / 86400000.0
           END AS days_elapsed
      WHERE days_elapsed >= 1.0
      WITH r, days_elapsed, exp(-$ln2 * days_elapsed / $halfLife) AS factor
      SET r.strength = r.strength * factor,
          r.last_decay_ts = timestamp()
      RETURN count(r) AS updated
      `,
      {
        minStrength: config.DECAY_MIN_STRENGTH,
        ln2: LN2,
        halfLife: config.DECAY_HALF_LIFE_DAYS,
      }
    );

    const updated = (result.records[0]?.get("updated") as number | undefined) ?? 0;
    const elapsed = Date.now() - started;
    console.log(
      `[access-engine:decay] applied — updated=${updated} elapsed=${elapsed}ms half_life=${config.DECAY_HALF_LIFE_DAYS}d`
    );
    return { scanned: updated, updated, elapsed_ms: elapsed };
  } catch (err) {
    console.warn("[access-engine:decay] failed:", (err as Error).message);
    return { scanned: 0, updated: 0, elapsed_ms: Date.now() - started };
  } finally {
    running = false;
    await session.close();
  }
}
