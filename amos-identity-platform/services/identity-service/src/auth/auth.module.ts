import { Module } from '@nestjs/common';
import { JwtAuthGuard } from './jwt.guard';
import { AuthService } from './auth.service';

@Module({
  providers: [JwtAuthGuard, AuthService],
  exports: [JwtAuthGuard, AuthService],
})
export class AuthModule {}
