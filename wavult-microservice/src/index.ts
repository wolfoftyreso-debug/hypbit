// IMPORTANT: tracing must be imported and started before any other module
// that might be auto-instrumented (http, pg, ioredis, kafkajs, ...).
import { startTracing } from './tracing';
startTracing();

import { buildServer } from './server';
import { config } from './config';
import { logger } from './logger';
import { getProducer } from './kafka/producer';
import { registerShutdownHooks } from './utils/graceful-shutdown';

async function main(): Promise<void> {
  const app = await buildServer();
  registerShutdownHooks(app);

  // Warm up Kafka producer so readiness returns true quickly.
  try {
    await getProducer();
  } catch (err) {
    logger.warn({ err }, 'kafka producer warmup failed, will retry on demand');
  }

  await app.listen({ host: config.HOST, port: config.PORT });
  logger.info(
    {
      host: config.HOST,
      port: config.PORT,
      env: config.NODE_ENV,
      version: config.SERVICE_VERSION,
    },
    'wavult-microservice listening',
  );
}

main().catch((err) => {
  logger.fatal({ err }, 'fatal startup error');
  process.exit(1);
});
