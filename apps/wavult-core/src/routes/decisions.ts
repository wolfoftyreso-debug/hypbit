import { Router, Request, Response } from 'express'
import { createClient } from '@supabase/supabase-js'

const router = Router()
const sb = () => createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

async function ensureTables() {
  await (sb().rpc('exec_sql', { sql: `
    CREATE TABLE IF NOT EXISTS meetings (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      date TEXT,
      attendees TEXT[],
      status TEXT DEFAULT 'scheduled',
      summary TEXT,
      decisions JSONB DEFAULT '[]',
      action_items JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS decision_blocks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      meeting_id TEXT,
      type TEXT,
      status TEXT DEFAULT 'open',
      description TEXT,
      options JSONB DEFAULT '[]',
      chosen_option TEXT,
      rationale TEXT,
      owner TEXT,
      deadline TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  ` }) as unknown as Promise<any>).catch(() => null)
}

router.get('/meetings', async (_req: Request, res: Response) => {
  try {
    await ensureTables()
    const { data } = await sb().from('meetings').select('*').order('date', { ascending: false })
    res.json(data ?? [])
  } catch { res.json([]) }
})

router.post('/meetings', async (req: Request, res: Response) => {
  try {
    const { data, error } = await sb().from('meetings').insert(req.body).select().single()
    if (error) throw error
    res.status(201).json(data)
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

router.put('/meetings/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await sb().from('meetings').update({ ...req.body, updated_at: new Date().toISOString() }).eq('id', req.params.id).select().single()
    if (error) throw error
    res.json(data)
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

router.get('/blocks', async (_req: Request, res: Response) => {
  try {
    const { data } = await sb().from('decision_blocks').select('*').order('deadline')
    res.json(data ?? [])
  } catch { res.json([]) }
})

router.post('/blocks', async (req: Request, res: Response) => {
  try {
    const { data, error } = await sb().from('decision_blocks').insert(req.body).select().single()
    if (error) throw error
    res.status(201).json(data)
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

export default router
