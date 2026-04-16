import type {
  ImpactLevel,
  InfluenceEventType,
  NormalizedEvent,
  SourceEventRaw,
} from "./shared/schemas.js";

/**
 * Deterministic keyword-based classifier. Cheap, explainable,
 * good enough as the first pass before the AI enrichment layer
 * adds the real contextual understanding.
 */

type Rule = {
  type: InfluenceEventType;
  impact: ImpactLevel;
  tags: string[];
  keywords: RegExp;
};

const RULES: Rule[] = [
  {
    type: "ROLE_CHANGE",
    impact: "HIGH",
    tags: ["leadership"],
    keywords: /\b(ceo|cto|cfo|coo|president|chair|resigns?|steps down|appointed|named)\b/i,
  },
  {
    type: "MA_ANNOUNCEMENT",
    impact: "HIGH",
    tags: ["ma"],
    keywords: /\b(acquire[ds]?|acquisition|merger|merges? with|buy[s]? .+ for \$|takeover)\b/i,
  },
  {
    type: "INVESTMENT",
    impact: "HIGH",
    tags: ["capital"],
    keywords: /\b(funding round|raised \$|series [a-z]|investment|backed by|valuation)\b/i,
  },
  {
    type: "REGULATORY_DECISION",
    impact: "HIGH",
    tags: ["regulation"],
    keywords: /\b(regulation|regulator|antitrust|sec filing|eu.*(law|directive|regulation)|fined|sanction)\b/i,
  },
  {
    type: "PARTNERSHIP",
    impact: "MEDIUM",
    tags: ["partnership"],
    keywords: /\b(partner(s|ship)?|collaborat(e|ion)|strategic alliance)\b/i,
  },
  {
    type: "EVENT_ATTENDANCE",
    impact: "MEDIUM",
    tags: ["event"],
    keywords: /\b(keynote|speaker|conference|summit|panel|fireside)\b/i,
  },
  {
    type: "MEDIA_EXPOSURE",
    impact: "MEDIUM",
    tags: ["media"],
    keywords: /\b(interview|op[- ]ed|feature|profile|podcast)\b/i,
  },
  {
    type: "SOCIAL_UPDATE",
    impact: "LOW",
    tags: ["social"],
    keywords: /\b(tweeted|posted|shared|instagram|linkedin update)\b/i,
  },
];

/**
 * Known people we already track in the graph, with naive name matchers.
 * In production this should come from a lookup service against Neo4j.
 */
const KNOWN_PEOPLE: Array<{ id: string; name: string; matcher: RegExp; orgs: string[] }> = [
  { id: "jeff_bezos", name: "Jeff Bezos", matcher: /\bjeff bezos\b/i, orgs: ["amazon"] },
  { id: "satya_nadella", name: "Satya Nadella", matcher: /\bsatya nadella\b/i, orgs: ["microsoft"] },
  { id: "sam_altman", name: "Sam Altman", matcher: /\bsam altman\b/i, orgs: ["openai"] },
  { id: "ursula_vdl", name: "Ursula von der Leyen", matcher: /\bursula von der leyen\b/i, orgs: ["eu_commission"] },
];

const KNOWN_ORGS: Array<{ id: string; matcher: RegExp }> = [
  { id: "amazon", matcher: /\b(amazon|aws|amazon web services)\b/i },
  { id: "microsoft", matcher: /\b(microsoft|azure)\b/i },
  { id: "openai", matcher: /\bopenai\b/i },
  { id: "eu_commission", matcher: /\b(eu commission|european commission|eu)\b/i },
];

export function classify(raw: SourceEventRaw, makeId: () => string): NormalizedEvent {
  const haystack = `${raw.title}\n${raw.body}`;
  const matchedRule = RULES.find((r) => r.keywords.test(haystack));

  const type = matchedRule?.type ?? "UNKNOWN";
  const impact: ImpactLevel = matchedRule?.impact ?? "LOW";
  const tags = matchedRule ? [...matchedRule.tags] : [];

  const personMatches = KNOWN_PEOPLE.filter((p) => p.matcher.test(haystack));
  const person_ids = personMatches.map((p) => p.id);

  const orgMatches = KNOWN_ORGS.filter((o) => o.matcher.test(haystack));
  const org_ids = Array.from(
    new Set([...orgMatches.map((o) => o.id), ...personMatches.flatMap((p) => p.orgs)])
  );

  const entity_type = person_ids.length > 0 ? "PERSON" : org_ids.length > 0 ? "ORGANIZATION" : "EVENT";
  const entity_id = person_ids[0] ?? org_ids[0] ?? "";

  if (raw.kind === "EVENT_LISTING" && tags.indexOf("event") === -1) {
    tags.push("event");
  }

  return {
    event_id: makeId(),
    raw_id: raw.id,
    ts: Date.now(),
    source: raw.source,
    url: raw.url,
    title: raw.title,
    body: raw.body,
    entity_type,
    entity_id,
    person_ids,
    org_ids,
    event_type: type,
    impact_level: impact,
    tags,
    normalized_data: {},
  };
}
