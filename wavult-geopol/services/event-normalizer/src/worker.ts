import "dotenv/config";
import { Kafka, logLevel } from "kafkajs";
import { ulid } from "ulid";
import { TOPICS } from "./shared/topics.js";
import { SourceEventRawSchema } from "./shared/schemas.js";
import { classify } from "./classify.js";

const BROKERS = (process.env.KAFKA_BROKERS ?? "kafka:9092").split(",");
const CLIENT_ID = process.env.KAFKA_CLIENT_ID ?? "event-normalizer";
const GROUP_ID = process.env.KAFKA_GROUP_ID ?? "event-normalizer";

const kafka = new Kafka({
  clientId: CLIENT_ID,
  brokers: BROKERS,
  logLevel: logLevel.NOTHING,
});

async function main() {
  const consumer = kafka.consumer({ groupId: GROUP_ID });
  const producer = kafka.producer({ allowAutoTopicCreation: true });

  await consumer.connect();
  await producer.connect();
  await consumer.subscribe({ topic: TOPICS.RAW_EVENTS, fromBeginning: false });

  console.log(`[event-normalizer] subscribed to ${TOPICS.RAW_EVENTS}`);

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      let parsed: unknown;
      try {
        parsed = JSON.parse(message.value.toString());
      } catch {
        console.warn("[event-normalizer] non-json message, skipping");
        return;
      }
      const rawResult = SourceEventRawSchema.safeParse(parsed);
      if (!rawResult.success) {
        console.warn("[event-normalizer] schema fail:", rawResult.error.flatten());
        return;
      }
      const normalized = classify(rawResult.data, () => ulid());

      await producer.send({
        topic: TOPICS.EVENTS_NORMALIZED,
        messages: [
          {
            key: normalized.event_id,
            value: JSON.stringify(normalized),
          },
        ],
      });

      console.log(
        `[event-normalizer] ${normalized.event_type} / ${normalized.impact_level} — ${normalized.title}`
      );
    },
  });

  const shutdown = async (sig: string) => {
    console.log(`[event-normalizer] received ${sig}`);
    try {
      await consumer.disconnect();
      await producer.disconnect();
    } catch {
      /* ignore */
    }
    process.exit(0);
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
