import { logger } from '../logger';

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  name: string;
  failureThreshold: number;
  resetTimeoutMs: number;
}

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private nextAttempt = 0;

  constructor(private readonly opts: CircuitBreakerOptions) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`circuit_breaker_open:${this.opts.name}`);
      }
      this.state = 'half-open';
      logger.info({ name: this.opts.name }, 'circuit breaker half-open');
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    if (this.state !== 'closed') {
      logger.info({ name: this.opts.name }, 'circuit breaker closed');
    }
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failures += 1;
    if (this.failures >= this.opts.failureThreshold) {
      this.state = 'open';
      this.nextAttempt = Date.now() + this.opts.resetTimeoutMs;
      logger.warn({ name: this.opts.name, failures: this.failures }, 'circuit breaker opened');
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}
