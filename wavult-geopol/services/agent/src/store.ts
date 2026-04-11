import Redis from "ioredis";
import { config } from "./config.js";
import { AgentTaskSchema, AgentRunSchema, type AgentTask, type AgentRun } from "./shared/schemas.js";

const TASKS_KEY = "agent:tasks";
const TASKS_PER_PERSON = (id: string) => `agent:tasks:person:${id}`;
const RUNS_KEY = "agent:runs";
const MAX_TASKS = 500;
const MAX_RUNS = 100;

let redis: Redis | null = null;
export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(config.REDIS_URL, { lazyConnect: false, maxRetriesPerRequest: 3 });
  }
  return redis;
}

export async function pingRedis(): Promise<boolean> {
  try {
    return (await getRedis().ping()) === "PONG";
  } catch {
    return false;
  }
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

export async function saveTasks(tasks: AgentTask[]): Promise<void> {
  if (tasks.length === 0) return;
  const pipe = getRedis().multi();
  for (const t of tasks) {
    const payload = JSON.stringify(t);
    pipe.lpush(TASKS_KEY, payload);
    pipe.lpush(TASKS_PER_PERSON(t.target_person_id), payload);
  }
  pipe.ltrim(TASKS_KEY, 0, MAX_TASKS - 1);
  await pipe.exec();
}

function parse<T>(raw: string[], schema: { safeParse: (v: unknown) => { success: boolean; data?: T } }): T[] {
  const out: T[] = [];
  for (const s of raw) {
    try {
      const parsed = schema.safeParse(JSON.parse(s));
      if (parsed.success && parsed.data) out.push(parsed.data);
    } catch {
      /* skip */
    }
  }
  return out;
}

export async function recentTasks(limit = 50): Promise<AgentTask[]> {
  const raw = await getRedis().lrange(TASKS_KEY, 0, limit - 1);
  return parse(raw, AgentTaskSchema);
}

export async function tasksForPerson(personId: string, limit = 20): Promise<AgentTask[]> {
  const raw = await getRedis().lrange(TASKS_PER_PERSON(personId), 0, limit - 1);
  return parse(raw, AgentTaskSchema);
}

export async function saveRun(run: AgentRun): Promise<void> {
  await getRedis().multi().lpush(RUNS_KEY, JSON.stringify(run)).ltrim(RUNS_KEY, 0, MAX_RUNS - 1).exec();
}

export async function recentRuns(limit = 20): Promise<AgentRun[]> {
  const raw = await getRedis().lrange(RUNS_KEY, 0, limit - 1);
  return parse(raw, AgentRunSchema);
}
