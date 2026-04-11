import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RiskModule } from './risk/risk.module';
import { HealthController } from './common/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] }),
    RiskModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
