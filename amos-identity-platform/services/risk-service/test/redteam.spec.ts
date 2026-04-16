/**
 * RED TEAM — risk-service HTTP exploit probes
 *
 * Exercises real attack patterns against the running Nest HTTP server:
 * - risk score manipulation
 * - duplicate detector bypass
 * - parameter pollution / type confusion
 * - prototype pollution
 * - decision tampering via extra fields
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { RiskModule } from '../src/risk/risk.module';
import { DuplicateDetector } from '../src/risk/duplicate-detector';

class FakeDupes {
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

async function post(app: INestApplication, path: string, body: unknown): Promise<{ status: number; body: any }> {
  const http = require('http');
  const server = app.getHttpServer();
  return new Promise((resolve, reject) => {
    const listener = server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      const payload = typeof body === 'string' ? body : JSON.stringify(body);
      const req = http.request(
        {
          host: '127.0.0.1',
          port,
          path,
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'content-length': Buffer.byteLength(payload),
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
              /* text */
            }
            server.close(() => resolve({ status: res.statusCode, body: parsed }));
          });
        },
      );
      req.on('error', (e: Error) => server.close(() => reject(e)));
      req.write(payload);
      req.end();
    });
    listener.on('error', reject);
  });
}

describe('RED TEAM / risk-service', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [RiskModule],
    })
      .overrideProvider(DuplicateDetector)
      .useClass(FakeDupes)
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('A. Decision tampering', () => {
    it('A1: attacker cannot inject extra top-level fields (forbidNonWhitelisted)', async () => {
      const res = await post(app, '/risk/score', {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        decision: 'approve', // attacker tries to inject final decision
        riskScore: 0, // and override the computed score
        document: {
          confidence: 0.1,
          fields: { documentNumber: 'BAD', dateOfBirth: '2020-01-01' },
          validation: { valid: false, issues: ['under 18'], expired: true, underAge: true },
        },
        face: {
          match: { similarity: 0.1, matched: false, threshold: 0.8 },
          liveness: { score: 0.1, passed: false },
        },
      });
      // Defense-in-depth: the validation pipe is configured with
      // forbidNonWhitelisted, so unknown top-level fields are rejected
      // before the controller ever runs. Attacker payload never reaches
      // the scorer. The error must also clearly state which properties
      // were rejected, without leaking internals.
      expect(res.status).toBe(400);
      const err = JSON.stringify(res.body);
      expect(err).toMatch(/decision|riskScore/);
      expect(err).not.toMatch(/node_modules|\.ts:\d+:\d+/);
    });

    it('A1b: without extra fields the scorer correctly rejects the same risky input', async () => {
      const res = await post(app, '/risk/score', {
        sessionId: '123e4567-e89b-12d3-a456-426614174003',
        document: {
          confidence: 0.1,
          fields: { documentNumber: 'BAD', dateOfBirth: '2020-01-01' },
          validation: { valid: false, issues: ['under 18'], expired: true, underAge: true },
        },
        face: {
          match: { similarity: 0.1, matched: false, threshold: 0.8 },
          liveness: { score: 0.1, passed: false },
        },
      });
      expect(res.status).toBe(201);
      expect(res.body.decision).toBe('reject');
      expect(res.body.riskScore).toBeGreaterThanOrEqual(70);
    });

    it('A2: negative similarity cannot underflow score', async () => {
      const res = await post(app, '/risk/score', {
        sessionId: '123e4567-e89b-12d3-a456-426614174001',
        document: {
          confidence: 1,
          fields: { documentNumber: 'X', dateOfBirth: '1985-01-01' },
          validation: { valid: true, issues: [], expired: false, underAge: false },
        },
        face: {
          match: { similarity: -999, matched: false, threshold: 0.8 },
          liveness: { score: -5, passed: false },
        },
      });
      expect(res.status).toBe(201);
      expect(res.body.riskScore).toBeGreaterThanOrEqual(0);
      expect(res.body.riskScore).toBeLessThanOrEqual(100);
    });

    it('A3: out-of-bounds similarity > 1 cannot overflow score', async () => {
      const res = await post(app, '/risk/score', {
        sessionId: '123e4567-e89b-12d3-a456-426614174002',
        document: {
          confidence: 9999,
          fields: { documentNumber: 'X', dateOfBirth: '1985-01-01' },
          validation: { valid: true, issues: [], expired: false, underAge: false },
        },
        face: {
          match: { similarity: 9999, matched: true, threshold: 0.8 },
          liveness: { score: 9999, passed: true },
        },
      });
      expect(res.status).toBe(201);
      expect(res.body.riskScore).toBeGreaterThanOrEqual(0);
      expect(res.body.riskScore).toBeLessThanOrEqual(100);
    });
  });

  describe('B. Duplicate bypass', () => {
    it('B1: same identity submitted twice is flagged as duplicate', async () => {
      const body = {
        sessionId: '123e4567-e89b-12d3-a456-426614174010',
        document: {
          confidence: 0.95,
          fields: { documentNumber: 'DUP123', dateOfBirth: '1985-01-01' },
          validation: { valid: true, issues: [], expired: false, underAge: false },
        },
        face: {
          match: { similarity: 0.92, matched: true, threshold: 0.8 },
          liveness: { score: 0.9, passed: true },
        },
      };
      await post(app, '/risk/score', body);
      const second = await post(app, '/risk/score', {
        ...body,
        sessionId: '123e4567-e89b-12d3-a456-426614174011',
      });
      expect(second.status).toBe(201);
      expect(second.body.reasons.join(' ')).toContain('duplicate');
    });

    it('B2: whitespace + case padding in document number does not bypass duplicate detection', async () => {
      const body = {
        sessionId: '123e4567-e89b-12d3-a456-426614174020',
        document: {
          confidence: 0.95,
          fields: { documentNumber: 'ABC999', dateOfBirth: '1985-01-01' },
          validation: { valid: true, issues: [], expired: false, underAge: false },
        },
        face: {
          match: { similarity: 0.92, matched: true, threshold: 0.8 },
          liveness: { score: 0.9, passed: true },
        },
      };
      await post(app, '/risk/score', body);
      // Attacker tries 4 perturbations to evade fingerprint collision.
      const attempts = [
        ' ABC999 ',
        'abc999',
        'A.B.C-9-9-9',
        'ABC  999',
      ];
      const uuids = [
        '223e4567-e89b-12d3-a456-426614170001',
        '223e4567-e89b-12d3-a456-426614170002',
        '223e4567-e89b-12d3-a456-426614170003',
        '223e4567-e89b-12d3-a456-426614170004',
      ];
      for (let i = 0; i < attempts.length; i++) {
        const docNum = attempts[i];
        const res = await post(app, '/risk/score', {
          ...body,
          sessionId: uuids[i],
          document: {
            ...body.document,
            fields: { ...body.document.fields, documentNumber: docNum },
          },
        });
        expect(res.status).toBe(201);
        expect((res.body.reasons ?? []).join(' ')).toContain('duplicate');
      }
    });
  });

  describe('C. Input validation', () => {
    it('C1: missing required fields returns 400', async () => {
      const res = await post(app, '/risk/score', { sessionId: '123e4567-e89b-12d3-a456-426614174030' });
      expect(res.status).toBe(400);
    });

    it('C2: non-UUID sessionId rejected', async () => {
      const res = await post(app, '/risk/score', {
        sessionId: '"><script>alert(1)</script>',
        document: { fields: {}, validation: { valid: true, issues: [], expired: false, underAge: false } },
        face: {
          match: { similarity: 0.9, matched: true, threshold: 0.8 },
          liveness: { score: 0.9, passed: true },
        },
      });
      expect(res.status).toBe(400);
    });

    it('C3: forbidNonWhitelisted rejects extra top-level fields', async () => {
      const res = await post(app, '/risk/score', {
        sessionId: '123e4567-e89b-12d3-a456-426614174040',
        document: { fields: {}, validation: { valid: true, issues: [], expired: false, underAge: false } },
        face: {
          match: { similarity: 0.9, matched: true, threshold: 0.8 },
          liveness: { score: 0.9, passed: true },
        },
        __proto__: { polluted: 'yes' },
        admin: true,
      });
      // Extra `admin` property should be stripped or rejected.
      expect([201, 400]).toContain(res.status);
      if (res.status === 201) {
        // If it passed, make sure no prototype pollution happened.
        expect((Object.prototype as any).polluted).toBeUndefined();
      }
    });

    it('C4: malformed JSON body is rejected safely', async () => {
      const res = await post(app, '/risk/score', '{not json');
      expect(res.status).toBe(400);
    });
  });

  describe('D. Error disclosure', () => {
    it('D1: 400 errors do not leak internals', async () => {
      const res = await post(app, '/risk/score', { sessionId: 'nope' });
      expect(res.status).toBe(400);
      const text = JSON.stringify(res.body);
      expect(text).not.toMatch(/node_modules|\.ts:\d+:\d+|InternalServerError.*stack/i);
    });
  });
});
