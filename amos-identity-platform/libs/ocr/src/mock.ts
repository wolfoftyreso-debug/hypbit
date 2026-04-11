import { OcrProvider, OcrResult } from './provider';

/**
 * Deterministic mock OCR provider for unit tests and local dev without
 * Tesseract installed.
 */
export class MockOcrProvider implements OcrProvider {
  constructor(private readonly fixture?: Partial<OcrResult>) {}

  async extract(_image: Buffer, documentType: string): Promise<OcrResult> {
    return {
      text: 'MOCK OCR TEXT',
      confidence: 0.98,
      fields: {
        documentType: (documentType as 'passport') ?? 'passport',
        documentNumber: 'P1234567',
        firstName: 'ADA',
        lastName: 'LOVELACE',
        dateOfBirth: '1985-04-11',
        nationality: 'SWE',
        sex: 'F',
        issuingCountry: 'SWE',
        dateOfExpiry: '2031-04-11',
        mrz: 'P<SWELOVELACE<<ADA<<<<<<<<<<<<<<<<<<<<<<<<<<\nP12345678SWE8504112F3104114<<<<<<<<<<<<<<04',
      },
      ...this.fixture,
    };
  }
}
