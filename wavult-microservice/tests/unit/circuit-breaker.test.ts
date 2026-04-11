import { CircuitBreaker } from '../../src/utils/circuit-breaker';

describe('CircuitBreaker', () => {
  it('closes on success', async () => {
    const cb = new CircuitBreaker({ name: 'test', failureThreshold: 3, resetTimeoutMs: 100 });
    const result = await cb.execute(async () => 42);
    expect(result).toBe(42);
    expect(cb.getState()).toBe('closed');
  });

  it('opens after threshold failures', async () => {
    const cb = new CircuitBreaker({ name: 'test', failureThreshold: 2, resetTimeoutMs: 1000 });
    await expect(cb.execute(async () => { throw new Error('boom'); })).rejects.toThrow('boom');
    await expect(cb.execute(async () => { throw new Error('boom'); })).rejects.toThrow('boom');
    expect(cb.getState()).toBe('open');
    await expect(cb.execute(async () => 1)).rejects.toThrow('circuit_breaker_open');
  });

  it('transitions to half-open after reset timeout', async () => {
    const cb = new CircuitBreaker({ name: 'test', failureThreshold: 1, resetTimeoutMs: 20 });
    await expect(cb.execute(async () => { throw new Error('x'); })).rejects.toThrow();
    expect(cb.getState()).toBe('open');
    await new Promise((r) => setTimeout(r, 30));
    const result = await cb.execute(async () => 'ok');
    expect(result).toBe('ok');
    expect(cb.getState()).toBe('closed');
  });
});
