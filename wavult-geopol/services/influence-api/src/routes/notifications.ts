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
   * SSE stream. Calls reply.hijack() immediately so Fastify stops
   * managing the response lifecycle — we own the raw socket until
   * the client disconnects. On connect we replay the most recent
   * 20 items as backlog, then push every new notification from the
   * Redis pub/sub channel.
   */
  app.get("/notifications/stream", async (req, reply) => {
    // Tell Fastify we're hijacking this response. Without this, Fastify
    // will try to send its own reply after the handler resolves and
    // print "Reply was already sent" warnings, and may tear down the
    // socket early.
    reply.hijack();

    const res = reply.raw;
    res.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    });

    const send = (data: unknown) => {
      // If the socket is already gone, bail early.
      if (res.writableEnded || res.destroyed) return;
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Backlog: replay the last 20 items (oldest first).
    try {
      const backlog = await getRedis().lrange(KEY, 0, 19);
      for (const raw of backlog.reverse()) {
        try {
          send(JSON.parse(raw));
        } catch {
          /* ignore malformed */
        }
      }
    } catch (err) {
      app.log.warn({ err }, "failed to replay notifications backlog");
    }

    // Dedicated subscriber connection — ioredis requires a separate
    // client for subscribe mode.
    const sub = getRedis().duplicate();
    try {
      await sub.subscribe("notifications:channel");
    } catch (err) {
      app.log.error({ err }, "failed to subscribe to notifications:channel");
      res.end();
      return;
    }
    sub.on("message", (_channel, payload) => {
      try {
        send(JSON.parse(payload));
      } catch {
        /* ignore */
      }
    });

    const hb = setInterval(() => {
      if (!res.writableEnded && !res.destroyed) res.write(`: hb\n\n`);
    }, 15_000);

    const cleanup = async () => {
      clearInterval(hb);
      try {
        await sub.unsubscribe("notifications:channel");
      } catch {
        /* ignore */
      }
      try {
        await sub.quit();
      } catch {
        /* ignore */
      }
    };

    req.raw.on("close", cleanup);
    req.raw.on("error", cleanup);
  });
}
