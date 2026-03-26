/**
 * PSP Adapter interface — pluggable payment service providers.
 * Each PSP implements this interface. The core never talks to PSPs directly.
 */

export interface PspAdapter {
  name: string;
  createCharge(params: ChargeParams): Promise<ChargeResult>;
  createPayout(params: PayoutParams): Promise<PayoutResult>;
  getStatus(externalId: string): Promise<PspStatus>;
  refund(externalId: string, amount?: string): Promise<RefundResult>;
}

export interface ChargeParams {
  amount: string;
  currency: string;
  reference: string;
  metadata?: Record<string, unknown>;
}

export interface ChargeResult {
  external_id: string;
  status: 'pending' | 'succeeded' | 'failed';
  raw_response?: unknown;
}

export interface PayoutParams {
  amount: string;
  currency: string;
  destination: string;
  reference: string;
}

export interface PayoutResult {
  external_id: string;
  status: 'pending' | 'succeeded' | 'failed';
}

export interface PspStatus {
  external_id: string;
  status: string;
  amount?: string;
  currency?: string;
}

export interface RefundResult {
  external_id: string;
  refund_id: string;
  status: 'pending' | 'succeeded' | 'failed';
}

// Registry for adapters
const adapters = new Map<string, PspAdapter>();

export function registerAdapter(adapter: PspAdapter): void {
  adapters.set(adapter.name, adapter);
}

export function getAdapter(name: string): PspAdapter {
  const adapter = adapters.get(name);
  if (!adapter) throw new Error(`PSP adapter "${name}" not registered`);
  return adapter;
}

export function listAdapters(): string[] {
  return Array.from(adapters.keys());
}
