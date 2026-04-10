// COPIED FROM packages/events/src/topics.ts — keep in sync.
export const TOPICS = {
  PERSON_CREATED: "person.created",
  PERSON_ENRICHED: "person.enriched",
  RELATIONSHIP_UPDATED: "relationship.updated",
  INTERACTION_LOGGED: "interaction.logged",

  RAW_EVENTS: "raw.events",
  EVENTS_NORMALIZED: "events.normalized",
  EVENTS_ENRICHED: "events.enriched",
  ALERTS_TRIGGERED: "alerts.triggered",
  ACTIONS_GENERATED: "actions.generated",
  NOTIFICATION_CREATED: "notification.created",
} as const;

export type Topic = (typeof TOPICS)[keyof typeof TOPICS];
