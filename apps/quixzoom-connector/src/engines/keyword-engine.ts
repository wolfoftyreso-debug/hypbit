// KeywordEngine — wraps the Phase 4 rule-based classifier, QVL builder,
// and location resolver into the QueryUnderstandingEngine contract.
// Used as the final fallback and as the shadow baseline.

import { detectIntent } from '../services/intent-classifier';
import { buildQVL } from '../services/qvl-builder';
import { resolveLocation } from '../services/location-resolver';
import type {
  EngineContext,
  EngineResult,
  QueryUnderstandingEngine,
} from './index';

export class KeywordEngine implements QueryUnderstandingEngine {
  readonly name = 'keyword';

  async analyze(
    text: string,
    context: EngineContext,
  ): Promise<EngineResult> {
    const started = Date.now();
    const intent = detectIntent(text);
    const location = await resolveLocation(text, context);
    const qvl = buildQVL({
      text,
      location: location
        ? { lat: location.lat, lon: location.lon }
        : undefined,
    });
    return {
      intent,
      qvl,
      location,
      took_ms: Date.now() - started,
      engine: this.name,
    };
  }
}
