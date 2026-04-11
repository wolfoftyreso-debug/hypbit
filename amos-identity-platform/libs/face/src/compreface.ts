import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import { ExternalProviderError } from '@amos/utils';
import { FaceMatchResult, FaceProvider, LivenessResult } from './provider';
import { computeTextureLivenessScore } from './liveness';

export interface CompreFaceConfig {
  url: string;
  apiKey: string;
  matchThreshold?: number;
}

/**
 * Thin client for CompreFace's verification endpoint.
 * https://github.com/exadel-inc/CompreFace
 */
export class CompreFaceProvider implements FaceProvider {
  private readonly http: AxiosInstance;
  private readonly threshold: number;

  constructor(private readonly cfg: CompreFaceConfig) {
    this.threshold = cfg.matchThreshold ?? 0.8;
    this.http = axios.create({
      baseURL: cfg.url,
      timeout: 15_000,
      headers: { 'x-api-key': cfg.apiKey },
    });
  }

  async match(reference: Buffer, probe: Buffer): Promise<FaceMatchResult> {
    try {
      const form = new FormData();
      form.append('source_image', reference, { filename: 'reference.jpg' });
      form.append('target_image', probe, { filename: 'probe.jpg' });

      const { data } = await this.http.post('/api/v1/verification/verify', form, {
        headers: form.getHeaders(),
      });

      const similarity = extractSimilarity(data);
      return {
        similarity,
        threshold: this.threshold,
        matched: similarity >= this.threshold,
      };
    } catch (err) {
      throw new ExternalProviderError('compreface', (err as Error).message);
    }
  }

  async detectLiveness(image: Buffer): Promise<LivenessResult> {
    // CompreFace CE doesn't ship liveness. We approximate with a texture
    // heuristic that catches obvious screen / printed-photo replays.
    // Production systems should plug in a dedicated liveness provider.
    const score = computeTextureLivenessScore(image);
    return {
      score,
      passed: score >= 0.6,
    };
  }
}

function extractSimilarity(response: unknown): number {
  const r = response as { result?: Array<{ face_matches?: Array<{ similarity: number }> }> };
  const first = r.result?.[0]?.face_matches?.[0]?.similarity;
  return typeof first === 'number' ? first : 0;
}
