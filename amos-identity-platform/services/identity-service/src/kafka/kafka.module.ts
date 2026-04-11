import { Global, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createKafka, KafkaProducer } from '@amos/utils';

export const KAFKA_PRODUCER = Symbol('KAFKA_PRODUCER');

@Global()
@Module({
  providers: [
    {
      provide: KAFKA_PRODUCER,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const kafka = createKafka({
          clientId: config.get<string>('identity.kafka.clientId') ?? 'amos-identity',
          brokers: config.get<string[]>('identity.kafka.brokers') ?? ['localhost:9092'],
        });
        const producer = new KafkaProducer(kafka);
        await producer.connect();
        return producer;
      },
    },
  ],
  exports: [KAFKA_PRODUCER],
})
export class KafkaModule implements OnApplicationShutdown {
  async onApplicationShutdown(): Promise<void> {
    // producer.disconnect() is handled per-instance via DI lifecycle in Nest
  }
}
