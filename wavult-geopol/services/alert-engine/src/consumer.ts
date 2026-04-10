import { Kafka, logLevel, type Producer } from "kafkajs";
import { ulid } from "ulid";
import { TOPICS } from "./shared/topics.js";
import { EnrichedEventSchema, type Alert } from "./shared/schemas.js";
import {
  computeAlertScore,
  ruleMatches,
  severityFromScore,
  type PersonContext,
} from "./shared/rules.js";
import { RuleStore } from "./rule-store.js";
import { lookupPeople } from "./people-lookup.js";

const BROKERS = (process.env.KAFKA_BROKERS ?? "kafka:9092").split(",");
const CLIENT_ID = process.env.KAFKA_CLIENT_ID ?? "alert-engine";
const GROUP_ID = process.env.KAFKA_GROUP_ID ?? "alert-engine";

export async function startConsumer(store: RuleStore) {
  const kafka = new Kafka({
    clientId: CLIENT_ID,
    brokers: BROKERS,
    logLevel: logLevel.NOTHING,
  });

  const consumer = kafka.consumer({ groupId: GROUP_ID });
  const producer: Producer = kafka.producer({ allowAutoTopicCreation: true });

  await consumer.connect();
  await producer.connect();
  await consumer.subscribe({ topic: TOPICS.EVENTS_ENRICHED, fromBeginning: false });

  console.log(`[alert-engine] subscribed to ${TOPICS.EVENTS_ENRICHED}`);

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
      if (!result.success) {
        console.warn("[alert-engine] schema fail", result.error.flatten());
        return;
      }
      const event = result.data;

      // Look up person context for every person referenced by the event.
      const people = await lookupPeople(event.person_ids);
      const personByContext: PersonContext | null = people[0] ?? null;

      const rules = await store.list();
      if (rules.length === 0) return;

      const alerts: Alert[] = [];
      for (const rule of rules) {
        if (!ruleMatches(rule, event, personByContext)) continue;
        const score = computeAlertScore(event, personByContext);
        const severity = severityFromScore(score);
        if (!severity) continue;
        alerts.push({
          id: ulid(),
          ts: Date.now(),
          rule_id: rule.id,
          rule_name: rule.name,
          severity,
          alert_score: Math.round(score),
          matched_person_id: personByContext?.id,
          matched_person_name: personByContext?.name,
          matched_influence_score: personByContext?.influence_score,
          matched_relevance_score: personByContext?.relevance_score,
          event,
        });
      }

      if (alerts.length === 0) return;

      await producer.send({
        topic: TOPICS.ALERTS_TRIGGERED,
        messages: alerts.map((a) => ({ key: a.id, value: JSON.stringify(a) })),
      });

      for (const a of alerts) {
        console.log(
          `[alert-engine] ${a.severity} score=${a.alert_score} rule=${a.rule_name} event=${event.event_id}`
        );
      }
    },
  });

  return async () => {
    await consumer.disconnect();
    await producer.disconnect();
  };
}
