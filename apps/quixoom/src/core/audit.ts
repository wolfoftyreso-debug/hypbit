import { randomUUID } from 'crypto';
import type { DbClient } from './db.js';

export async function log(
  db: DbClient,
  params: {
    entity_id?: string;
    event_type: string;
    actor: string;
    resource_type?: string;
    resource_id?: string;
    payload?: Record<string, unknown>;
  },
): Promise<void> {
  await db.query(
    `INSERT INTO qx_audit_logs (id, entity_id, event_type, actor, resource_type, resource_id, payload)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      randomUUID(),
      params.entity_id ?? null,
      params.event_type,
      params.actor,
      params.resource_type ?? null,
      params.resource_id ?? null,
      JSON.stringify(params.payload ?? {}),
    ],
  );
}
