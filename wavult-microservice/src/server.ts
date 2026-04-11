import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { config } from './config';
import { logger } from './logger';
import { registerRoutes } from './routes';
import { requestIdPlugin } from './middleware/request-id';
import { registerErrorHandler } from './middleware/error-handler';
import { httpRequestDurationSeconds, httpRequestsTotal } from './metrics';

export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({
    logger,
    disableRequestLogging: false,
    trustProxy: true,
    bodyLimit: 1_048_576, // 1 MB
    genReqId: (req) => {
      const hdr = req.headers['x-request-id'];
      return typeof hdr === 'string' && hdr.length > 0 ? hdr : undefined!;
    },
  });

  await app.register(helmet, { global: true });
  await app.register(cors, { origin: config.CORS_ORIGIN });
  await app.register(rateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW_MS,
    allowList: (req) => req.url.startsWith('/health') || req.url === '/metrics',
  });

  await app.register(requestIdPlugin);

  // Metrics hook
  app.addHook('onResponse', async (request, reply) => {
    const route = (request.routeOptions?.url as string | undefined) ?? request.url;
    const labels = {
      method: request.method,
      route,
      status_code: String(reply.statusCode),
    };
    httpRequestsTotal.inc(labels);
    httpRequestDurationSeconds.observe(labels, reply.elapsedTime / 1000);
  });

  registerErrorHandler(app);
  await registerRoutes(app);

  return app;
}
