import { describe, expect, it } from 'vitest';

import { calculatePrice } from '../services/pricing';
import { defaultPipeline } from '../services/image-understanding';
import { buildQVL } from '../services/qvl-builder';

describe('calculatePrice', () => {
  it('returns the bronze base for a central Stockholm normal query at noon', () => {
    const p = calculatePrice({
      location: { lat: 59.3293, lon: 18.0686, radius_m: 100 },
      priority: 'normal',
      tier: 'bronze',
      now: new Date('2026-04-09T12:00:00Z'),
    });
    expect(p.tier).toBe('bronze');
    expect(p.base).toBe(49);
    expect(p.rarity).toBe(1);
    expect(p.urgency).toBe(1);
    // 12:00 UTC = 13:00 local CEST so noon multiplier still applies.
    expect(p.time_of_day).toBeGreaterThanOrEqual(1);
  });

  it('adds urgency and rarity for a remote high-priority gold query', () => {
    const p = calculatePrice({
      location: { lat: 67.85, lon: 20.22, radius_m: 100 },
      priority: 'high',
      tier: 'gold',
      now: new Date('2026-04-09T12:00:00Z'),
    });
    expect(p.tier).toBe('gold');
    expect(p.base).toBe(195);
    expect(p.urgency).toBe(1.5);
    expect(p.rarity).toBeGreaterThan(1);
    expect(p.total).toBeGreaterThan(p.base);
  });

  it('applies enterprise discount', () => {
    const base = calculatePrice({
      location: { lat: 59.33, lon: 18.07, radius_m: 100 },
      priority: 'normal',
      tier: 'silver',
      now: new Date('2026-04-09T12:00:00Z'),
    });
    const ent = calculatePrice({
      location: { lat: 59.33, lon: 18.07, radius_m: 100 },
      priority: 'normal',
      tier: 'silver',
      tenant_id: 'enterprise-openai',
      now: new Date('2026-04-09T12:00:00Z'),
    });
    expect(ent.total).toBeLessThan(base.total);
  });

  it('adds supply surge when zero zoomers are available', () => {
    const zero = calculatePrice({
      location: { lat: 59.33, lon: 18.07, radius_m: 100 },
      priority: 'normal',
      tier: 'bronze',
      supply: 0,
      now: new Date('2026-04-09T12:00:00Z'),
    });
    const ok = calculatePrice({
      location: { lat: 59.33, lon: 18.07, radius_m: 100 },
      priority: 'normal',
      tier: 'bronze',
      supply: 15,
      now: new Date('2026-04-09T12:00:00Z'),
    });
    expect(zero.total).toBeGreaterThan(ok.total);
  });
});

describe('ImagePipeline', () => {
  it('runs every stage and returns a full annotation set', async () => {
    const qvl = buildQVL({
      text: 'entrance',
      location: { lat: 59.33, lon: 18.07 },
    });
    const result = await defaultPipeline.process({
      task_id: 't1',
      url: 'https://example.test/img.jpg',
      captured_at: new Date().toISOString(),
      qvl,
    });
    expect(result.final_url).toBe('https://example.test/img.jpg');
    expect(result.subject_match).toBeGreaterThan(0);
    expect(result.took_ms).toBeGreaterThanOrEqual(0);
  });
});
