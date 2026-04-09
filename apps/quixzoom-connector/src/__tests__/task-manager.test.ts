import { beforeEach, describe, expect, it } from 'vitest';
import {
  __resetTaskManager,
  createTask,
  getTask,
  updateState,
} from '../services/task-manager';
import { buildQVL } from '../services/qvl-builder';
import { InvalidTransitionError } from '../models/task';

describe('task-manager', () => {
  beforeEach(() => {
    __resetTaskManager();
  });

  it('creates a task in OPEN state and retrieves it', async () => {
    const qvl = buildQVL({ text: 'park', location: { lat: 0, lon: 0 } });
    const task = await createTask({
      query_id: 'q1',
      qvl,
      location: { lat: 0, lon: 0, radius_m: 100 },
    });
    expect(task.state).toBe('OPEN');
    const fetched = await getTask(task.task_id);
    expect(fetched?.task_id).toBe(task.task_id);
  });

  it('allows a valid state transition', async () => {
    const qvl = buildQVL({ text: 'park', location: { lat: 0, lon: 0 } });
    const task = await createTask({
      query_id: 'q1',
      qvl,
      location: { lat: 0, lon: 0, radius_m: 100 },
    });
    const next = await updateState(task.task_id, 'RESERVED');
    expect(next.state).toBe('RESERVED');
  });

  it('rejects an invalid state transition', async () => {
    const qvl = buildQVL({ text: 'park', location: { lat: 0, lon: 0 } });
    const task = await createTask({
      query_id: 'q1',
      qvl,
      location: { lat: 0, lon: 0, radius_m: 100 },
    });
    await expect(updateState(task.task_id, 'COMPLETED')).rejects.toBeInstanceOf(
      InvalidTransitionError,
    );
  });
});
