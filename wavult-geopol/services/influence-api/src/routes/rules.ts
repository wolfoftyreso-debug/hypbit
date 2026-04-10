import type { FastifyInstance } from "fastify";
import { AlertRuleSchema } from "../shared/rules.js";
import { getRedis } from "../db/redis.js";

const KEY = "alert-engine:rules";

/**
 * Thin proxy over the same Redis hash that alert-engine reads from.
 * Keeping the rule store in Redis means the alert-engine picks up
 * changes on its next consumed message without needing IPC.
 */
export async function rulesRoutes(app: FastifyInstance) {
  app.get("/rules", async () => {
    const vals = await getRedis().hvals(KEY);
    return vals
      .map((v) => {
        try {
          return AlertRuleSchema.parse(JSON.parse(v));
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  });

  app.post("/rules", async (req, reply) => {
    const rule = AlertRuleSchema.parse(req.body);
    await getRedis().hset(KEY, rule.id, JSON.stringify(rule));
    reply.code(201);
    return rule;
  });

  app.put("/rules/:id", async (req) => {
    const { id } = req.params as { id: string };
    const rule = AlertRuleSchema.parse({ ...(req.body as object), id });
    await getRedis().hset(KEY, rule.id, JSON.stringify(rule));
    return rule;
  });

  app.delete("/rules/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const removed = await getRedis().hdel(KEY, id);
    if (removed === 0) reply.code(404);
    return { ok: removed > 0 };
  });
}
