/**
 * Quixoom SDK — Typed client for the enterprise financial control API.
 *
 * Usage:
 *   const qx = createClient({ baseUrl: 'https://api.example.com/api/qx' });
 *   const payment = await qx.createPayment({ entity_id: '...', amount: '100', currency: 'USD', direction: 'inbound' });
 */

export interface QxConfig {
  baseUrl: string;
  actor?: string;
  headers?: Record<string, string>;
}

export interface CreateEntityParams {
  name: string;
  jurisdiction: string;
  base_currency: string;
  metadata?: Record<string, unknown>;
}

export interface CreateAccountParams {
  entity_id: string;
  type: 'customer' | 'treasury' | 'revenue' | 'payable' | 'receivable' | 'suspense' | 'fee' | 'fx';
  currency: string;
  label?: string;
}

export interface CreatePaymentParams {
  entity_id: string;
  amount: string;
  currency: string;
  direction: 'inbound' | 'outbound';
  psp?: string;
  reference?: string;
  payer_info?: Record<string, unknown>;
  idempotency_key?: string;
}

export interface LedgerLine {
  account_id: string;
  direction: 'debit' | 'credit';
  amount: string;
  currency: string;
}

export interface CommitLedgerParams {
  entity_id: string;
  type: string;
  reference?: string;
  idempotency_key?: string;
  lines: LedgerLine[];
}

export interface ReconcileParams {
  payment_id: string;
  external_amount: string;
}

export interface IntercompanyUpdateParams {
  from_entity: string;
  to_entity: string;
  currency: string;
  amount: string;
}

async function request(config: QxConfig, method: string, path: string, body?: unknown) {
  const res = await fetch(`${config.baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-actor': config.actor ?? 'sdk',
      ...config.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(`QxSDK ${method} ${path}: ${err.error ?? res.statusText}`);
  }

  return res.json();
}

export function createClient(config: QxConfig) {
  return {
    // Entities
    createEntity: (params: CreateEntityParams) =>
      request(config, 'POST', '/entities', params),
    listEntities: () =>
      request(config, 'GET', '/entities'),

    // Accounts
    createAccount: (params: CreateAccountParams) =>
      request(config, 'POST', '/accounts', params),
    listAccounts: (entityId: string) =>
      request(config, 'GET', `/accounts/${entityId}`),
    getBalance: (accountId: string) =>
      request(config, 'GET', `/accounts/${accountId}/balance`),

    // Payments
    createPayment: (params: CreatePaymentParams) =>
      request(config, 'POST', '/payments', params),
    approvePayment: (paymentId: string) =>
      request(config, 'POST', `/payments/${paymentId}/approve`),

    // Ledger
    commitLedger: (params: CommitLedgerParams) =>
      request(config, 'POST', '/ledger/commit', params),

    // Reconciliation
    reconcile: (params: ReconcileParams) =>
      request(config, 'POST', '/reconcile', params),

    // Intercompany
    getIntercompanyPositions: (entityId: string) =>
      request(config, 'GET', `/intercompany/${entityId}`),
    updateIntercompanyPosition: (params: IntercompanyUpdateParams) =>
      request(config, 'POST', '/intercompany/update', params),
    getNetting: (currency: string) =>
      request(config, 'GET', `/intercompany/netting/${currency}`),

    // Audit
    getAuditLog: (entityId: string, limit?: number) =>
      request(config, 'GET', `/audit/${entityId}?limit=${limit ?? 100}`),

    // Compliance
    getComplianceFlags: (status?: string) =>
      request(config, 'GET', `/compliance/flags?status=${status ?? 'open'}`),
  };
}
