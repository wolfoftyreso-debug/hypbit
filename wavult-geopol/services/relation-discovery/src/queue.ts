/**
 * Single-worker queue with TTL dedupe. Both the scheduler and the
 * Kafka consumer push person ids into here; a background worker
 * pulls them one at a time and runs discovery. This prevents
 * event storms from hammering Claude and Neo4j.
 */
import { discoverForPerson } from "./discoverer.js";
import { publish } from "./kafka.js";
import { TOPICS } from "./shared/topics.js";

const seen = new Map<string, number>();
const DEDUPE_WINDOW_MS = 10 * 60 * 1000;

const queue: string[] = [];
let running = false;
let stopped = false;

export function enqueue(personId: string): void {
  if (stopped) return;
  const now = Date.now();
  const last = seen.get(personId);
  if (last !== undefined && now - last < DEDUPE_WINDOW_MS) return;
  seen.set(personId, now);
  if (!queue.includes(personId)) queue.push(personId);
  if (!running) void drain();
}

async function drain(): Promise<void> {
  if (running) return;
  running = true;
  try {
    while (queue.length > 0 && !stopped) {
      const id = queue.shift()!;
      try {
        const relations = await discoverForPerson(id);
        for (const rel of relations) {
          console.log(
            `[relation-discovery] ${rel.person_a_id} ↔ ${rel.person_b_id} ${rel.kind} strength=${rel.strength} confidence=${rel.confidence.toFixed(2)}`
          );
          await publish(TOPICS.RELATION_DISCOVERED, rel, rel.id);
        }
      } catch (err) {
        console.warn(`[relation-discovery] error for ${id}:`, (err as Error).message);
      }
    }
  } finally {
    running = false;
  }
}

export function queueSize(): number {
  return queue.length;
}

export function stop(): void {
  stopped = true;
}
