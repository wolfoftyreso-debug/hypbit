import type { FastifyInstance } from "fastify";
import { pingNeo4j } from "../db/neo4j.js";
import { pingRedis } from "../db/redis.js";
import { pingOpenSearch } from "../db/opensearch.js";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health/live", async () => ({ status: "ok" }));

  app.get("/health/ready", async (_req, reply) => {
    const [neo4j, redis, opensearch] = await Promise.all([
      pingNeo4j(),
      pingRedis(),
      pingOpenSearch(),
    ]);
    const ok = neo4j && redis && opensearch;
    reply.code(ok ? 200 : 503);
    return {
      status: ok ? "ready" : "degraded",
      services: { neo4j, redis, opensearch },
    };
  });
}
