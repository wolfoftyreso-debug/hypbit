import { Body, Controller, Post } from '@nestjs/common';
import { RiskService } from './risk.service';
import { ScoreDto } from './dto/score.dto';

@Controller('risk')
export class RiskController {
  constructor(private readonly svc: RiskService) {}

  @Post('score')
  async score(@Body() dto: ScoreDto) {
    return this.svc.score(dto);
  }
}
