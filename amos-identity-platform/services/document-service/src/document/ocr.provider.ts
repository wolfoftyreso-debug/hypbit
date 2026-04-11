import { Injectable } from '@nestjs/common';
import { MockOcrProvider, OcrProvider, TesseractProvider } from '@amos/ocr';

@Injectable()
export class OcrProviderFactory {
  private readonly provider: OcrProvider;

  constructor() {
    if (process.env.NODE_ENV === 'test' || process.env.OCR_MOCK === 'true') {
      this.provider = new MockOcrProvider();
    } else {
      this.provider = new TesseractProvider({ lang: process.env.TESSERACT_LANG ?? 'eng' });
    }
  }

  get(): OcrProvider {
    return this.provider;
  }
}
