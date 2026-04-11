import { Kafka, Producer, logLevel } from "kafkajs";
import { config } from "./config.js";
import { TOPICS } from "./shared/topics.js";
import type { AgentTask } from "./shared/schemas.js";

const kafka = new Kafka({
  clientId: config.KAFKA_CLIENT_ID,
  brokers: config.KAFKA_BROKERS.split(",").map((b) => b.trim()),
  logLevel: logLevel.NOTHING,
});

let producer: Producer | null = null;

export async function startKafka(): Promise<void> {
  try {
    producer = kafka.producer({ allowAutoTopicCreation: true });
    await producer.connect();
  } catch (err) {
    console.warn(`[agent] kafka connect failed: ${(err as Error).message}; dropping events`);
    producer = null;
  }
}

export async function publishTasks(tasks: AgentTask[]): Promise<void> {
  if (!producer || tasks.length === 0) return;
  try {
    await producer.send({
      topic: TOPICS.AGENT_TASKS_CREATED,
      messages: tasks.map((t) => ({ key: t.id, value: JSON.stringify(t) })),
    });
  } catch (err) {
    console.warn("[agent] publish failed:", (err as Error).message);
  }
}

export async function stopKafka(): Promise<void> {
  if (producer) {
    try {
      await producer.disconnect();
    } catch {
      /* ignore */
    }
    producer = null;
  }
}
