import { beforeEach, describe, expect, it } from 'vitest';

import {
  __resetCostAttribution,
  recordRevenue,
  setBudget,
  summaryFor,
  summaryAll,
  isThrottled,
} from '../services/cost-attribution';
import {
  __resetWebhooks,
  registerWebhook,
  dispatchEvent,
} from '../services/webhooks';

describe('cost-attribution', () => {
  beforeEach(() => __resetCostAttribution());

  it('returns null for an unknown tenant', () => {
    expect(summaryFor('nope')).toBeNull();
  });

  it('accumulates revenue and queries', () => {
    recordRevenue('ten-a', 100);
    recordRevenue('ten-a', 50);
    const s = summaryFor('ten-a');
    expect(s?.revenue_sek).toBe(150);
    expect(s?.queries).toBe(2);
    expect(s?.cost_sek).toBeGreaterThan(0);
    expect(s?.margin_sek).toBeLessThan(150);
  });

  it('sorts summaryAll by revenue descending', () => {
    recordRevenue('ten-a', 100);
    recordRevenue('ten-b', 300);
    recordRevenue('ten-c', 50);
    const all = summaryAll();
    expect(all[0].tenant_id).toBe('ten-b');
    expect(all[2].tenant_id).toBe('ten-c');
  });

  it('throttles when cost >= 90 % of budget', () => {
    // Budget is 0.05 SEK; a single request costs ~0.063 SEK so the
    // tenant crosses the 90% threshold immediately.
    setBudget('ten-d', 0.05);
    recordRevenue('ten-d', 10);
    expect(isThrottled('ten-d')).toBe(true);
  });

  it('does not throttle without a budget', () => {
    recordRevenue('ten-e', 10);
    expect(isThrottled('ten-e')).toBe(false);
  });
});

describe('webhooks', () => {
  beforeEach(() => __resetWebhooks());

  it('dispatches only to subscriptions that match the event', async () => {
    const received: Array<{ event: string; url: string }> = [];
    const server = await import('http').then((http) =>
      http.createServer((req, res) => {
        let body = '';
        req.on('data', (c: Buffer) => (body += c.toString()));
        req.on('end', () => {
          received.push({
            event: (req.headers['x-event'] as string) ?? '',
            url: (req.url as string) ?? '',
          });
          res.statusCode = 200;
          res.end();
        });
      }),
    );
    await new Promise<void>((r) => server.listen(0, r));
    const addr = server.address() as { port: number };

    registerWebhook({
      tenant_id: 'ten',
      url: `http://127.0.0.1:${addr.port}/hook-capture`,
      secret: 'k',
      events: ['TASK_CAPTURED'],
    });
    registerWebhook({
      tenant_id: 'ten',
      url: `http://127.0.0.1:${addr.port}/hook-complete`,
      secret: 'k',
      events: ['TASK_COMPLETED'],
    });

    await dispatchEvent('ten', 'TASK_CAPTURED', { task_id: 't1' });

    expect(received.length).toBe(1);
    expect(received[0].url).toBe('/hook-capture');

    await new Promise<void>((r) => server.close(() => r()));
  });
});
