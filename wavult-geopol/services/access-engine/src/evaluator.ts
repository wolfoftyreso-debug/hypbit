import { gatherSignals } from "./signals.js";
import { computeScore } from "./score.js";
import { putScore } from "./cache.js";
import type { AccessScore } from "./shared/schemas.js";

/**
 * Evaluate access for one target person and persist the score to Redis.
 * Called by the HTTP API, the Kafka consumer and the scheduler.
 */
export async function evaluate(targetId: string): Promise<AccessScore> {
  const signals = await gatherSignals(targetId);
  const score = computeScore(targetId, signals);
  await putScore(score);
  return score;
}
