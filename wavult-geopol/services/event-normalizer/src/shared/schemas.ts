// COPIED FROM packages/events/src/schemas.ts — keep in sync.
import { z } from "zod";

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

export const SourceEventRawSchema = z.object({
  id: z.string(),
  ts: z.number(),
  source: z.string(),
  kind: z.enum(["NEWS", "FILING", "SOCIAL", "EVENT_LISTING", "OTHER"]),
  url: z.string().url().optional(),
  title: z.string(),
  body: z.string().default(""),
  published_at: z.number().optional(),
  raw: z.unknown().optional(),
});
export type SourceEventRaw = z.infer<typeof SourceEventRawSchema>;

export const NormalizedEventSchema = z.object({
  event_id: z.string(),
  raw_id: z.string(),
  ts: z.number(),
  source: z.string(),
  url: z.string().url().optional(),
  title: z.string(),
  body: z.string().default(""),
  entity_type: EntityTypeSchema,
  entity_id: z.string(),
  person_ids: z.array(z.string()).default([]),
  org_ids: z.array(z.string()).default([]),
  event_type: InfluenceEventTypeSchema,
  impact_level: ImpactLevelSchema,
  tags: z.array(z.string()).default([]),
  normalized_data: z.record(z.string(), z.unknown()).default({}),
});
export type NormalizedEvent = z.infer<typeof NormalizedEventSchema>;

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
  path: z.array(z.string()).default([]),
  priority: SeveritySchema,
  deadline_ts: z.number().optional(),
});
export type Action = z.infer<typeof ActionSchema>;

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
