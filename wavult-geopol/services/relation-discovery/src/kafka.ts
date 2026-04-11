import { Kafka, Producer, logLevel, Consumer } from "kafkajs";
import { config } from "./config.js";
import { TOPICS } from "./shared/topics.js";
import { NormalizedEventSchema, EnrichedEventSchema } from "./shared/schemas.js";
import { enqueue } from "./queue.js";

const kafka = new Kafka({
  clientId: config.KAFKA_CLIENT_ID,
  brokers: config.KAFKA_BROKERS.split(",").map((b) => b.trim()),
  logLevel: logLevel.NOTHING,
});

let producer: Producer | null = null;
let consumer: Consumer | null = null;
let connected = false;

export async function connect(): Promise<void> {
  if (connected) return;
  try {
    producer = kafka.producer({ allowAutoTopicCreation: true });
    await producer.connect();

    consumer = kafka.consumer({ groupId: config.KAFKA_GROUP_ID });
    await consumer.connect();
    await consumer.subscribe({ topic: TOPICS.EVENTS_ENRICHED, fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;
        let parsed: unknown;
        try {
          parsed = JSON.parse(message.value.toString());
        } catch {
          return;
        }
        // Accept both normalized and enriched — either shape has
        // person_ids, which is all we care about here.
        const shape =
          EnrichedEventSchema.safeParse(parsed).data ??
          NormalizedEventSchema.safeParse(parsed).data;
        if (!shape) return;
        for (const pid of shape.person_ids) enqueue(pid);
      },
    });

    connected = true;
  } catch (err) {
    console.warn(
      `[relation-discovery] kafka connect failed: ${(err as Error).message}; operating HTTP-only`
    );
    producer = null;
    consumer = null;
    connected = false;
  }
}

export async function publish(topic: string, payload: unknown, key: string): Promise<void> {
  if (!connected || !producer) return;
  try {
    await producer.send({
      topic,
      messages: [{ key, value: JSON.stringify(payload) }],
    });
  } catch (err) {
    console.warn(`[relation-discovery] publish ${topic} failed:`, (err as Error).message);
  }
}

export async function disconnect(): Promise<void> {
  try {
    if (consumer) await consumer.disconnect();
  } catch {
    /* ignore */
  }
  try {
    if (producer) await producer.disconnect();
  } catch {
    /* ignore */
  }
  consumer = null;
  producer = null;
  connected = false;
}
