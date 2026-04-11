import { Kafka, Producer, Consumer, EachMessagePayload, CompressionTypes, logLevel } from 'kafkajs';

export interface KafkaClientOptions {
  clientId: string;
  brokers: string[];
  ssl?: boolean;
}

export function createKafka(opts: KafkaClientOptions): Kafka {
  return new Kafka({
    clientId: opts.clientId,
    brokers: opts.brokers,
    ssl: opts.ssl ?? false,
    connectionTimeout: 5_000,
    requestTimeout: 30_000,
    retry: { initialRetryTime: 300, retries: 8 },
    logLevel: logLevel.WARN,
  });
}

export class KafkaProducer {
  private producer: Producer;
  private connected = false;

  constructor(kafka: Kafka) {
    this.producer = kafka.producer({ allowAutoTopicCreation: true, idempotent: true });
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    await this.producer.connect();
    this.connected = true;
  }

  async publish(topic: string, key: string, value: unknown, headers?: Record<string, string>): Promise<void> {
    await this.connect();
    await this.producer.send({
      topic,
      compression: CompressionTypes.GZIP,
      messages: [
        {
          key,
          value: Buffer.from(JSON.stringify(value)),
          headers,
        },
      ],
    });
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.producer.disconnect();
      this.connected = false;
    }
  }
}

export type KafkaMessageHandler = (payload: EachMessagePayload) => Promise<void>;

export class KafkaConsumer {
  private consumer: Consumer;
  private running = false;

  constructor(kafka: Kafka, groupId: string) {
    this.consumer = kafka.consumer({
      groupId,
      sessionTimeout: 30_000,
      heartbeatInterval: 3_000,
      allowAutoTopicCreation: true,
    });
  }

  async subscribe(topics: string[], handler: KafkaMessageHandler): Promise<void> {
    if (this.running) return;
    await this.consumer.connect();
    for (const topic of topics) {
      await this.consumer.subscribe({ topic, fromBeginning: false });
    }
    this.running = true;
    await this.consumer.run({
      autoCommit: true,
      eachMessage: handler,
    });
  }

  async disconnect(): Promise<void> {
    if (this.running) {
      await this.consumer.disconnect();
      this.running = false;
    }
  }
}

export function parseMessage<T>(payload: EachMessagePayload): T | null {
  if (!payload.message.value) return null;
  try {
    return JSON.parse(payload.message.value.toString()) as T;
  } catch {
    return null;
  }
}
