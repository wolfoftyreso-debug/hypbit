import { Router } from "express";
import { z } from "zod";
import { getNeo4j } from "../db/neo4j.js";
import { getRedis } from "../db/redis.js";
import { getOpenSearch } from "../db/opensearch.js";
import { config } from "../config.js";

export const entitiesRouter = Router();

const ENTITY_INDEX = "geopol-entities";
const CACHE_TTL_SECONDS = 60;

const createEntitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["country", "organization", "person", "event"]),
  summary: z.string().optional(),
});

entitiesRouter.post("/", async (req, res, next) => {
  try {
    const body = createEntitySchema.parse(req.body);

    const session = getNeo4j().session({ database: config.NEO4J_DATABASE });
    try {
      await session.run(
        `MERGE (e:Entity {id: $id})
         SET e.name = $name, e.type = $type, e.summary = $summary, e.updatedAt = timestamp()
         RETURN e`,
        body
      );
    } finally {
      await session.close();
    }

    await getOpenSearch().index({
      index: ENTITY_INDEX,
      id: body.id,
      body,
      refresh: true,
    });

    await getRedis().del(`entity:${body.id}`);
    res.status(201).json(body);
  } catch (err) {
    next(err);
  }
});

entitiesRouter.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const cacheKey = `entity:${id}`;
    const cached = await getRedis().get(cacheKey);
    if (cached) {
      res.setHeader("x-cache", "hit");
      res.json(JSON.parse(cached));
      return;
    }

    const session = getNeo4j().session({ database: config.NEO4J_DATABASE });
    try {
      const result = await session.run(
        `MATCH (e:Entity {id: $id}) RETURN e LIMIT 1`,
        { id }
      );
      if (result.records.length === 0) {
        res.status(404).json({ error: "not_found" });
        return;
      }
      const entity = result.records[0].get("e").properties;
      await getRedis().set(cacheKey, JSON.stringify(entity), "EX", CACHE_TTL_SECONDS);
      res.setHeader("x-cache", "miss");
      res.json(entity);
    } finally {
      await session.close();
    }
  } catch (err) {
    next(err);
  }
});

entitiesRouter.get("/", async (req, res, next) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    const os = getOpenSearch();
    const result = await os.search({
      index: ENTITY_INDEX,
      body: {
        size: 25,
        query: q
          ? { multi_match: { query: q, fields: ["name^2", "summary", "type"] } }
          : { match_all: {} },
      },
    });
    const hits = (result.body.hits.hits as Array<{ _source: unknown }>).map(
      (h) => h._source
    );
    res.json({ results: hits });
  } catch (err) {
    next(err);
  }
});
