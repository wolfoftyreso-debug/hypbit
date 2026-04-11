import type { AccessBand, AccessScore } from "./shared/schemas.js";
import type { Signals } from "./signals.js";
import { config } from "./config.js";

/**
 * Apply the scoring formula from the spec:
 *
 *   probability = (1 / graph_distance) * 0.30
 *               + relation_strength    * 0.25
 *               + mutual_score         * 0.15
 *               + event_overlap        * 0.10
 *               + geo_proximity        * 0.10
 *               + historical_success   * 0.10
 */
export function computeScore(targetId: string, signals: Signals): AccessScore {
  const distanceTerm =
    signals.graph_distance && signals.graph_distance > 0
      ? 1 / signals.graph_distance
      : 0;

  const mutualScore = Math.min(1, signals.mutual_connections / 10);
  const eventOverlap =
    signals.event_overlap_denominator > 0
      ? signals.event_overlap_numerator / signals.event_overlap_denominator
      : 0;

  const probability = Math.max(
    0,
    Math.min(
      1,
      distanceTerm * 0.3 +
        signals.relation_strength * 0.25 +
        mutualScore * 0.15 +
        eventOverlap * 0.1 +
        signals.geo_proximity * 0.1 +
        signals.historical_success * 0.1
    )
  );

  const band: AccessBand = probability >= 0.66 ? "HIGH" : probability >= 0.33 ? "MEDIUM" : "LOW";

  // Best next hop = second element of the shortest path (path[0] is ourselves).
  const bestNextHop = signals.path.length > 1 ? signals.path[1] : undefined;

  return {
    target_person_id: targetId,
    from_node_id: config.OUR_NODE_ID,
    ts: Date.now(),
    probability,
    band,
    signals: {
      graph_distance: signals.graph_distance,
      relation_strength: signals.relation_strength,
      mutual_connections: signals.mutual_connections,
      mutual_score: mutualScore,
      event_overlap: eventOverlap,
      geo_proximity: signals.geo_proximity,
      historical_success: signals.historical_success,
    },
    best_next_hop: bestNextHop,
    best_path: signals.path,
  };
}
