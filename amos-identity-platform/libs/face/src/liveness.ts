/**
 * Heuristic liveness scoring.
 *
 * Real liveness requires ML models. As a stand-in for a production model
 * we compute a simple entropy proxy over the raw image bytes: printed
 * photos and flat screen replays tend to have lower byte entropy than a
 * genuine camera capture (noise in the sensor). This is intentionally
 * simple and pluggable — replace with iBeta-level provider in prod.
 */
export function computeTextureLivenessScore(image: Buffer): number {
  if (image.length === 0) return 0;
  const freq = new Uint32Array(256);
  for (let i = 0; i < image.length; i++) freq[image[i]]++;

  const len = image.length;
  let entropy = 0;
  for (let i = 0; i < 256; i++) {
    if (freq[i] === 0) continue;
    const p = freq[i] / len;
    entropy -= p * Math.log2(p);
  }
  // normalize to 0..1 (max entropy of 8 bits = 8)
  return Math.min(1, Math.max(0, entropy / 8));
}
