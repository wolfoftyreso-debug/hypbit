// Redis-backed TaskStore. Hot path only — PostgreSQL persistence lives
// in the existing quiXzoom backend and is not duplicated here. The
// connector writes the authoritative task record into PostgreSQL via
// wavult-core's API in a later iteration; for now Redis is the source
// of truth within the connector.

import type Redis from 'ioredis';

import type { Task } from '../models/task';
import type { TaskStore } from './task-manager';

const KEY_PREFIX = 'task:';
const TTL_SECONDS = 24 * 3600;

export class RedisTaskStore implements TaskStore {
  constructor(private readonly redis: Redis) {}

  async save(task: Task): Promise<void> {
    await this.redis.set(
      KEY_PREFIX + task.task_id,
      JSON.stringify(task),
      'EX',
      TTL_SECONDS,
    );
  }

  async get(task_id: string): Promise<Task | null> {
    const raw = await this.redis.get(KEY_PREFIX + task_id);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Task;
    } catch {
      return null;
    }
  }

  async update(task: Task): Promise<void> {
    await this.save(task);
  }
}
