import { Module } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { OcrProviderFactory } from './ocr.provider';
import { S3Downloader } from './s3-downloader';

@Module({
  controllers: [DocumentController],
  providers: [DocumentService, OcrProviderFactory, S3Downloader],
})
export class DocumentModule {}
