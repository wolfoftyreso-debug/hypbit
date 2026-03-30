// ─── Kafka — Public API ───────────────────────────────────────────────────────

export { kafka } from './client'
export { TOPICS, TOPIC_CONFIG } from './topics'
export type { TopicName } from './topics'
export * from './events'
export { connectProducer, disconnectProducer, publish, publishAudit } from './producer'
export { ensureTopics } from './admin'
