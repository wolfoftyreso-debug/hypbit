import type { FastifyInstance } from "fastify";
import { AccessScoreSchema, DealOpportunitySchema } from "../shared/schemas.js";

/**
 * Proxy routes that forward to the access-engine and deal-flow-engine
 * services, plus a combined /decision endpoint that joins access +
 * top deal + top relation into a single composite signal.
 *
 * The upstream URLs are configurable so you can run against a
 * different topology in prod vs dev.
 */
const ACCESS_ENGINE_URL = process.env.ACCESS_ENGINE_URL ?? "http://access-engine:4200";
const DEAL_FLOW_URL = process.env.DEAL_FLOW_URL ?? "http://deal-flow-engine:4400";
const INFLUENCE_API_SELF = "http://localhost:4000";

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function intelligenceProxyRoutes(app: FastifyInstance) {
  // --- /api/access/* ---
  app.get("/access/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const raw = await fetchJson<unknown>(`${ACCESS_ENGINE_URL}/access/${encodeURIComponent(id)}`);
    if (!raw) {
      reply.code(503);
      return { error: "access_engine_unavailable" };
    }
    return raw;
  });

  app.get("/access/top", async (req) => {
    const limit = (req.query as { limit?: string }).limit ?? "20";
    const raw = await fetchJson<unknown>(`${ACCESS_ENGINE_URL}/access/top?limit=${limit}`);
    return raw ?? [];
  });

  // --- /api/deals/* ---
  app.get("/deals", async (req) => {
    const limit = (req.query as { limit?: string }).limit ?? "50";
    const raw = await fetchJson<unknown>(`${DEAL_FLOW_URL}/deals?limit=${limit}`);
    return raw ?? [];
  });

  app.get("/deals/person/:id", async (req) => {
    const { id } = req.params as { id: string };
    const raw = await fetchJson<unknown>(
      `${DEAL_FLOW_URL}/deals/person/${encodeURIComponent(id)}`
    );
    return raw ?? [];
  });

  /**
   * Combined Decision Engine.
   *
   * For a single target person, join:
   *   - access probability (from access-engine)
   *   - top deal opportunity (from deal-flow-engine)
   *   - top discovered relation (from influence-api/Neo4j)
   * into one "what do I do about this person right now" response.
   */
  app.get("/decision/:personId", async (req, reply) => {
    const { personId } = req.params as { personId: string };

    const [accessRaw, dealsRaw, relationsRaw] = await Promise.all([
      fetchJson<unknown>(`${ACCESS_ENGINE_URL}/access/${encodeURIComponent(personId)}`),
      fetchJson<unknown[]>(`${DEAL_FLOW_URL}/deals/person/${encodeURIComponent(personId)}`),
      fetchJson<Array<{ kind: string; strength: number; narrative: string; other_name: string }>>(
        `${INFLUENCE_API_SELF}/api/relations/${encodeURIComponent(personId)}?limit=1`
      ),
    ]);

    const access = (() => {
      const parsed = AccessScoreSchema.safeParse(accessRaw);
      return parsed.success ? parsed.data : undefined;
    })();

    const topDeal = (() => {
      if (!Array.isArray(dealsRaw) || dealsRaw.length === 0) return undefined;
      const parsed = DealOpportunitySchema.safeParse(dealsRaw[0]);
      return parsed.success ? parsed.data : undefined;
    })();

    const topRelation = Array.isArray(relationsRaw) ? relationsRaw[0] : undefined;

    // Synthesise urgency + recommendation.
    const urgency: "INFO" | "IMPORTANT" | "CRITICAL" = (() => {
      if (topDeal?.priority === "CRITICAL") return "CRITICAL";
      if (topDeal?.priority === "IMPORTANT") return "IMPORTANT";
      if (access && access.band === "HIGH" && topDeal) return "IMPORTANT";
      return "INFO";
    })();

    const recommendation = (() => {
      if (topDeal) return topDeal.suggested_action;
      if (access?.best_next_hop && access.band !== "LOW") {
        return `Request intro via ${access.best_next_hop}.`;
      }
      if (topRelation) return `Leverage known link: ${topRelation.narrative}`;
      return "Monitor.";
    })();

    reply.send({
      target_person_id: personId,
      access,
      top_deal: topDeal,
      top_relation: topRelation,
      urgency,
      recommended_action: recommendation,
    });
  });
}
