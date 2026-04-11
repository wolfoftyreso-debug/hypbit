import { CompressionTypes, Producer } from 'kafkajs';
import { kafka } from './client';
import { logger } from '../logger';
import { kafkaMessagesProduced } from '../metrics';
import { ServiceUnavailableError } from '../errors';

let producer: Producer | null = null;
let connected = false;

export async function getProducer(): Promise<Producer> {
  if (producer && connected) return producer;
  producer = kafka.producer({
    allowAutoTopicCreation: false,
    idempotent: true,
    maxInFlightRequests: 5,
    transactionTimeout: 30_000,
  });
  await producer.connect();
  connected = true;
  logger.info('Kafka producer connected');
  return producer;
}

export interface PublishOptions {
  topic: string;
  key?: string;
  value: unknown;
  headers?: Record<string, string>;
}

export async function publish(opts: PublishOptions): Promise<void> {
  try {
    const p = await getProducer();
    await p.send({
      topic: opts.topic,
      compression: CompressionTypes.GZIP,
      messages: [
        {
          key: opts.key,
          value: Buffer.from(JSON.stringify(opts.value)),
          headers: opts.headers,
        },
      ],
    });
    kafkaMessagesProduced.inc({ topic: opts.topic, status: 'ok' });
  } catch (err) {
    kafkaMessagesProduced.inc({ topic: opts.topic, status: 'error' });
    logger.error({ err, topic: opts.topic }, 'kafka publish failed');
    throw new ServiceUnavailableError('kafka');
  }
}

export async function disconnectProducer(): Promise<void> {
  if (producer && connected) {
    await producer.disconnect();
    connected = false;
    producer = null;
    logger.info('Kafka producer disconnected');
  }
}

export function isProducerConnected(): boolean {
  return connected;
}
