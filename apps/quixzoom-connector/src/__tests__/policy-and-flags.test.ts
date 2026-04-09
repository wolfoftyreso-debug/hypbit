import { beforeEach, describe, expect, it } from 'vitest';

import { evaluate, __setPolicyState } from '../services/policy';
import { buildQVL } from '../services/qvl-builder';
import { getFlags, __setFlags } from '../services/feature-flags';

describe('policy.evaluate', () => {
  beforeEach(() => {
    __setPolicyState({
      zones: [
        {
          name: 'Test school',
          lat: 59.34,
          lon: 18.05,
          radius_m: 200,
          type: 'school',
        },
      ],
      suspended_tenants: new Set(['badtenant']),
      max_radius_m: 10_000,
    });
  });

  it('denies a task that overlaps a no-capture zone', () => {
    const qvl = buildQVL({ text: 'park' });
    const result = evaluate({
      qvl,
      location: { lat: 59.34, lon: 18.05, radius_m: 50 },
    });
    expect(result.allowed).toBe(false);
    expect(result.deny_reason).toMatch(/location_inside_zone/);
  });

  it('allows a task far from any zone', () => {
    const qvl = buildQVL({ text: 'park' });
    const result = evaluate({
      qvl,
      location: { lat: 55.605, lon: 13.0038, radius_m: 100 },
    });
    expect(result.allowed).toBe(true);
  });

  it('denies suspended tenants', () => {
    const qvl = buildQVL({ text: 'park' });
    const result = evaluate({
      qvl,
      location: { lat: 55.605, lon: 13.0038, radius_m: 100 },
      tenant_id: 'badtenant',
    });
    expect(result.allowed).toBe(false);
    expect(result.deny_reason).toBe('tenant_suspended');
  });

  it('warns on crowd subject without consent scope', () => {
    const qvl = buildQVL({ text: 'crowd' });
    const result = evaluate({
      qvl,
      location: { lat: 55.605, lon: 13.0038, radius_m: 100 },
    });
    expect(result.allowed).toBe(true);
    expect(
      result.decisions.some(
        (d) => d.rule === 'gdpr-face-consent' && d.effect === 'warn',
      ),
    ).toBe(true);
  });

  it('denies radii over the cap', () => {
    const qvl = buildQVL({ text: 'park' });
    const result = evaluate({
      qvl,
      location: { lat: 55.605, lon: 13.0038, radius_m: 100 },
    });
    expect(result.allowed).toBe(false);
    expect(result.deny_reason).toBe('radius_too_large');
  });
});

describe('feature flags', () => {
  it('returns defaults when no overrides', () => {
    __setFlags({ engine: 'keyword' });
    const f = getFlags();
    expect(f.engine).toBe('keyword');
  });

  it('applies tenant override when present', () => {
    __setFlags({
      engine: 'keyword',
      overrides: { 'tenant:enterprise-x': { engine: 'haiku' } },
    });
    expect(getFlags('enterprise-x').engine).toBe('haiku');
    expect(getFlags('other').engine).toBe('keyword');
  });
});
