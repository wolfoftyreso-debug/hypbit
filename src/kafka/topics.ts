// ─── Kafka Topics — Wavult Event Registry ────────────────────────────────────
// Single source of truth for all topic names.
// Convention: wavult.<domain>.<action>

export const TOPICS = {
  // ── Missions (quiXzoom) ──────────────────────────────────────────────────
  MISSIONS_CREATED:        'wavult.missions.created',
  MISSIONS_UPDATED:        'wavult.missions.updated',
  MISSIONS_COMPLETED:      'wavult.missions.completed',
  MISSIONS_CANCELLED:      'wavult.missions.cancelled',

  // ── Alerts (LandveX / Optical Insight) ──────────────────────────────────
  ALERTS_TRIGGERED:        'wavult.alerts.triggered',
  ALERTS_RESOLVED:         'wavult.alerts.resolved',
  ALERTS_ESCALATED:        'wavult.alerts.escalated',

  // ── Communications ───────────────────────────────────────────────────────
  COMMS_SEND:              'wavult.comms.send',
  COMMS_DELIVERED:         'wavult.comms.delivered',

  // ── Users ────────────────────────────────────────────────────────────────
  USERS_ONBOARDED:         'wavult.users.onboarded',
  USERS_UPDATED:           'wavult.users.updated',
  USERS_VERIFIED:          'wavult.users.verified',

  // ── Payments ─────────────────────────────────────────────────────────────
  PAYMENTS_INITIATED:      'wavult.payments.initiated',
  PAYMENTS_PROCESSED:      'wavult.payments.processed',
  PAYMENTS_FAILED:         'wavult.payments.failed',

  // ── System ───────────────────────────────────────────────────────────────
  SYSTEM_AUDIT:            'wavult.system.audit',
} as const

export type TopicName = typeof TOPICS[keyof typeof TOPICS]

// ─── Topic configs (retention, partitions) ────────────────────────────────────
export const TOPIC_CONFIG: Record<TopicName, { numPartitions: number; replicationFactor: number }> = {
  [TOPICS.MISSIONS_CREATED]:    { numPartitions: 3, replicationFactor: 1 },
  [TOPICS.MISSIONS_UPDATED]:    { numPartitions: 3, replicationFactor: 1 },
  [TOPICS.MISSIONS_COMPLETED]:  { numPartitions: 3, replicationFactor: 1 },
  [TOPICS.MISSIONS_CANCELLED]:  { numPartitions: 1, replicationFactor: 1 },
  [TOPICS.ALERTS_TRIGGERED]:    { numPartitions: 3, replicationFactor: 1 },
  [TOPICS.ALERTS_RESOLVED]:     { numPartitions: 1, replicationFactor: 1 },
  [TOPICS.ALERTS_ESCALATED]:    { numPartitions: 1, replicationFactor: 1 },
  [TOPICS.COMMS_SEND]:          { numPartitions: 3, replicationFactor: 1 },
  [TOPICS.COMMS_DELIVERED]:     { numPartitions: 1, replicationFactor: 1 },
  [TOPICS.USERS_ONBOARDED]:     { numPartitions: 2, replicationFactor: 1 },
  [TOPICS.USERS_UPDATED]:       { numPartitions: 2, replicationFactor: 1 },
  [TOPICS.USERS_VERIFIED]:      { numPartitions: 1, replicationFactor: 1 },
  [TOPICS.PAYMENTS_INITIATED]:  { numPartitions: 3, replicationFactor: 1 },
  [TOPICS.PAYMENTS_PROCESSED]:  { numPartitions: 3, replicationFactor: 1 },
  [TOPICS.PAYMENTS_FAILED]:     { numPartitions: 1, replicationFactor: 1 },
  [TOPICS.SYSTEM_AUDIT]:        { numPartitions: 1, replicationFactor: 1 },
}
