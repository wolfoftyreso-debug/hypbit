import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { config } from "./config.js";
import { RelationKindSchema, type RelationEvidence, type RelationKind } from "./shared/schemas.js";

const SYSTEM_PROMPT = `You are an influence-intelligence analyst who classifies relationships between people based on graph evidence.

OUR COMPANY CONTEXT:
${config.COMPANY_CONTEXT}

Every prompt will give you two people and a list of evidence types (common neighbours, same org, same event, org influence, co-mention). Classify the most likely relationship between them and estimate how strong and useful that link is for us.

Output STRICT JSON and nothing else:
{
  "kind": "COLLEAGUE" | "MENTOR" | "COMPETITOR" | "COLLABORATOR" | "RIVAL" | "ACQUAINTANCE" | "UNKNOWN",
  "strength": number 0-100,
  "confidence": number 0-1,
  "narrative": string (<= 220 chars, why we think they're linked),
  "recommendation": string (<= 160 chars, how to leverage this for access)
}

Rules:
- Be conservative: UNKNOWN + low confidence when evidence is thin.
- Prefer COLLEAGUE for SAME_ORG with no additional signal.
- Prefer COLLABORATOR for COMMON_NEIGHBORS in the same domain.
- Narrative must be plain English, no JSON, no markdown.`;

const AnalysisSchema = z.object({
  kind: RelationKindSchema,
  strength: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  narrative: z.string(),
  recommendation: z.string().optional().default(""),
});

const client = config.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: config.ANTHROPIC_API_KEY }) : null;

export type AnalystInput = {
  a: { id: string; name: string; tags?: string[] };
  b: { id: string; name: string; tags?: string[] };
  evidence: RelationEvidence[];
};

export type AnalystOutput = {
  kind: RelationKind;
  strength: number;
  confidence: number;
  narrative: string;
  recommendation: string;
  model: string;
};

/** Deterministic fallback when Claude isn't available. */
function heuristic(input: AnalystInput): AnalystOutput {
  const kinds = new Set(input.evidence.map((e) => e.kind));
  let kind: RelationKind = "ACQUAINTANCE";
  let strength = 20;

  if (kinds.has("SAME_ORG")) {
    kind = "COLLEAGUE";
    strength = 60;
  } else if (kinds.has("COMMON_NEIGHBORS")) {
    kind = "COLLABORATOR";
    strength = 40;
  } else if (kinds.has("SAME_EVENT")) {
    kind = "ACQUAINTANCE";
    strength = 30;
  }

  const weightSum = input.evidence.reduce((acc, e) => acc + e.weight, 0);
  strength = Math.min(100, Math.round(strength + weightSum * 10));

  return {
    kind,
    strength,
    confidence: 0.3,
    narrative: `Linked via ${Array.from(kinds).join(", ").toLowerCase() || "weak signals"}.`,
    recommendation: "Confirm manually before outreach.",
    model: "deterministic-heuristic",
  };
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first === -1 || last === -1) throw new Error("no json block in model output");
  return JSON.parse(trimmed.slice(first, last + 1));
}

export async function analyzeRelation(input: AnalystInput): Promise<AnalystOutput> {
  if (!client) return heuristic(input);

  const userBlock = `CANDIDATE PAIR:
A: ${input.a.name} (id: ${input.a.id}, tags: ${(input.a.tags ?? []).join(", ") || "none"})
B: ${input.b.name} (id: ${input.b.id}, tags: ${(input.b.tags ?? []).join(", ") || "none"})

EVIDENCE:
${input.evidence
  .map((e) => `- ${e.kind} weight=${e.weight.toFixed(2)} details=${JSON.stringify(e.details)}`)
  .join("\n")}

Classify the relationship per the instructions.`;

  try {
    const response = await client.messages.create({
      model: config.ANTHROPIC_MODEL,
      max_tokens: 400,
      temperature: 0.2,
      // Prompt caching on the large static system block — the
      // instructions + company context don't change per request.
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userBlock }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("no text block");
    const parsed = AnalysisSchema.parse(extractJson(textBlock.text));
    return { ...parsed, recommendation: parsed.recommendation ?? "", model: config.ANTHROPIC_MODEL };
  } catch (err) {
    console.warn(
      `[relation-discovery] Claude analyse failed (${(err as Error).message}); using heuristic`
    );
    return heuristic(input);
  }
}
