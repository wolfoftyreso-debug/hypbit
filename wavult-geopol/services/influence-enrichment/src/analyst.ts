import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { NormalizedEvent, EnrichedEvent, ImpactLevel } from "./shared/schemas.js";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
const API_KEY = process.env.ANTHROPIC_API_KEY;
const COMPANY_CONTEXT =
  process.env.COMPANY_CONTEXT ??
  "Wavult is building an influence intelligence platform. Our core dependencies include cloud infrastructure (AWS, Azure), AI model providers (OpenAI, Anthropic), and we care about EU tech regulation and M&A activity among hyperscalers.";

const SYSTEM_PROMPT = `You are an influence intelligence analyst. For every event you receive, analyse how it affects OUR company.

OUR COMPANY CONTEXT:
${COMPANY_CONTEXT}

Output STRICT JSON matching this schema and nothing else:
{
  "relevance_score": number 0-100,
  "impact_on_us": "LOW" | "MEDIUM" | "HIGH",
  "summary": string (<= 240 chars),
  "recommended_actions": string[] (<= 3, imperative),
  "risk": "LOW" | "MEDIUM" | "HIGH",
  "opportunity": "LOW" | "MEDIUM" | "HIGH",
  "confidence": number 0-1
}

Rules:
- No prose before or after the JSON.
- Base impact_on_us on how directly this affects our infrastructure, capital, or strategic positioning.
- relevance_score reflects how much this specific event matters to us (not how big the news is in general).
- Prefer "LOW" impact/opportunity when uncertain rather than inflating scores.`;

const AnalysisSchema = z.object({
  relevance_score: z.number().min(0).max(100),
  impact_on_us: z.enum(["LOW", "MEDIUM", "HIGH"]),
  summary: z.string(),
  recommended_actions: z.array(z.string()).default([]),
  risk: z.enum(["LOW", "MEDIUM", "HIGH"]),
  opportunity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  confidence: z.number().min(0).max(1),
});

const client = API_KEY ? new Anthropic({ apiKey: API_KEY }) : null;

function fallback(event: NormalizedEvent): EnrichedEvent["enrichment"] {
  // Deterministic fallback used when ANTHROPIC_API_KEY is missing.
  const impact: ImpactLevel = event.impact_level;
  return {
    relevance_score: impact === "HIGH" ? 70 : impact === "MEDIUM" ? 40 : 15,
    impact_on_us: impact,
    summary: event.title,
    recommended_actions: [],
    risk: impact,
    opportunity: "LOW",
    confidence: 0.25,
    model: "fallback-deterministic",
  };
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first === -1 || last === -1) throw new Error("no json block in model output");
  return JSON.parse(trimmed.slice(first, last + 1));
}

export async function analyze(event: NormalizedEvent): Promise<EnrichedEvent["enrichment"]> {
  if (!client) return fallback(event);

  const userBlock = `EVENT TO ANALYSE:
title: ${event.title}
source: ${event.source}
type: ${event.event_type}
impact_level (from normalizer): ${event.impact_level}
person_ids: ${event.person_ids.join(", ") || "(none)"}
org_ids: ${event.org_ids.join(", ") || "(none)"}
body:
${event.body || "(no body)"}`;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      temperature: 0.2,
      // cache_control on the system block enables prompt caching — the
      // large static context (instructions + company background) is
      // identical across every call, so we amortize its token cost.
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: userBlock,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("no text in model response");

    const parsed = AnalysisSchema.parse(extractJson(textBlock.text));
    return { ...parsed, model: MODEL };
  } catch (err) {
    console.warn(
      `[influence-enrichment] Claude analyse failed (${(err as Error).message}); using fallback`
    );
    return fallback(event);
  }
}
