import { Kafka, Consumer, Producer, logLevel } from "kafkajs";
import { config } from "./config.js";
import { TOPICS } from "./shared/topics.js";
import { EnrichedEventSchema, type DealOpportunity } from "./shared/schemas.js";
import { detectOpportunities } from "./rules.js";
import { getPerson } from "./db/neo4j.js";
import { push } from "./cache.js";

const kafka = new Kafka({
  clientId: config.KAFKA_CLIENT_ID,
  brokers: config.KAFKA_BROKERS.split(",").map((b) => b.trim()),
  logLevel: logLevel.NOTHING,
});

let consumer: Consumer | null = null;
let producer: Producer | null = null;

async function publishDeal(deal: DealOpportunity): Promise<void> {
  if (!producer) return;
  try {
    await producer.send({
      topic: TOPICS.DEALFLOW_DETECTED,
      messages: [{ key: deal.id, value: JSON.stringify(deal) }],
    });
  } catch (err) {
    console.warn("[deal-flow-engine] publish failed:", (err as Error).message);
  }
}

export async function start(): Promise<void> {
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
        const result = EnrichedEventSchema.safeParse(parsed);
        if (!result.success) return;
        const event = result.data;

        for (const pid of event.person_ids) {
          const person = await getPerson(pid);
          if (!person) continue;
          const deals = detectOpportunities(person, event);
          for (const deal of deals) {
            await push(deal);
            await publishDeal(deal);
            console.log(
              `[deal-flow-engine] ${deal.type} ${deal.priority} — ${deal.narrative}`
            );
          }
        }
      },
    });
  } catch (err) {
    console.warn(
      `[deal-flow-engine] kafka connect failed: ${(err as Error).message}; operating HTTP-only`
    );
    consumer = null;
    producer = null;
  }
}

export async function stop(): Promise<void> {
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
