import { Router, Request, Response } from 'express'
import { createClient } from '@supabase/supabase-js'

const router = Router()
const sb = () => createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

async function ensureTables() {
  await sb().rpc('exec_sql', { sql: `
    CREATE TABLE IF NOT EXISTS media_campaigns (id TEXT PRIMARY KEY, name TEXT, status TEXT DEFAULT 'draft', budget NUMERIC, spent NUMERIC DEFAULT 0, start_date TEXT, end_date TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS media_channels (id TEXT PRIMARY KEY, name TEXT, type TEXT, status TEXT DEFAULT 'active', created_at TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS media_audiences (id TEXT PRIMARY KEY, name TEXT, campaign_id TEXT, size INT, created_at TIMESTAMPTZ DEFAULT NOW());
  ` }).catch(() => null)
}

router.get('/campaigns', async (_req: Request, res: Response) => {
  try { await ensureTables(); const { data } = await sb().from('media_campaigns').select('*'); res.json(data ?? []) } catch { res.json([]) }
})

router.post('/campaigns', async (req: Request, res: Response) => {
  try { const { data, error } = await sb().from('media_campaigns').insert(req.body).select().single(); if (error) throw error; res.status(201).json(data) } catch (e: any) { res.status(500).json({ error: e.message }) }
})

router.get('/channels', async (_req: Request, res: Response) => {
  try { const { data } = await sb().from('media_channels').select('*'); res.json(data ?? []) } catch { res.json([]) }
})

router.get('/audiences', async (_req: Request, res: Response) => {
  try { const { data } = await sb().from('media_audiences').select('*'); res.json(data ?? []) } catch { res.json([]) }
})

export default router
