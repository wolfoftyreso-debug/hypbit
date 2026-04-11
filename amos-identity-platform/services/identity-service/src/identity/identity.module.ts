import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdentityController } from './identity.controller';
import { IdentityService } from './identity.service';
import { StorageService } from './storage.service';
import { IdentitySession } from '../db/entities/identity-session.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([IdentitySession]), AuthModule],
  controllers: [IdentityController],
  providers: [IdentityService, StorageService],
  exports: [IdentityService],
})
export class IdentityModule {}
