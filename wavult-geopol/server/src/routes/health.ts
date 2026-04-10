import { Router } from "express";
import { pingNeo4j } from "../db/neo4j.js";
import { pingRedis } from "../db/redis.js";
import { pingOpenSearch } from "../db/opensearch.js";

export const healthRouter = Router();

healthRouter.get("/live", (_req, res) => {
  res.json({ status: "ok" });
});

healthRouter.get("/ready", async (_req, res) => {
  const [neo4j, redis, opensearch] = await Promise.all([
    pingNeo4j(),
    pingRedis(),
    pingOpenSearch(),
  ]);
  const ok = neo4j && redis && opensearch;
  res.status(ok ? 200 : 503).json({
    status: ok ? "ready" : "degraded",
    services: { neo4j, redis, opensearch },
  });
});
