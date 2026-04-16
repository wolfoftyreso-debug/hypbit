import { randomUUID } from 'crypto';
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

// Trust only loopback and RFC 1918 ranges where the internal AWS ALB
// lives. Mitigates GHSA-444r-cwp2-x5xf (Fastify ≤5.8.2 protocol/host
// spoofing) by refusing to honour X-Forwarded-* from arbitrary public
// peers.
const TRUSTED_PROXY_CIDRS = [
  '127.0.0.1/32',
  '::1/128',
  '10.0.0.0/8',
  '172.16.0.0/12',
  '192.168.0.0/16',
];

export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({
    // pino instance; cast to any to bypass Fastify 4.x's stricter Logger typing
    logger: logger as unknown as boolean,
    disableRequestLogging: false,
    trustProxy: TRUSTED_PROXY_CIDRS,
    bodyLimit: 1_048_576, // 1 MB
    genReqId: (req) => {
      const hdr = req.headers['x-request-id'];
      if (typeof hdr === 'string' && hdr.length > 0) return hdr;
      return randomUUID();
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
