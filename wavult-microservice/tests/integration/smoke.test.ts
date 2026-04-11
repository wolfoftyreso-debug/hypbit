/**
 * In-process smoke test using Fastify's inject() API. Exercises the
 * route tree, middlewares, error handler and metrics endpoint without
 * needing a live Postgres/Redis/Kafka.
 */
import { FastifyInstance } from 'fastify';

describe('wavult-microservice smoke (in-process)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    const { buildServer } = await import('../../src/server');
    app = await buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health/live returns 200', async () => {
    const res = await app.inject({ method: 'GET', url: '/health/live' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('ok');
    expect(body.service).toBe('wavult-microservice');
    expect(body.timestamp).toBeTruthy();
  });

  it('GET / returns service descriptor', async () => {
    const res = await app.inject({ method: 'GET', url: '/' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.service).toBe('wavult-microservice');
    expect(body.status).toBe('running');
  });

  it('GET /metrics returns Prometheus format', async () => {
    const res = await app.inject({ method: 'GET', url: '/metrics' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.body).toContain('http_requests_total');
  });

  it('GET /nope returns 404 with typed error envelope', async () => {
    const res = await app.inject({ method: 'GET', url: '/nope' });
    expect(res.statusCode).toBe(404);
    const body = JSON.parse(res.body);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('POST /v1/events rejects invalid payload', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/events',
      payload: { type: '', source: '' },
    });
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('propagates x-request-id header', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health/live',
      headers: { 'x-request-id': 'smoke-req-42' },
    });
    expect(res.headers['x-request-id']).toBe('smoke-req-42');
  });

  it('returns 503 on /health/ready without real deps', async () => {
    const res = await app.inject({ method: 'GET', url: '/health/ready' });
    expect(res.statusCode).toBe(503);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('not_ready');
    expect(body.checks.database).toBe('fail');
    expect(body.checks.redis).toBe('fail');
  });
});
