import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdentityModule } from './identity/identity.module';
import { AuthModule } from './auth/auth.module';
import { KafkaModule } from './kafka/kafka.module';
import { HealthController } from './common/health.controller';
import { identityConfig } from './config/identity.config';
import { IdentitySession } from './db/entities/identity-session.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [identityConfig],
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.POSTGRES_HOST ?? 'localhost',
        port: Number(process.env.POSTGRES_PORT ?? 5432),
        username: process.env.POSTGRES_USER ?? 'amos',
        password: process.env.POSTGRES_PASSWORD ?? 'amos',
        database: process.env.POSTGRES_DB ?? 'amos',
        entities: [IdentitySession],
        synchronize: process.env.NODE_ENV !== 'production',
        logging: ['error', 'warn'],
      }),
    }),
    KafkaModule,
    AuthModule,
    IdentityModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
