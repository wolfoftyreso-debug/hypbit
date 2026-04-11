import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get('live')
  live(): { status: string; service: string; timestamp: string } {
    return { status: 'ok', service: 'identity-service', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  ready(): { status: string } {
    return { status: 'ready' };
  }
}
