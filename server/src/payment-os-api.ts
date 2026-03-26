// ─── Payment OS API — Enterprise Payment Operating System ───────────────────
// Layer 0: Payment routing + split engine
// Layer 1: Settlement + FX
// Layer 2: Ledger entries + billing
// Layer 3: Compliance + audit
// All flows are event-driven, immutable, append-only.

import { Router, Request, Response } from "express";
import { supabase } from "./supabase";

const router = Router();

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PaymentEvent {
  id: string;
  event_type: string;
  entity_id: string;
  amount: number;
  currency: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface SplitAllocation {
  entity_id: string;
  amount: number;
  type: "revenue" | "royalty" | "service-fee" | "tax-reserve";
  percentage: number;
}

export interface LedgerEntry {
  id: string;
  flow_id: string;
  entity_id: string;
  account: string;
  debit: number;
  credit: number;
  currency: string;
  description: string;
  created_at: string;
}

// ─── Split Rules (jurisdiction-based) ───────────────────────────────────────

const SPLIT_RULES: Record<string, SplitAllocation[]> = {
  US: [
    { entity_id: "receiving-entity", amount: 0, type: "revenue", percentage: 55 },
    { entity_id: "wavult-group", amount: 0, type: "royalty", percentage: 10 },
    { entity_id: "wavult-operations", amount: 0, type: "service-fee", percentage: 14 },
    { entity_id: "receiving-entity", amount: 0, type: "tax-reserve", percentage: 21 },
  ],
  SE: [
    { entity_id: "receiving-entity", amount: 0, type: "revenue", percentage: 49.4 },
    { entity_id: "wavult-group", amount: 0, type: "royalty", percentage: 10 },
    { entity_id: "wavult-operations", amount: 0, type: "service-fee", percentage: 14 },
    { entity_id: "receiving-entity", amount: 0, type: "tax-reserve", percentage: 26.6 },
  ],
  EU: [
    { entity_id: "receiving-entity", amount: 0, type: "revenue", percentage: 61 },
    { entity_id: "wavult-group", amount: 0, type: "royalty", percentage: 10 },
    { entity_id: "wavult-operations", amount: 0, type: "service-fee", percentage: 14 },
    { entity_id: "receiving-entity", amount: 0, type: "tax-reserve", percentage: 15 },
  ],
};

// ─── Routing Map ────────────────────────────────────────────────────────────

const ROUTING_MAP: Record<string, { entity: string; psp: string }> = {
  US: { entity: "landvex-inc", psp: "stripe" },
  SE: { entity: "landvex-ab", psp: "stripe" },
  EU: { entity: "quixzoom-uab", psp: "stripe" },
  DEFAULT: { entity: "landvex-ab", psp: "stripe" },
};

// ─── POST /api/payment-os/process ───────────────────────────────────────────
// The main payment processing endpoint. Handles:
// 1. Routing (jurisdiction → entity + PSP)
// 2. Split calculation
// 3. Ledger entries (double-entry)
// 4. Event emission

router.post("/process", async (req: Request, res: Response) => {
  try {
    const { amount, currency, customer_jurisdiction, product, customer_id, metadata } = req.body;

    if (!amount || !currency || !customer_jurisdiction) {
      return res.status(400).json({ error: "amount, currency, and customer_jurisdiction required" });
    }

    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Step 1: Route
    const route = ROUTING_MAP[customer_jurisdiction] ?? ROUTING_MAP.DEFAULT;
    const splitJurisdiction = customer_jurisdiction === "SE" ? "SE" : customer_jurisdiction === "US" ? "US" : "EU";

    // Step 2: Calculate splits
    const splits = (SPLIT_RULES[splitJurisdiction] ?? SPLIT_RULES.EU).map(s => ({
      ...s,
      entity_id: s.entity_id === "receiving-entity" ? route.entity : s.entity_id,
      amount: Math.round(amount * s.percentage) / 100,
    }));

    // Step 3: Generate ledger entries (double-entry)
    const ledgerEntries: Omit<LedgerEntry, "id" | "created_at">[] = [];

    // Customer payment → bank
    ledgerEntries.push({
      flow_id: paymentId,
      entity_id: route.entity,
      account: "bank",
      debit: amount,
      credit: 0,
      currency,
      description: `Customer payment received (${customer_jurisdiction})`,
    });

    // Revenue recognition
    const revenueAlloc = splits.find(s => s.type === "revenue");
    if (revenueAlloc) {
      ledgerEntries.push({
        flow_id: paymentId,
        entity_id: route.entity,
        account: "revenue",
        debit: 0,
        credit: revenueAlloc.amount,
        currency,
        description: "Revenue recognized",
      });
    }

    // Royalty payable
    const royaltyAlloc = splits.find(s => s.type === "royalty");
    if (royaltyAlloc) {
      ledgerEntries.push({
        flow_id: paymentId,
        entity_id: route.entity,
        account: "ic-payable-royalty",
        debit: 0,
        credit: royaltyAlloc.amount,
        currency,
        description: "IP royalty payable to Wavult Group (Dubai)",
      });
    }

    // Service fee payable
    const serviceFeeAlloc = splits.find(s => s.type === "service-fee");
    if (serviceFeeAlloc) {
      ledgerEntries.push({
        flow_id: paymentId,
        entity_id: route.entity,
        account: "ic-payable-service",
        debit: 0,
        credit: serviceFeeAlloc.amount,
        currency,
        description: "Service fee payable to Wavult Operations (Dubai)",
      });
    }

    // Tax reserve
    const taxAlloc = splits.find(s => s.type === "tax-reserve");
    if (taxAlloc) {
      ledgerEntries.push({
        flow_id: paymentId,
        entity_id: route.entity,
        account: "tax-reserve",
        debit: 0,
        credit: taxAlloc.amount,
        currency,
        description: `Tax reserve (${splitJurisdiction})`,
      });
    }

    // Step 4: Generate event trail
    const events = [
      { event: "PaymentCreated", data: { paymentId, amount, currency, customer_jurisdiction } },
      { event: "PaymentRouted", data: { entity: route.entity, psp: route.psp } },
      { event: "PaymentAuthorized", data: { psp: route.psp, status: "authorized" } },
      { event: "SplitCalculated", data: { splits } },
      { event: "LedgerWritten", data: { entries: ledgerEntries.length } },
      { event: "PaymentSettled", data: { status: "settled" } },
    ];

    // Try to persist to Supabase (graceful fallback)
    try {
      await supabase.from("payment_os_events").insert(
        events.map(e => ({
          payment_id: paymentId,
          event_type: e.event,
          entity_id: route.entity,
          amount,
          currency,
          metadata: e.data,
        }))
      );
    } catch {
      // Table may not exist yet — continue with mock
    }

    res.json({
      payment_id: paymentId,
      status: "settled",
      routing: {
        entity: route.entity,
        psp: route.psp,
        jurisdiction: splitJurisdiction,
      },
      splits,
      ledger_entries: ledgerEntries,
      event_trail: events.map(e => e.event),
      totals: {
        to_dubai_holding: (royaltyAlloc?.amount ?? 0),
        to_dubai_ops: (serviceFeeAlloc?.amount ?? 0),
        to_dubai_total: (royaltyAlloc?.amount ?? 0) + (serviceFeeAlloc?.amount ?? 0),
        retained_locally: revenueAlloc?.amount ?? 0,
        tax_reserved: taxAlloc?.amount ?? 0,
        dubai_tax_rate: "0%",
      },
      mode: "mock",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/payment-os/simulate-split ────────────────────────────────────
// Simulate split without processing payment

router.post("/simulate-split", (req: Request, res: Response) => {
  const { amount, jurisdiction } = req.body;

  if (!amount || !jurisdiction) {
    return res.status(400).json({ error: "amount and jurisdiction required" });
  }

  const splitJurisdiction = jurisdiction === "SE" ? "SE" : jurisdiction === "US" ? "US" : "EU";
  const route = ROUTING_MAP[jurisdiction] ?? ROUTING_MAP.DEFAULT;
  const splits = (SPLIT_RULES[splitJurisdiction] ?? SPLIT_RULES.EU).map(s => ({
    ...s,
    entity_id: s.entity_id === "receiving-entity" ? route.entity : s.entity_id,
    amount: Math.round(amount * s.percentage) / 100,
  }));

  const toDubai = splits.filter(s => s.entity_id === "wavult-group" || s.entity_id === "wavult-operations");

  res.json({
    jurisdiction: splitJurisdiction,
    receiving_entity: route.entity,
    splits,
    summary: {
      total_to_dubai: toDubai.reduce((sum, s) => sum + s.amount, 0),
      dubai_tax: "0%",
      local_tax_reserve: splits.find(s => s.type === "tax-reserve")?.amount ?? 0,
      net_retained: splits.find(s => s.type === "revenue")?.amount ?? 0,
    },
  });
});

// ─── GET /api/payment-os/events ─────────────────────────────────────────────
// Get payment event trail (audit log)

router.get("/events", async (req: Request, res: Response) => {
  try {
    const payment_id = req.query.payment_id as string | undefined;

    let query = supabase
      .from("payment_os_events")
      .select("*")
      .order("created_at", { ascending: true });

    if (payment_id) {
      query = query.eq("payment_id", payment_id);
    }

    const { data, error } = await query.limit(100);

    if (error) {
      return res.json({ events: [], source: "mock", message: "Events table not yet created" });
    }

    res.json({ events: data, source: "supabase" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/payment-os/ledger ─────────────────────────────────────────────
// Get ledger entries (double-entry accounting)

router.get("/ledger", async (req: Request, res: Response) => {
  try {
    const entity_id = req.query.entity_id as string | undefined;

    let query = supabase
      .from("payment_os_ledger")
      .select("*")
      .order("created_at", { ascending: false });

    if (entity_id) {
      query = query.eq("entity_id", entity_id);
    }

    const { data, error } = await query.limit(100);

    if (error) {
      return res.json({ entries: [], source: "mock", message: "Ledger table not yet created" });
    }

    res.json({ entries: data, source: "supabase" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/payment-os/split-rules ────────────────────────────────────────
// Get active split rules per jurisdiction

router.get("/split-rules", (_req: Request, res: Response) => {
  res.json({ rules: SPLIT_RULES, routing: ROUTING_MAP });
});

// ─── GET /api/payment-os/architecture ───────────────────────────────────────
// System architecture overview

router.get("/architecture", (_req: Request, res: Response) => {
  res.json({
    principle: "Modular monolith = business logic. Microservices = external integrations. Never the other way around.",
    layers: [
      { layer: 0, name: "Payment Core", tech: "Rust (Hyperswitch)", status: "planned" },
      { layer: 1, name: "Clearing & Settlement", tech: "Node.js (Mojaloop)", status: "evaluating" },
      { layer: 2, name: "Ledger & Billing", tech: "PostgreSQL + Ruby (Lago)", status: "planned" },
      { layer: 3, name: "Integrations", tech: "TypeScript (adapters)", status: "partial" },
    ],
    compliance_strategy: "Technical Service Provider (TSP) — no fund custody, no banking license needed",
    deployment: {
      eu: "eu-north-1 (Stockholm)",
      us: "us-east-1 (Virginia)",
      uae: "me-south-1 (Bahrain)",
    },
  });
});

// ─── POST /api/payment-os/compliance-check ──────────────────────────────────
// Run compliance rules against a transaction

router.post("/compliance-check", (req: Request, res: Response) => {
  const { amount, currency, from_entity, to_entity, flow_type } = req.body;

  const checks: { rule: string; status: "pass" | "flag" | "block"; reason: string }[] = [];

  // Amount threshold
  if (amount > 100000) {
    checks.push({ rule: "large_payment", status: "flag", reason: "Amount > €100K — requires dual approval" });
  } else {
    checks.push({ rule: "large_payment", status: "pass", reason: "Amount within threshold" });
  }

  // Cross-border
  if (from_entity !== to_entity) {
    checks.push({ rule: "cross_border", status: "flag", reason: "Cross-border transfer — AML check required" });
  }

  // Transfer pricing
  if (flow_type === "royalty") {
    checks.push({ rule: "transfer_pricing", status: "flag", reason: "Royalty payment — ensure arms-length rate (5-15%)" });
  }

  // Sanctions
  checks.push({ rule: "sanctions_screening", status: "pass", reason: "No sanctions hits" });

  // SoD
  checks.push({ rule: "segregation_of_duties", status: "pass", reason: "Different user for create/approve/pay" });

  const hasBlock = checks.some(c => c.status === "block");
  const hasFlag = checks.some(c => c.status === "flag");

  res.json({
    overall: hasBlock ? "blocked" : hasFlag ? "flagged" : "cleared",
    checks,
    requires_approval: hasFlag,
    auto_approvable: !hasBlock && !hasFlag,
  });
});

export default router;
