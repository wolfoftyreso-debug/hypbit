import type { FastifyInstance } from "fastify";
import { neoSession } from "../db/neo4j.js";
import { config } from "../config.js";

/**
 * Intelligence / Access Engine.
 *
 * Given a target node, compute the shortest access path from our "home"
 * node (config.OUR_NODE_ID) through the :CONNECTED relationship graph.
 */
export async function intelligenceRoutes(app: FastifyInstance) {
  app.get("/intelligence/path/:targetId", async (req, reply) => {
    const { targetId } = req.params as { targetId: string };
    const from = (req.query as { from?: string }).from ?? config.OUR_NODE_ID;

    const session = neoSession();
    try {
      const result = await session.run(
        `MATCH path = shortestPath(
           (me:Person {id: $from})-[:CONNECTED*..5]-(target:Person {id: $target})
         )
         RETURN [n IN nodes(path) | n { .id, .name, .influence_score }] AS nodes,
                [r IN relationships(path) | coalesce(r.strength, 0)]   AS strengths`,
        { from, target: targetId }
      );

      if (result.records.length === 0) {
        reply.code(404);
        return { error: "no_path", from, target: targetId };
      }

      const record = result.records[0];
      const nodes = record.get("nodes");
      const strengths = record.get("strengths") as number[];
      const totalStrength = strengths.reduce((a, b) => a + b, 0);
      return {
        from,
        target: targetId,
        hops: nodes.length - 1,
        path: nodes,
        strengths,
        total_strength: totalStrength,
      };
    } finally {
      await session.close();
    }
  });

  // Event engine stub — ranks events by detected impact.
  app.get("/intelligence/events", async () => {
    const session = neoSession();
    try {
      const result = await session.run(
        `MATCH (e:Event)
         RETURN e
         ORDER BY coalesce(e.impact_score, 0) DESC
         LIMIT 25`
      );
      return result.records.map((r) => r.get("e").properties);
    } finally {
      await session.close();
    }
  });
}
