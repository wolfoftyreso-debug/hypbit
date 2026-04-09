// Event schemas — Kafka envelope for all quiXzoom domain events.
// All handlers must be idempotent on `event_id`.

export const QRP_VERSION = '2.0' as const;
// QVL_VERSION is re-exported from ./qvl — imported here for the meta envelope.
import { QVL_VERSION } from './qvl';

export type EventType =
  | 'TASK_CREATED'
  | 'TASK_ASSIGNED'
  | 'TASK_CAPTURED'
  | 'TASK_VALIDATED'
  | 'TASK_FAILED'
  | 'TOKEN_RESERVED'
  | 'TOKEN_SETTLED'
  | 'TOKEN_REFUNDED';

export interface EventMeta {
  qvl_version: typeof QVL_VERSION;
  qrp_version: typeof QRP_VERSION;
  trace_id: string;
}

export interface QuiXzoomEvent<T = Record<string, unknown>> {
  event_id: string;
  type: EventType;
  timestamp: string;
  payload: T;
  meta: EventMeta;
}

// Concrete payload types for the most important events. Other payloads
// can remain as Record<string, unknown> until they are needed.

export interface TaskCreatedPayload {
  task_id: string;
  query_id: string;
  lat: number;
  lon: number;
  radius_m: number;
  priority: 'normal' | 'high';
  tokens_reserved: number;
}

export interface TaskAssignedPayload {
  task_id: string;
  photographer_id: string;
  eta_seconds: number;
}

export interface TaskCapturedPayload {
  task_id: string;
  image_url: string;
  score: number;
  captured_at: string;
}

export interface TokenTransactionPayload {
  user_id: string;
  amount: number;
  ref: string;
  balance_after: number;
}
