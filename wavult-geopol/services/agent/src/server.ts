import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { ZodError } from "zod";
import { config } from "./config.js";
import { closeNeo4j, pingNeo4j } from "./db/neo4j.js";
import { closeRedis, pingRedis, recentRuns, recentTasks, tasksForPerson } from "./store.js";
import { runAgent } from "./runner.js";
import { startScheduler, stopScheduler } from "./scheduler.js";
import { startKafka, stopKafka } from "./kafka.js";
import { registerMetrics } from "./metrics.js";

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
await registerMetrics(app);

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

app.get("/tasks", async (req) => {
  const limit = Math.min(Number((req.query as { limit?: string }).limit ?? 50), 200);
  return await recentTasks(limit);
});

app.get("/tasks/person/:id", async (req) => {
  const { id } = req.params as { id: string };
  return await tasksForPerson(id);
});

app.get("/runs", async (req) => {
  const limit = Math.min(Number((req.query as { limit?: string }).limit ?? 20), 100);
  return await recentRuns(limit);
});

app.post("/run", async () => {
  const run = await runAgent();
  return run;
});

await startKafka();
startScheduler();

try {
  await app.listen({ port: config.PORT, host: config.HOST });
  app.log.info(`agent listening on ${config.HOST}:${config.PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

async function shutdown(sig: string) {
  app.log.info(`received ${sig}`);
  stopScheduler();
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
