import { Module, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditEntry } from './audit.entity';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditConsumer } from './audit.consumer';

@Module({
  imports: [TypeOrmModule.forFeature([AuditEntry])],
  controllers: [AuditController],
  providers: [AuditService, AuditConsumer],
})
export class AuditModule implements OnApplicationBootstrap, OnApplicationShutdown {
  constructor(private readonly consumer: AuditConsumer) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.consumer.start();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.consumer.stop();
  }
}
