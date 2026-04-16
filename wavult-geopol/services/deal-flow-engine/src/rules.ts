import type {
  DealOpportunity,
  DealType,
  EnrichedEvent,
  Severity,
} from "./shared/schemas.js";
import type { PersonRow } from "./db/neo4j.js";
import { ulid } from "ulid";

type DealRule = {
  id: string;
  requires_tag: string[] | null; // any of
  requires_event_type: EnrichedEvent["event_type"][];
  deal_type: DealType;
  priority: Severity;
  narrative: (p: PersonRow, e: EnrichedEvent) => string;
  suggested_action: (p: PersonRow, e: EnrichedEvent) => string;
};

/**
 * Hand-rolled rule set. In production this would live in Redis and
 * be CRUD-able from the UI, the same way alert-engine's rules are.
 * For now, ship useful defaults and let the service start producing
 * signal immediately.
 */
const RULES: DealRule[] = [
  {
    id: "capital-investment",
    requires_tag: ["capital", "vc", "investor"],
    requires_event_type: ["INVESTMENT"],
    deal_type: "FUNDING",
    priority: "CRITICAL",
    narrative: (p, e) =>
      `${p.name} is tagged capital and just showed up on an INVESTMENT event: ${e.title}`,
    suggested_action: (p) => `Initiate contact with ${p.name} this week via warmest intro.`,
  },
  {
    id: "policy-regulation",
    requires_tag: ["politics", "policy", "eu"],
    requires_event_type: ["REGULATORY_DECISION"],
    deal_type: "REGULATORY_ACCESS",
    priority: "IMPORTANT",
    narrative: (p, e) => `${p.name} is a policy actor connected to: ${e.title}`,
    suggested_action: (p) => `Brief leadership on regulatory exposure via ${p.name}'s network.`,
  },
  {
    id: "tech-partnership",
    requires_tag: ["tech", "cloud", "ai"],
    requires_event_type: ["PARTNERSHIP"],
    deal_type: "PARTNERSHIP",
    priority: "IMPORTANT",
    narrative: (p, e) => `${p.name}'s org is forming partnerships: ${e.title}`,
    suggested_action: (p) => `Reach out to partnership lead near ${p.name}.`,
  },
  {
    id: "tech-ma",
    requires_tag: ["tech", "cloud", "ai"],
    requires_event_type: ["MA_ANNOUNCEMENT"],
    deal_type: "ACQUISITION",
    priority: "CRITICAL",
    narrative: (p, e) => `M&A activity near ${p.name}: ${e.title}`,
    suggested_action: () => "Review our own strategic position within 72h.",
  },
  {
    id: "event-attendance",
    requires_tag: null, // any tag
    requires_event_type: ["EVENT_ATTENDANCE"],
    deal_type: "CUSTOMER",
    priority: "INFO",
    narrative: (p, e) => `${p.name} confirmed attendance at: ${e.title}`,
    suggested_action: (p) => `Plan to meet ${p.name} at the event.`,
  },
];

export function detectOpportunities(
  person: PersonRow,
  event: EnrichedEvent
): DealOpportunity[] {
  const out: DealOpportunity[] = [];
  for (const rule of RULES) {
    if (!rule.requires_event_type.includes(event.event_type)) continue;
    if (
      rule.requires_tag &&
      !rule.requires_tag.some((t) => person.tags.includes(t))
    )
      continue;
    out.push({
      id: ulid(),
      ts: Date.now(),
      person_id: person.id,
      person_name: person.name,
      type: rule.deal_type,
      priority: rule.priority,
      trigger_event_id: event.event_id,
      trigger_event_type: event.event_type,
      narrative: rule.narrative(person, event),
      suggested_action: rule.suggested_action(person, event),
    });
  }
  return out;
}
