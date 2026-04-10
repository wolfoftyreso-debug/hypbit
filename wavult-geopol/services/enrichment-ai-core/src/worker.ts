import "dotenv/config";
import { Kafka, logLevel } from "kafkajs";

/**
 * Enrichment AI Core (stub).
 *
 * Consumes `person.created`, computes influence/relevance/summary, and
 * emits `person.enriched`. Replace the scoring stubs with real model
 * calls (OpenAI, Anthropic, local model) when wiring up the AI layer.
 */

const BROKERS = (process.env.KAFKA_BROKERS ?? "kafka:9092").split(",");
const CLIENT_ID = process.env.KAFKA_CLIENT_ID ?? "enrichment-ai-core";
const GROUP_ID = process.env.KAFKA_GROUP_ID ?? "enrichment-ai-core";

const kafka = new Kafka({
  clientId: CLIENT_ID,
  brokers: BROKERS,
  logLevel: logLevel.INFO,
});

type Person = {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
  influence_score?: number;
  relevance_score?: number;
  tags?: string[];
  summary?: string;
};

function scoreInfluence(p: Person): number {
  // Placeholder heuristic. Replace with a proper model.
  const base = p.influence_score ?? 0;
  const tagBoost = (p.tags?.length ?? 0) * 2;
  return Math.min(100, base + tagBoost);
}

function scoreRelevance(p: Person): number {
  const base = p.relevance_score ?? 0;
  const boost = (p.tags ?? []).includes("ai") ? 5 : 0;
  return Math.min(100, base + boost);
}

function summarize(p: Person): string {
  return p.summary ?? `${p.name} — ${(p.tags ?? []).join(", ") || "entity"}`;
}

async function main() {
  const consumer = kafka.consumer({ groupId: GROUP_ID });
  const producer = kafka.producer({ allowAutoTopicCreation: true });

  await consumer.connect();
  await producer.connect();
  await consumer.subscribe({ topic: "person.created", fromBeginning: false });

  console.log("[enrichment-ai-core] listening on person.created");

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      let envelope: { payload?: Person };
      try {
        envelope = JSON.parse(message.value.toString());
      } catch {
        return;
      }
      const person = envelope.payload;
      if (!person?.id) return;

      const enriched: Person = {
        ...person,
        influence_score: scoreInfluence(person),
        relevance_score: scoreRelevance(person),
        summary: summarize(person),
      };

      await producer.send({
        topic: "person.enriched",
        messages: [{ key: person.id, value: JSON.stringify({ ts: Date.now(), payload: enriched }) }],
      });
      console.log(`[enrichment-ai-core] enriched ${person.id}`);
    },
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
