import { randomUUID } from 'crypto';
import type { DbClient } from './db.js';
import { emit } from './event-bus.js';
import { log as auditLog } from './audit.js';
import type { TransactionType } from './types.js';

export interface LedgerLine {
  account_id: string;
  direction: 'debit' | 'credit';
  amount: string;
  currency: string;
}

export interface CommitResult {
  transaction_id: string;
  entries: Array<{ id: string; account_id: string; direction: string; amount: string }>;
}

/**
 * Commit a balanced set of ledger entries atomically.
 * Validates that total debits === total credits before writing.
 */
export async function commitEntries(
  db: DbClient,
  params: {
    entity_id: string;
    type: TransactionType;
    reference?: string;
    idempotency_key?: string;
    lines: LedgerLine[];
    actor: string;
  },
): Promise<CommitResult> {
  const { entity_id, type, reference, idempotency_key, lines, actor } = params;

  // Balance check
  let totalDebit = 0;
  let totalCredit = 0;
  for (const line of lines) {
    const amt = parseFloat(line.amount);
    if (amt <= 0) throw new Error('Ledger entry amount must be positive');
    if (line.direction === 'debit') totalDebit += amt;
    else totalCredit += amt;
  }

  const diff = Math.abs(totalDebit - totalCredit);
  if (diff > 0.00000001) {
    throw new Error(
      `Unbalanced entries: debit=${totalDebit}, credit=${totalCredit}, diff=${diff}`,
    );
  }

  // Create transaction
  const txId = randomUUID();
  await db.query(
    `INSERT INTO qx_transactions (id, entity_id, type, status, reference, idempotency_key)
     VALUES ($1, $2, $3, 'committed', $4, $5)`,
    [txId, entity_id, type, reference ?? null, idempotency_key ?? null],
  );

  // Insert ledger entries
  const entries: CommitResult['entries'] = [];
  for (const line of lines) {
    const entryId = randomUUID();
    await db.query(
      `INSERT INTO qx_ledger_entries (id, transaction_id, account_id, direction, amount, currency)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [entryId, txId, line.account_id, line.direction, line.amount, line.currency],
    );
    entries.push({ id: entryId, account_id: line.account_id, direction: line.direction, amount: line.amount });
  }

  // Emit event
  await emit(db, {
    entity_id,
    aggregate_type: 'transaction',
    aggregate_id: txId,
    event_type: 'LedgerCommitted',
    payload: { type, reference, entry_count: lines.length },
  });

  // Audit
  await auditLog(db, {
    entity_id,
    event_type: 'ledger.committed',
    actor,
    resource_type: 'transaction',
    resource_id: txId,
    payload: { type, reference, entry_count: lines.length, total: totalDebit.toString() },
  });

  return { transaction_id: txId, entries };
}

/**
 * Get account balance by summing ledger entries.
 */
export async function getBalance(
  db: DbClient,
  accountId: string,
): Promise<{ debit: string; credit: string; net: string }> {
  const result = await db.query(
    `SELECT
       COALESCE(SUM(CASE WHEN direction = 'debit'  THEN amount END), 0) AS total_debit,
       COALESCE(SUM(CASE WHEN direction = 'credit' THEN amount END), 0) AS total_credit
     FROM qx_ledger_entries
     WHERE account_id = $1`,
    [accountId],
  );

  const row = result.rows[0];
  const debit = parseFloat(row.total_debit);
  const credit = parseFloat(row.total_credit);

  return {
    debit: row.total_debit,
    credit: row.total_credit,
    net: (debit - credit).toFixed(8),
  };
}
