import type { FastifyInstance } from "fastify";
import { neoSession } from "../db/neo4j.js";

/**
 * Read discovered relations from Neo4j. Writes happen inside the
 * relation-discovery service; this route is read-only.
 */
export async function relationsRoutes(app: FastifyInstance) {
  app.get("/relations/:personId", async (req) => {
    const { personId } = req.params as { personId: string };
    const limit = Math.min(
      Number((req.query as { limit?: string }).limit ?? 20),
      100
    );
    const session = neoSession();
    try {
      const result = await session.run(
        `MATCH (p:Person {id:$personId})-[r:DISCOVERED_CONNECTION]-(other:Person)
         RETURN other.id          AS other_id,
                other.name        AS other_name,
                r.id              AS id,
                r.kind            AS kind,
                r.strength        AS strength,
                r.confidence      AS confidence,
                r.narrative       AS narrative,
                r.recommendation  AS recommendation,
                r.discovered_at   AS discovered_at
         ORDER BY r.strength DESC
         LIMIT $limit`,
        { personId, limit }
      );
      return result.records.map((rec) => ({
        id: rec.get("id"),
        other_id: rec.get("other_id"),
        other_name: rec.get("other_name"),
        kind: rec.get("kind"),
        strength: rec.get("strength"),
        confidence: rec.get("confidence"),
        narrative: rec.get("narrative"),
        recommendation: rec.get("recommendation"),
        discovered_at: rec.get("discovered_at"),
      }));
    } finally {
      await session.close();
    }
  });

  app.get("/relations/between/:a/:b", async (req) => {
    const { a, b } = req.params as { a: string; b: string };
    const session = neoSession();
    try {
      const result = await session.run(
        `MATCH (x:Person {id:$a})-[r:DISCOVERED_CONNECTION]-(y:Person {id:$b})
         RETURN r LIMIT 1`,
        { a, b }
      );
      if (result.records.length === 0) return { found: false };
      const props = result.records[0].get("r").properties;
      return { found: true, relation: props };
    } finally {
      await session.close();
    }
  });
}
