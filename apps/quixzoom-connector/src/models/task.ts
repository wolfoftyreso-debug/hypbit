// Task — the execution record for a single real-world capture request.
// State transitions are validated through VALID_TRANSITIONS.

import type { QVL } from './qvl';

export type TaskState =
  | 'OPEN'
  | 'RESERVED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'CAPTURED'
  | 'VALIDATING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REQUEUED'
  | 'REFUNDED';

export interface TaskLocation {
  lat: number;
  lon: number;
  radius_m: number;
}

export type TaskPriority = 'normal' | 'high';

export interface Task {
  task_id: string;
  query_id: string;
  state: TaskState;
  qvl: QVL;
  location: TaskLocation;
  priority: TaskPriority;
  tokens_reserved: number;
  retries: number;
  max_retries: number;
  timeout_seconds: number;
  created_at: string;
  last_transition: string;
}

/** Valid task-state transitions per the QRP v2.0 state machine. */
export const VALID_TRANSITIONS: Record<TaskState, TaskState[]> = {
  OPEN: ['RESERVED', 'FAILED'],
  RESERVED: ['ASSIGNED', 'FAILED', 'REFUNDED'],
  ASSIGNED: ['IN_PROGRESS', 'FAILED', 'REQUEUED'],
  IN_PROGRESS: ['CAPTURED', 'FAILED', 'REQUEUED'],
  CAPTURED: ['VALIDATING', 'FAILED'],
  VALIDATING: ['COMPLETED', 'FAILED'],
  COMPLETED: [],
  FAILED: ['REQUEUED', 'REFUNDED'],
  REQUEUED: ['OPEN'],
  REFUNDED: [],
};

export function canTransition(from: TaskState, to: TaskState): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export class InvalidTransitionError extends Error {
  constructor(
    public readonly from: TaskState,
    public readonly to: TaskState,
  ) {
    super(`Invalid task state transition: ${from} -> ${to}`);
    this.name = 'InvalidTransitionError';
  }
}
