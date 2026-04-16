import type { FastifyInstance } from "fastify";

const AGENT_URL = process.env.AGENT_URL ?? "http://agent:4500";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Proxy into the agent service. The agent owns its own Redis store
 * for tasks and runs; the API gateway just forwards.
 */
export async function agentRoutes(app: FastifyInstance) {
  app.get("/agent/tasks", async (req) => {
    const limit = (req.query as { limit?: string }).limit ?? "50";
    return (await fetchJson<unknown[]>(`${AGENT_URL}/tasks?limit=${limit}`)) ?? [];
  });

  app.get("/agent/tasks/person/:id", async (req) => {
    const { id } = req.params as { id: string };
    return (
      (await fetchJson<unknown[]>(`${AGENT_URL}/tasks/person/${encodeURIComponent(id)}`)) ?? []
    );
  });

  app.get("/agent/runs", async (req) => {
    const limit = (req.query as { limit?: string }).limit ?? "20";
    return (await fetchJson<unknown[]>(`${AGENT_URL}/runs?limit=${limit}`)) ?? [];
  });

  app.post("/agent/run", async (_req, reply) => {
    const result = await fetchJson<unknown>(`${AGENT_URL}/run`, { method: "POST" });
    if (!result) {
      reply.code(503);
      return { error: "agent_unavailable" };
    }
    return result;
  });
}
