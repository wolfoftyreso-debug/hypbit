import Redis from "ioredis";
import { AlertRuleSchema, BASE_RULE, type AlertRule } from "./shared/rules.js";

const KEY = "alert-engine:rules";

export class RuleStore {
  constructor(private readonly redis: Redis) {}

  async init(): Promise<void> {
    const existing = await this.redis.hlen(KEY);
    if (existing === 0) {
      await this.put(BASE_RULE);
    }
  }

  async list(): Promise<AlertRule[]> {
    const entries = await this.redis.hvals(KEY);
    return entries
      .map((raw) => {
        try {
          return AlertRuleSchema.parse(JSON.parse(raw));
        } catch {
          return null;
        }
      })
      .filter((r): r is AlertRule => r !== null);
  }

  async put(rule: AlertRule): Promise<void> {
    const parsed = AlertRuleSchema.parse(rule);
    await this.redis.hset(KEY, parsed.id, JSON.stringify(parsed));
  }

  async delete(id: string): Promise<boolean> {
    const removed = await this.redis.hdel(KEY, id);
    return removed > 0;
  }
}
