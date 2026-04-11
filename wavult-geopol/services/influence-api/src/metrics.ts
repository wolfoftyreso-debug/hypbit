import type { FastifyInstance } from "fastify";
import { collectDefaultMetrics, Histogram, register } from "prom-client";

collectDefaultMetrics({ prefix: "influence_api_" });

const httpDuration = new Histogram({
  name: "influence_api_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

export async function registerMetrics(app: FastifyInstance): Promise<void> {
  app.addHook("onRequest", async (req) => {
    (req as unknown as { _startTime: number })._startTime = process.hrtime.bigint
      ? Number(process.hrtime.bigint()) / 1e9
      : Date.now() / 1000;
  });

  app.addHook("onResponse", async (req, reply) => {
    const start = (req as unknown as { _startTime?: number })._startTime;
    if (start === undefined) return;
    const now = process.hrtime.bigint ? Number(process.hrtime.bigint()) / 1e9 : Date.now() / 1000;
    const routePattern =
      (req.routeOptions as { url?: string } | undefined)?.url ?? req.url.split("?")[0];
    httpDuration
      .labels(req.method, routePattern, String(reply.statusCode))
      .observe(now - start);
  });

  app.get("/metrics", async (_req, reply) => {
    reply.header("content-type", register.contentType);
    return await register.metrics();
  });
}
