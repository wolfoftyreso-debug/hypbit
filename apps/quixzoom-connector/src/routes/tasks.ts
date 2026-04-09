// POST /v1/tasks  — direct task creation for REST API consumers
// GET  /v1/tasks/:id — task status lookup

import { Router, type Request, type Response } from 'express';
import { randomUUID } from 'crypto';

import { buildQVL } from '../services/qvl-builder';
import { createTask, getTask } from '../services/task-manager';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

interface CreateTaskBody {
  description?: unknown;
  lat?: unknown;
  lon?: unknown;
  radius_m?: unknown;
  type?: 'photo' | 'video';
  priority?: 'normal' | 'high';
}

function badRequest(res: Response, message: string): void {
  res.status(400).json({ error: message });
}

export function tasksRouter(): Router {
  const router = Router();

  router.post('/v1/tasks', async (req: Request, res: Response) => {
    const trace_id =
      (req.header(config.traceHeader) as string | undefined) ?? randomUUID();
    const log = logger.child(trace_id);

    const body = (req.body ?? {}) as CreateTaskBody;

    if (typeof body.description !== 'string' || !body.description.trim()) {
      return badRequest(res, 'description is required');
    }
    if (typeof body.lat !== 'number' || typeof body.lon !== 'number') {
      return badRequest(res, 'lat/lon are required numbers');
    }
    const radius_m =
      typeof body.radius_m === 'number'
        ? body.radius_m
        : config.defaultRadiusM;
    const priority = body.priority === 'high' ? 'high' : 'normal';

    const qvl = buildQVL({
      text: body.description,
      location: { lat: body.lat, lon: body.lon },
    });
    qvl.constraints.geo_radius_m = radius_m;

    const task = await createTask({
      query_id: randomUUID(),
      qvl,
      location: { lat: body.lat, lon: body.lon, radius_m },
      priority,
    });

    log.info('task.created', { task_id: task.task_id, priority });
    res.status(201).json({
      task_id: task.task_id,
      state: task.state,
      stream_url: `/stream/${task.task_id}`,
    });
  });

  router.get('/v1/tasks/:id', async (req: Request, res: Response) => {
    const task = await getTask(req.params.id);
    if (!task) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    res.status(200).json(task);
  });

  return router;
}
