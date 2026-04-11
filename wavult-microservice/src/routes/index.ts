import { FastifyInstance } from 'fastify';
import { healthRoutes } from '../health/routes';
import { eventRoutes } from './events';
import { registry } from '../metrics';

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  await app.register(healthRoutes);
  await app.register(eventRoutes);

  app.get('/metrics', async (_req, reply) => {
    reply.header('Content-Type', registry.contentType);
    return registry.metrics();
  });

  app.get('/', async () => ({
    service: 'wavult-microservice',
    status: 'running',
  }));
}
