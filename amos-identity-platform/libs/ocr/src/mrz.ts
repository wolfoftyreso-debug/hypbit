/**
 * Minimal TD3 (passport) MRZ parser. Handles the two 44-character lines
 * of an ICAO 9303 machine readable zone. Best-effort — good enough to
 * power risk checks. Does NOT validate check digits (callers can).
 */
export interface MrzFields {
  documentNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;   // ISO
  dateOfExpiry: string;  // ISO
  sex: 'M' | 'F' | 'X';
  nationality: string;
  issuingCountry: string;
}

export function parseMRZ(mrz: string): MrzFields | null {
  const lines = mrz.replace(/\s/g, '').split('\n').filter(Boolean);
  if (lines.length < 2) return null;
  const l1 = lines[0];
  const l2 = lines[1];
  if (l1.length < 44 || l2.length < 44) return null;

  const issuingCountry = l1.substring(2, 5).replace(/</g, '');
  const names = l1.substring(5, 44).split('<<');
  const lastName = (names[0] ?? '').replace(/</g, ' ').trim();
  const firstName = (names[1] ?? '').replace(/</g, ' ').trim();

  const documentNumber = l2.substring(0, 9).replace(/</g, '');
  const nationality = l2.substring(10, 13).replace(/</g, '');
  const dob = l2.substring(13, 19);
  const sexChar = l2.substring(20, 21);
  const exp = l2.substring(21, 27);

  return {
    documentNumber,
    firstName,
    lastName,
    dateOfBirth: yymmddToIso(dob, true),
    dateOfExpiry: yymmddToIso(exp, false),
    sex: sexChar === 'M' || sexChar === 'F' ? sexChar : 'X',
    nationality,
    issuingCountry,
  };
}

function yymmddToIso(s: string, assumePast: boolean): string {
  if (s.length !== 6) return '';
  const yy = parseInt(s.substring(0, 2), 10);
  const mm = s.substring(2, 4);
  const dd = s.substring(4, 6);
  const now = new Date().getFullYear() % 100;
  const century = assumePast ? (yy > now ? 1900 : 2000) : yy < now ? 2000 : 2000;
  const year = century + yy;
  return `${year}-${mm}-${dd}`;
}
