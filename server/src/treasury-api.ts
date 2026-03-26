// ─── Treasury API — Bank-Level Payment Infrastructure ────────────────────────
// Prepares the system for multi-entity payment processing.
// Endpoints: accounts, flows, routing, payouts, reconciliation.
// All entity-scoped — each request is routed to the correct jurisdiction.

import { Router, Request, Response } from "express";
import { supabase } from "./supabase";

const router = Router();

// ─── Types ──────────────────────────────────────────────────────────────────

export type EntityJurisdiction = "UAE" | "US-DE" | "US-TX" | "SE" | "EU-LT" | "Global";
export type AccountStatus = "active" | "pending" | "planned";
export type FlowType = "royalty" | "dividend" | "service-fee" | "revenue" | "payout";
export type FlowDirection = "inbound" | "outbound" | "intercompany";
export type ComplianceGate = "kyc" | "aml" | "sanctions" | "transfer-pricing" | "substance";

export interface TreasuryAccount {
  id: string;
  entity_id: string;
  bank_name: string;
  currency: string;
  account_type: string;
  status: AccountStatus;
  iban: string | null;
  balance: number | null; // null = not yet connected
  last_synced: string | null;
}

export interface TreasuryFlow {
  id: string;
  from_entity_id: string;
  to_entity_id: string;
  flow_type: FlowType;
  direction: FlowDirection;
  amount: number;
  currency: string;
  description: string;
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
  completed_at: string | null;
  reference: string | null;
}

export interface RoutingRule {
  id: string;
  condition: string;
  destination_entity_id: string;
  psp: string;
  priority: number;
  active: boolean;
}

export interface ComplianceCheck {
  gate: ComplianceGate;
  entity_id: string;
  status: "pass" | "fail" | "pending" | "not-applicable";
  last_checked: string | null;
  notes: string;
}

// ─── GET /api/treasury/accounts ─────────────────────────────────────────────
// Returns all entity bank accounts with status and balances

router.get("/accounts", async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("treasury_accounts")
      .select("*")
      .order("entity_id");

    if (error) {
      // Table may not exist yet — return mock structure
      return res.json({
        accounts: [
          { id: "ta-1", entity_id: "landvex-ab", bank_name: "SEB", currency: "SEK", status: "active", balance: null },
          { id: "ta-2", entity_id: "wavult-group", bank_name: "Emirates NBD", currency: "USD", status: "pending", balance: null },
          { id: "ta-3", entity_id: "wavult-operations", bank_name: "Emirates NBD", currency: "USD", status: "pending", balance: null },
          { id: "ta-4", entity_id: "landvex-inc", bank_name: "Mercury", currency: "USD", status: "planned", balance: null },
          { id: "ta-5", entity_id: "quixzoom-uab", bank_name: "Revolut Business", currency: "EUR", status: "planned", balance: null },
          { id: "ta-6", entity_id: "quixzoom-inc", bank_name: "Mercury", currency: "USD", status: "planned", balance: null },
        ],
        source: "mock",
      });
    }

    res.json({ accounts: data, source: "supabase" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/treasury/flows ────────────────────────────────────────────────
// Returns intercompany flow ledger

router.get("/flows", async (req: Request, res: Response) => {
  try {
    const entity_id = req.query.entity_id as string | undefined;
    const flow_type = req.query.flow_type as string | undefined;

    let query = supabase
      .from("treasury_flows")
      .select("*")
      .order("created_at", { ascending: false });

    if (entity_id) {
      query = query.or(`from_entity_id.eq.${entity_id},to_entity_id.eq.${entity_id}`);
    }
    if (flow_type) {
      query = query.eq("flow_type", flow_type);
    }

    const { data, error } = await query;

    if (error) {
      return res.json({ flows: [], source: "mock", message: "Treasury flows table not yet created" });
    }

    res.json({ flows: data, source: "supabase" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/treasury/payment-intent ──────────────────────────────────────
// Creates a payment intent routed to the correct entity based on jurisdiction

router.post("/payment-intent", async (req: Request, res: Response) => {
  try {
    const { amount, currency, customer_jurisdiction, product_id, metadata } = req.body;

    if (!amount || !currency || !customer_jurisdiction) {
      return res.status(400).json({ error: "amount, currency, and customer_jurisdiction required" });
    }

    // Determine target entity based on customer jurisdiction
    const routingMap: Record<string, string> = {
      "US": "landvex-inc",
      "EU": "quixzoom-uab",
      "SE": "landvex-ab",
      "default": "landvex-ab",
    };

    const targetEntity = routingMap[customer_jurisdiction] ?? routingMap["default"];

    // In bank-level phase: this creates a real Stripe PaymentIntent
    // For now: return the routing decision
    res.json({
      payment_intent_id: `pi_${Date.now()}_mock`,
      target_entity: targetEntity,
      amount,
      currency,
      customer_jurisdiction,
      routing_reason: `Customer in ${customer_jurisdiction} → routed to ${targetEntity}`,
      status: "requires_payment_method",
      psp: "stripe",
      mode: "mock", // Will be "live" when connected
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/treasury/payout ──────────────────────────────────────────────
// Initiates a payout (vendor, contractor, intercompany)

router.post("/payout", async (req: Request, res: Response) => {
  try {
    const { from_entity_id, to_entity_id, amount, currency, flow_type, description } = req.body;

    if (!from_entity_id || !amount || !currency || !flow_type) {
      return res.status(400).json({ error: "from_entity_id, amount, currency, and flow_type required" });
    }

    // In bank-level phase: this triggers a real transfer via Wise/bank
    res.json({
      payout_id: `po_${Date.now()}_mock`,
      from_entity_id,
      to_entity_id: to_entity_id ?? "external",
      amount,
      currency,
      flow_type,
      description,
      status: "pending_approval", // Requires board/CFO approval for intercompany
      approval_required: flow_type === "dividend" || flow_type === "royalty",
      mode: "mock",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/treasury/intercompany-invoice ────────────────────────────────
// Generates an intercompany invoice (royalty, service fee)

router.post("/intercompany-invoice", async (req: Request, res: Response) => {
  try {
    const { from_entity_id, to_entity_id, invoice_type, period, amount, currency } = req.body;

    if (!from_entity_id || !to_entity_id || !invoice_type) {
      return res.status(400).json({ error: "from_entity_id, to_entity_id, and invoice_type required" });
    }

    res.json({
      invoice_id: `inv_${Date.now()}_mock`,
      from_entity_id,
      to_entity_id,
      invoice_type, // "royalty" | "service-fee"
      period: period ?? new Date().toISOString().slice(0, 7),
      amount: amount ?? null,
      currency: currency ?? "USD",
      status: "draft",
      transfer_pricing_compliant: invoice_type === "royalty" ? "requires_documentation" : "n/a",
      mode: "mock",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/treasury/routing-rules ────────────────────────────────────────
// Returns active payment routing configuration

router.get("/routing-rules", async (_req: Request, res: Response) => {
  res.json({
    rules: [
      { id: "rr-1", condition: "customer_jurisdiction == 'EU'", destination_entity_id: "quixzoom-uab", psp: "stripe", priority: 1, active: true },
      { id: "rr-2", condition: "customer_jurisdiction == 'SE'", destination_entity_id: "landvex-ab", psp: "stripe", priority: 2, active: true },
      { id: "rr-3", condition: "customer_jurisdiction == 'US'", destination_entity_id: "landvex-inc", psp: "stripe", priority: 3, active: true },
      { id: "rr-4", condition: "flow_type == 'royalty'", destination_entity_id: "wavult-group", psp: "wise", priority: 10, active: true },
      { id: "rr-5", condition: "flow_type == 'service-fee'", destination_entity_id: "wavult-operations", psp: "wise", priority: 11, active: true },
      { id: "rr-6", condition: "flow_type == 'dividend'", destination_entity_id: "wavult-group", psp: "bank-transfer", priority: 20, active: true },
    ],
  });
});

// ─── POST /api/treasury/reconcile ───────────────────────────────────────────
// Reconciliation endpoint — matches bank statements vs internal ledger

router.post("/reconcile", async (req: Request, res: Response) => {
  const { entity_id, period } = req.body;

  res.json({
    entity_id: entity_id ?? "all",
    period: period ?? new Date().toISOString().slice(0, 7),
    status: "not_implemented",
    message: "Reconciliation engine will be available in bank-level phase. Requires live bank feed connection.",
    planned_features: [
      "Bank statement import (MT940/CAMT.053)",
      "Auto-matching against internal ledger",
      "Exception handling for unmatched items",
      "Multi-currency reconciliation",
    ],
  });
});

// ─── GET /api/treasury/compliance-gates ─────────────────────────────────────
// Returns compliance status for all entities

router.get("/compliance-gates", async (_req: Request, res: Response) => {
  const gates: ComplianceCheck[] = [
    { gate: "kyc", entity_id: "landvex-ab", status: "pass", last_checked: "2026-03-15", notes: "Swedish entity — KYC complete via SEB" },
    { gate: "kyc", entity_id: "wavult-group", status: "pending", last_checked: null, notes: "Dubai FZCO — KYC in progress" },
    { gate: "aml", entity_id: "landvex-ab", status: "pass", last_checked: "2026-03-15", notes: "AML screening passed" },
    { gate: "transfer-pricing", entity_id: "wavult-group", status: "pending", last_checked: null, notes: "Documentation needed for IP royalty rates" },
    { gate: "substance", entity_id: "wavult-group", status: "pending", last_checked: null, notes: "CRITICAL — office + board meetings required in Dubai" },
    { gate: "sanctions", entity_id: "wavult-group", status: "pass", last_checked: "2026-03-20", notes: "No sanctions hits" },
  ];

  res.json({ gates });
});

export default router;
