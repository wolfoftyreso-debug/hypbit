import { randomUUID } from 'crypto';
import type { DbClient } from './db.js';
import type { EventType, DomainEvent } from './types.js';

type EventHandler = (event: DomainEvent) => Promise<void>;

const handlers = new Map<string, EventHandler[]>();

export function on(eventType: EventType, handler: EventHandler): void {
  const existing = handlers.get(eventType) ?? [];
  existing.push(handler);
  handlers.set(eventType, existing);
}

export async function emit(
  db: DbClient,
  params: {
    entity_id?: string;
    aggregate_type: string;
    aggregate_id: string;
    event_type: EventType;
    version?: number;
    payload: Record<string, unknown>;
  },
): Promise<DomainEvent> {
  const id = randomUUID();
  const now = new Date().toISOString();

  await db.query(
    `INSERT INTO qx_events (id, entity_id, aggregate_type, aggregate_id, event_type, version, payload, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      id,
      params.entity_id ?? null,
      params.aggregate_type,
      params.aggregate_id,
      params.event_type,
      params.version ?? 1,
      JSON.stringify(params.payload),
      now,
    ],
  );

  const event: DomainEvent = {
    id,
    entity_id: params.entity_id,
    aggregate_type: params.aggregate_type,
    aggregate_id: params.aggregate_id,
    event_type: params.event_type as EventType,
    version: params.version ?? 1,
    payload: params.payload,
    created_at: now,
  };

  // Fire-and-forget in-process handlers
  const eventHandlers = handlers.get(params.event_type) ?? [];
  for (const handler of eventHandlers) {
    handler(event).catch(err => {
      console.error(`[event-bus] handler error for ${params.event_type}:`, err);
    });
  }

  return event;
}
