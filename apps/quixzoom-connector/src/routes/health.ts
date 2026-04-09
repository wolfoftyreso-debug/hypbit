import { Router } from 'express';

export interface HealthDeps {
  isRedisReady: () => boolean;
  isKafkaReady: () => boolean;
  isCanaryOk?: () => boolean;
}

export function healthRouter(deps: HealthDeps): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  router.get('/ready', (_req, res) => {
    const redis = deps.isRedisReady();
    const kafka = deps.isKafkaReady();
    const canary = deps.isCanaryOk ? deps.isCanaryOk() : true;
    const ready = redis && kafka && canary;
    res.status(ready ? 200 : 503).json({
      status: ready ? 'ready' : 'not_ready',
      checks: { redis, kafka, canary },
    });
  });

  return router;
}
