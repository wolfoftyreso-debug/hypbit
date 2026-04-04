/**
 * Customer Intelligence API
 * /api/intelligence/*
 */
import { Router, Request, Response } from 'express'
import { createClient } from '@supabase/supabase-js'
import { captureSignal, getCustomerProfile } from '../lib/intelligence'

const router = Router()
const sb = () => createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

// Ensure tables
async function ensureTables() {
  await (sb().rpc('exec_sql', { sql: `
    CREATE TABLE IF NOT EXISTS customer_signals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id TEXT NOT NULL,
      source TEXT NOT NULL,
      value NUMERIC DEFAULT 50,
      metadata JSONB DEFAULT '{}',
      product_hint TEXT,
      timestamp TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_signals_customer ON customer_signals(customer_id);
    CREATE INDEX IF NOT EXISTS idx_signals_source ON customer_signals(source);
    CREATE INDEX IF NOT EXISTS idx_signals_time ON customer_signals(timestamp DESC);

    CREATE TABLE IF NOT EXISTS customer_intelligence_profiles (
      customer_id TEXT PRIMARY KEY,
      payment_reliability NUMERIC DEFAULT 50,
      engagement_score NUMERIC DEFAULT 50,
      support_burden NUMERIC DEFAULT 0,
      churn_risk NUMERIC DEFAULT 0,
      referral_potential NUMERIC DEFAULT 50,
      predicted_ltv NUMERIC DEFAULT 0,
      current_mrr NUMERIC DEFAULT 0,
      ai_summary TEXT,
      next_best_action TEXT,
      optimal_contact_timing TEXT,
      product_fit JSONB DEFAULT '[]',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  ` }) as unknown as Promise<any>).catch(() => null)
}

// POST /api/intelligence/signal — capture a signal
router.post('/signal', async (req: Request, res: Response) => {
  try {
    await captureSignal(req.body)
    res.json({ ok: true })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/intelligence/profile/:customerId
router.get('/profile/:customerId', async (req: Request, res: Response) => {
  try {
    await ensureTables()
    const profile = await getCustomerProfile(req.params.customerId)
    res.json(profile)
  } catch (e: any) {
    res.json({ customer_id: req.params.customerId, error: e.message })
  }
})

// GET /api/intelligence/signals — all signals with filters
router.get('/signals', async (req: Request, res: Response) => {
  try {
    await ensureTables()
    const { customer_id, source, days = '30' } = req.query as Record<string, string>
    const cutoff = new Date(Date.now() - parseInt(days) * 86400000).toISOString()

    let query = sb().from('customer_signals').select('*').gte('timestamp', cutoff).order('timestamp', { ascending: false }).limit(500)
    if (customer_id) query = query.eq('customer_id', customer_id)
    if (source) query = query.eq('source', source)

    const { data } = await query
    res.json(data ?? [])
  } catch { res.json([]) }
})

// GET /api/intelligence/dashboard — aggregated view
router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    await ensureTables()
    const cutoff = new Date(Date.now() - 30 * 86400000).toISOString()

    const [signals30d, churnRisks, topEngaged] = await Promise.allSettled([
      sb().from('customer_signals').select('source, value', { count: 'exact' }).gte('timestamp', cutoff),
      sb().from('customer_intelligence_profiles').select('customer_id, churn_risk').gte('churn_risk', 60).order('churn_risk', { ascending: false }).limit(10),
      sb().from('customer_intelligence_profiles').select('customer_id, engagement_score').order('engagement_score', { ascending: false }).limit(10),
    ])

    res.json({
      signals_30d: signals30d.status === 'fulfilled' ? signals30d.value.count ?? 0 : 0,
      high_churn_risk: churnRisks.status === 'fulfilled' ? churnRisks.value.data ?? [] : [],
      top_engaged: topEngaged.status === 'fulfilled' ? topEngaged.value.data ?? [] : [],
    })
  } catch { res.json({ signals_30d: 0, high_churn_risk: [], top_engaged: [] }) }
})

export default router
