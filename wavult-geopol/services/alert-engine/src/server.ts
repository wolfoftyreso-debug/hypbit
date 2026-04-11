import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import Redis from "ioredis";
import { ZodError } from "zod";
import { AlertRuleSchema } from "./shared/rules.js";
import { RuleStore } from "./rule-store.js";
import { startConsumer } from "./consumer.js";
import { closeNeo, pingNeo4j } from "./people-lookup.js";
import { registerMetrics } from "./metrics.js";

const PORT = Number(process.env.PORT ?? 4100);
const HOST = process.env.HOST ?? "0.0.0.0";
const REDIS_URL = process.env.REDIS_URL ?? "redis://redis:6379";

const redis = new Redis(REDIS_URL, { lazyConnect: false, maxRetriesPerRequest: 3 });
const store = new RuleStore(redis);
await store.init();

const app = Fastify({
  logger: { level: process.env.NODE_ENV === "production" ? "info" : "debug" },
});
await app.register(cors, { origin: process.env.CORS_ORIGIN ?? "*" });
await registerMetrics(app);

app.setErrorHandler((err, req, reply) => {
  if (err instanceof ZodError) {
    reply.code(400).send({ error: "validation_error", issues: err.issues });
    return;
  }
  const status = (err as { statusCode?: number }).statusCode ?? 500;
  req.log.error({ err, url: req.url }, "request failed");
  reply.code(status).send({
    error: err.name || "internal_error",
    message: err.message,
  });
});

app.get("/health/live", async () => ({ status: "ok" }));

app.get("/health/ready", async (_req, reply) => {
  const [redisOk, neoOk] = await Promise.all([
    redis
      .ping()
      .then((r) => r === "PONG")
      .catch(() => false),
    pingNeo4j(),
  ]);
  const ok = redisOk && neoOk;
  reply.code(ok ? 200 : 503);
  return {
    status: ok ? "ready" : "degraded",
    services: { redis: redisOk, neo4j: neoOk },
  };
});

app.get("/rules", async () => await store.list());

app.post("/rules", async (req, reply) => {
  const rule = AlertRuleSchema.parse(req.body);
  await store.put(rule);
  reply.code(201);
  return rule;
});

app.put("/rules/:id", async (req) => {
  const { id } = req.params as { id: string };
  const rule = AlertRuleSchema.parse({ ...(req.body as object), id });
  await store.put(rule);
  return rule;
});

app.delete("/rules/:id", async (req, reply) => {
  const { id } = req.params as { id: string };
  const ok = await store.delete(id);
  if (!ok) reply.code(404);
  return { ok };
});

const stopConsumer = await startConsumer(store);

try {
  await app.listen({ port: PORT, host: HOST });
  app.log.info(`alert-engine http listening on ${HOST}:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

async function shutdown(sig: string) {
  app.log.info(`received ${sig}`);
  try {
    await stopConsumer();
    await app.close();
    await redis.quit();
    await closeNeo();
  } catch (err) {
    app.log.error(err);
  }
  process.exit(0);
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
