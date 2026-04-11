import { FastifyInstance } from 'fastify';
import { logger } from '../logger';
import { config } from '../config';
import { closeDatabase } from '../db/client';
import { closeRedis } from '../redis/client';
import { disconnectProducer } from '../kafka/producer';
import { stopConsumer } from '../kafka/consumer';
import { stopTracing } from '../tracing';

let shuttingDown = false;

export function registerShutdownHooks(app: FastifyInstance): void {
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) {
    process.on(signal, () => {
      void shutdown(app, signal);
    });
  }

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'unhandled rejection');
  });

  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'uncaught exception, exiting');
    void shutdown(app, 'uncaughtException').then(() => process.exit(1));
  });
}

async function shutdown(app: FastifyInstance, reason: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info({ reason }, 'graceful shutdown started');

  const timeout = setTimeout(() => {
    logger.error('shutdown timeout exceeded, force exiting');
    process.exit(1);
  }, config.SHUTDOWN_TIMEOUT_MS);
  timeout.unref();

  try {
    await app.close();
    await Promise.allSettled([
      stopConsumer(),
      disconnectProducer(),
      closeRedis(),
      closeDatabase(),
      stopTracing(),
    ]);
    logger.info('shutdown complete');
    clearTimeout(timeout);
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'error during shutdown');
    clearTimeout(timeout);
    process.exit(1);
  }
}
