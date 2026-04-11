import { Body, Controller, Post } from '@nestjs/common';
import { FaceService } from './face.service';
import { ProcessDto } from './dto/process.dto';

@Controller('face')
export class FaceController {
  constructor(private readonly svc: FaceService) {}

  @Post('process')
  process(@Body() dto: ProcessDto) {
    return this.svc.process(dto);
  }
}
