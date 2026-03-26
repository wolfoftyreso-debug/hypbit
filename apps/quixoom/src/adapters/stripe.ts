import type { PspAdapter, ChargeParams, ChargeResult, PayoutParams, PayoutResult, PspStatus, RefundResult } from './psp.js';

/**
 * Stripe PSP adapter stub.
 * Replace with real Stripe SDK calls in production.
 */
export const stripeAdapter: PspAdapter = {
  name: 'stripe',

  async createCharge(params: ChargeParams): Promise<ChargeResult> {
    // TODO: integrate with Stripe SDK
    console.log('[stripe] createCharge', params);
    return {
      external_id: `stripe_ch_${Date.now()}`,
      status: 'pending',
    };
  },

  async createPayout(params: PayoutParams): Promise<PayoutResult> {
    console.log('[stripe] createPayout', params);
    return {
      external_id: `stripe_po_${Date.now()}`,
      status: 'pending',
    };
  },

  async getStatus(externalId: string): Promise<PspStatus> {
    console.log('[stripe] getStatus', externalId);
    return {
      external_id: externalId,
      status: 'succeeded',
    };
  },

  async refund(externalId: string, amount?: string): Promise<RefundResult> {
    console.log('[stripe] refund', externalId, amount);
    return {
      external_id: externalId,
      refund_id: `stripe_re_${Date.now()}`,
      status: 'pending',
    };
  },
};
