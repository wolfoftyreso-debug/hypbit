import { Injectable, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { sha256 } from '@amos/crypto';

/**
 * Tracks seen document/person fingerprints to detect duplicate identities
 * across sessions. Uses Redis sets with a long TTL.
 */
@Injectable()
export class DuplicateDetector implements OnModuleInit {
  private redis!: Redis;
  private readonly ttlSeconds = 60 * 60 * 24 * 90; // 90 days

  onModuleInit(): void {
    this.redis = new Redis({
      host: process.env.REDIS_HOST ?? 'redis',
      port: Number(process.env.REDIS_PORT ?? 6379),
      keyPrefix: 'amos:risk:',
      lazyConnect: false,
      maxRetriesPerRequest: 3,
    });
  }

  async isDuplicate(fingerprint: string): Promise<boolean> {
    const key = `fp:${sha256(fingerprint)}`;
    const seen = await this.redis.exists(key);
    if (!seen) {
      await this.redis.set(key, '1', 'EX', this.ttlSeconds);
    }
    return seen === 1;
  }
}
