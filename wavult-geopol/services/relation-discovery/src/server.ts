import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { ZodError } from "zod";
import { config } from "./config.js";
import { closeNeo4j, pingNeo4j } from "./db/neo4j.js";
import { discoverForPerson } from "./discoverer.js";
import { enqueue, queueSize, stop as stopQueue } from "./queue.js";
import { startScheduler, stopScheduler } from "./scheduler.js";
import { connect as connectKafka, disconnect as disconnectKafka } from "./kafka.js";
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

app.get("/health/live", async () => ({ status: "ok", queue: queueSize() }));

app.get("/health/ready", async (_req, reply) => {
  const ok = await pingNeo4j();
  reply.code(ok ? 200 : 503);
  return { status: ok ? "ready" : "degraded", services: { neo4j: ok } };
});

/** Synchronous discovery for ad-hoc exploration. */
app.get("/discover/:personId", async (req) => {
  const { personId } = req.params as { personId: string };
  const relations = await discoverForPerson(personId);
  return { person_id: personId, count: relations.length, relations };
});

/** Queue a background discovery pass without blocking. */
app.post("/discover/:personId/queue", async (req, reply) => {
  const { personId } = req.params as { personId: string };
  enqueue(personId);
  reply.code(202);
  return { queued: personId, queue_size: queueSize() };
});

await connectKafka();
startScheduler();

try {
  await app.listen({ port: config.PORT, host: config.HOST });
  app.log.info(`relation-discovery listening on ${config.HOST}:${config.PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

async function shutdown(sig: string) {
  app.log.info(`received ${sig}`);
  stopScheduler();
  stopQueue();
  try {
    await app.close();
    await disconnectKafka();
    await closeNeo4j();
  } catch (err) {
    app.log.error(err);
  }
  process.exit(0);
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
