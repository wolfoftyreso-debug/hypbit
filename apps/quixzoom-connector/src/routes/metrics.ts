// GET /metrics — Prometheus scrape endpoint.

import { Router, type Request, type Response } from 'express';

import { render } from '../utils/metrics';

export function metricsRouter(): Router {
  const router = Router();
  router.get('/metrics', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.status(200).send(render());
  });
  return router;
}
