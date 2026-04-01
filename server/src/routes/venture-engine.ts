// ─── Venture Engine Routes — FinanceCO module ────────────────────────────────
// Tables: ve_opportunities, ve_ventures, ve_investments, ve_system_impact, ve_events
// All routes are relative to /api/venture-engine (mounted in index.ts)

import { Router, Request, Response } from 'express'
import { supabase } from '../supabase'

export const ventureEngineRouter = Router()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Industry = 'Healthcare' | 'Government' | 'Logistics' | 'Finance' | 'Education'
const INDUSTRIES: Industry[] = ['Healthcare', 'Government', 'Logistics', 'Finance', 'Education']

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

function getUser(req: Request, res: Response): { id: string; org_id: string } | null {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' })
    return null
  }
  return req.user
}

// ---------------------------------------------------------------------------
// Event helper
// ---------------------------------------------------------------------------

async function emitEvent(
  type: string,
  payload: Record<string, unknown>,
  orgId: string
) {
  try {
    await supabase.from('ve_events').insert({
      type,
      payload,
      org_id: orgId,
      emitted_at: new Date().toISOString(),
    })
  } catch {
    // fire-and-forget
  }
}

// ---------------------------------------------------------------------------
// GET /api/venture-engine/opportunities?industry=&status=
// ---------------------------------------------------------------------------
ventureEngineRouter.get('/opportunities', async (req: Request, res: Response) => {
  try {
    const user = getUser(req, res)
    if (!user) return

    let query = supabase
      .from('ve_opportunities')
      .select('*')
      .order('impact_score', { ascending: false })

    const { industry, status } = req.query
    if (typeof industry === 'string' && industry) query = query.eq('industry', industry)
    if (typeof status === 'string' && status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    return res.json(data ?? [])
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' })
  }
})

// ---------------------------------------------------------------------------
// POST /api/venture-engine/opportunities
// ---------------------------------------------------------------------------
ventureEngineRouter.post('/opportunities', async (req: Request, res: Response) => {
  try {
    const user = getUser(req, res)
    if (!user) return

    const {
      title, industry, description, inefficiency_description,
      impact_score, complexity_score, cost_saving_potential_eur, source,
    } = req.body as Record<string, unknown>

    if (!title || !industry || !description || !inefficiency_description) {
      return res.status(400).json({ error: 'title, industry, description, inefficiency_description required' })
    }
    if (!INDUSTRIES.includes(industry as Industry)) {
      return res.status(400).json({ error: `industry must be one of: ${INDUSTRIES.join(', ')}` })
    }

    const payload = {
      title,
      industry,
      description,
      inefficiency_description,
      impact_score: typeof impact_score === 'number' ? impact_score : 5,
      complexity_score: typeof complexity_score === 'number' ? complexity_score : 5,
      cost_saving_potential_eur: typeof cost_saving_potential_eur === 'number' ? cost_saving_potential_eur : 0,
      source: source ?? 'internal',
      status: 'detected',
      detected_at: new Date().toISOString(),
      validated_at: null,
    }

    const { data, error } = await supabase
      .from('ve_opportunities')
      .insert(payload)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    await emitEvent('opportunity.detected', { id: data.id, title: data.title }, user.org_id)
    return res.status(201).json(data)
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' })
  }
})

// ---------------------------------------------------------------------------
// PATCH /api/venture-engine/opportunities/:id/validate
// ---------------------------------------------------------------------------
ventureEngineRouter.patch('/opportunities/:id/validate', async (req: Request, res: Response) => {
  try {
    const user = getUser(req, res)
    if (!user) return

    const { data, error } = await supabase
      .from('ve_opportunities')
      .update({ status: 'validated', validated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) return res.status(404).json({ error: error.message })
    await emitEvent('opportunity.validated', { id: data.id, title: data.title }, user.org_id)
    return res.json(data)
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' })
  }
})

// ---------------------------------------------------------------------------
// GET /api/venture-engine/ventures
// ---------------------------------------------------------------------------
ventureEngineRouter.get('/ventures', async (req: Request, res: Response) => {
  try {
    const user = getUser(req, res)
    if (!user) return

    const { data, error } = await supabase
      .from('ve_ventures')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.json(data ?? [])
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' })
  }
})

// ---------------------------------------------------------------------------
// POST /api/venture-engine/ventures
// ---------------------------------------------------------------------------
ventureEngineRouter.post('/ventures', async (req: Request, res: Response) => {
  try {
    const user = getUser(req, res)
    if (!user) return

    const {
      opportunity_id, name, problem_definition, system_design,
      revenue_model, integration_plan, burn_rate, roi_projected,
    } = req.body as Record<string, unknown>

    if (!opportunity_id || !name || !problem_definition || !system_design) {
      return res.status(400).json({ error: 'opportunity_id, name, problem_definition, system_design required' })
    }

    const payload = {
      opportunity_id,
      name,
      problem_definition,
      system_design,
      revenue_model: revenue_model ?? '',
      integration_plan: integration_plan ?? '',
      status: 'ideation',
      created_at: new Date().toISOString(),
      burn_rate: typeof burn_rate === 'number' ? burn_rate : 0,
      roi_actual: 0,
      roi_projected: typeof roi_projected === 'number' ? roi_projected : 0,
      integration_level: 0,
    }

    const { data, error } = await supabase
      .from('ve_ventures')
      .insert(payload)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })

    // Mark opportunity as building
    await supabase
      .from('ve_opportunities')
      .update({ status: 'building' })
      .eq('id', opportunity_id)

    await emitEvent('venture.created', { id: data.id, name: data.name }, user.org_id)
    return res.status(201).json(data)
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' })
  }
})

// ---------------------------------------------------------------------------
// GET /api/venture-engine/investments
// ---------------------------------------------------------------------------
ventureEngineRouter.get('/investments', async (req: Request, res: Response) => {
  try {
    const user = getUser(req, res)
    if (!user) return

    const { data, error } = await supabase
      .from('ve_investments')
      .select('*')
      .order('allocated_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.json(data ?? [])
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' })
  }
})

// ---------------------------------------------------------------------------
// POST /api/venture-engine/investments
// ---------------------------------------------------------------------------
ventureEngineRouter.post('/investments', async (req: Request, res: Response) => {
  try {
    const user = getUser(req, res)
    if (!user) return

    const { venture_id, amount, burn_rate, efficiency_gain_pct } = req.body as Record<string, unknown>

    if (!venture_id || !amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'venture_id and positive amount required' })
    }

    const payload = {
      venture_id,
      amount: Number(amount),
      allocated_at: new Date().toISOString(),
      roi_current: 0,
      burn_rate: typeof burn_rate === 'number' ? burn_rate : 0,
      efficiency_gain_pct: typeof efficiency_gain_pct === 'number' ? efficiency_gain_pct : 0,
      status: 'active',
    }

    const { data, error } = await supabase
      .from('ve_investments')
      .insert(payload)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    await emitEvent('capital.allocated', { id: data.id, venture_id, amount: data.amount }, user.org_id)
    return res.status(201).json(data)
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' })
  }
})

// ---------------------------------------------------------------------------
// GET /api/venture-engine/impact
// ---------------------------------------------------------------------------
ventureEngineRouter.get('/impact', async (req: Request, res: Response) => {
  try {
    const user = getUser(req, res)
    if (!user) return

    const { data, error } = await supabase
      .from('ve_system_impact')
      .select('*')
      .order('measured_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.json(data ?? [])
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' })
  }
})

// ---------------------------------------------------------------------------
// GET /api/venture-engine/stats
// ---------------------------------------------------------------------------
ventureEngineRouter.get('/stats', async (req: Request, res: Response) => {
  try {
    const user = getUser(req, res)
    if (!user) return

    const [
      { data: opportunities },
      { data: ventures },
      { data: investments },
      { data: impact },
      { data: recentEvents },
    ] = await Promise.all([
      supabase.from('ve_opportunities').select('status, cost_saving_potential_eur'),
      supabase.from('ve_ventures').select('status, integration_level, roi_actual, roi_projected'),
      supabase.from('ve_investments').select('amount, roi_current, efficiency_gain_pct, status'),
      supabase.from('ve_system_impact').select('friction_reduction_pct'),
      supabase.from('ve_events').select('*').order('emitted_at', { ascending: false }).limit(10),
    ])

    const opps = opportunities ?? []
    const vens = ventures ?? []
    const invs = investments ?? []
    const imps = impact ?? []

    const activeInvs = invs.filter(i => i.status === 'active')
    const totalCapital = activeInvs.reduce((s, i) => s + (i.amount ?? 0), 0)
    const roiInvs = invs.filter(i => (i.roi_current ?? 0) > 0)
    const avgROI = roiInvs.length > 0
      ? roiInvs.reduce((s, i) => s + i.roi_current, 0) / roiInvs.length
      : 0
    const avgFriction = imps.length > 0
      ? imps.reduce((s, i) => s + (i.friction_reduction_pct ?? 0), 0) / imps.length
      : 0

    return res.json({
      opportunities: {
        total: opps.length,
        by_status: {
          detected: opps.filter(o => o.status === 'detected').length,
          validated: opps.filter(o => o.status === 'validated').length,
          building: opps.filter(o => o.status === 'building').length,
          invested: opps.filter(o => o.status === 'invested').length,
          integrated: opps.filter(o => o.status === 'integrated').length,
        },
        total_cost_saving_potential_eur: opps.reduce((s, o) => s + (o.cost_saving_potential_eur ?? 0), 0),
      },
      ventures: {
        total: vens.length,
        by_status: {
          ideation: vens.filter(v => v.status === 'ideation').length,
          building: vens.filter(v => v.status === 'building').length,
          live: vens.filter(v => v.status === 'live').length,
          integrated: vens.filter(v => v.status === 'integrated').length,
        },
        avg_integration_level: vens.length > 0
          ? vens.reduce((s, v) => s + (v.integration_level ?? 0), 0) / vens.length
          : 0,
      },
      capital: {
        total_deployed: totalCapital,
        active_investments: activeInvs.length,
        avg_roi: avgROI,
      },
      impact: {
        avg_friction_reduction: avgFriction,
        metrics_count: imps.length,
      },
      recent_events: recentEvents ?? [],
    })
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' })
  }
})

// ---------------------------------------------------------------------------
// POST /api/venture-engine/scan
// Runs Perplexity for each industry and stores results as ve_opportunities
// ---------------------------------------------------------------------------
ventureEngineRouter.post('/scan', async (req: Request, res: Response) => {
  try {
    const user = getUser(req, res)
    if (!user) return

    const apiKey = process.env.PERPLEXITY_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'PERPLEXITY_API_KEY not configured' })

    const results: Record<string, unknown>[] = []
    const errors: string[] = []

    for (const industry of INDUSTRIES) {
      try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'sonar-pro',
            messages: [
              {
                role: 'user',
                content: `Identify the single biggest systemic inefficiency in ${industry} that technology could solve today. Return ONLY valid JSON: {"title": string, "description": string, "inefficiency_description": string, "cost_saving_potential_eur": number, "complexity_score": number between 1-10}`,
              },
            ],
          }),
        })

        if (!response.ok) {
          errors.push(`${industry}: HTTP ${response.status}`)
          continue
        }

        const json = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
        const content = json.choices?.[0]?.message?.content ?? ''

        // Extract JSON from the response (may have markdown code blocks)
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          errors.push(`${industry}: could not parse JSON from response`)
          continue
        }

        const parsed = JSON.parse(jsonMatch[0]) as {
          title?: string
          description?: string
          inefficiency_description?: string
          cost_saving_potential_eur?: number
          complexity_score?: number
        }

        const payload = {
          title: parsed.title ?? `${industry} Systemic Inefficiency`,
          industry,
          description: parsed.description ?? '',
          inefficiency_description: parsed.inefficiency_description ?? '',
          impact_score: Math.max(1, Math.min(10, 10 - (parsed.complexity_score ?? 5))),
          complexity_score: Math.max(1, Math.min(10, parsed.complexity_score ?? 5)),
          cost_saving_potential_eur: parsed.cost_saving_potential_eur ?? 0,
          source: 'research',
          status: 'detected',
          detected_at: new Date().toISOString(),
          validated_at: null,
        }

        const { data, error: dbError } = await supabase
          .from('ve_opportunities')
          .insert(payload)
          .select()
          .single()

        if (!dbError && data) {
          results.push(data)
          await emitEvent('opportunity.detected', { id: data.id, title: data.title, industry }, user.org_id)
        } else {
          errors.push(`${industry}: DB insert failed — ${dbError?.message ?? 'unknown'}`)
        }
      } catch (scanErr) {
        errors.push(`${industry}: ${scanErr instanceof Error ? scanErr.message : 'unknown error'}`)
      }
    }

    return res.json({
      scanned: INDUSTRIES.length,
      created: results.length,
      opportunities: results,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' })
  }
})

// ---------------------------------------------------------------------------
// POST /api/venture-engine/contact  (supportfunds.com contact form)
// ---------------------------------------------------------------------------
ventureEngineRouter.post('/contact', async (req: Request, res: Response) => {
  try {
    const { name, company, email, message } = req.body as Record<string, string>
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'name, email, message required' })
    }
    const { error } = await supabase.from('ve_contact_submissions').insert({
      name, company: company ?? '', email, message, submitted_at: new Date().toISOString(),
    })
    if (error) {
      // Non-fatal — still acknowledge
      console.error('[venture-engine/contact]', error.message)
    }
    return res.json({ ok: true })
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' })
  }
})
