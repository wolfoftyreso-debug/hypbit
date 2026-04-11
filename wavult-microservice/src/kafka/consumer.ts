import { Consumer, EachMessagePayload } from 'kafkajs';
import { kafka } from './client';
import { config } from '../config';
import { logger } from '../logger';
import { kafkaMessagesConsumed } from '../metrics';

let consumer: Consumer | null = null;
let running = false;

export type MessageHandler = (payload: EachMessagePayload) => Promise<void>;

export async function startConsumer(topics: string[], handler: MessageHandler): Promise<void> {
  if (running) return;

  consumer = kafka.consumer({
    groupId: config.KAFKA_GROUP_ID,
    sessionTimeout: 30_000,
    heartbeatInterval: 3_000,
    allowAutoTopicCreation: false,
  });

  await consumer.connect();
  for (const topic of topics) {
    await consumer.subscribe({ topic, fromBeginning: false });
  }

  running = true;
  logger.info({ topics }, 'Kafka consumer subscribed');

  await consumer.run({
    autoCommit: false,
    eachMessage: async (payload) => {
      const { topic, partition, message } = payload;
      try {
        await handler(payload);
        kafkaMessagesConsumed.inc({ topic, status: 'ok' });
        await consumer!.commitOffsets([
          { topic, partition, offset: (Number(message.offset) + 1).toString() },
        ]);
      } catch (err) {
        kafkaMessagesConsumed.inc({ topic, status: 'error' });
        logger.error({ err, topic, partition, offset: message.offset }, 'consumer handler failed');
        // DLQ publishing omitted; handled in outbox retry pipeline.
      }
    },
  });
}

export async function stopConsumer(): Promise<void> {
  if (consumer && running) {
    await consumer.disconnect();
    running = false;
    consumer = null;
    logger.info('Kafka consumer disconnected');
  }
}

export function isConsumerRunning(): boolean {
  return running;
}
