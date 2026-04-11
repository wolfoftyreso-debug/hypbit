export interface RetryOptions {
  retries: number;
  baseMs: number;
  maxMs?: number;
  shouldRetry?: (err: unknown) => boolean;
}

export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions): Promise<T> {
  let attempt = 0;
  let lastErr: unknown;
  const maxMs = opts.maxMs ?? 10_000;

  while (attempt <= opts.retries) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (opts.shouldRetry && !opts.shouldRetry(err)) throw err;
      if (attempt === opts.retries) break;
      const delay = Math.min(opts.baseMs * Math.pow(2, attempt), maxMs);
      await new Promise((r) => setTimeout(r, delay));
      attempt += 1;
    }
  }
  throw lastErr;
}
