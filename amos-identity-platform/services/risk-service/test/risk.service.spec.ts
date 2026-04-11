import { RiskService } from '../src/risk/risk.service';
import { DuplicateDetector } from '../src/risk/duplicate-detector';

class FakeDupes {
  private seen = new Set<string>();
  async isDuplicate(fp: string): Promise<boolean> {
    const dup = this.seen.has(fp);
    this.seen.add(fp);
    return dup;
  }
}

describe('RiskService', () => {
  function build(): RiskService {
    return new RiskService(new FakeDupes() as unknown as DuplicateDetector);
  }

  it('approves a clean identity', async () => {
    const svc = build();
    const r = await svc.score({
      sessionId: '00000000-0000-0000-0000-000000000001',
      document: {
        confidence: 0.95,
        fields: { documentNumber: 'P1', dateOfBirth: '1985-01-01' },
        validation: { valid: true, issues: [], expired: false, underAge: false },
      },
      face: {
        match: { similarity: 0.92, matched: true, threshold: 0.8 },
        liveness: { score: 0.88, passed: true },
      },
    });
    expect(r.decision).toBe('approve');
    expect(r.riskScore).toBeLessThan(35);
  });

  it('rejects on underage', async () => {
    const svc = build();
    const r = await svc.score({
      sessionId: '00000000-0000-0000-0000-000000000002',
      document: {
        confidence: 0.95,
        fields: { documentNumber: 'P2', dateOfBirth: '2020-01-01' },
        validation: { valid: false, issues: ['under 18'], expired: false, underAge: true },
      },
      face: {
        match: { similarity: 0.92, matched: true, threshold: 0.8 },
        liveness: { score: 0.88, passed: true },
      },
    });
    expect(r.decision).toBe('reject');
    expect(r.reasons).toContain('holder is under 18');
  });

  it('sends to review on low face similarity', async () => {
    const svc = build();
    const r = await svc.score({
      sessionId: '00000000-0000-0000-0000-000000000003',
      document: {
        confidence: 0.95,
        fields: { documentNumber: 'P3', dateOfBirth: '1985-01-01' },
        validation: { valid: true, issues: [], expired: false, underAge: false },
      },
      face: {
        match: { similarity: 0.62, matched: false, threshold: 0.8 },
        liveness: { score: 0.88, passed: true },
      },
    });
    expect(['review', 'reject']).toContain(r.decision);
  });

  it('flags duplicates', async () => {
    const svc = build();
    const input = {
      sessionId: '00000000-0000-0000-0000-000000000004',
      document: {
        confidence: 0.95,
        fields: { documentNumber: 'DUP', dateOfBirth: '1985-01-01' },
        validation: { valid: true, issues: [], expired: false, underAge: false },
      },
      face: {
        match: { similarity: 0.92, matched: true, threshold: 0.8 },
        liveness: { score: 0.88, passed: true },
      },
    };
    await svc.score(input);
    const second = await svc.score({ ...input, sessionId: '00000000-0000-0000-0000-000000000005' });
    expect(second.reasons).toContain('duplicate identity detected');
  });
});
