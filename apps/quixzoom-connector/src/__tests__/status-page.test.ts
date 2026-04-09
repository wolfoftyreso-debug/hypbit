import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { AddressInfo } from 'net';
import type { Server } from 'http';

import { buildApp } from '../index';
import { __resetTaskManager } from '../services/task-manager';

let server: Server;
let baseUrl: string;

beforeEach(async () => {
  __resetTaskManager();
  const app = buildApp({
    isRedisReady: () => false,
    isKafkaReady: () => false,
  });
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });
  const addr = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${addr.port}`;
});

afterEach(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('GET /status', () => {
  it('serves the HTML status page', async () => {
    const res = await fetch(`${baseUrl}/status`);
    expect(res.status).toBe(200);
    const ct = res.headers.get('content-type') ?? '';
    expect(ct).toContain('text/html');
    const body = await res.text();
    expect(body).toContain('<title>quiXzoom Connector');
    expect(body).toContain('Readiness checks');
    expect(body).toContain('Latency (ms)');
    expect(body).toContain("fetch('/metrics')");
  });

  it('sets Cache-Control: no-cache', async () => {
    const res = await fetch(`${baseUrl}/status`);
    expect(res.headers.get('cache-control')).toContain('no-cache');
  });
});
