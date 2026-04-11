import { createWorker, Worker } from 'tesseract.js';
import { ExternalProviderError } from '@amos/utils';
import { OcrProvider, OcrResult } from './provider';
import { parseMRZ } from './mrz';

export interface TesseractConfig {
  lang: string;
}

export class TesseractProvider implements OcrProvider {
  private worker: Worker | null = null;

  constructor(private readonly cfg: TesseractConfig) {}

  private async getWorker(): Promise<Worker> {
    if (this.worker) return this.worker;
    this.worker = await createWorker(this.cfg.lang);
    return this.worker;
  }

  async extract(image: Buffer, documentType: string): Promise<OcrResult> {
    try {
      const worker = await this.getWorker();
      const { data } = await worker.recognize(image);

      const text = data.text ?? '';
      const mrzLine = extractMrzLine(text);
      const mrz = mrzLine ? parseMRZ(mrzLine) : undefined;

      return {
        text,
        confidence: Number(((data.confidence ?? 0) / 100).toFixed(3)),
        fields: {
          documentType: normalizeType(documentType),
          documentNumber: mrz?.documentNumber,
          firstName: mrz?.firstName,
          lastName: mrz?.lastName,
          dateOfBirth: mrz?.dateOfBirth,
          nationality: mrz?.nationality,
          sex: mrz?.sex,
          issuingCountry: mrz?.issuingCountry,
          dateOfExpiry: mrz?.dateOfExpiry,
          mrz: mrzLine ?? undefined,
        },
      };
    } catch (err) {
      throw new ExternalProviderError('tesseract', (err as Error).message);
    }
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

function normalizeType(t: string): 'passport' | 'id_card' | 'driver_license' | undefined {
  if (t === 'passport' || t === 'id_card' || t === 'driver_license') return t;
  return undefined;
}

function extractMrzLine(text: string): string | null {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => /[A-Z0-9<]{30,}/.test(l));
  if (lines.length === 0) return null;
  return lines.slice(-2).join('\n');
}
