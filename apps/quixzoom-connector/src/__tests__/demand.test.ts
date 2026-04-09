import { beforeEach, describe, expect, it } from 'vitest';

import {
  recordDemand,
  pressureFor,
  topCells,
  __resetDemand,
} from '../services/demand-forecaster';

describe('demand-forecaster', () => {
  beforeEach(() => {
    __resetDemand();
  });

  it('returns zero for an unseen cell', () => {
    const p = pressureFor(59.33, 18.07);
    expect(p.total_24h).toBe(0);
    expect(p.forecast_next_bucket).toBe(0);
  });

  it('counts recordings in the same cell', () => {
    recordDemand(59.33, 18.07);
    recordDemand(59.331, 18.071); // still same cell at 0.005° resolution
    recordDemand(59.33, 18.07);
    const p = pressureFor(59.33, 18.07);
    expect(p.total_24h).toBe(3);
  });

  it('keeps separate cells isolated', () => {
    recordDemand(59.33, 18.07);
    recordDemand(41.9, 12.49); // Rome
    expect(pressureFor(59.33, 18.07).total_24h).toBe(1);
    expect(pressureFor(41.9, 12.49).total_24h).toBe(1);
  });

  it('topCells returns cells sorted by total demand', () => {
    recordDemand(59.33, 18.07);
    recordDemand(59.33, 18.07);
    recordDemand(59.33, 18.07);
    recordDemand(41.9, 12.49);
    const top = topCells(5);
    expect(top.length).toBe(2);
    expect(top[0].total_24h).toBe(3);
    expect(top[1].total_24h).toBe(1);
  });
});
