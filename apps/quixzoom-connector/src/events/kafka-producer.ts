// Kafka producer — thin wrapper around kafkajs. Publishes the
// QuiXzoomEvent envelope on the topic returned by topicForEventType().

import { Kafka, type Producer } from 'kafkajs';
import { randomUUID } from 'crypto';

import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { QRP_VERSION } from '../models/events';
import { QVL_VERSION } from '../models/qvl';
import { topicForEventType } from './topics';
import type { EventPublisher } from '../services/task-manager';

let kafka: Kafka | null = null;
let producer: Producer | null = null;
let ready = false;

export async function initKafkaProducer(): Promise<void> {
  if (producer) return;
  kafka = new Kafka({
    clientId: config.kafkaClientId,
    brokers: config.kafkaBrokers,
    connectionTimeout: 3000,
    requestTimeout: 10000,
    retry: { retries: 2, initialRetryTime: 200 },
    logLevel: 1, // ERROR only — kafkajs is noisy on reconnects
  });
  producer = kafka.producer({
    allowAutoTopicCreation: false,
    idempotent: true,
  });
  try {
    await producer.connect();
    ready = true;
    logger.info('kafka.producer.connected', {
      brokers: config.kafkaBrokers,
    });
  } catch (err) {
    ready = false;
    logger.error('kafka.producer.connect_failed', {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export function isKafkaReady(): boolean {
  return ready && producer !== null;
}

export async function shutdownKafkaProducer(): Promise<void> {
  if (producer) {
    await producer.disconnect().catch(() => undefined);
    producer = null;
    ready = false;
  }
}

/** EventPublisher adapter wired into task-manager. */
export const kafkaPublisher: EventPublisher = {
  async publish(type, payload): Promise<void> {
    if (!producer || !ready) {
      logger.warn('kafka.publish.skipped', { type, reason: 'not_ready' });
      return;
    }
    const envelope = {
      event_id: randomUUID(),
      type,
      timestamp: new Date().toISOString(),
      payload,
      meta: {
        qvl_version: QVL_VERSION,
        qrp_version: QRP_VERSION,
        trace_id:
          typeof payload.trace_id === 'string'
            ? (payload.trace_id as string)
            : randomUUID(),
      },
    };
    try {
      await producer.send({
        topic: topicForEventType(type),
        messages: [
          {
            key: (payload.task_id as string | undefined) ?? envelope.event_id,
            value: JSON.stringify(envelope),
            headers: { trace_id: envelope.meta.trace_id },
          },
        ],
      });
    } catch (err) {
      logger.error('kafka.publish.error', {
        type,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },
};
