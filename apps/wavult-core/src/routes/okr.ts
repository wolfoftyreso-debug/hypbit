/**
 * OKR API — Google-modellen
 * Objectives, Key Results, Initiatives, Check-ins
 *
 * Levels: company | team | individual
 * Cadence: annual objectives, quarterly KRs, weekly check-ins
 * Scoring: 0.0–0.4 fail | 0.4–0.7 progress | 0.7–1.0 success
 */
import { Router, Request, Response } from 'express'
import { createClient } from '@supabase/supabase-js'

const router = Router()
const sb = () => createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

// ─── Score helpers ────────────────────────────────────────────────────────────

function calcKrScore(kr: {
  kr_type: string
  start_value: number | null
  target_value: number | null
  current_value: number | null
  milestone_achieved: boolean | null
  score_override: boolean
  score: number | null
}): number {
  if (kr.score_override && kr.score !== null) return kr.score
  if (kr.kr_type === 'boolean') return kr.milestone_achieved ? 1.0 : 0.0
  if (kr.kr_type === 'milestone') return kr.milestone_achieved ? 1.0 : 0.0
  // metric
  const start = kr.start_value ?? 0
  const target = kr.target_value ?? 1
  const current = kr.current_value ?? 0
  if (target === start) return current >= target ? 1.0 : 0.0
  const raw = (current - start) / (target - start)
  return Math.max(0, Math.min(1, raw))
}

function calcObjectiveScore(krs: { score?: number }[]): number | null {
  const scores = krs.map(k => k.score ?? 0)
  if (scores.length === 0) return null
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
}

// ─── GET /v1/okr/cycles ───────────────────────────────────────────────────────
router.get('/v1/okr/cycles', async (req: Request, res: Response) => {
  try {
    const entity = req.query.entity as string | undefined
    let q = sb().from('okr_cycles').select('*').order('starts_at', { ascending: false })
    if (entity) q = q.eq('entity_slug', entity)
    const { data, error } = await q
    if (error) throw error
    res.json(data)
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

// ─── POST /v1/okr/cycles ──────────────────────────────────────────────────────
router.post('/v1/okr/cycles', async (req: Request, res: Response) => {
  try {
    const { entity_slug, cycle_type, label, starts_at, ends_at, status, parent_cycle_id, created_by } = req.body
    const { data, error } = await sb()
      .from('okr_cycles')
      .insert({ entity_slug, cycle_type, label, starts_at, ends_at, status, parent_cycle_id, created_by })
      .select()
      .single()
    if (error) throw error
    res.status(201).json(data)
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

// ─── GET /v1/okr/:cycleId/objectives ─────────────────────────────────────────
router.get('/v1/okr/:cycleId/objectives', async (req: Request, res: Response) => {
  try {
    const { cycleId } = req.params
    const { data: objectives, error: objErr } = await sb()
      .from('okr_objectives')
      .select('*')
      .eq('cycle_id', cycleId)
      .order('sort_order', { ascending: true })
    if (objErr) throw objErr

    // Fetch KRs for all objectives and compute scores
    const objIds = (objectives || []).map((o: any) => o.id)
    if (objIds.length === 0) return res.json([])

    const { data: krs, error: krErr } = await sb()
      .from('okr_key_results')
      .select('*')
      .in('objective_id', objIds)
      .order('sort_order', { ascending: true })
    if (krErr) throw krErr

    // Compute scores and attach KRs
    const krsWithScore = (krs || []).map((kr: any) => ({
      ...kr,
      score: calcKrScore(kr),
    }))

    const result = (objectives || []).map((obj: any) => {
      const objKrs = krsWithScore.filter((kr: any) => kr.objective_id === obj.id)
      const computedScore = calcObjectiveScore(objKrs)
      return {
        ...obj,
        computed_score: computedScore,
        key_results: objKrs,
      }
    })

    res.json(result)
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

// ─── POST /v1/okr/:cycleId/objectives ────────────────────────────────────────
router.post('/v1/okr/:cycleId/objectives', async (req: Request, res: Response) => {
  try {
    const { cycleId } = req.params
    const { entity_slug, level, owner_id, team_id, title, description, parent_objective_id, sort_order } = req.body
    const { data, error } = await sb()
      .from('okr_objectives')
      .insert({ cycle_id: cycleId, entity_slug, level, owner_id, team_id, title, description, parent_objective_id, sort_order })
      .select()
      .single()
    if (error) throw error
    res.status(201).json(data)
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

// ─── PUT /v1/okr/objectives/:objectiveId ─────────────────────────────────────
router.put('/v1/okr/objectives/:objectiveId', async (req: Request, res: Response) => {
  try {
    const { objectiveId } = req.params
    const updates = { ...req.body, updated_at: new Date().toISOString() }
    delete updates.id
    const { data, error } = await sb()
      .from('okr_objectives')
      .update(updates)
      .eq('id', objectiveId)
      .select()
      .single()
    if (error) throw error
    res.json(data)
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

// ─── DELETE /v1/okr/objectives/:objectiveId ───────────────────────────────────
router.delete('/v1/okr/objectives/:objectiveId', async (req: Request, res: Response) => {
  try {
    const { objectiveId } = req.params
    const { error } = await sb().from('okr_objectives').delete().eq('id', objectiveId)
    if (error) throw error
    res.json({ deleted: true })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

// ─── POST /v1/okr/objectives/:objectiveId/kr ─────────────────────────────────
router.post('/v1/okr/objectives/:objectiveId/kr', async (req: Request, res: Response) => {
  try {
    const { objectiveId } = req.params
    const {
      title, description, kr_type, start_value, target_value, current_value, unit,
      milestone_description, owner_id, sort_order,
    } = req.body
    const { data, error } = await sb()
      .from('okr_key_results')
      .insert({
        objective_id: objectiveId, title, description, kr_type,
        start_value, target_value, current_value: current_value ?? start_value ?? 0,
        unit, milestone_description, owner_id, sort_order,
      })
      .select()
      .single()
    if (error) throw error
    res.status(201).json({ ...data, score: calcKrScore(data) })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

// ─── PUT /v1/okr/kr/:krId ────────────────────────────────────────────────────
router.put('/v1/okr/kr/:krId', async (req: Request, res: Response) => {
  try {
    const { krId } = req.params
    const updates = { ...req.body, updated_at: new Date().toISOString() }
    delete updates.id
    const { data, error } = await sb()
      .from('okr_key_results')
      .update(updates)
      .eq('id', krId)
      .select()
      .single()
    if (error) throw error
    res.json({ ...data, score: calcKrScore(data) })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

// ─── DELETE /v1/okr/kr/:krId ─────────────────────────────────────────────────
router.delete('/v1/okr/kr/:krId', async (req: Request, res: Response) => {
  try {
    const { krId } = req.params
    const { error } = await sb().from('okr_key_results').delete().eq('id', krId)
    if (error) throw error
    res.json({ deleted: true })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

// ─── POST /v1/okr/kr/:krId/initiatives ───────────────────────────────────────
router.post('/v1/okr/kr/:krId/initiatives', async (req: Request, res: Response) => {
  try {
    const { krId } = req.params
    const { title, description, owner_id, status, due_date, linked_task_id } = req.body
    const { data, error } = await sb()
      .from('okr_initiatives')
      .insert({ key_result_id: krId, title, description, owner_id, status, due_date, linked_task_id })
      .select()
      .single()
    if (error) throw error
    res.status(201).json(data)
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

// ─── PUT /v1/okr/initiatives/:initiativeId ───────────────────────────────────
router.put('/v1/okr/initiatives/:initiativeId', async (req: Request, res: Response) => {
  try {
    const { initiativeId } = req.params
    const updates = { ...req.body }
    delete updates.id
    const { data, error } = await sb()
      .from('okr_initiatives')
      .update(updates)
      .eq('id', initiativeId)
      .select()
      .single()
    if (error) throw error
    res.json(data)
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

// ─── DELETE /v1/okr/initiatives/:initiativeId ────────────────────────────────
router.delete('/v1/okr/initiatives/:initiativeId', async (req: Request, res: Response) => {
  try {
    const { initiativeId } = req.params
    const { error } = await sb().from('okr_initiatives').delete().eq('id', initiativeId)
    if (error) throw error
    res.json({ deleted: true })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

// ─── POST /v1/okr/kr/:krId/checkin ───────────────────────────────────────────
router.post('/v1/okr/kr/:krId/checkin', async (req: Request, res: Response) => {
  try {
    const { krId } = req.params
    const { checked_by, current_value, confidence, note, blocker, meeting_id } = req.body

    // Insert check-in
    const { data: checkin, error: ciErr } = await sb()
      .from('okr_checkins')
      .insert({ key_result_id: krId, checked_by, current_value, confidence, note, blocker, meeting_id })
      .select()
      .single()
    if (ciErr) throw ciErr

    // Update KR with new current_value and confidence
    const krUpdates: any = { confidence, updated_at: new Date().toISOString() }
    if (current_value !== undefined && current_value !== null) {
      krUpdates.current_value = current_value
    }
    const { data: kr, error: krErr } = await sb()
      .from('okr_key_results')
      .update(krUpdates)
      .eq('id', krId)
      .select()
      .single()
    if (krErr) throw krErr

    res.status(201).json({ checkin, kr: { ...kr, score: calcKrScore(kr) } })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

// ─── GET /v1/okr/kr/:krId/checkins ───────────────────────────────────────────
router.get('/v1/okr/kr/:krId/checkins', async (req: Request, res: Response) => {
  try {
    const { krId } = req.params
    const { data, error } = await sb()
      .from('okr_checkins')
      .select('*')
      .eq('key_result_id', krId)
      .order('checked_at', { ascending: false })
    if (error) throw error
    res.json(data)
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

// ─── GET /v1/okr/dashboard ───────────────────────────────────────────────────
router.get('/v1/okr/dashboard', async (req: Request, res: Response) => {
  try {
    const entity = (req.query.entity as string) || 'wavult-os'

    // Active cycles
    const { data: cycles, error: cycleErr } = await sb()
      .from('okr_cycles')
      .select('*')
      .eq('entity_slug', entity)
      .eq('status', 'active')
      .order('starts_at', { ascending: false })
    if (cycleErr) throw cycleErr

    if (!cycles || cycles.length === 0) {
      return res.json({ entity, cycles: [], objectives: [], summary: null })
    }

    const cycleIds = cycles.map((c: any) => c.id)

    // All objectives for active cycles
    const { data: objectives, error: objErr } = await sb()
      .from('okr_objectives')
      .select('*')
      .in('cycle_id', cycleIds)
      .neq('status', 'cancelled')
      .order('sort_order', { ascending: true })
    if (objErr) throw objErr

    const objIds = (objectives || []).map((o: any) => o.id)

    // All KRs
    const { data: krs, error: krErr } = objIds.length > 0
      ? await sb().from('okr_key_results').select('*').in('objective_id', objIds).neq('status', 'cancelled')
      : { data: [], error: null }
    if (krErr) throw krErr

    const krsWithScore = (krs || []).map((kr: any) => ({
      ...kr,
      score: calcKrScore(kr),
    }))

    // Attach KRs to objectives, compute objective scores
    const objectivesWithKrs = (objectives || []).map((obj: any) => {
      const objKrs = krsWithScore.filter((kr: any) => kr.objective_id === obj.id)
      return { ...obj, computed_score: calcObjectiveScore(objKrs), key_results: objKrs }
    })

    // Confidence distribution
    const confCounts: Record<string, number> = { at_risk: 0, off_track: 0, on_track: 0, achieved: 0 }
    krsWithScore.forEach((kr: any) => {
      if (kr.confidence && confCounts[kr.confidence] !== undefined) confCounts[kr.confidence]++
    })

    // Overall score
    const allScores = objectivesWithKrs
      .map((o: any) => o.computed_score)
      .filter((s: any) => s !== null) as number[]
    const overallScore = allScores.length > 0
      ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 100) / 100
      : null

    res.json({
      entity,
      cycles,
      objectives: objectivesWithKrs,
      summary: {
        total_objectives: objectivesWithKrs.length,
        total_krs: krsWithScore.length,
        overall_score: overallScore,
        confidence_distribution: confCounts,
      },
    })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

export default router
