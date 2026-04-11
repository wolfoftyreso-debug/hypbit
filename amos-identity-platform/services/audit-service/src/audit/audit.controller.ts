import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly svc: AuditService) {}

  @Get('session/:id')
  async session(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.svc.findBySession(id);
  }

  @Get('session/:id/verify')
  async verify(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.svc.verify(id);
  }
}
