// Quality tiers — bronze / silver / gold with auto-escalation.
//
// Each tier has (a) minimum quality-score requirements a delivered
// image must meet and (b) a fallback rule that fires when the zoomer's
// delivery fails QC. Bronze fails → retry once, then silver. Silver
// fails → retry once, then gold. Gold fails → refund tokens.

import type { ImageAnnotations } from './image-understanding';

export type Tier = 'bronze' | 'silver' | 'gold';

export interface TierSpec {
  min_subject_match: number;
  min_quality: number;
  max_faces_detected: number;
  max_blur: boolean;
  max_attempts: number;
  escalates_to: Tier | null;
}

export const TIERS: Record<Tier, TierSpec> = {
  bronze: {
    min_subject_match: 0.6,
    min_quality: 0.55,
    max_faces_detected: 10,
    max_blur: true, // blur allowed
    max_attempts: 2,
    escalates_to: 'silver',
  },
  silver: {
    min_subject_match: 0.75,
    min_quality: 0.7,
    max_faces_detected: 5,
    max_blur: false,
    max_attempts: 2,
    escalates_to: 'gold',
  },
  gold: {
    min_subject_match: 0.88,
    min_quality: 0.85,
    max_faces_detected: 2,
    max_blur: false,
    max_attempts: 2,
    escalates_to: null,
  },
};

export interface QcResult {
  pass: boolean;
  failures: string[];
}

/** Evaluate an image against a tier spec. */
export function qc(
  annotations: ImageAnnotations,
  tier: Tier,
): QcResult {
  const spec = TIERS[tier];
  const failures: string[] = [];
  if (annotations.subject_match < spec.min_subject_match) {
    failures.push(
      `subject_match<${spec.min_subject_match.toFixed(2)}`,
    );
  }
  if (annotations.quality < spec.min_quality) {
    failures.push(`quality<${spec.min_quality.toFixed(2)}`);
  }
  if (annotations.faces_detected > spec.max_faces_detected) {
    failures.push(`faces>${spec.max_faces_detected}`);
  }
  if (!spec.max_blur && annotations.blur_detected) {
    failures.push('blur_detected');
  }
  return { pass: failures.length === 0, failures };
}

export interface EscalationDecision {
  action: 'accept' | 'retry' | 'escalate' | 'refund';
  next_tier?: Tier;
  attempts: number;
  failures: string[];
}

/**
 * Given the current tier, the QC result, and the attempt counter,
 * decide what to do next.
 */
export function decideEscalation(
  tier: Tier,
  attempts: number,
  qcResult: QcResult,
): EscalationDecision {
  if (qcResult.pass) {
    return { action: 'accept', attempts, failures: [] };
  }
  const spec = TIERS[tier];
  if (attempts < spec.max_attempts) {
    return {
      action: 'retry',
      attempts: attempts + 1,
      failures: qcResult.failures,
    };
  }
  if (spec.escalates_to) {
    return {
      action: 'escalate',
      next_tier: spec.escalates_to,
      attempts: 0,
      failures: qcResult.failures,
    };
  }
  return { action: 'refund', attempts, failures: qcResult.failures };
}
