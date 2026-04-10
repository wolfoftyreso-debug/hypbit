// COPIED FROM packages/events/src/rules.ts — keep in sync.
import { z } from "zod";
import {
  ImpactLevelSchema,
  InfluenceEventTypeSchema,
  SeveritySchema,
  type EnrichedEvent,
  type Severity,
} from "./schemas.js";

export const AlertRuleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  enabled: z.boolean().default(true),
  event_types: z.array(InfluenceEventTypeSchema).optional(),
  min_impact_on_us: ImpactLevelSchema.optional(),
  tag_any: z.array(z.string()).optional(),
  min_influence_score: z.number().min(0).max(100).optional(),
  min_relevance_score: z.number().min(0).max(100).optional(),
  person_ids: z.array(z.string()).optional(),
  min_severity: SeveritySchema.optional(),
});
export type AlertRule = z.infer<typeof AlertRuleSchema>;

const IMPACT_ORDER = { LOW: 0, MEDIUM: 1, HIGH: 2 } as const;
const IMPACT_WEIGHT = { LOW: 20, MEDIUM: 60, HIGH: 100 } as const;
const SEVERITY_ORDER = { INFO: 0, IMPORTANT: 1, CRITICAL: 2 } as const;

export type PersonContext = {
  id: string;
  name?: string;
  influence_score?: number;
  relevance_score?: number;
};

export function computeAlertScore(
  event: EnrichedEvent,
  person: PersonContext | null
): number {
  const influence = person?.influence_score ?? 0;
  const relevance = person?.relevance_score ?? event.enrichment.relevance_score;
  const impactWeight = IMPACT_WEIGHT[event.enrichment.impact_on_us];
  return influence * 0.4 + relevance * 0.4 + impactWeight * 0.2;
}

export function severityFromScore(score: number): Severity | null {
  if (score >= 85) return "CRITICAL";
  if (score >= 70) return "IMPORTANT";
  if (score >= 50) return "INFO";
  return null;
}

export function ruleMatches(
  rule: AlertRule,
  event: EnrichedEvent,
  person: PersonContext | null
): boolean {
  if (!rule.enabled) return false;
  if (rule.event_types && !rule.event_types.includes(event.event_type)) return false;
  if (
    rule.min_impact_on_us &&
    IMPACT_ORDER[event.enrichment.impact_on_us] < IMPACT_ORDER[rule.min_impact_on_us]
  ) {
    return false;
  }
  if (rule.tag_any && !rule.tag_any.some((t) => event.tags.includes(t))) return false;
  if (rule.person_ids && person && !rule.person_ids.includes(person.id)) return false;
  if (rule.min_influence_score !== undefined) {
    if (!person || (person.influence_score ?? 0) < rule.min_influence_score) return false;
  }
  if (rule.min_relevance_score !== undefined) {
    if (!person || (person.relevance_score ?? 0) < rule.min_relevance_score) return false;
  }
  if (rule.min_severity) {
    const score = computeAlertScore(event, person);
    const sev = severityFromScore(score);
    if (!sev || SEVERITY_ORDER[sev] < SEVERITY_ORDER[rule.min_severity]) return false;
  }
  return true;
}

export const BASE_RULE: AlertRule = {
  id: "base-high-impact",
  name: "High-impact moves on top-relevance people",
  enabled: true,
  min_impact_on_us: "HIGH",
  min_influence_score: 80,
  min_relevance_score: 70,
};
