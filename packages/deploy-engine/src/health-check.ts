import type { HealthResult } from './types.js';

/**
 * Check HTTP endpoint health.
 */
export async function checkHTTP(
  url: string,
  expectedStatus = 200,
  timeoutMs = 10_000,
): Promise<HealthResult> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    const latencyMs = Date.now() - start;
    const healthy = res.status === expectedStatus;

    return { healthy, statusCode: res.status, latencyMs };
  } catch (err) {
    return {
      healthy: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Retry a health check function until it returns healthy or maxAttempts is reached.
 */
export async function retryUntilHealthy(
  checkFn: () => Promise<HealthResult>,
  maxAttempts = 10,
  intervalMs = 6_000,
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    const result = await checkFn();
    if (result.healthy) return true;
    if (i < maxAttempts - 1) {
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }
  return false;
}

/**
 * Check Cloudflare Pages deployment health.
 */
export async function checkPages(
  healthCheckUrl: string,
): Promise<HealthResult> {
  return checkHTTP(healthCheckUrl, 200, 15_000);
}
