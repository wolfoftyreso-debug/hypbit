import { randomUUID } from 'crypto';
import type { DbClient } from './db.js';
import { emit } from './event-bus.js';
import { log as auditLog } from './audit.js';

export interface ReconcileInput {
  payment_id: string;
  external_amount: string;
}

export async function reconcile(
  db: DbClient,
  input: ReconcileInput,
  actor: string,
): Promise<{ id: string; status: string; difference: string }> {
  // Get ledger amount for the payment's transaction
  const { rows: paymentRows } = await db.query(
    `SELECT p.transaction_id, p.entity_id,
            COALESCE(SUM(CASE WHEN le.direction = 'debit' THEN le.amount END), 0) AS ledger_amount
     FROM qx_payments p
     LEFT JOIN qx_ledger_entries le ON le.transaction_id = p.transaction_id
     WHERE p.id = $1
     GROUP BY p.transaction_id, p.entity_id`,
    [input.payment_id],
  );

  if (paymentRows.length === 0) throw new Error('Payment not found');

  const ledgerAmount = parseFloat(paymentRows[0].ledger_amount);
  const externalAmount = parseFloat(input.external_amount);
  const diff = externalAmount - ledgerAmount;
  const matched = Math.abs(diff) < 0.01;
  const status = matched ? 'matched' : 'discrepancy';

  const reconId = randomUUID();
  await db.query(
    `INSERT INTO qx_reconciliations (id, payment_id, ledger_match, external_amount, ledger_amount, status)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [reconId, input.payment_id, matched, input.external_amount, ledgerAmount.toString(), status],
  );

  await emit(db, {
    entity_id: paymentRows[0].entity_id,
    aggregate_type: 'reconciliation',
    aggregate_id: reconId,
    event_type: 'Reconciled',
    payload: { payment_id: input.payment_id, matched, difference: diff },
  });

  await auditLog(db, {
    entity_id: paymentRows[0].entity_id,
    event_type: `reconciliation.${status}`,
    actor,
    resource_type: 'reconciliation',
    resource_id: reconId,
    payload: { payment_id: input.payment_id, external_amount: input.external_amount, ledger_amount: ledgerAmount, difference: diff },
  });

  return { id: reconId, status, difference: diff.toFixed(8) };
}
