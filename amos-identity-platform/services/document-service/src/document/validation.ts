import { ExtractedFields } from '@amos/ocr';

export interface DocumentValidation {
  valid: boolean;
  issues: string[];
  expired: boolean;
  underAge: boolean;
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function validateDocumentFields(fields: ExtractedFields): DocumentValidation {
  const issues: string[] = [];

  if (!fields.documentNumber) issues.push('missing document number');
  if (!fields.firstName) issues.push('missing first name');
  if (!fields.lastName) issues.push('missing last name');

  if (!fields.dateOfBirth || !ISO.test(fields.dateOfBirth)) {
    issues.push('invalid date of birth');
  }
  if (!fields.dateOfExpiry || !ISO.test(fields.dateOfExpiry)) {
    issues.push('invalid date of expiry');
  }

  let expired = false;
  let underAge = false;

  if (fields.dateOfExpiry && ISO.test(fields.dateOfExpiry)) {
    expired = new Date(fields.dateOfExpiry).getTime() < Date.now();
    if (expired) issues.push('document expired');
  }

  if (fields.dateOfBirth && ISO.test(fields.dateOfBirth)) {
    const ageMs = Date.now() - new Date(fields.dateOfBirth).getTime();
    const ageYears = ageMs / (365.25 * 24 * 3600 * 1000);
    underAge = ageYears < 18;
    if (underAge) issues.push('under 18');
  }

  return { valid: issues.length === 0, issues, expired, underAge };
}
