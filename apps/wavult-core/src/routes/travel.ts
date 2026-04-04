/**
 * Travel Routes — /api/travel/*
 * Trip management for Wavult Group team travel
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

// GET /api/travel/trips — list all active trips
router.get('/api/travel/trips', async (_req: Request, res: Response) => {
  try {
    const sb = getSb()
    const { data, error } = await sb
      .from('travel_trips')
      .select('*')
      .order('departure', { ascending: true })
    if (error) throw error
    res.json({ trips: data ?? [] })
  } catch {
    // TODO: implement full logic — create travel_trips table in Supabase
    res.json({ trips: [] })
  }
})

// POST /api/travel/trips — create a trip
router.post('/api/travel/trips', async (req: Request, res: Response) => {
  try {
    const sb = getSb()
    const { data, error } = await sb
      .from('travel_trips')
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

// GET /api/travel/health
router.get('/api/travel/health', (_req: Request, res: Response) => {
  res.json({ ok: true, message: 'Travel API running' })
})

export default router
