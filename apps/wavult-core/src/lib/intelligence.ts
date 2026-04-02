/**
 * Customer Intelligence Signal Collector
 * Called from every meaningful customer interaction in the system
 */
import { createClient } from '@supabase/supabase-js'

const sb = () => createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

export interface Signal {
  customer_id: string
  source: string
  value: number
  metadata?: Record<string, unknown>
}

export async function captureSignal(signal: Signal): Promise<void> {
  try {
    await sb().from('customer_signals').insert({
      customer_id: signal.customer_id,
      source: signal.source,
      value: signal.value,
      metadata: signal.metadata ?? {},
      timestamp: new Date().toISOString(),
    })
  } catch (e) {
    console.error('Signal capture failed (non-critical):', e)
  }
}

export async function getCustomerProfile(customerId: string) {
  const client = sb()

  const [signals, transactions, devices] = await Promise.allSettled([
    client.from('customer_signals').select('*').eq('customer_id', customerId).order('timestamp', { ascending: false }).limit(100),
    client.from('account_transactions').select('*').eq('account_id', customerId).order('date', { ascending: false }).limit(50),
    client.from('wolvold-media-index').select('*').eq('customer_id', customerId).limit(20),
  ])

  const sigs = signals.status === 'fulfilled' ? signals.value.data ?? [] : []
  const txs = transactions.status === 'fulfilled' ? transactions.value.data ?? [] : []

  // Compute scores
  const paymentTxs = txs.filter((t: any) => t.type === 'payment_received')
  const latePay = paymentTxs.filter((t: any) => t.status === 'late').length
  const payment_reliability = paymentTxs.length > 0
    ? Math.max(0, 100 - (latePay / paymentTxs.length) * 100)
    : 50

  const recentSigs = sigs.filter((s: any) => {
    const age = (Date.now() - new Date(s.timestamp).getTime()) / (1000 * 60 * 60 * 24)
    return age < 30
  })
  const engagement_score = Math.min(100, recentSigs.length * 5)

  const supportSigs = sigs.filter((s: any) => s.source === 'support_contact')
  const support_burden = Math.min(100, supportSigs.length * 10)

  const churnSigs = sigs.filter((s: any) => s.source === 'churn_signal')
  const churn_risk = Math.min(100, churnSigs.length * 25)

  return {
    customer_id: customerId,
    payment_reliability,
    engagement_score,
    support_burden,
    churn_risk,
    recent_signals: sigs.slice(0, 10),
    signal_count: sigs.length,
    transaction_count: txs.length,
  }
}
