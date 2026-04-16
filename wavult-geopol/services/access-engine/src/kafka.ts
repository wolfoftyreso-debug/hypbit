import { Kafka, Consumer, Producer, logLevel } from "kafkajs";
import { config } from "./config.js";
import { TOPICS } from "./shared/topics.js";
import { EnrichedEventSchema, NormalizedEventSchema, type AccessScore } from "./shared/schemas.js";
import { evaluate } from "./evaluator.js";

const kafka = new Kafka({
  clientId: config.KAFKA_CLIENT_ID,
  brokers: config.KAFKA_BROKERS.split(",").map((b) => b.trim()),
  logLevel: logLevel.NOTHING,
});

let consumer: Consumer | null = null;
let producer: Producer | null = null;

export async function startKafka(): Promise<void> {
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
        const shape =
          EnrichedEventSchema.safeParse(parsed).data ??
          NormalizedEventSchema.safeParse(parsed).data;
        if (!shape) return;
        for (const pid of shape.person_ids) {
          try {
            const score = await evaluate(pid);
            await publishScore(score);
            console.log(
              `[access-engine] ${pid} → ${(score.probability * 100).toFixed(0)}% (${score.band})`
            );
          } catch (err) {
            console.warn(`[access-engine] evaluate ${pid} failed:`, (err as Error).message);
          }
        }
      },
    });
  } catch (err) {
    console.warn(
      `[access-engine] kafka connect failed: ${(err as Error).message}; operating HTTP-only`
    );
    consumer = null;
    producer = null;
  }
}

export async function publishScore(score: AccessScore): Promise<void> {
  if (!producer) return;
  try {
    await producer.send({
      topic: TOPICS.ACCESS_SCORES_UPDATED,
      messages: [{ key: score.target_person_id, value: JSON.stringify(score) }],
    });
  } catch (err) {
    console.warn("[access-engine] publish failed:", (err as Error).message);
  }
}

export async function stopKafka(): Promise<void> {
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
}
