import { FastifyInstance } from 'fastify';
import { pingDatabase } from '../db/client';
import { pingRedis } from '../redis/client';
import { isProducerConnected } from '../kafka/producer';
import { config } from '../config';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health/live', async () => ({
    status: 'ok',
    service: config.SERVICE_NAME,
    version: config.SERVICE_VERSION,
    timestamp: new Date().toISOString(),
  }));

  app.get('/health/ready', async (_req, reply) => {
    const [db, cache] = await Promise.all([pingDatabase(), pingRedis()]);
    const kafka = isProducerConnected();

    const ready = db && cache && kafka;
    const body = {
      status: ready ? 'ready' : 'not_ready',
      checks: {
        database: db ? 'ok' : 'fail',
        redis: cache ? 'ok' : 'fail',
        kafka: kafka ? 'ok' : 'fail',
      },
      timestamp: new Date().toISOString(),
    };
    return reply.status(ready ? 200 : 503).send(body);
  });
}
