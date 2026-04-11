import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from './audit/audit.module';
import { HealthController } from './common/health.controller';
import { AuditEntry } from './audit/audit.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.POSTGRES_HOST ?? 'localhost',
        port: Number(process.env.POSTGRES_PORT ?? 5432),
        username: process.env.POSTGRES_USER ?? 'amos',
        password: process.env.POSTGRES_PASSWORD ?? 'amos',
        database: process.env.POSTGRES_DB ?? 'amos',
        entities: [AuditEntry],
        synchronize: process.env.NODE_ENV !== 'production',
        logging: ['error', 'warn'],
      }),
    }),
    AuditModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
