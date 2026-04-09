// QueryUnderstandingEngine — pluggable contract for the intent +
// location + QVL extraction pipeline.
//
// The connector defines this single interface and ships four concrete
// engines. The route calls `engine.analyze(text, context)` — nothing
// else. Swapping engines is a feature flag, not a deploy.
//
//   KeywordEngine      — the Phase 4 rule-based fallback
//   HaikuEngine        — claude-haiku-4-5 with strict JSON schema
//   EmbeddingCacheEngine — wraps another engine with a Redis vector cache
//   ShadowEngine       — runs two engines in parallel, returns the
//                        primary's result but logs any divergence

import type { QVL } from '../models/qvl';
import type { IntentResult } from '../services/intent-classifier';

export interface EngineLocation {
  lat: number;
  lon: number;
  place: string;
  confidence: number;
}

export interface EngineContext {
  lat?: number | null;
  lon?: number | null;
  locale?: string;
  tenant_id?: string;
  trace_id?: string;
}

export interface EngineResult {
  intent: IntentResult;
  qvl: QVL;
  location: EngineLocation | null;
  took_ms: number;
  engine: string;
  cache_hit?: boolean;
}

export interface QueryUnderstandingEngine {
  readonly name: string;
  analyze(text: string, context: EngineContext): Promise<EngineResult>;
}
