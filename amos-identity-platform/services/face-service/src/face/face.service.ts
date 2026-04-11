import { Injectable, Logger } from '@nestjs/common';
import { FaceProviderFactory } from './face.provider';
import { S3Downloader } from './s3-downloader';
import { ProcessDto } from './dto/process.dto';

export interface FaceProcessingResult {
  sessionId: string;
  match: {
    similarity: number;
    matched: boolean;
    threshold: number;
  };
  liveness: {
    score: number;
    passed: boolean;
  };
  processedAt: string;
}

@Injectable()
export class FaceService {
  private readonly logger = new Logger(FaceService.name);

  constructor(
    private readonly factory: FaceProviderFactory,
    private readonly downloader: S3Downloader,
  ) {}

  async process(dto: ProcessDto): Promise<FaceProcessingResult> {
    this.logger.log(`processing face for session ${dto.sessionId}`);
    const [reference, probe] = await Promise.all([
      this.downloader.download(dto.documentKey),
      this.downloader.download(dto.selfieKey),
    ]);

    const provider = this.factory.get();
    const [match, liveness] = await Promise.all([
      provider.match(reference, probe),
      provider.detectLiveness(probe),
    ]);

    return {
      sessionId: dto.sessionId,
      match,
      liveness,
      processedAt: new Date().toISOString(),
    };
  }
}
