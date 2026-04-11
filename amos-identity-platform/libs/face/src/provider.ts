export interface FaceMatchResult {
  similarity: number;      // 0..1
  matched: boolean;
  threshold: number;
}

export interface LivenessResult {
  score: number;           // 0..1
  passed: boolean;
}

export interface FaceProvider {
  match(reference: Buffer, probe: Buffer): Promise<FaceMatchResult>;
  detectLiveness(image: Buffer): Promise<LivenessResult>;
}
