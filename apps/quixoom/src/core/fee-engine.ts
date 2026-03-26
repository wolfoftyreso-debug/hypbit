import { randomUUID } from 'crypto';
import type { DbClient } from './db.js';
import { emit } from './event-bus.js';
import { log as auditLog } from './audit.js';

// ============================================================================
// Fee Engine
//
// Universal take rate on ALL value flows in the system.
// Fees are applied at the moment of value transfer — never in arrears.
//
// Flow:
//   PaymentTriggered → FeeEngine.split() → LedgerCommitted → WalletUpdated
//
// Rules:
//   1. Fee is deducted BEFORE creator receives funds
//   2. Fee is recorded in immutable fee_ledger
//   3. Platform account balance is updated atomically
//   4. Tiered fees per creator level (Elite 3%, Professional 4%, default 5%)
// ============================================================================

// ============================================================================
// Types
// ============================================================================

export interface SplitResult {
  gross_amount: number;
  fee_pct: number;
  fee_amount: number;
  net_amount: number;         // what creator receives
  fee_config_slug: string;
  level_slug?: string;
  platform_account_id: string;
}

export interface SplitInput {
  transaction_type: string;   // task_payout, ir_sale, subscription, lead_sale, withdrawal, enterprise
  gross_amount: number;
  creator_id?: string;
  reference_type: string;     // task_assignment, ir_purchase, buyer_purchase, withdrawal
  reference_id: string;
}

export interface FeeConfig {
  id: string;
  slug: string;
  transaction_type: string;
  fee_pct: number;
  min_fee: number;
  max_fee: number | null;
}

// Cache fee configs (reload every 5 min in production)
let feeConfigCache: FeeConfig[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 300_000; // 5 min

// ============================================================================
// Core: Calculate + Apply Split
// ============================================================================

/**
 * Calculate and record the fee split for a transaction.
 * This is the SINGLE ENTRY POINT for all fee calculations.
 *
 * Returns the net amount the creator receives.
 */
export async function split(
  db: DbClient,
  input: SplitInput,
): Promise<SplitResult> {
  // 1. Get fee config for this transaction type
  const config = await getFeeConfig(db, input.transaction_type);
  if (!config) {
    // No fee configured — pass through full amount
    return {
      gross_amount: input.gross_amount,
      fee_pct: 0,
      fee_amount: 0,
      net_amount: input.gross_amount,
      fee_config_slug: 'none',
      platform_account_id: '',
    };
  }

  // 2. Check for tiered override based on creator level
  let feePct = config.fee_pct;
  let levelSlug: string | undefined;

  if (input.creator_id) {
    const tierOverride = await getTieredFee(db, config.id, input.creator_id);
    if (tierOverride) {
      feePct = tierOverride.fee_pct;
      levelSlug = tierOverride.level_slug;
    }
  }

  // 3. Calculate fee
  let feeAmount = Math.round(input.gross_amount * feePct * 100) / 100;

  // Apply min/max bounds
  if (feeAmount < config.min_fee) feeAmount = config.min_fee;
  if (config.max_fee !== null && feeAmount > config.max_fee) feeAmount = config.max_fee;

  // Ensure fee doesn't exceed gross
  if (feeAmount >= input.gross_amount) feeAmount = Math.round(input.gross_amount * 0.5 * 100) / 100;

  const netAmount = Math.round((input.gross_amount - feeAmount) * 100) / 100;

  // 4. Get platform account
  const { rows: acctRows } = await db.query(
    `SELECT id FROM qz_platform_accounts WHERE slug = 'fee-collection' LIMIT 1`,
  );
  const platformAccountId = acctRows[0]?.id ?? '';

  // 5. Record in fee ledger (immutable)
  await db.query(
    `INSERT INTO qz_fee_ledger (
       id, transaction_type, reference_type, reference_id,
       gross_amount, fee_pct, fee_amount, net_amount, currency,
       creator_id, level_slug, platform_account_id
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'SEK', $9, $10, $11)`,
    [
      randomUUID(), input.transaction_type, input.reference_type, input.reference_id,
      input.gross_amount, feePct, feeAmount, netAmount,
      input.creator_id ?? null, levelSlug ?? null, platformAccountId,
    ],
  );

  // 6. Credit platform account
  if (platformAccountId) {
    await db.query(
      `UPDATE qz_platform_accounts SET balance = balance + $1, updated_at = now() WHERE id = $2`,
      [feeAmount, platformAccountId],
    );
  }

  // 7. Emit event
  await emit(db, {
    aggregate_type: 'fee',
    aggregate_id: input.reference_id,
    event_type: 'PaymentTriggered',
    payload: {
      event: 'fee_split',
      transaction_type: input.transaction_type,
      gross: input.gross_amount,
      fee_pct: feePct,
      fee: feeAmount,
      net: netAmount,
      creator_id: input.creator_id,
    },
  });

  // 8. Audit
  await auditLog(db, {
    event_type: 'fee.applied',
    actor: 'system:fee-engine',
    resource_type: input.reference_type,
    resource_id: input.reference_id,
    payload: {
      transaction_type: input.transaction_type,
      gross: input.gross_amount,
      fee_pct: feePct,
      fee: feeAmount,
      net: netAmount,
    },
  });

  return {
    gross_amount: input.gross_amount,
    fee_pct: feePct,
    fee_amount: feeAmount,
    net_amount: netAmount,
    fee_config_slug: config.slug,
    level_slug: levelSlug,
    platform_account_id: platformAccountId,
  };
}

/**
 * Preview a fee split without recording it.
 * Used by pricing engine and UI to show "you'll receive X".
 */
export async function preview(
  db: DbClient,
  transactionType: string,
  grossAmount: number,
  creatorId?: string,
): Promise<{ fee_pct: number; fee_amount: number; net_amount: number }> {
  const config = await getFeeConfig(db, transactionType);
  if (!config) return { fee_pct: 0, fee_amount: 0, net_amount: grossAmount };

  let feePct = config.fee_pct;

  if (creatorId) {
    const tierOverride = await getTieredFee(db, config.id, creatorId);
    if (tierOverride) feePct = tierOverride.fee_pct;
  }

  let feeAmount = Math.round(grossAmount * feePct * 100) / 100;
  if (feeAmount < config.min_fee) feeAmount = config.min_fee;
  if (config.max_fee !== null && feeAmount > config.max_fee) feeAmount = config.max_fee;
  if (feeAmount >= grossAmount) feeAmount = Math.round(grossAmount * 0.5 * 100) / 100;

  return {
    fee_pct: feePct,
    fee_amount: feeAmount,
    net_amount: Math.round((grossAmount - feeAmount) * 100) / 100,
  };
}

// ============================================================================
// Revenue Reporting
// ============================================================================

/**
 * Get platform revenue summary.
 */
export async function getRevenueSummary(
  db: DbClient,
  params?: { from?: string; to?: string },
): Promise<{
  total_gross: number;
  total_fees: number;
  total_net_to_creators: number;
  transaction_count: number;
  by_type: Array<{ type: string; gross: number; fees: number; net: number; count: number }>;
}> {
  let dateFilter = '';
  const queryParams: unknown[] = [];

  if (params?.from) {
    queryParams.push(params.from);
    dateFilter += ` AND created_at >= $${queryParams.length}`;
  }
  if (params?.to) {
    queryParams.push(params.to);
    dateFilter += ` AND created_at <= $${queryParams.length}`;
  }

  const { rows: totals } = await db.query(
    `SELECT
       COALESCE(SUM(gross_amount), 0) AS total_gross,
       COALESCE(SUM(fee_amount), 0) AS total_fees,
       COALESCE(SUM(net_amount), 0) AS total_net,
       COUNT(*) AS tx_count
     FROM qz_fee_ledger WHERE 1=1 ${dateFilter}`,
    queryParams,
  );

  const { rows: byType } = await db.query(
    `SELECT
       transaction_type AS type,
       SUM(gross_amount) AS gross,
       SUM(fee_amount) AS fees,
       SUM(net_amount) AS net,
       COUNT(*) AS count
     FROM qz_fee_ledger WHERE 1=1 ${dateFilter}
     GROUP BY transaction_type ORDER BY fees DESC`,
    queryParams,
  );

  return {
    total_gross: parseFloat(totals[0].total_gross),
    total_fees: parseFloat(totals[0].total_fees),
    total_net_to_creators: parseFloat(totals[0].total_net),
    transaction_count: parseInt(totals[0].tx_count),
    by_type: byType.map(r => ({
      type: r.type,
      gross: parseFloat(r.gross),
      fees: parseFloat(r.fees),
      net: parseFloat(r.net),
      count: parseInt(r.count),
    })),
  };
}

/**
 * Get platform account balances.
 */
export async function getPlatformBalances(
  db: DbClient,
): Promise<Array<{ slug: string; name: string; type: string; balance: number }>> {
  const { rows } = await db.query(
    `SELECT slug, name, type, balance FROM qz_platform_accounts ORDER BY type`,
  );
  return rows.map(r => ({ ...r, balance: parseFloat(r.balance) }));
}

/**
 * Get fee history for a specific creator.
 */
export async function getCreatorFeeHistory(
  db: DbClient,
  creatorId: string,
  limit: number = 50,
): Promise<Array<{
  transaction_type: string;
  gross_amount: number;
  fee_amount: number;
  net_amount: number;
  fee_pct: number;
  created_at: string;
}>> {
  const { rows } = await db.query(
    `SELECT transaction_type, gross_amount, fee_amount, net_amount, fee_pct, created_at
     FROM qz_fee_ledger WHERE creator_id = $1
     ORDER BY created_at DESC LIMIT $2`,
    [creatorId, limit],
  );
  return rows;
}

// ============================================================================
// Config Management
// ============================================================================

/**
 * Get all active fee configs.
 */
export async function getAllFeeConfigs(db: DbClient): Promise<FeeConfig[]> {
  if (feeConfigCache && Date.now() - cacheTime < CACHE_TTL) return feeConfigCache;

  const { rows } = await db.query(
    `SELECT id, slug, transaction_type, fee_pct, min_fee, max_fee
     FROM qz_fee_config
     WHERE active = true
       AND effective_from <= now()
       AND (effective_until IS NULL OR effective_until > now())
     ORDER BY transaction_type`,
  );

  feeConfigCache = rows.map(r => ({
    ...r,
    fee_pct: parseFloat(r.fee_pct),
    min_fee: parseFloat(r.min_fee),
    max_fee: r.max_fee ? parseFloat(r.max_fee) : null,
  }));
  cacheTime = Date.now();
  return feeConfigCache;
}

/**
 * Update a fee configuration.
 */
export async function updateFeeConfig(
  db: DbClient,
  slug: string,
  newFeePct: number,
  actor: string,
): Promise<void> {
  await db.query(
    `UPDATE qz_fee_config SET fee_pct = $1 WHERE slug = $2`,
    [newFeePct, slug],
  );

  feeConfigCache = null; // invalidate cache

  await auditLog(db, {
    event_type: 'fee.config_updated',
    actor,
    resource_type: 'fee_config',
    payload: { slug, new_fee_pct: newFeePct },
  });
}

// ============================================================================
// Internal
// ============================================================================

async function getFeeConfig(db: DbClient, transactionType: string): Promise<FeeConfig | null> {
  const configs = await getAllFeeConfigs(db);
  return configs.find(c => c.transaction_type === transactionType) ?? null;
}

async function getTieredFee(
  db: DbClient,
  feeConfigId: string,
  creatorId: string,
): Promise<{ fee_pct: number; level_slug: string } | null> {
  const { rows } = await db.query(
    `SELECT ft.fee_pct, l.slug AS level_slug
     FROM qz_fee_tiers ft
     JOIN qz_levels l ON l.id = ft.level_id
     JOIN qz_users u ON u.level_id = l.id
     WHERE ft.fee_config_id = $1 AND u.id = $2 AND ft.active = true`,
    [feeConfigId, creatorId],
  );
  return rows[0] ? { fee_pct: parseFloat(rows[0].fee_pct), level_slug: rows[0].level_slug } : null;
}
