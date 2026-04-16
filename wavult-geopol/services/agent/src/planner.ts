import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { ulid } from "ulid";
import { config } from "./config.js";
import { AgentTaskKindSchema, SeveritySchema, type AgentTask } from "./shared/schemas.js";
import type { Target } from "./db/neo4j.js";

const SYSTEM_PROMPT = `You are an autonomous strategic planner for ${config.COMPANY_CONTEXT}

Given a strategic decision about one target person (their access probability, the top deal opportunity, and a discovered relation), produce 1–2 concrete next tasks we can execute in the next 7 days.

Output STRICT JSON and nothing else:
{
  "tasks": [
    {
      "kind": "MEET" | "INTRO" | "OUTREACH" | "ATTEND_EVENT" | "RESEARCH" | "ESCALATE",
      "title": string (<= 80 chars, imperative),
      "rationale": string (<= 220 chars, why this task now),
      "channel": string (optional; e.g. "email", "event: web-summit", "intro via Satya"),
      "priority": "INFO" | "IMPORTANT" | "CRITICAL",
      "days_until_deadline": integer 1-14
    }
  ]
}

Rules:
- Be specific. Never "connect with X" without saying how.
- If the target's access_probability is LOW, prefer INTRO or RESEARCH.
- If access is HIGH, prefer direct OUTREACH or MEET.
- If the top_deal is CRITICAL, at least one task must escalate that deal.
- Never invent facts not present in the input.`;

const TaskOutSchema = z.object({
  kind: AgentTaskKindSchema,
  title: z.string().min(1).max(120),
  rationale: z.string().min(1),
  channel: z.string().optional(),
  priority: SeveritySchema,
  days_until_deadline: z.number().int().min(1).max(60),
});

const OutSchema = z.object({ tasks: z.array(TaskOutSchema).min(0).max(4) });

const client = config.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: config.ANTHROPIC_API_KEY }) : null;

/**
 * Decision envelope returned by influence-api /api/decision/:id.
 * Kept loose to avoid coupling to the combined-decision schema in detail.
 */
export type DecisionInput = {
  target: Target;
  decision: Record<string, unknown>;
};

function heuristic(input: DecisionInput, runId: string): AgentTask[] {
  const { target, decision } = input;
  const accessBand = (decision.access as { band?: string } | undefined)?.band ?? "LOW";
  const deal = decision.top_deal as { type: string; priority: string; suggested_action: string } | undefined;

  const now = Date.now();
  const tasks: AgentTask[] = [];

  if (deal?.priority === "CRITICAL") {
    tasks.push({
      id: ulid(),
      ts: now,
      run_id: runId,
      target_person_id: target.id,
      target_person_name: target.name,
      kind: "ESCALATE",
      title: `Escalate: ${deal.type} opportunity on ${target.name}`,
      rationale: deal.suggested_action,
      priority: "CRITICAL",
      deadline_ts: now + 3 * 24 * 3600 * 1000,
      model: "deterministic-heuristic",
      status: "OPEN",
    });
  }

  if (accessBand === "HIGH") {
    tasks.push({
      id: ulid(),
      ts: now,
      run_id: runId,
      target_person_id: target.id,
      target_person_name: target.name,
      kind: "OUTREACH",
      title: `Direct outreach to ${target.name}`,
      rationale: "Access probability HIGH — send a concise personal note this week.",
      priority: "IMPORTANT",
      deadline_ts: now + 7 * 24 * 3600 * 1000,
      model: "deterministic-heuristic",
      status: "OPEN",
    });
  } else {
    tasks.push({
      id: ulid(),
      ts: now,
      run_id: runId,
      target_person_id: target.id,
      target_person_name: target.name,
      kind: "INTRO",
      title: `Request intro to ${target.name}`,
      rationale: "Access is not direct — use best next hop from the access engine.",
      priority: "IMPORTANT",
      deadline_ts: now + 10 * 24 * 3600 * 1000,
      model: "deterministic-heuristic",
      status: "OPEN",
    });
  }

  return tasks;
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first === -1 || last === -1) throw new Error("no json block in model output");
  return JSON.parse(trimmed.slice(first, last + 1));
}

export async function planTasksForTarget(
  input: DecisionInput,
  runId: string
): Promise<AgentTask[]> {
  if (!client) return heuristic(input, runId);

  const userBlock = `TARGET:
id: ${input.target.id}
name: ${input.target.name}
tags: ${input.target.tags.join(", ") || "none"}
influence_score: ${input.target.influence_score}
relevance_score: ${input.target.relevance_score}

DECISION SIGNAL:
${JSON.stringify(input.decision, null, 2)}

Produce the plan per the instructions.`;

  try {
    const response = await client.messages.create({
      model: config.ANTHROPIC_MODEL,
      max_tokens: 800,
      temperature: 0.3,
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
    const parsed = OutSchema.parse(extractJson(textBlock.text));
    const now = Date.now();
    return parsed.tasks.slice(0, config.AGENT_MAX_TASKS_PER_TARGET).map((t) => ({
      id: ulid(),
      ts: now,
      run_id: runId,
      target_person_id: input.target.id,
      target_person_name: input.target.name,
      kind: t.kind,
      title: t.title,
      rationale: t.rationale,
      channel: t.channel,
      priority: t.priority,
      deadline_ts: now + t.days_until_deadline * 24 * 3600 * 1000,
      access_probability: (input.decision.access as { probability?: number } | undefined)?.probability,
      best_next_hop: (input.decision.access as { best_next_hop?: string } | undefined)?.best_next_hop,
      model: config.ANTHROPIC_MODEL,
      status: "OPEN",
    }));
  } catch (err) {
    console.warn(`[agent] Claude plan failed (${(err as Error).message}); heuristic fallback`);
    return heuristic(input, runId);
  }
}
