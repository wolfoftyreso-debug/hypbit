// Kafka topic names — single source of truth.
// Topic creation lives in Terraform (Phase 7).

export const TOPICS = {
  TASK_CREATED: 'quixzoom.tasks.created',
  TASK_ASSIGNED: 'quixzoom.tasks.assigned',
  TASK_CAPTURED: 'quixzoom.tasks.captured',
  TASK_VALIDATED: 'quixzoom.tasks.validated',
  TASK_FAILED: 'quixzoom.tasks.failed',
  TOKENS: 'quixzoom.tokens.transactions',
  CALLBACKS: 'quixzoom.platform.callbacks',
  DEAD_LETTER: 'quixzoom.dead-letter',
} as const;

export type Topic = (typeof TOPICS)[keyof typeof TOPICS];

/** Maps an EventType name (e.g. TASK_CREATED) to its Kafka topic. */
export function topicForEventType(type: string): Topic {
  switch (type) {
    case 'TASK_CREATED':
      return TOPICS.TASK_CREATED;
    case 'TASK_ASSIGNED':
      return TOPICS.TASK_ASSIGNED;
    case 'TASK_CAPTURED':
      return TOPICS.TASK_CAPTURED;
    case 'TASK_VALIDATED':
      return TOPICS.TASK_VALIDATED;
    case 'TASK_FAILED':
    case 'TASK_REQUEUED':
    case 'TASK_REFUNDED':
      return TOPICS.TASK_FAILED;
    case 'TOKEN_RESERVED':
    case 'TOKEN_SETTLED':
    case 'TOKEN_REFUNDED':
      return TOPICS.TOKENS;
    default:
      return TOPICS.CALLBACKS;
  }
}
