/**
 * Campaign Routes — /api/campaign/*
 * Campaign OS: activities, budgets, KPIs
 */
import { Router, Request, Response } from 'express'
import { createClient } from '@supabase/supabase-js'

const router = Router()

function getSb() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase not configured')
  return createClient(url, key)
}

// GET /api/campaign/activities — list all campaign activities
router.get('/api/campaign/activities', async (req: Request, res: Response) => {
  try {
    const sb = getSb()
    let query = sb.from('campaign_activities').select('*').order('date', { ascending: true })
    if (req.query.brand)   query = query.eq('brand', req.query.brand as string)
    if (req.query.status)  query = query.eq('status', req.query.status as string)
    if (req.query.channel) query = query.eq('channel', req.query.channel as string)
    const { data, error } = await query
    if (error) throw error
    res.json(data ?? [])
  } catch {
    // TODO: implement full logic — create campaign_activities table in Supabase
    res.json([])
  }
})

// POST /api/campaign/activities — create a campaign activity
router.post('/api/campaign/activities', async (req: Request, res: Response) => {
  try {
    const sb = getSb()
    const { data, error } = await sb
      .from('campaign_activities')
      .insert({ ...req.body, created_at: new Date().toISOString() })
      .select()
      .single()
    if (error) throw error
    res.status(201).json(data)
  } catch (e: any) {
    // TODO: implement full logic
    res.status(500).json({ error: e.message })
  }
})

// PUT /api/campaign/activities/:id — update campaign activity
router.put('/api/campaign/activities/:id', async (req: Request, res: Response) => {
  try {
    const sb = getSb()
    const { data, error } = await sb
      .from('campaign_activities')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error
    res.json(data)
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

export default router
