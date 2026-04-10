import type { FastifyInstance } from "fastify";
import { getRedis } from "../db/redis.js";
import { NotificationSchema, type Notification } from "../shared/schemas.js";

const KEY = "notifications:recent";

/**
 * In-app notification feed. Reads from the Redis list that
 * notification-dispatcher writes, and streams new items via SSE
 * using the Redis pub/sub channel "notifications:channel".
 */
export async function notificationsRoutes(app: FastifyInstance) {
  app.get("/notifications", async (req) => {
    const limit = Math.min(Number((req.query as { limit?: string }).limit ?? 50), 200);
    const raw = await getRedis().lrange(KEY, 0, limit - 1);
    return raw
      .map((s) => {
        try {
          return NotificationSchema.parse(JSON.parse(s));
        } catch {
          return null;
        }
      })
      .filter((n): n is Notification => n !== null);
  });

  /**
   * SSE stream. On connect: replays the most recent 20 items as
   * backlog, then pushes every new notification as it arrives on the
   * pub/sub channel.
   */
  app.get("/notifications/stream", async (req, reply) => {
    reply.raw.setHeader("content-type", "text/event-stream");
    reply.raw.setHeader("cache-control", "no-cache");
    reply.raw.setHeader("connection", "keep-alive");
    reply.raw.setHeader("x-accel-buffering", "no");
    reply.raw.flushHeaders?.();

    const send = (data: unknown) => {
      reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Backlog
    const backlog = await getRedis().lrange(KEY, 0, 19);
    for (const raw of backlog.reverse()) {
      try {
        send(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    }

    // Live updates via a *separate* subscriber connection (ioredis
    // requires a dedicated client in subscribe mode).
    const sub = getRedis().duplicate();
    await sub.subscribe("notifications:channel");
    sub.on("message", (_channel, payload) => {
      try {
        send(JSON.parse(payload));
      } catch {
        /* ignore */
      }
    });

    const hb = setInterval(() => reply.raw.write(`: hb\n\n`), 15_000);

    req.raw.on("close", async () => {
      clearInterval(hb);
      try {
        await sub.unsubscribe("notifications:channel");
        await sub.quit();
      } catch {
        /* ignore */
      }
    });
  });
}
