export interface OcrResult {
  text: string;
  confidence: number;
  fields: ExtractedFields;
}

export interface ExtractedFields {
  documentType?: 'passport' | 'id_card' | 'driver_license';
  documentNumber?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string; // ISO 8601
  nationality?: string;
  sex?: 'M' | 'F' | 'X';
  issuingCountry?: string;
  dateOfIssue?: string;
  dateOfExpiry?: string;
  mrz?: string;
}

/**
 * Provider-agnostic OCR contract so we can swap Tesseract for a hosted
 * provider (Textract, Google Vision, Veriff) without touching call sites.
 */
export interface OcrProvider {
  extract(image: Buffer, documentType: string): Promise<OcrResult>;
}
