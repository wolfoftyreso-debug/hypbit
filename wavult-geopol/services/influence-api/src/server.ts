import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import sensible from "@fastify/sensible";
import { config } from "./config.js";
import { healthRoutes } from "./routes/health.js";
import { peopleRoutes } from "./routes/people.js";
import { intelligenceRoutes } from "./routes/intelligence.js";
import { privateRoutes } from "./routes/private.js";
import { connectKafka, disconnectKafka } from "./lib/kafka.js";
import { closeNeo4j } from "./db/neo4j.js";
import { closeRedis } from "./db/redis.js";

const app = Fastify({
  logger: {
    level: config.NODE_ENV === "production" ? "info" : "debug",
    transport:
      config.NODE_ENV === "production"
        ? undefined
        : { target: "pino-pretty", options: { colorize: true, singleLine: true } },
  },
});

await app.register(helmet, { global: true });
await app.register(cors, { origin: config.CORS_ORIGIN });
await app.register(sensible);

await app.register(healthRoutes);
await app.register(peopleRoutes, { prefix: "/api" });
await app.register(intelligenceRoutes, { prefix: "/api" });
await app.register(privateRoutes, { prefix: "/api" });

app.get("/", async () => ({
  name: "influence-api",
  version: "0.1.0",
  docs: "/health/ready",
}));

await connectKafka();

try {
  await app.listen({ port: config.PORT, host: config.HOST });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

async function shutdown(signal: string) {
  app.log.info(`received ${signal}, shutting down`);
  try {
    await app.close();
  } catch (err) {
    app.log.error(err);
  }
  await Promise.allSettled([closeNeo4j(), closeRedis(), disconnectKafka()]);
  process.exit(0);
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
