import { Kafka, Producer, logLevel } from "kafkajs";
import { config } from "../config.js";
import { TOPICS } from "../shared/topics.js";

// Re-exported under the old name to preserve existing imports across
// the service. The single source of truth is ../shared/topics.ts,
// which in turn mirrors packages/events/src/topics.ts.
export const KAFKA_TOPICS = TOPICS;
export type KafkaTopic = (typeof TOPICS)[keyof typeof TOPICS];

let kafka: Kafka | null = null;
let producer: Producer | null = null;
let connected = false;

function getKafka(): Kafka {
  if (!kafka) {
    kafka = new Kafka({
      clientId: config.KAFKA_CLIENT_ID,
      brokers: config.KAFKA_BROKERS.split(",").map((b) => b.trim()),
      logLevel: logLevel.NOTHING,
    });
  }
  return kafka;
}

export async function connectKafka(): Promise<void> {
  if (!config.KAFKA_ENABLED) return;
  if (connected) return;
  try {
    producer = getKafka().producer({ allowAutoTopicCreation: true });
    await producer.connect();
    connected = true;
  } catch (err) {
    // Non-fatal: API stays up even if Kafka is unavailable.
    console.warn("[kafka] connect failed, events will be dropped:", (err as Error).message);
    connected = false;
    producer = null;
  }
}

export async function publish(topic: KafkaTopic, payload: unknown, key?: string): Promise<void> {
  if (!config.KAFKA_ENABLED || !producer || !connected) return;
  try {
    await producer.send({
      topic,
      messages: [
        {
          key: key ?? null,
          value: JSON.stringify({ ts: Date.now(), payload }),
        },
      ],
    });
  } catch (err) {
    console.warn(`[kafka] publish to ${topic} failed:`, (err as Error).message);
  }
}

export async function disconnectKafka(): Promise<void> {
  if (producer) {
    try {
      await producer.disconnect();
    } catch {
      /* ignore */
    }
    producer = null;
    connected = false;
  }
}
