import { Module } from '@nestjs/common';
import { FaceController } from './face.controller';
import { FaceService } from './face.service';
import { FaceProviderFactory } from './face.provider';
import { S3Downloader } from './s3-downloader';

@Module({
  controllers: [FaceController],
  providers: [FaceService, FaceProviderFactory, S3Downloader],
})
export class FaceModule {}
