import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FaceModule } from './face/face.module';
import { HealthController } from './common/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] }),
    FaceModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
