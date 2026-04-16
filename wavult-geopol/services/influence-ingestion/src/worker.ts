import "dotenv/config";
import { Kafka, logLevel, type Producer } from "kafkajs";
import { TOPICS } from "./shared/topics.js";
import type { SourceEventRaw } from "./shared/schemas.js";
import { fetchRss } from "./sources/rss.js";
import { mockSource } from "./sources/mock.js";

const BROKERS = (process.env.KAFKA_BROKERS ?? "kafka:9092").split(",");
const CLIENT_ID = process.env.KAFKA_CLIENT_ID ?? "influence-ingestion";
const POLL_MS = Number(process.env.INGESTION_POLL_MS ?? 60_000);
const RSS_FEEDS = (process.env.INGESTION_RSS_FEEDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const USE_MOCK = (process.env.INGESTION_USE_MOCK ?? "true") === "true";

const kafka = new Kafka({
  clientId: CLIENT_ID,
  brokers: BROKERS,
  logLevel: logLevel.NOTHING,
});

async function poll(producer: Producer) {
  const items: SourceEventRaw[] = [];

  for (const feed of RSS_FEEDS) {
    try {
      const batch = await fetchRss(feed);
      items.push(...batch);
      console.log(`[ingestion] rss ${feed} → ${batch.length} items`);
    } catch (err) {
      console.warn(`[ingestion] rss ${feed} failed:`, (err as Error).message);
    }
  }

  if (USE_MOCK) {
    const batch = mockSource();
    items.push(...batch);
    console.log(`[ingestion] mock → ${batch.length} items`);
  }

  if (items.length === 0) return;

  await producer.send({
    topic: TOPICS.RAW_EVENTS,
    messages: items.map((item) => ({
      key: item.id,
      value: JSON.stringify(item),
    })),
  });
  console.log(`[ingestion] published ${items.length} raw events`);
}

async function main() {
  const producer = kafka.producer({ allowAutoTopicCreation: true });
  await producer.connect();
  console.log(`[ingestion] started; poll every ${POLL_MS}ms; feeds=${RSS_FEEDS.length}; mock=${USE_MOCK}`);

  // Run once immediately, then on an interval.
  await poll(producer);
  const timer = setInterval(() => {
    poll(producer).catch((err) => console.error("[ingestion] poll error", err));
  }, POLL_MS);

  const shutdown = async (sig: string) => {
    console.log(`[ingestion] received ${sig}, shutting down`);
    clearInterval(timer);
    try {
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
