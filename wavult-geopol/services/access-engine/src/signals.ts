import { neoSession } from "./db/neo4j.js";
import { config } from "./config.js";

export type Signals = {
  graph_distance: number | null;
  path: string[];
  path_strengths: number[];
  relation_strength: number;
  mutual_connections: number;
  event_overlap_numerator: number;
  event_overlap_denominator: number;
  geo_proximity: number;
  historical_success: number;
};

/**
 * Haversine distance in kilometres.
 */
function haversine(a: [number, number], b: [number, number]): number {
  const [lat1, lng1] = a;
  const [lat2, lng2] = b;
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const aa =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return R * c;
}

/**
 * Collect every signal we use for access probability in a single
 * Neo4j round-trip where possible. Returns raw values; scoring
 * happens in score.ts.
 */
export async function gatherSignals(targetId: string): Promise<Signals> {
  const me = config.OUR_NODE_ID;
  const session = neoSession();
  try {
    const pathResult = await session.run(
      `MATCH path = shortestPath(
         (me:Person {id:$me})-[:CONNECTED*..${config.ACCESS_MAX_PATH_DEPTH}]-(target:Person {id:$target})
       )
       RETURN [n IN nodes(path) | n.id]               AS node_ids,
              [r IN relationships(path) | coalesce(r.strength, 0.0)] AS strengths`,
      { me, target: targetId }
    );

    let distance: number | null = null;
    let path: string[] = [];
    let strengths: number[] = [];
    if (pathResult.records.length > 0) {
      path = pathResult.records[0].get("node_ids") as string[];
      strengths = pathResult.records[0].get("strengths") as number[];
      distance = strengths.length;
    }

    const mutualsResult = await session.run(
      `MATCH (me:Person {id:$me})-[:CONNECTED]-(x:Person)-[:CONNECTED]-(t:Person {id:$target})
       RETURN count(DISTINCT x) AS mutuals`,
      { me, target: targetId }
    );
    const mutuals = (mutualsResult.records[0]?.get("mutuals") as number) ?? 0;

    const eventsResult = await session.run(
      `OPTIONAL MATCH (me:Person {id:$me})-[:ATTENDED]->(e:Event)<-[:ATTENDED]-(t:Person {id:$target})
       WITH collect(DISTINCT e.id) AS shared
       MATCH (t:Person {id:$target})
       OPTIONAL MATCH (t)-[:ATTENDED]->(te:Event)
       RETURN shared, count(DISTINCT te.id) AS target_total`,
      { me, target: targetId }
    );
    const eventsRow = eventsResult.records[0];
    const sharedEvents = (eventsRow?.get("shared") as string[] | undefined) ?? [];
    const targetEvents = (eventsRow?.get("target_total") as number | undefined) ?? 0;

    const geoResult = await session.run(
      `MATCH (me:Person {id:$me}), (t:Person {id:$target})
       RETURN me.lat AS me_lat, me.lng AS me_lng, t.lat AS t_lat, t.lng AS t_lng`,
      { me, target: targetId }
    );
    let geo = 0.5;
    if (geoResult.records.length > 0) {
      const r = geoResult.records[0];
      const meLat = r.get("me_lat") as number | null;
      const meLng = r.get("me_lng") as number | null;
      const tLat = r.get("t_lat") as number | null;
      const tLng = r.get("t_lng") as number | null;
      if (meLat != null && meLng != null && tLat != null && tLng != null) {
        const km = haversine([meLat, meLng], [tLat, tLng]);
        // 0 km → 1.0, >= 15000 km → 0.
        geo = Math.max(0, 1 - km / 15_000);
      }
    }

    const relationStrength =
      strengths.length > 0
        ? strengths.reduce((a, b) => a + b, 0) / strengths.length
        : 0;

    return {
      graph_distance: distance,
      path,
      path_strengths: strengths,
      relation_strength: Math.max(0, Math.min(1, relationStrength)),
      mutual_connections: mutuals,
      event_overlap_numerator: sharedEvents.length,
      event_overlap_denominator: Math.max(1, targetEvents),
      geo_proximity: geo,
      // Placeholder until we have a feedback loop from outreach outcomes.
      historical_success: 0.5,
    };
  } finally {
    await session.close();
  }
}
