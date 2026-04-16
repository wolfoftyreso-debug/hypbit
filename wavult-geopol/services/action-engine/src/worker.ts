import "dotenv/config";
import { Kafka, logLevel } from "kafkajs";
import { TOPICS } from "./shared/topics.js";
import { AlertSchema } from "./shared/schemas.js";
import { generateActions } from "./generate.js";
import { closeNeo } from "./access-path.js";

const BROKERS = (process.env.KAFKA_BROKERS ?? "kafka:9092").split(",");
const CLIENT_ID = process.env.KAFKA_CLIENT_ID ?? "action-engine";
const GROUP_ID = process.env.KAFKA_GROUP_ID ?? "action-engine";

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
  await consumer.subscribe({ topic: TOPICS.ALERTS_TRIGGERED, fromBeginning: false });

  console.log(`[action-engine] subscribed to ${TOPICS.ALERTS_TRIGGERED}`);

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      let parsed: unknown;
      try {
        parsed = JSON.parse(message.value.toString());
      } catch {
        return;
      }
      const result = AlertSchema.safeParse(parsed);
      if (!result.success) {
        console.warn("[action-engine] schema fail", result.error.flatten());
        return;
      }
      const actions = await generateActions(result.data);
      if (actions.length === 0) return;

      await producer.send({
        topic: TOPICS.ACTIONS_GENERATED,
        messages: actions.map((a) => ({ key: a.id, value: JSON.stringify(a) })),
      });

      for (const a of actions) {
        console.log(`[action-engine] ${a.action_type} priority=${a.priority} — ${a.title}`);
      }
    },
  });

  const shutdown = async (sig: string) => {
    console.log(`[action-engine] received ${sig}`);
    try {
      await consumer.disconnect();
      await producer.disconnect();
      await closeNeo();
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
