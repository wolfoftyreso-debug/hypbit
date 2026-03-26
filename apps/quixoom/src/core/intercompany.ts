import { randomUUID } from 'crypto';
import type { DbClient } from './db.js';
import { emit } from './event-bus.js';
import { log as auditLog } from './audit.js';

export interface IntercompanyPosition {
  id: string;
  from_entity: string;
  to_entity: string;
  currency: string;
  net_amount: string;
}

/**
 * Update intercompany position between two entities.
 * Uses UPSERT to maintain a running net position.
 */
export async function updatePosition(
  db: DbClient,
  params: {
    from_entity: string;
    to_entity: string;
    currency: string;
    amount: string;
    actor: string;
  },
): Promise<IntercompanyPosition> {
  const { rows } = await db.query(
    `INSERT INTO qx_intercompany_positions (id, from_entity, to_entity, currency, net_amount, updated_at)
     VALUES ($1, $2, $3, $4, $5, now())
     ON CONFLICT (from_entity, to_entity, currency)
     DO UPDATE SET net_amount = qx_intercompany_positions.net_amount + EXCLUDED.net_amount,
                   updated_at = now()
     RETURNING *`,
    [randomUUID(), params.from_entity, params.to_entity, params.currency, params.amount],
  );

  const position = rows[0];

  await emit(db, {
    aggregate_type: 'intercompany',
    aggregate_id: position.id,
    event_type: 'IntercompanySettled',
    payload: {
      from_entity: params.from_entity,
      to_entity: params.to_entity,
      currency: params.currency,
      delta: params.amount,
      net: position.net_amount,
    },
  });

  await auditLog(db, {
    event_type: 'intercompany.position_updated',
    actor: params.actor,
    resource_type: 'intercompany_position',
    resource_id: position.id,
    payload: { from: params.from_entity, to: params.to_entity, delta: params.amount },
  });

  return position;
}

/**
 * Get all positions for an entity.
 */
export async function getPositions(
  db: DbClient,
  entityId: string,
): Promise<IntercompanyPosition[]> {
  const { rows } = await db.query(
    `SELECT * FROM qx_intercompany_positions
     WHERE from_entity = $1 OR to_entity = $1
     ORDER BY updated_at DESC`,
    [entityId],
  );
  return rows;
}

/**
 * Net positions: find pairs that can be offset.
 */
export async function calculateNetting(
  db: DbClient,
  currency: string,
): Promise<Array<{ from: string; to: string; net: string }>> {
  const { rows } = await db.query(
    `SELECT from_entity, to_entity, net_amount
     FROM qx_intercompany_positions
     WHERE currency = $1 AND net_amount != 0
     ORDER BY ABS(net_amount) DESC`,
    [currency],
  );

  return rows.map(r => ({
    from: r.from_entity,
    to: r.to_entity,
    net: r.net_amount,
  }));
}
