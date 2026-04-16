/**
 * RED TEAM — @amos/crypto
 *
 * Attacks against the shared crypto primitives used for PII encryption,
 * JWT auth and the immutable audit hash chain.
 */
import {
  encryptPII,
  decryptPII,
  generateKey,
  signJwt,
  verifyJwt,
  sha256,
  chainHash,
} from '../src';

describe('RED TEAM / @amos/crypto', () => {
  const key = Buffer.from(
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    'hex',
  );

  describe('A. AES-256-GCM', () => {
    it('A1: ciphertext is non-deterministic (fresh IV per call)', () => {
      const a = encryptPII('super-secret-pii', key);
      const b = encryptPII('super-secret-pii', key);
      expect(a.iv).not.toBe(b.iv);
      expect(a.ciphertext).not.toBe(b.ciphertext);
    });

    it('A2: tampering ciphertext fails authentication', () => {
      const enc = encryptPII('victim', key);
      const bad = { ...enc, ciphertext: Buffer.from('AAAAAAAAAA').toString('base64') };
      expect(() => decryptPII(bad, key)).toThrow();
    });

    it('A3: tampering auth tag fails decryption', () => {
      const enc = encryptPII('victim', key);
      const bad = { ...enc, tag: Buffer.alloc(16, 0).toString('base64') };
      expect(() => decryptPII(bad, key)).toThrow();
    });

    it('A4: wrong key fails authentication', () => {
      const enc = encryptPII('victim', key);
      const wrongKey = generateKey();
      expect(() => decryptPII(enc, wrongKey)).toThrow();
    });

    it('A5: rejects short keys instead of silently truncating/padding', () => {
      expect(() => encryptPII('x', 'deadbeef')).toThrow(/32 bytes/);
      expect(() => encryptPII('x', Buffer.alloc(16))).toThrow(/32 bytes/);
      expect(() => encryptPII('x', Buffer.alloc(64))).toThrow(/32 bytes/);
    });

    it('A6: round-trip preserves unicode PII', () => {
      const plaintext = 'Åsa Löfström 🛂 你好';
      const enc = encryptPII(plaintext, key);
      expect(decryptPII(enc, key)).toBe(plaintext);
    });
  });

  describe('B. JWT', () => {
    const cfg = {
      secret: 'super-long-test-secret-32-bytes-min',
      issuer: 'amos-test',
      audience: 'amos-external',
    };

    it('B1: valid token round-trip', () => {
      const token = signJwt({ sub: 'user-1' }, cfg, 60);
      const payload = verifyJwt(token, cfg);
      expect(payload.sub).toBe('user-1');
    });

    it('B2: audience mismatch rejects token', () => {
      const token = signJwt({ sub: 'x' }, cfg, 60);
      expect(() =>
        verifyJwt(token, { ...cfg, audience: 'other-audience' }),
      ).toThrow();
    });

    it('B3: issuer mismatch rejects token', () => {
      const token = signJwt({ sub: 'x' }, cfg, 60);
      expect(() => verifyJwt(token, { ...cfg, issuer: 'evil' })).toThrow();
    });

    it('B4: expired token is rejected', async () => {
      const token = signJwt({ sub: 'x' }, cfg, 1);
      await new Promise((r) => setTimeout(r, 1500));
      expect(() => verifyJwt(token, cfg)).toThrow();
    });

    it('B5: alg=none token forged by attacker is rejected', () => {
      // Craft an unsigned token with alg=none and try to pass it through.
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const body = Buffer.from(
        JSON.stringify({ sub: 'admin', iss: cfg.issuer, aud: cfg.audience }),
      ).toString('base64url');
      const forged = `${header}.${body}.`;
      expect(() => verifyJwt(forged, cfg)).toThrow();
    });

    it('B6: token signed with different secret is rejected', () => {
      const token = signJwt({ sub: 'x' }, cfg, 60);
      expect(() => verifyJwt(token, { ...cfg, secret: 'different' })).toThrow();
    });

    it('B7: signing without any key throws instead of producing unsigned token', () => {
      expect(() =>
        signJwt({ sub: 'x' }, { issuer: 'a', audience: 'b' } as any, 60),
      ).toThrow();
    });
  });

  describe('C. Hash chain (audit tamper evidence)', () => {
    it('C1: flipping one bit of a historical entry breaks chain', () => {
      const genesis = sha256('amos-audit-genesis');
      const h1 = chainHash(genesis, { event: 'a', v: 1 });
      const h2 = chainHash(h1, { event: 'b', v: 2 });
      const h3 = chainHash(h2, { event: 'c', v: 3 });

      // Attacker tries to rewrite entry #2 while preserving downstream hashes.
      const tamperedH2 = chainHash(h1, { event: 'b', v: 999 });
      // If we recompute h3 from the tampered chain, it will NOT match the original h3.
      const recomputedH3 = chainHash(tamperedH2, { event: 'c', v: 3 });
      expect(recomputedH3).not.toBe(h3);
    });

    it('C2: attacker cannot forge an entry without knowing the previous hash', () => {
      const genesis = sha256('amos-audit-genesis');
      const real = chainHash(genesis, { v: 1 });
      // Attacker guesses a previous hash and tries to create a matching entry.
      const forged = chainHash('deadbeef'.repeat(8), { v: 1 });
      expect(forged).not.toBe(real);
    });

    it('C3: sha256 is deterministic and yields correct length', () => {
      const h = sha256('hello');
      expect(h).toHaveLength(64);
      expect(h).toBe(sha256('hello'));
      expect(h).toMatch(/^[0-9a-f]{64}$/);
    });
  });
});
