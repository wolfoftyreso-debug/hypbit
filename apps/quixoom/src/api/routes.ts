import { Router, type Request, type Response } from 'express';
import { withTransaction } from '../core/db.js';
import * as payments from '../core/payments.js';
import * as ledger from '../core/ledger.js';
import * as reconciliation from '../core/reconciliation.js';
import * as intercompany from '../core/intercompany.js';
import { CreatePaymentInput, CreateEntityInput, CreateAccountInput } from '../core/types.js';
import { getPool } from '../core/db.js';
import { randomUUID } from 'crypto';

export const router = Router();

// ============================================================================
// Health
// ============================================================================
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'quixoom', timestamp: new Date().toISOString() });
});

// ============================================================================
// Entities
// ============================================================================
router.post('/entities', async (req: Request, res: Response) => {
  try {
    const input = CreateEntityInput.parse(req.body);
    const id = randomUUID();
    const pool = getPool();
    await pool.query(
      `INSERT INTO qx_entities (id, name, jurisdiction, base_currency, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, input.name, input.jurisdiction, input.base_currency, JSON.stringify(input.metadata ?? {})],
    );
    res.status(201).json({ id, ...input });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/entities', async (_req: Request, res: Response) => {
  const { rows } = await getPool().query('SELECT * FROM qx_entities ORDER BY created_at DESC');
  res.json(rows);
});

// ============================================================================
// Accounts
// ============================================================================
router.post('/accounts', async (req: Request, res: Response) => {
  try {
    const input = CreateAccountInput.parse(req.body);
    const id = randomUUID();
    await getPool().query(
      `INSERT INTO qx_accounts (id, entity_id, type, currency, label)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, input.entity_id, input.type, input.currency, input.label ?? null],
    );
    res.status(201).json({ id, ...input });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/accounts/:entityId', async (req: Request, res: Response) => {
  const { rows } = await getPool().query(
    'SELECT * FROM qx_accounts WHERE entity_id = $1 ORDER BY created_at DESC',
    [req.params.entityId],
  );
  res.json(rows);
});

router.get('/accounts/:accountId/balance', async (req: Request, res: Response) => {
  try {
    const balance = await ledger.getBalance(getPool(), req.params.accountId);
    res.json(balance);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ============================================================================
// Payments
// ============================================================================
router.post('/payments', async (req: Request, res: Response) => {
  try {
    const input = CreatePaymentInput.parse(req.body);
    const actor = req.headers['x-actor'] as string || 'system';

    // Get entity jurisdiction
    const { rows: entityRows } = await getPool().query(
      'SELECT jurisdiction FROM qx_entities WHERE id = $1',
      [input.entity_id],
    );
    if (entityRows.length === 0) {
      res.status(404).json({ error: 'Entity not found' });
      return;
    }

    const result = await withTransaction(async (client) =>
      payments.createPayment(client, input, actor, entityRows[0].jurisdiction),
    );

    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/payments/:id/approve', async (req: Request, res: Response) => {
  try {
    const approver = req.headers['x-actor'] as string;
    if (!approver) {
      res.status(400).json({ error: 'x-actor header required' });
      return;
    }

    const result = await withTransaction(async (client) =>
      payments.approvePayment(client, req.params.id, approver),
    );

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ============================================================================
// Ledger
// ============================================================================
router.post('/ledger/commit', async (req: Request, res: Response) => {
  try {
    const actor = req.headers['x-actor'] as string || 'system';
    const { entity_id, type, reference, idempotency_key, lines } = req.body;

    const result = await withTransaction(async (client) =>
      ledger.commitEntries(client, { entity_id, type, reference, idempotency_key, lines, actor }),
    );

    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ============================================================================
// Reconciliation
// ============================================================================
router.post('/reconcile', async (req: Request, res: Response) => {
  try {
    const actor = req.headers['x-actor'] as string || 'system';
    const result = await withTransaction(async (client) =>
      reconciliation.reconcile(client, req.body, actor),
    );
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ============================================================================
// Intercompany
// ============================================================================
router.get('/intercompany/:entityId', async (req: Request, res: Response) => {
  const positions = await intercompany.getPositions(getPool(), req.params.entityId);
  res.json(positions);
});

router.post('/intercompany/update', async (req: Request, res: Response) => {
  try {
    const actor = req.headers['x-actor'] as string || 'system';
    const result = await withTransaction(async (client) =>
      intercompany.updatePosition(client, { ...req.body, actor }),
    );
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/intercompany/netting/:currency', async (req: Request, res: Response) => {
  const result = await intercompany.calculateNetting(getPool(), req.params.currency);
  res.json(result);
});

// ============================================================================
// Audit
// ============================================================================
router.get('/audit/:entityId', async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const { rows } = await getPool().query(
    `SELECT * FROM qx_audit_logs WHERE entity_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [req.params.entityId, limit],
  );
  res.json(rows);
});

// ============================================================================
// Compliance flags
// ============================================================================
router.get('/compliance/flags', async (req: Request, res: Response) => {
  const status = req.query.status as string || 'open';
  const { rows } = await getPool().query(
    `SELECT * FROM qx_compliance_flags WHERE status = $1 ORDER BY created_at DESC LIMIT 100`,
    [status],
  );
  res.json(rows);
});
