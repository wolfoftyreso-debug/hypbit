/**
 * In-process HTTP smoke test for risk-service.
 * Boots the Nest app, overrides the Redis-backed DuplicateDetector with
 * an in-memory fake, and exercises the real controller -> service
 * -> scoring pipeline through supertest-style injection.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { RiskModule } from '../src/risk/risk.module';
import { DuplicateDetector } from '../src/risk/duplicate-detector';
import { HealthController } from '../src/common/health.controller';

class InMemoryDupes {
  private seen = new Set<string>();
  async isDuplicate(fp: string): Promise<boolean> {
    const dup = this.seen.has(fp);
    this.seen.add(fp);
    return dup;
  }
  onModuleInit(): void {
    /* no-op */
  }
}

describe('risk-service HTTP smoke', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [RiskModule],
      controllers: [HealthController],
    })
      .overrideProvider(DuplicateDetector)
      .useClass(InMemoryDupes)
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health/live returns 200', async () => {
    const server = app.getHttpServer();
    const res = await fetchInProcess(server, 'GET', '/health/live');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('risk-service');
  });

  it('POST /risk/score returns approve for a clean identity', async () => {
    const server = app.getHttpServer();
    const res = await fetchInProcess(server, 'POST', '/risk/score', {
      sessionId: '123e4567-e89b-12d3-a456-426614174000',
      document: {
        confidence: 0.95,
        fields: { documentNumber: 'P001', dateOfBirth: '1985-01-01' },
        validation: { valid: true, issues: [], expired: false, underAge: false },
      },
      face: {
        match: { similarity: 0.92, matched: true, threshold: 0.8 },
        liveness: { score: 0.9, passed: true },
      },
    });
    if (res.status !== 201) console.error('approve body:', JSON.stringify(res.body));
    expect(res.status).toBe(201);
    expect(res.body.decision).toBe('approve');
    expect(res.body.riskScore).toBeLessThan(35);
  });

  it('POST /risk/score rejects a mismatched face + underage', async () => {
    const server = app.getHttpServer();
    const res = await fetchInProcess(server, 'POST', '/risk/score', {
      sessionId: '223e4567-e89b-12d3-a456-426614174000',
      document: {
        confidence: 0.95,
        fields: { documentNumber: 'P002', dateOfBirth: '2020-01-01' },
        validation: { valid: false, issues: ['under 18'], expired: false, underAge: true },
      },
      face: {
        match: { similarity: 0.4, matched: false, threshold: 0.8 },
        liveness: { score: 0.2, passed: false },
      },
    });
    expect(res.status).toBe(201);
    expect(res.body.decision).toBe('reject');
    expect(res.body.riskScore).toBeGreaterThanOrEqual(70);
    expect(res.body.reasons.length).toBeGreaterThan(0);
  });

  it('POST /risk/score returns 400 for a malformed body', async () => {
    const server = app.getHttpServer();
    const res = await fetchInProcess(server, 'POST', '/risk/score', {
      sessionId: 'not-a-uuid',
      document: 'wrong',
      face: 'wrong',
    });
    expect(res.status).toBe(400);
  });
});

/**
 * Minimal in-process HTTP client that fires a request against a Node
 * http.Server instance without opening a real port.
 */
function fetchInProcess(
  server: any,
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const http = require('http');
    const listener = server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      const payload = body ? JSON.stringify(body) : undefined;
      const req = http.request(
        {
          host: '127.0.0.1',
          port,
          path,
          method,
          headers: {
            'content-type': 'application/json',
            ...(payload ? { 'content-length': Buffer.byteLength(payload) } : {}),
          },
        },
        (res: any) => {
          const chunks: Buffer[] = [];
          res.on('data', (c: Buffer) => chunks.push(c));
          res.on('end', () => {
            const text = Buffer.concat(chunks).toString('utf8');
            let parsed: any = text;
            try {
              parsed = JSON.parse(text);
            } catch {
              /* keep text */
            }
            server.close(() => resolve({ status: res.statusCode, body: parsed }));
          });
        },
      );
      req.on('error', (err: Error) => {
        server.close(() => reject(err));
      });
      if (payload) req.write(payload);
      req.end();
    });
    listener.on('error', reject);
  });
}
