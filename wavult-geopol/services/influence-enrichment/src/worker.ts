import "dotenv/config";
import { Kafka, logLevel } from "kafkajs";
import { TOPICS } from "./shared/topics.js";
import { NormalizedEventSchema, type EnrichedEvent } from "./shared/schemas.js";
import { analyze } from "./analyst.js";

const BROKERS = (process.env.KAFKA_BROKERS ?? "kafka:9092").split(",");
const CLIENT_ID = process.env.KAFKA_CLIENT_ID ?? "influence-enrichment";
const GROUP_ID = process.env.KAFKA_GROUP_ID ?? "influence-enrichment";

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
  await consumer.subscribe({ topic: TOPICS.EVENTS_NORMALIZED, fromBeginning: false });

  console.log(`[influence-enrichment] subscribed to ${TOPICS.EVENTS_NORMALIZED}`);

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      let parsed: unknown;
      try {
        parsed = JSON.parse(message.value.toString());
      } catch {
        return;
      }
      const result = NormalizedEventSchema.safeParse(parsed);
      if (!result.success) {
        console.warn("[influence-enrichment] schema fail", result.error.flatten());
        return;
      }

      const enrichment = await analyze(result.data);
      const enriched: EnrichedEvent = { ...result.data, enrichment };

      await producer.send({
        topic: TOPICS.EVENTS_ENRICHED,
        messages: [
          {
            key: enriched.event_id,
            value: JSON.stringify(enriched),
          },
        ],
      });

      console.log(
        `[influence-enrichment] ${enriched.event_id} → relevance=${enrichment.relevance_score} impact=${enrichment.impact_on_us}`
      );
    },
  });

  const shutdown = async (sig: string) => {
    console.log(`[influence-enrichment] received ${sig}`);
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
