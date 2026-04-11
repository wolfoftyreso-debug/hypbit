import { Module } from '@nestjs/common';
import { RiskController } from './risk.controller';
import { RiskService } from './risk.service';
import { DuplicateDetector } from './duplicate-detector';

@Module({
  controllers: [RiskController],
  providers: [RiskService, DuplicateDetector],
})
export class RiskModule {}
