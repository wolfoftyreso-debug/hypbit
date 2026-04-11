import { Injectable, Logger } from '@nestjs/common';
import { OcrProviderFactory } from './ocr.provider';
import { S3Downloader } from './s3-downloader';
import { ExtractDto } from './dto/extract.dto';
import { validateDocumentFields, DocumentValidation } from './validation';

export interface DocumentExtractionResult {
  sessionId: string;
  type: string;
  confidence: number;
  fields: Record<string, unknown>;
  validation: DocumentValidation;
  extractedAt: string;
}

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(
    private readonly ocrFactory: OcrProviderFactory,
    private readonly downloader: S3Downloader,
  ) {}

  async extract(dto: ExtractDto): Promise<DocumentExtractionResult> {
    this.logger.log(`extracting ${dto.type} for session ${dto.sessionId}`);
    const image = await this.downloader.download(dto.s3Key);
    const ocr = await this.ocrFactory.get().extract(image, dto.type);
    const validation = validateDocumentFields(ocr.fields);

    return {
      sessionId: dto.sessionId,
      type: dto.type,
      confidence: ocr.confidence,
      fields: ocr.fields as unknown as Record<string, unknown>,
      validation,
      extractedAt: new Date().toISOString(),
    };
  }
}
