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

      // Look up context for every referenced person in one round-trip.
      const people = await lookupPeople(event.person_ids);

      // Evaluate each rule against every (person, event) pair. If an event
      // has no known people, we still evaluate rules once with person=null
      // so that person-agnostic rules (e.g. tag_any: ["regulation"]) can fire.
      const contexts: (PersonContext | null)[] = people.length > 0 ? people : [null];

      const rules = await store.list();
      if (rules.length === 0) return;

      // Dedupe: one alert per (rule_id, person_id). An event referencing
      // the same person twice or matching multiple rules should still
      // produce a clean set.
      const seen = new Set<string>();
      const alerts: Alert[] = [];

      for (const rule of rules) {
        for (const person of contexts) {
          const key = `${rule.id}::${person?.id ?? "__none__"}`;
          if (seen.has(key)) continue;

          if (!ruleMatches(rule, event, person)) continue;
          const score = computeAlertScore(event, person);
          const severity = severityFromScore(score);
          if (!severity) continue;

          seen.add(key);
          alerts.push({
            id: ulid(),
            ts: Date.now(),
            rule_id: rule.id,
            rule_name: rule.name,
            severity,
            alert_score: Math.round(score),
            matched_person_id: person?.id,
            matched_person_name: person?.name,
            matched_influence_score: person?.influence_score,
            matched_relevance_score: person?.relevance_score,
            event,
          });
        }
      }

      if (alerts.length === 0) return;

      await producer.send({
        topic: TOPICS.ALERTS_TRIGGERED,
        messages: alerts.map((a) => ({ key: a.id, value: JSON.stringify(a) })),
      });

      for (const a of alerts) {
        console.log(
          `[alert-engine] ${a.severity} score=${a.alert_score} rule=${a.rule_name} person=${a.matched_person_id ?? "-"} event=${event.event_id}`
        );
      }
    },
  });

  return async () => {
    await consumer.disconnect();
    await producer.disconnect();
  };
}
