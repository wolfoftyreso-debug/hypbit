import { describe, expect, it } from 'vitest';

import { qc, decideEscalation, TIERS } from '../services/quality-tiers';
import type { ImageAnnotations } from '../services/image-understanding';

function good(): ImageAnnotations {
  return {
    subject_match: 0.95,
    quality: 0.9,
    people_count: 0,
    vehicles_count: 0,
    text_detected: [],
    exposure: 'ok',
    blur_detected: false,
    faces_detected: 0,
    license_plates_detected: 0,
    pii_blurred: false,
    final_url: 'u',
    deduped: false,
    took_ms: 10,
  };
}

describe('quality-tiers.qc', () => {
  it('passes a high-quality image at every tier', () => {
    const a = good();
    for (const tier of Object.keys(TIERS) as Array<keyof typeof TIERS>) {
      const r = qc(a, tier);
      expect(r.pass).toBe(true);
    }
  });

  it('fails gold but passes bronze on a mid image', () => {
    const a = { ...good(), subject_match: 0.7, quality: 0.65 };
    expect(qc(a, 'bronze').pass).toBe(true);
    expect(qc(a, 'gold').pass).toBe(false);
  });

  it('flags blur on silver but not on bronze', () => {
    const a = { ...good(), blur_detected: true };
    expect(qc(a, 'bronze').pass).toBe(true);
    expect(qc(a, 'silver').pass).toBe(false);
  });
});

describe('quality-tiers.decideEscalation', () => {
  it('accepts on a pass', () => {
    const r = decideEscalation('bronze', 0, { pass: true, failures: [] });
    expect(r.action).toBe('accept');
  });

  it('retries within the same tier before escalating', () => {
    const r = decideEscalation('bronze', 0, {
      pass: false,
      failures: ['quality<0.55'],
    });
    expect(r.action).toBe('retry');
    expect(r.attempts).toBe(1);
  });

  it('escalates bronze to silver after max attempts', () => {
    const r = decideEscalation(
      'bronze',
      TIERS.bronze.max_attempts,
      { pass: false, failures: ['x'] },
    );
    expect(r.action).toBe('escalate');
    expect(r.next_tier).toBe('silver');
  });

  it('refunds gold after max attempts with no escalation path', () => {
    const r = decideEscalation(
      'gold',
      TIERS.gold.max_attempts,
      { pass: false, failures: ['x'] },
    );
    expect(r.action).toBe('refund');
  });
});
