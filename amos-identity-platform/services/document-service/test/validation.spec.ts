import { validateDocumentFields } from '../src/document/validation';

describe('validateDocumentFields', () => {
  it('returns valid for a complete, non-expired, adult passport', () => {
    const result = validateDocumentFields({
      documentNumber: 'P1234567',
      firstName: 'Ada',
      lastName: 'Lovelace',
      dateOfBirth: '1985-01-01',
      dateOfExpiry: '2099-01-01',
    });
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('flags expired documents', () => {
    const result = validateDocumentFields({
      documentNumber: 'P1234567',
      firstName: 'A',
      lastName: 'B',
      dateOfBirth: '1985-01-01',
      dateOfExpiry: '2001-01-01',
    });
    expect(result.expired).toBe(true);
    expect(result.valid).toBe(false);
  });

  it('flags underage holders', () => {
    const now = new Date();
    const recent = `${now.getFullYear() - 10}-01-01`;
    const result = validateDocumentFields({
      documentNumber: 'P1234567',
      firstName: 'A',
      lastName: 'B',
      dateOfBirth: recent,
      dateOfExpiry: '2099-01-01',
    });
    expect(result.underAge).toBe(true);
  });
});
