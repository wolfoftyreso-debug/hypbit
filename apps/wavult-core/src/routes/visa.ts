/**
 * Visa & Travel Documents API
 * Tracks visa applications, team member status, and deadlines.
 *
 * Table: visa_applications
 * ─────────────────────────────────────────────────────────────────────────────
 * Run this SQL in Supabase before first use:
 *
 * CREATE TABLE IF NOT EXISTS visa_applications (
 *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   person_id text NOT NULL,
 *   person_name text NOT NULL,
 *   visa_type text NOT NULL,  -- tourist | investor_visa | golden_visa | entry_permit | residency_renewal
 *   country text NOT NULL,    -- TH | UAE | SE | US | other
 *   status text DEFAULT 'not_started',  -- not_started | in_progress | submitted | approved | rejected | expired
 *   target_date date,
 *   notes text,
 *   pro_agent text,
 *   steps jsonb DEFAULT '[]',
 *   created_at timestamptz DEFAULT now(),
 *   updated_at timestamptz DEFAULT now()
 * );
 * CREATE INDEX IF NOT EXISTS idx_visa_person ON visa_applications(person_id);
 * CREATE INDEX IF NOT EXISTS idx_visa_country ON visa_applications(country);
 * CREATE INDEX IF NOT EXISTS idx_visa_status ON visa_applications(status);
 * CREATE INDEX IF NOT EXISTS idx_visa_target_date ON visa_applications(target_date ASC);
 */
import { Router, Request, Response } from 'express'
import { createClient } from '@supabase/supabase-js'

const router = Router()
const sb = () => createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

// ─── GET /v1/visa/applications ────────────────────────────────────────────────
// Fetch all visa applications, newest first
router.get('/v1/visa/applications', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await sb()
      .from('visa_applications')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data ?? [])
  } catch (err: any) {
    console.error('[visa] GET /applications error:', err)
    res.status(500).json({ error: 'Failed to fetch visa applications', detail: err?.message })
  }
})

// ─── GET /v1/visa/members ─────────────────────────────────────────────────────
// Fetch distinct team members with their latest visa status
router.get('/v1/visa/members', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await sb()
      .from('visa_applications')
      .select('person_id, person_name, status, country, visa_type, target_date, updated_at')
      .order('person_name', { ascending: true })

    if (error) throw error

    // Deduplicate by person_id — keep most recent record per person
    const memberMap = new Map<string, typeof data[0]>()
    for (const row of (data ?? [])) {
      const existing = memberMap.get(row.person_id)
      if (!existing || new Date(row.updated_at) > new Date(existing.updated_at)) {
        memberMap.set(row.person_id, row)
      }
    }

    res.json(Array.from(memberMap.values()))
  } catch (err: any) {
    console.error('[visa] GET /members error:', err)
    res.status(500).json({ error: 'Failed to fetch visa members', detail: err?.message })
  }
})

// ─── GET /v1/visa/deadlines ───────────────────────────────────────────────────
// Fetch upcoming deadlines (target_date IS NOT NULL, ordered by date asc)
router.get('/v1/visa/deadlines', async (_req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().slice(0, 10)

    const { data, error } = await sb()
      .from('visa_applications')
      .select('id, person_id, person_name, visa_type, country, status, target_date, notes')
      .not('target_date', 'is', null)
      .not('status', 'in', '("approved","rejected")')
      .gte('target_date', today)
      .order('target_date', { ascending: true })

    if (error) throw error
    res.json(data ?? [])
  } catch (err: any) {
    console.error('[visa] GET /deadlines error:', err)
    res.status(500).json({ error: 'Failed to fetch visa deadlines', detail: err?.message })
  }
})

// ─── POST /v1/visa/applications ───────────────────────────────────────────────
// Create a new visa application
router.post('/v1/visa/applications', async (req: Request, res: Response) => {
  try {
    const {
      person_id,
      person_name,
      visa_type,
      country,
      status,
      target_date,
      notes,
      pro_agent,
      steps,
    } = req.body

    if (!person_id || !person_name || !visa_type || !country) {
      res.status(400).json({ error: 'Missing required fields: person_id, person_name, visa_type, country' })
      return
    }

    const VALID_VISA_TYPES = ['tourist', 'investor_visa', 'golden_visa', 'entry_permit', 'residency_renewal']
    const VALID_COUNTRIES   = ['TH', 'UAE', 'SE', 'US', 'other']
    const VALID_STATUSES    = ['not_started', 'in_progress', 'submitted', 'approved', 'rejected', 'expired']

    if (!VALID_VISA_TYPES.includes(visa_type)) {
      res.status(400).json({ error: `Invalid visa_type. Must be one of: ${VALID_VISA_TYPES.join(', ')}` })
      return
    }
    if (!VALID_COUNTRIES.includes(country)) {
      res.status(400).json({ error: `Invalid country. Must be one of: ${VALID_COUNTRIES.join(', ')}` })
      return
    }
    if (status && !VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` })
      return
    }

    const { data, error } = await sb()
      .from('visa_applications')
      .insert({
        person_id,
        person_name,
        visa_type,
        country,
        status: status ?? 'not_started',
        target_date: target_date ?? null,
        notes: notes ?? null,
        pro_agent: pro_agent ?? null,
        steps: steps ?? [],
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (err: any) {
    console.error('[visa] POST /applications error:', err)
    res.status(500).json({ error: 'Failed to create visa application', detail: err?.message })
  }
})

export default router
