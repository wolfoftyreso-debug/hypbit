import { randomUUID } from 'crypto';
import type { DbClient } from './db.js';
import { emit } from './event-bus.js';
import { log as auditLog } from './audit.js';
import type { Severity } from './types.js';

// ============================================================================
// Rule definitions (loaded from YAML/config in production)
// ============================================================================

export interface ComplianceRule {
  name: string;
  description: string;
  condition: (ctx: RuleContext) => boolean;
  severity: Severity;
  actions: RuleAction[];
}

export interface RuleContext {
  amount: number;
  currency: string;
  entity_id: string;
  jurisdiction: string;
  counterparty_jurisdiction?: string;
  transaction_type: string;
  actor: string;
  velocity_count?: number; // transactions in current window
}

export type RuleAction =
  | { type: 'require_approval'; count: number }
  | { type: 'aml_check' }
  | { type: 'hold' }
  | { type: 'log' };

export interface RuleResult {
  rule: string;
  triggered: boolean;
  severity: Severity;
  actions: RuleAction[];
}

// ============================================================================
// Built-in rules
// ============================================================================

const builtinRules: ComplianceRule[] = [
  {
    name: 'high_value_payment',
    description: 'Flag payments above 100,000',
    condition: (ctx) => ctx.amount > 100_000,
    severity: 'high',
    actions: [
      { type: 'require_approval', count: 2 },
      { type: 'aml_check' },
      { type: 'log' },
    ],
  },
  {
    name: 'geo_mismatch',
    description: 'Counterparty in different jurisdiction',
    condition: (ctx) =>
      !!ctx.counterparty_jurisdiction &&
      ctx.counterparty_jurisdiction !== ctx.jurisdiction,
    severity: 'medium',
    actions: [{ type: 'aml_check' }, { type: 'log' }],
  },
  {
    name: 'velocity_breach',
    description: 'Too many transactions in window',
    condition: (ctx) => (ctx.velocity_count ?? 0) > 50,
    severity: 'high',
    actions: [{ type: 'hold' }, { type: 'log' }],
  },
  {
    name: 'sanctioned_jurisdiction',
    description: 'Transaction involving sanctioned jurisdiction',
    condition: (ctx) => {
      const sanctioned = ['KP', 'IR', 'SY', 'CU'];
      return (
        sanctioned.includes(ctx.jurisdiction) ||
        sanctioned.includes(ctx.counterparty_jurisdiction ?? '')
      );
    },
    severity: 'critical',
    actions: [{ type: 'hold' }, { type: 'require_approval', count: 3 }, { type: 'log' }],
  },
];

let customRules: ComplianceRule[] = [];

export function registerRule(rule: ComplianceRule): void {
  customRules.push(rule);
}

export function clearCustomRules(): void {
  customRules = [];
}

// ============================================================================
// Engine
// ============================================================================

export async function evaluate(
  db: DbClient,
  ctx: RuleContext,
  transactionId: string,
): Promise<RuleResult[]> {
  const allRules = [...builtinRules, ...customRules];
  const results: RuleResult[] = [];

  for (const rule of allRules) {
    const triggered = rule.condition(ctx);
    results.push({
      rule: rule.name,
      triggered,
      severity: rule.severity,
      actions: triggered ? rule.actions : [],
    });

    if (triggered) {
      // Persist flag
      await db.query(
        `INSERT INTO qx_compliance_flags (id, entity_id, transaction_id, rule, severity, status, details)
         VALUES ($1, $2, $3, $4, $5, 'open', $6)`,
        [
          randomUUID(),
          ctx.entity_id,
          transactionId,
          rule.name,
          rule.severity,
          JSON.stringify({ description: rule.description, context: ctx }),
        ],
      );

      // Emit event
      await emit(db, {
        entity_id: ctx.entity_id,
        aggregate_type: 'compliance',
        aggregate_id: transactionId,
        event_type: 'ComplianceFlagged',
        payload: { rule: rule.name, severity: rule.severity, actions: rule.actions },
      });

      // Audit
      await auditLog(db, {
        entity_id: ctx.entity_id,
        event_type: 'compliance.flagged',
        actor: 'system:compliance-engine',
        resource_type: 'transaction',
        resource_id: transactionId,
        payload: { rule: rule.name, severity: rule.severity },
      });
    }
  }

  return results;
}

/**
 * Check if any triggered rule requires a hold.
 */
export function requiresHold(results: RuleResult[]): boolean {
  return results.some(r => r.triggered && r.actions.some(a => a.type === 'hold'));
}

/**
 * Get minimum approval count from triggered rules.
 */
export function requiredApprovals(results: RuleResult[]): number {
  let max = 0;
  for (const r of results) {
    if (!r.triggered) continue;
    for (const a of r.actions) {
      if (a.type === 'require_approval' && a.count > max) {
        max = a.count;
      }
    }
  }
  return max;
}
