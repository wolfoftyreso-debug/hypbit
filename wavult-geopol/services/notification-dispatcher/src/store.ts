import Redis from "ioredis";
import type { Notification } from "./shared/schemas.js";

const KEY = "notifications:recent";
const MAX = 200;

export class NotificationStore {
  constructor(private readonly redis: Redis) {}

  async push(n: Notification): Promise<void> {
    await this.redis
      .multi()
      .lpush(KEY, JSON.stringify(n))
      .ltrim(KEY, 0, MAX - 1)
      .publish("notifications:channel", JSON.stringify(n))
      .exec();
  }
}
