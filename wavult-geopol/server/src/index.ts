import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config.js";
import { healthRouter } from "./routes/health.js";
import { entitiesRouter } from "./routes/entities.js";
import { closeNeo4j } from "./db/neo4j.js";
import { closeRedis } from "./db/redis.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: config.CORS_ORIGIN }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan(config.NODE_ENV === "production" ? "combined" : "dev"));

app.use("/health", healthRouter);
app.use("/api/entities", entitiesRouter);

app.get("/", (_req, res) => {
  res.json({
    name: "wavult-geopol-api",
    version: "0.1.0",
    docs: "/health/ready",
  });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = (err as { status?: number })?.status ?? 500;
  const message = err instanceof Error ? err.message : "internal_error";
  res.status(status).json({ error: message });
});

const server = app.listen(config.PORT, () => {
  console.log(`[wavult-geopol] api listening on :${config.PORT} (${config.NODE_ENV})`);
});

async function shutdown(signal: string) {
  console.log(`[wavult-geopol] received ${signal}, shutting down`);
  server.close(async () => {
    await Promise.allSettled([closeNeo4j(), closeRedis()]);
    process.exit(0);
  });
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
