import { FaceMatchResult, FaceProvider, LivenessResult } from './provider';

export class MockFaceProvider implements FaceProvider {
  constructor(private readonly overrides: { similarity?: number; liveness?: number } = {}) {}

  async match(_reference: Buffer, _probe: Buffer): Promise<FaceMatchResult> {
    const similarity = this.overrides.similarity ?? 0.92;
    return { similarity, threshold: 0.8, matched: similarity >= 0.8 };
  }

  async detectLiveness(_image: Buffer): Promise<LivenessResult> {
    const score = this.overrides.liveness ?? 0.85;
    return { score, passed: score >= 0.6 };
  }
}
