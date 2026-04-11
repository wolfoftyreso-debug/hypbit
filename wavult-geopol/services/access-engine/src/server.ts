import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { ZodError } from "zod";
import { config } from "./config.js";
import { closeNeo4j, pingNeo4j } from "./db/neo4j.js";
import { closeRedis, pingRedis, getScore, topByAccess } from "./cache.js";
import { evaluate } from "./evaluator.js";
import { startKafka, stopKafka, publishScore } from "./kafka.js";

const app = Fastify({
  logger: {
    level: config.NODE_ENV === "production" ? "info" : "debug",
    transport:
      config.NODE_ENV === "production"
        ? undefined
        : { target: "pino-pretty", options: { colorize: true, singleLine: true } },
  },
});
await app.register(cors, { origin: config.CORS_ORIGIN });

app.setErrorHandler((err, req, reply) => {
  if (err instanceof ZodError) {
    reply.code(400).send({ error: "validation_error", issues: err.issues });
    return;
  }
  req.log.error({ err, url: req.url }, "request failed");
  reply.code(500).send({ error: err.name || "internal_error", message: err.message });
});

app.get("/health/live", async () => ({ status: "ok" }));
app.get("/health/ready", async (_req, reply) => {
  const [redisOk, neoOk] = await Promise.all([pingRedis(), pingNeo4j()]);
  const ok = redisOk && neoOk;
  reply.code(ok ? 200 : 503);
  return { status: ok ? "ready" : "degraded", services: { redis: redisOk, neo4j: neoOk } };
});

/** Evaluate now (cache miss = force recomputation). */
app.get("/access/:id", async (req) => {
  const { id } = req.params as { id: string };
  const force = (req.query as { force?: string }).force === "1";
  if (!force) {
    const cached = await getScore(id);
    if (cached) return cached;
  }
  const score = await evaluate(id);
  await publishScore(score);
  return score;
});

/** Top-N most-reachable people from our_node. */
app.get("/access/top", async (req) => {
  const limit = Math.min(Number((req.query as { limit?: string }).limit ?? 20), 100);
  return await topByAccess(limit);
});

await startKafka();

try {
  await app.listen({ port: config.PORT, host: config.HOST });
  app.log.info(`access-engine listening on ${config.HOST}:${config.PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

async function shutdown(sig: string) {
  app.log.info(`received ${sig}`);
  try {
    await app.close();
    await stopKafka();
    await closeRedis();
    await closeNeo4j();
  } catch (err) {
    app.log.error(err);
  }
  process.exit(0);
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
