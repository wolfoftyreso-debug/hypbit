import { randomUUID } from 'crypto';
import type { DbClient } from './db.js';
import { emit } from './event-bus.js';
import { log as auditLog } from './audit.js';
import * as compliance from './compliance.js';
import * as ledger from './ledger.js';
import type { CreatePaymentInput } from './types.js';

export interface PaymentResult {
  payment_id: string;
  transaction_id: string;
  status: 'authorized' | 'held' | 'failed';
  compliance_results: compliance.RuleResult[];
  required_approvals: number;
}

/**
 * Full payment flow:
 * 1. Create transaction
 * 2. Run compliance checks
 * 3. If held → stop, require manual review
 * 4. If clear → commit ledger entries + create payment record
 */
export async function createPayment(
  db: DbClient,
  input: CreatePaymentInput,
  actor: string,
  entityJurisdiction: string,
): Promise<PaymentResult> {
  const paymentId = randomUUID();
  const txId = randomUUID();

  // 1. Create transaction
  await db.query(
    `INSERT INTO qx_transactions (id, entity_id, type, status, reference, idempotency_key)
     VALUES ($1, $2, 'payment', 'pending', $3, $4)`,
    [txId, input.entity_id, input.reference ?? null, input.idempotency_key ?? null],
  );

  // 2. Compliance check
  const complianceResults = await compliance.evaluate(
    db,
    {
      amount: parseFloat(input.amount),
      currency: input.currency,
      entity_id: input.entity_id,
      jurisdiction: entityJurisdiction,
      counterparty_jurisdiction: (input.payer_info as Record<string, string>)?.jurisdiction,
      transaction_type: 'payment',
      actor,
    },
    txId,
  );

  const held = compliance.requiresHold(complianceResults);
  const approvals = compliance.requiredApprovals(complianceResults);
  const status = held ? 'held' : 'authorized';

  // 3. Update transaction status
  await db.query(
    `UPDATE qx_transactions SET status = $1 WHERE id = $2`,
    [held ? 'pending' : 'authorized', txId],
  );

  // 4. Create payment record
  await db.query(
    `INSERT INTO qx_payments (id, transaction_id, entity_id, psp, amount, currency, status, direction, payer_info)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      paymentId, txId, input.entity_id,
      input.psp ?? null, input.amount, input.currency,
      status, input.direction,
      JSON.stringify(input.payer_info ?? {}),
    ],
  );

  // 5. Emit event
  await emit(db, {
    entity_id: input.entity_id,
    aggregate_type: 'payment',
    aggregate_id: paymentId,
    event_type: held ? 'PaymentCreated' : 'PaymentAuthorized',
    payload: {
      amount: input.amount,
      currency: input.currency,
      direction: input.direction,
      status,
      compliance_hold: held,
    },
  });

  // 6. Audit
  await auditLog(db, {
    entity_id: input.entity_id,
    event_type: `payment.${status}`,
    actor,
    resource_type: 'payment',
    resource_id: paymentId,
    payload: { amount: input.amount, currency: input.currency, held, approvals },
  });

  return {
    payment_id: paymentId,
    transaction_id: txId,
    status: held ? 'held' : 'authorized',
    compliance_results: complianceResults,
    required_approvals: approvals,
  };
}

/**
 * Authorize a held payment after manual review.
 * SoD: approver must differ from creator.
 */
export async function approvePayment(
  db: DbClient,
  paymentId: string,
  approver: string,
): Promise<{ status: string }> {
  const { rows } = await db.query(
    `SELECT p.*, t.entity_id AS tx_entity_id
     FROM qx_payments p
     JOIN qx_transactions t ON t.id = p.transaction_id
     WHERE p.id = $1`,
    [paymentId],
  );

  if (rows.length === 0) throw new Error('Payment not found');
  const payment = rows[0];

  if (payment.status !== 'held') {
    throw new Error(`Payment is ${payment.status}, not held`);
  }

  // SoD check: get creator from audit
  const auditResult = await db.query(
    `SELECT actor FROM qx_audit_logs
     WHERE resource_type = 'payment' AND resource_id = $1 AND event_type = 'payment.held'
     ORDER BY created_at ASC LIMIT 1`,
    [paymentId],
  );

  if (auditResult.rows.length > 0 && auditResult.rows[0].actor === approver) {
    throw new Error('Segregation of duties: approver cannot be the creator');
  }

  await db.query(`UPDATE qx_payments SET status = 'authorized', updated_at = now() WHERE id = $1`, [paymentId]);
  await db.query(`UPDATE qx_transactions SET status = 'authorized' WHERE id = $1`, [payment.transaction_id]);

  await emit(db, {
    entity_id: payment.tx_entity_id,
    aggregate_type: 'payment',
    aggregate_id: paymentId,
    event_type: 'PaymentAuthorized',
    payload: { approved_by: approver },
  });

  await auditLog(db, {
    entity_id: payment.tx_entity_id,
    event_type: 'payment.approved',
    actor: approver,
    resource_type: 'payment',
    resource_id: paymentId,
  });

  return { status: 'authorized' };
}
