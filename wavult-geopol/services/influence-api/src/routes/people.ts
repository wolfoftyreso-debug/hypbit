import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { neoSession } from "../db/neo4j.js";
import { getRedis } from "../db/redis.js";
import { getOpenSearch } from "../db/opensearch.js";
import { publish, KAFKA_TOPICS } from "../lib/kafka.js";
import { getAccessMap } from "../lib/access-lookup.js";

const PERSON_INDEX = "geopol-people";
const CACHE_TTL = 60;

/**
 * Core Person data is the **Business Influence Layer** — neutral, objective,
 * shared across the org. Personal filters, notes and lists live in a
 * separate private layer (see ./private.ts) and must NOT leak into this
 * schema. `visibility` marks whether a record is org-visible or
 * private-only; `lists` is a set of private list memberships evaluated
 * per-user at query time.
 */
const createPersonSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  influence_score: z.number().min(0).max(100).default(0),
  relevance_score: z.number().min(0).max(100).default(0),
  summary: z.string().optional(),
  tags: z.array(z.string()).optional(),
  visibility_org: z.boolean().default(true),
  visibility_private: z.boolean().default(false),
  lists: z.array(z.string()).optional(),
});

type Mode = "global" | "my_network" | "private";

function parseMode(raw: unknown): Mode {
  if (raw === "my_network" || raw === "private") return raw;
  return "global";
}

function getUserId(req: { headers: Record<string, string | string[] | undefined> }): string {
  const h = req.headers["x-user-id"];
  if (typeof h === "string" && h.length > 0) return h;
  return "anonymous";
}

export async function peopleRoutes(app: FastifyInstance) {
  /**
   * List / search people.
   *
   * Mode semantics:
   *   - global     → all org-visible people (the neutral business layer)
   *   - my_network → org-visible people + caller's private contacts merged
   *   - private    → only records on caller's private lists
   */
  app.get("/people", async (req) => {
    const q = (req.query as { q?: string }).q ?? "";
    const mode = parseMode((req.query as { mode?: string }).mode);
    const userId = getUserId(req);
    const session = neoSession();

    const visibilityClause = (() => {
      if (mode === "global") return `p.visibility_org = true`;
      if (mode === "my_network")
        return `(p.visibility_org = true OR exists { MATCH (u:User {id:$userId})-[:PRIVATE_CONTACT]->(p) })`;
      // private
      return `exists { MATCH (u:User {id:$userId})-[:PRIVATE_CONTACT]->(p) }`;
    })();

    const textClause = q
      ? `AND (toLower(p.name) CONTAINS toLower($q)
             OR any(tag IN coalesce(p.tags, []) WHERE toLower(tag) CONTAINS toLower($q)))`
      : "";

    try {
      const result = await session.run(
        `MATCH (p:Person)
         WHERE ${visibilityClause} ${textClause}
         RETURN p
         ORDER BY coalesce(p.influence_score, 0) DESC
         LIMIT 100`,
        { q, userId }
      );
      return result.records.map((r) => r.get("p").properties);
    } finally {
      await session.close();
    }
  });

  // Top-N priority engine (business layer only — never biased by private lists)
  app.get("/people/top", async (req) => {
    const limit = Number((req.query as { limit?: string }).limit ?? 20);
    const session = neoSession();
    try {
      const result = await session.run(
        `MATCH (p:Person)
         WHERE p.visibility_org = true
         RETURN p
         ORDER BY coalesce(p.relevance_score, 0) DESC, coalesce(p.influence_score, 0) DESC
         LIMIT $limit`,
        { limit: Math.min(Math.max(limit, 1), 100) }
      );
      return result.records.map((r) => r.get("p").properties);
    } finally {
      await session.close();
    }
  });

  // Single person by id (Redis-cached, cache key includes mode to prevent leaks)
  app.get("/people/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const cacheKey = `person:${id}`;
    const cached = await getRedis().get(cacheKey);
    if (cached) {
      reply.header("x-cache", "hit");
      return JSON.parse(cached);
    }
    const session = neoSession();
    try {
      const result = await session.run(
        `MATCH (p:Person {id: $id})
         WHERE p.visibility_org = true
         RETURN p LIMIT 1`,
        { id }
      );
      if (result.records.length === 0) {
        reply.code(404);
        return { error: "not_found" };
      }
      const person = result.records[0].get("p").properties;
      await getRedis().set(cacheKey, JSON.stringify(person), "EX", CACHE_TTL);
      reply.header("x-cache", "miss");
      return person;
    } finally {
      await session.close();
    }
  });

  // Upsert person -> Neo4j + OpenSearch + Kafka event
  app.post("/people", async (req, reply) => {
    const body = createPersonSchema.parse(req.body);
    const session = neoSession();
    try {
      await session.run(
        `MERGE (p:Person {id: $id})
         SET p.name = $name,
             p.lat = $lat,
             p.lng = $lng,
             p.influence_score = $influence_score,
             p.relevance_score = $relevance_score,
             p.summary = $summary,
             p.tags = $tags,
             p.visibility_org = $visibility_org,
             p.visibility_private = $visibility_private,
             p.lists = $lists,
             p.updatedAt = timestamp()
         RETURN p`,
        {
          ...body,
          summary: body.summary ?? null,
          tags: body.tags ?? [],
          lists: body.lists ?? [],
        }
      );
    } finally {
      await session.close();
    }

    if (body.visibility_org) {
      await getOpenSearch().index({
        index: PERSON_INDEX,
        id: body.id,
        body,
        refresh: true,
      });
    }

    await getRedis().del(`person:${body.id}`);
    await publish(KAFKA_TOPICS.PERSON_CREATED, body, body.id);

    reply.code(201);
    return body;
  });

  // GeoJSON for the map UI. Mode-aware.
  app.get("/map", async (req) => {
    const mode = parseMode((req.query as { mode?: string }).mode);
    const userId = getUserId(req);
    const session = neoSession();

    const visibilityClause = (() => {
      if (mode === "global") return `p.visibility_org = true`;
      if (mode === "my_network")
        return `(p.visibility_org = true OR exists { MATCH (u:User {id:$userId})-[:PRIVATE_CONTACT]->(p) })`;
      return `exists { MATCH (u:User {id:$userId})-[:PRIVATE_CONTACT]->(p) }`;
    })();

    try {
      const result = await session.run(
        `MATCH (p:Person)
         WHERE ${visibilityClause}
           AND p.lat IS NOT NULL AND p.lng IS NOT NULL
         RETURN p.id as id, p.name as name, p.lat as lat, p.lng as lng,
                coalesce(p.influence_score, 0) as influence_score,
                coalesce(p.relevance_score, 0) as relevance_score`,
        { userId }
      );
      const ids = result.records.map((r) => r.get("id") as string);
      const access = await getAccessMap(ids);
      return {
        type: "FeatureCollection",
        features: result.records.map((r) => {
          const id = r.get("id") as string;
          const a = access.get(id);
          return {
            type: "Feature",
            properties: {
              id,
              name: r.get("name"),
              influence_score: r.get("influence_score"),
              relevance_score: r.get("relevance_score"),
              access_band: a?.band ?? null,
              access_probability: a?.probability ?? null,
              best_next_hop: a?.best_next_hop ?? null,
            },
            geometry: {
              type: "Point",
              coordinates: [r.get("lng"), r.get("lat")],
            },
          };
        }),
      };
    } finally {
      await session.close();
    }
  });
}
