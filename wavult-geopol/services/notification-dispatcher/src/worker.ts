import "dotenv/config";
import { Kafka, logLevel, type Producer } from "kafkajs";
import Redis from "ioredis";
import { ulid } from "ulid";
import { TOPICS } from "./shared/topics.js";
import { AlertSchema, ActionSchema, type Notification } from "./shared/schemas.js";
import { NotificationStore } from "./store.js";

const BROKERS = (process.env.KAFKA_BROKERS ?? "kafka:9092").split(",");
const CLIENT_ID = process.env.KAFKA_CLIENT_ID ?? "notification-dispatcher";
const GROUP_ID = process.env.KAFKA_GROUP_ID ?? "notification-dispatcher";
const REDIS_URL = process.env.REDIS_URL ?? "redis://redis:6379";

const redis = new Redis(REDIS_URL, { lazyConnect: false, maxRetriesPerRequest: 3 });
const store = new NotificationStore(redis);

const kafka = new Kafka({
  clientId: CLIENT_ID,
  brokers: BROKERS,
  logLevel: logLevel.NOTHING,
});

async function main() {
  const consumer = kafka.consumer({ groupId: GROUP_ID });
  const producer: Producer = kafka.producer({ allowAutoTopicCreation: true });

  await consumer.connect();
  await producer.connect();
  await consumer.subscribe({ topic: TOPICS.ALERTS_TRIGGERED, fromBeginning: false });
  await consumer.subscribe({ topic: TOPICS.ACTIONS_GENERATED, fromBeginning: false });

  console.log(
    `[notification-dispatcher] subscribed to ${TOPICS.ALERTS_TRIGGERED}, ${TOPICS.ACTIONS_GENERATED}`
  );

  async function emit(n: Notification) {
    await store.push(n);
    await producer.send({
      topic: TOPICS.NOTIFICATION_CREATED,
      messages: [{ key: n.id, value: JSON.stringify(n) }],
    });
    console.log(`[notification-dispatcher] ${n.kind} ${n.severity} — ${n.title}`);
  }

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      if (!message.value) return;
      let parsed: unknown;
      try {
        parsed = JSON.parse(message.value.toString());
      } catch {
        return;
      }

      if (topic === TOPICS.ALERTS_TRIGGERED) {
        const r = AlertSchema.safeParse(parsed);
        if (!r.success) return;
        const alert = r.data;
        await emit({
          id: ulid(),
          ts: Date.now(),
          kind: "ALERT",
          severity: alert.severity,
          title:
            alert.severity === "CRITICAL"
              ? `🚨 ${alert.matched_person_name ?? alert.event.entity_id ?? "Entity"} — ${alert.event.title}`
              : `${alert.matched_person_name ?? alert.event.entity_id ?? "Entity"} — ${alert.event.title}`,
          body: alert.event.enrichment.summary,
          alert,
          read: false,
        });
      } else if (topic === TOPICS.ACTIONS_GENERATED) {
        const r = ActionSchema.safeParse(parsed);
        if (!r.success) return;
        const action = r.data;
        await emit({
          id: ulid(),
          ts: Date.now(),
          kind: "ACTION",
          severity: action.priority,
          title: action.title,
          body: action.description,
          action,
          read: false,
        });
      }
    },
  });

  const shutdown = async (sig: string) => {
    console.log(`[notification-dispatcher] received ${sig}`);
    try {
      await consumer.disconnect();
      await producer.disconnect();
      await redis.quit();
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
