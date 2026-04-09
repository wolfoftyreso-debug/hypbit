// Engine factory — builds the QueryUnderstandingEngine stack from
// runtime config. Feature-flag driven (QUERY_ENGINE env var):
//
//   keyword                 → just the keyword engine (default, no deps)
//   haiku                   → Haiku with keyword fallback
//   cached-haiku            → cache(Haiku with keyword fallback)
//   shadow                  → primary=haiku, shadow=keyword
//   cached-shadow           → cache(shadow(haiku, keyword))

import type Redis from 'ioredis';

import { getRedis } from '../utils/redis';
import { KeywordEngine } from './keyword-engine';
import { HaikuEngine } from './haiku-engine';
import { EmbeddingCacheEngine } from './embedding-cache-engine';
import { ShadowEngine } from './shadow-engine';
import type { QueryUnderstandingEngine } from './index';

export function buildEngine(): QueryUnderstandingEngine {
  const mode = (process.env.QUERY_ENGINE ?? 'keyword').toLowerCase();
  const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
  // NOTE: we pass `getRedis` (the function) not `getRedis()` (the
  // current value). This closes the boot-race where buildEngine() runs
  // before initRedis() completes — the cache engine checks the live
  // connection state on every call instead of capturing null forever.
  const redisSupplier: () => Redis | null = () => getRedis();
  const keyword = new KeywordEngine();

  if (mode === 'keyword' || !apiKey) {
    return keyword;
  }

  const haiku = new HaikuEngine({ apiKey, fallback: keyword });

  if (mode === 'haiku') return haiku;

  if (mode === 'cached-haiku') {
    return new EmbeddingCacheEngine({ inner: haiku, getRedis: redisSupplier });
  }

  if (mode === 'shadow') {
    return new ShadowEngine({ primary: haiku, shadow: keyword });
  }

  if (mode === 'cached-shadow') {
    return new EmbeddingCacheEngine({
      inner: new ShadowEngine({ primary: haiku, shadow: keyword }),
      getRedis: redisSupplier,
    });
  }

  return keyword;
}
