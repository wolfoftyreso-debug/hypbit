import { chainHash, sha256 } from '@amos/crypto';

describe('hash chain', () => {
  it('deterministically chains entries', () => {
    const genesis = sha256('amos-audit-genesis');
    const h1 = chainHash(genesis, { type: 'identity.created', id: 'a' });
    const h2 = chainHash(h1, { type: 'document.uploaded', id: 'a' });
    expect(h1).not.toEqual(genesis);
    expect(h2).not.toEqual(h1);
    // Same input -> same hash
    expect(chainHash(genesis, { type: 'identity.created', id: 'a' })).toEqual(h1);
  });

  it('detects tampering', () => {
    const genesis = sha256('amos-audit-genesis');
    const good = chainHash(genesis, { value: 1 });
    const tampered = chainHash(genesis, { value: 2 });
    expect(good).not.toEqual(tampered);
  });
});
