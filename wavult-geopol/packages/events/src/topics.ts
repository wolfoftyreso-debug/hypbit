/**
 * Canonical Kafka topic names for the Influence Monitoring & Response
 * Platform. Keep in sync with copies in each service's src/shared/topics.ts.
 *
 * Event flow:
 *
 *   raw.events           ← influence-ingestion
 *   events.normalized    ← event-normalizer
 *   events.enriched      ← influence-enrichment (AI)
 *   alerts.triggered     ← alert-engine
 *   actions.generated    ← action-engine
 *   notification.created ← notification-dispatcher (fan-out)
 */
export const TOPICS = {
  // Core person / graph events (existing)
  PERSON_CREATED: "person.created",
  PERSON_ENRICHED: "person.enriched",
  RELATIONSHIP_UPDATED: "relationship.updated",
  INTERACTION_LOGGED: "interaction.logged",

  // Influence Monitoring & Response pipeline
  RAW_EVENTS: "raw.events",
  EVENTS_NORMALIZED: "events.normalized",
  EVENTS_ENRICHED: "events.enriched",
  ALERTS_TRIGGERED: "alerts.triggered",
  ACTIONS_GENERATED: "actions.generated",
  NOTIFICATION_CREATED: "notification.created",
} as const;

export type Topic = (typeof TOPICS)[keyof typeof TOPICS];
