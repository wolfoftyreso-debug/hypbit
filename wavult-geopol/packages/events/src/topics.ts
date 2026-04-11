/**
 * Canonical Kafka topic names for the Influence Monitoring & Response
 * Platform. Keep in sync with copies in each service's src/shared/topics.ts.
 */
export const TOPICS = {
  // Core person / graph events
  PERSON_CREATED: "person.created",
  PERSON_ENRICHED: "person.enriched",
  RELATIONSHIP_UPDATED: "relationship.updated",
  INTERACTION_LOGGED: "interaction.logged",

  // Influence Monitoring pipeline
  RAW_EVENTS: "raw.events",
  EVENTS_NORMALIZED: "events.normalized",
  EVENTS_ENRICHED: "events.enriched",
  ALERTS_TRIGGERED: "alerts.triggered",
  ACTIONS_GENERATED: "actions.generated",
  NOTIFICATION_CREATED: "notification.created",

  // Intelligence layer
  RELATION_DISCOVERED: "relation.discovered",
  ACCESS_SCORES_UPDATED: "access.scores.updated",
  DEALFLOW_DETECTED: "dealflow.detected",
} as const;

export type Topic = (typeof TOPICS)[keyof typeof TOPICS];
