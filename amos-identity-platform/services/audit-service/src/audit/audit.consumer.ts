import { Injectable, Logger } from '@nestjs/common';
import { createKafka, KafkaConsumer, parseMessage } from '@amos/utils';
import { AuditService } from './audit.service';

const TOPICS = [
  'identity.created',
  'document.uploaded',
  'face.processed',
  'risk.completed',
  'identity.verified',
];

@Injectable()
export class AuditConsumer {
  private readonly logger = new Logger(AuditConsumer.name);
  private consumer: KafkaConsumer | null = null;

  constructor(private readonly audit: AuditService) {}

  async start(): Promise<void> {
    const kafka = createKafka({
      clientId: `${process.env.KAFKA_CLIENT_ID_PREFIX ?? 'amos'}-audit`,
      brokers: (process.env.KAFKA_BROKERS ?? 'kafka:29092').split(','),
    });

    this.consumer = new KafkaConsumer(kafka, 'amos-audit-consumer');
    await this.consumer.subscribe(TOPICS, async (payload) => {
      const parsed = parseMessage<Record<string, unknown>>(payload);
      if (!parsed) return;
      const sessionId = (parsed.sessionId as string) ?? (parsed.id as string) ?? null;
      try {
        await this.audit.append(payload.topic, sessionId, parsed);
      } catch (err) {
        this.logger.error(`failed to append audit entry: ${(err as Error).message}`);
      }
    });
    this.logger.log(`audit consumer subscribed to ${TOPICS.length} topics`);
  }

  async stop(): Promise<void> {
    if (this.consumer) await this.consumer.disconnect();
  }
}
