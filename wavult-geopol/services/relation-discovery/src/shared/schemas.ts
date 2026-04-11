import { z } from "zod";

/**
 * Wire-format schemas for the Influence Monitoring & Response pipeline.
 *
 * Pipeline stages and the message each stage emits:
 *
 *   influence-ingestion    → SourceEventRaw       on raw.events
 *   event-normalizer       → NormalizedEvent      on events.normalized
 *   influence-enrichment   → EnrichedEvent        on events.enriched
 *   alert-engine           → Alert                on alerts.triggered
 *   action-engine          → Action               on actions.generated
 *   notification-dispatcher → Notification        on notification.created
 */

export const InfluenceEventTypeSchema = z.enum([
  "ROLE_CHANGE",
  "INVESTMENT",
  "REGULATORY_DECISION",
  "MA_ANNOUNCEMENT",
  "EVENT_ATTENDANCE",
  "PARTNERSHIP",
  "MEDIA_EXPOSURE",
  "SOCIAL_UPDATE",
  "UNKNOWN",
]);
export type InfluenceEventType = z.infer<typeof InfluenceEventTypeSchema>;

export const ImpactLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);
export type ImpactLevel = z.infer<typeof ImpactLevelSchema>;

export const SeveritySchema = z.enum(["INFO", "IMPORTANT", "CRITICAL"]);
export type Severity = z.infer<typeof SeveritySchema>;

export const EntityTypeSchema = z.enum(["PERSON", "ORGANIZATION", "EVENT"]);
export type EntityType = z.infer<typeof EntityTypeSchema>;

/**
 * STAGE 1 — raw.events
 * What the ingestion layer saw, before any classification.
 */
export const SourceEventRawSchema = z.object({
  id: z.string(),
  ts: z.number(),
  source: z.string(), // e.g. "rss:news.google", "twitter", "sec.gov"
  kind: z.enum(["NEWS", "FILING", "SOCIAL", "EVENT_LISTING", "OTHER"]),
  url: z.string().url().optional(),
  title: z.string(),
  body: z.string().default(""),
  published_at: z.number().optional(),
  raw: z.unknown().optional(),
});
export type SourceEventRaw = z.infer<typeof SourceEventRawSchema>;

/**
 * STAGE 2 — events.normalized
 * Canonical structure after keyword / regex classification. No AI yet.
 */
export const NormalizedEventSchema = z.object({
  event_id: z.string(),
  raw_id: z.string(),
  ts: z.number(),
  source: z.string(),
  url: z.string().url().optional(),
  title: z.string(),
  body: z.string().default(""),

  entity_type: EntityTypeSchema,
  entity_id: z.string(), // best-guess primary entity, empty string if unknown
  person_ids: z.array(z.string()).default([]),
  org_ids: z.array(z.string()).default([]),

  event_type: InfluenceEventTypeSchema,
  impact_level: ImpactLevelSchema,
  tags: z.array(z.string()).default([]),
  normalized_data: z.record(z.string(), z.unknown()).default({}),
});
export type NormalizedEvent = z.infer<typeof NormalizedEventSchema>;

/**
 * STAGE 3 — events.enriched
 * Normalized event + AI analysis about what it means for US.
 */
export const EnrichedEventSchema = NormalizedEventSchema.extend({
  enrichment: z.object({
    relevance_score: z.number().min(0).max(100),
    impact_on_us: ImpactLevelSchema,
    summary: z.string(),
    recommended_actions: z.array(z.string()).default([]),
    risk: ImpactLevelSchema,
    opportunity: ImpactLevelSchema,
    confidence: z.number().min(0).max(1),
    model: z.string(),
  }),
});
export type EnrichedEvent = z.infer<typeof EnrichedEventSchema>;

/**
 * STAGE 4 — alerts.triggered
 * One alert per rule match. Carries the score that drove it.
 */
export const AlertSchema = z.object({
  id: z.string(),
  ts: z.number(),
  rule_id: z.string(),
  rule_name: z.string(),
  severity: SeveritySchema,
  alert_score: z.number().min(0).max(100),
  matched_person_id: z.string().optional(),
  matched_person_name: z.string().optional(),
  matched_influence_score: z.number().optional(),
  matched_relevance_score: z.number().optional(),
  event: EnrichedEventSchema,
});
export type Alert = z.infer<typeof AlertSchema>;

/**
 * STAGE 5 — actions.generated
 * Concrete next-step derived from an alert.
 */
export const ActionSchema = z.object({
  id: z.string(),
  ts: z.number(),
  alert_id: z.string(),
  action_type: z.enum([
    "INTRO_REQUEST",
    "ATTEND_EVENT",
    "REVIEW_STRATEGY",
    "MONITOR",
    "CONTACT_PARTNER",
    "CREATE_CRM_TASK",
  ]),
  title: z.string(),
  description: z.string(),
  target_person_id: z.string().optional(),
  target_person_name: z.string().optional(),
  path: z.array(z.string()).default([]), // access path through the graph
  priority: SeveritySchema,
  deadline_ts: z.number().optional(),
});
export type Action = z.infer<typeof ActionSchema>;

/**
 * STAGE 6 — notification.created
 * Renderable in the in-app feed.
 */
export const NotificationSchema = z.object({
  id: z.string(),
  ts: z.number(),
  kind: z.enum(["ALERT", "ACTION"]),
  severity: SeveritySchema,
  title: z.string(),
  body: z.string(),
  alert: AlertSchema.optional(),
  action: ActionSchema.optional(),
  read: z.boolean().default(false),
});
export type Notification = z.infer<typeof NotificationSchema>;

/**
 * Intelligence layer — Relation Discovery
 * Emitted by relation-discovery when a candidate pair is analysed.
 */
export const RelationKindSchema = z.enum([
  "COLLEAGUE",
  "MENTOR",
  "COMPETITOR",
  "COLLABORATOR",
  "RIVAL",
  "ACQUAINTANCE",
  "UNKNOWN",
]);
export type RelationKind = z.infer<typeof RelationKindSchema>;

export const RelationEvidenceKindSchema = z.enum([
  "COMMON_NEIGHBORS",
  "SAME_ORG",
  "SAME_EVENT",
  "ORG_INFLUENCE",
  "CO_MENTION",
]);

export const RelationEvidenceSchema = z.object({
  kind: RelationEvidenceKindSchema,
  weight: z.number().min(0).max(1),
  details: z.record(z.string(), z.unknown()).default({}),
});
export type RelationEvidence = z.infer<typeof RelationEvidenceSchema>;

export const DiscoveredRelationSchema = z.object({
  id: z.string(),
  ts: z.number(),
  person_a_id: z.string(),
  person_b_id: z.string(),
  person_a_name: z.string().optional(),
  person_b_name: z.string().optional(),
  kind: RelationKindSchema,
  strength: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  narrative: z.string(),
  recommendation: z.string().optional(),
  evidence: z.array(RelationEvidenceSchema).default([]),
  model: z.string().default("deterministic"),
});
export type DiscoveredRelation = z.infer<typeof DiscoveredRelationSchema>;

/**
 * Intelligence layer — Access Probability Engine
 * Emitted by access-engine on every (our_node, target) pair evaluation.
 *
 *   probability = (1 / graph_distance)   * 0.30
 *               + relation_strength      * 0.25
 *               + mutual_connection_score * 0.15
 *               + event_overlap          * 0.10
 *               + geo_proximity          * 0.10
 *               + historical_success     * 0.10
 */
export const AccessBandSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);
export type AccessBand = z.infer<typeof AccessBandSchema>;

export const AccessScoreSchema = z.object({
  target_person_id: z.string(),
  from_node_id: z.string(),
  ts: z.number(),
  probability: z.number().min(0).max(1),
  band: AccessBandSchema,
  signals: z.object({
    graph_distance: z.number().nullable(),
    relation_strength: z.number().min(0).max(1),
    mutual_connections: z.number(),
    mutual_score: z.number().min(0).max(1),
    event_overlap: z.number().min(0).max(1),
    geo_proximity: z.number().min(0).max(1),
    historical_success: z.number().min(0).max(1),
  }),
  best_next_hop: z.string().optional(),
  best_path: z.array(z.string()).default([]),
});
export type AccessScore = z.infer<typeof AccessScoreSchema>;

/**
 * Intelligence layer — Deal Flow Engine
 * Matches person domains/tags against events to find opportunities.
 */
export const DealTypeSchema = z.enum([
  "FUNDING",
  "PARTNERSHIP",
  "REGULATORY_ACCESS",
  "CUSTOMER",
  "TALENT",
  "ACQUISITION",
  "CO_INVEST",
]);
export type DealType = z.infer<typeof DealTypeSchema>;

export const DealOpportunitySchema = z.object({
  id: z.string(),
  ts: z.number(),
  person_id: z.string(),
  person_name: z.string().optional(),
  type: DealTypeSchema,
  priority: SeveritySchema,
  trigger_event_id: z.string().optional(),
  trigger_event_type: z.string().optional(),
  narrative: z.string(),
  suggested_action: z.string(),
  access_probability: z.number().min(0).max(1).optional(),
});
export type DealOpportunity = z.infer<typeof DealOpportunitySchema>;

/**
 * Combined Decision Engine — the composite signal returned by
 * /api/decision/:personId. Not a Kafka event; just the API shape.
 */
export const DecisionSchema = z.object({
  target_person_id: z.string(),
  target_person_name: z.string().optional(),
  access: AccessScoreSchema.optional(),
  top_deal: DealOpportunitySchema.optional(),
  top_relation: DiscoveredRelationSchema.optional(),
  urgency: SeveritySchema,
  recommended_action: z.string(),
});
export type Decision = z.infer<typeof DecisionSchema>;
