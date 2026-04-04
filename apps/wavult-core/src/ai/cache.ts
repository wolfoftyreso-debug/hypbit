// ─── Response Cache ───────────────────────────────────────────────────────────
// In-memory cache med Redis-ready interface.
// Swap till Redis: byt getCached/setCache till ioredis-anrop mot REDIS_URL.

import crypto from 'crypto'

interface CacheEntry {
  value: string
  expires: number
}

// In-memory fallback — swap mot Redis vid skalning
const memCache = new Map<string, CacheEntry>()

function hashRequest(prompt: string, model: string, system?: string): string {
  return crypto.createHash('sha256')
    .update(`${model}:${system || ''}:${prompt}`)
    .digest('hex')
    .slice(0, 16)
}

/**
 * Hämtar cachat svar om det finns och inte gått ut.
 * Returnerar null om cache miss.
 */
export async function getCached(
  prompt: string,
  model: string,
  system?: string,
): Promise<string | null> {
  const key = hashRequest(prompt, model, system)
  const entry = memCache.get(key)
  if (entry && entry.expires > Date.now()) return entry.value
  if (entry) memCache.delete(key) // Rensa utgångna entries
  return null
}

/**
 * Sparar svar i cache med angiven TTL.
 * Rensar automatiskt gamla entries när cachen växer.
 */
export async function setCache(
  prompt: string,
  model: string,
  value: string,
  ttlSeconds = 3600,
  system?: string,
): Promise<void> {
  const key = hashRequest(prompt, model, system)
  memCache.set(key, { value, expires: Date.now() + ttlSeconds * 1000 })

  // Rensa gamla entries när cachen är stor
  if (memCache.size > 1000) {
    const now = Date.now()
    for (const [k, v] of memCache.entries()) {
      if (v.expires < now) memCache.delete(k)
    }
  }
}

/** Cache-statistik för monitoring */
export function getCacheStats(): { size: number; activeEntries: number } {
  const now = Date.now()
  let activeEntries = 0
  for (const v of memCache.values()) {
    if (v.expires > now) activeEntries++
  }
  return { size: memCache.size, activeEntries }
}
