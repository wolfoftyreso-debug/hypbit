import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'

const router = Router()

function sb() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) throw new Error('Supabase not configured')
  return createClient(url, key)
}

// ─── Legal Documents CRUD ─────────────────────────────────────────────────────

// GET /v1/legal/documents — lista alla juridiska dokument
router.get('/v1/legal/documents', async (req, res) => {
  try {
    const client = sb()
    const { data, error } = await client
      .from('legal_documents')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json(data ?? [])
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /v1/legal/documents/:id — hämta ett specifikt dokument
router.get('/v1/legal/documents/:id', async (req, res) => {
  try {
    const client = sb()
    const { data, error } = await client
      .from('legal_documents')
      .select('*')
      .eq('id', req.params.id)
      .single()
    if (error) return res.status(404).json({ error: 'Not found' })
    res.json(data)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /v1/legal/documents — skapa nytt dokument
router.post('/v1/legal/documents', async (req, res) => {
  try {
    const client = sb()
    const { data, error } = await client
      .from('legal_documents')
      .insert(req.body)
      .select()
      .single()
    if (error) throw error
    res.status(201).json(data)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /v1/legal/documents/:id — uppdatera status, sign_method etc.
router.patch('/v1/legal/documents/:id', async (req, res) => {
  try {
    const client = sb()
    const { data, error } = await client
      .from('legal_documents')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error
    res.json(data)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Scrive e-signing ─────────────────────────────────────────────────────────

// POST /v1/legal/sign/document — skapa signeringsärende i Scrive
router.post('/v1/legal/sign/document', async (req, res) => {
  const key = process.env.SCRIVE_API_TOKEN
  if (!key) return res.status(503).json({ error: 'Scrive not configured', configured: false })
  const { title, parties } = req.body
  try {
    const r = await fetch('https://api.scrive.com/api/v2/documents/new', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, parties })
    })
    res.json(await r.json())
  } catch (err: any) { res.status(500).json({ error: err.message }) }
})

// GET /v1/legal/sign/health
router.get('/v1/legal/sign/health', (_req, res) => {
  res.json({
    scrive: !!process.env.SCRIVE_API_TOKEN,
    docusign: !!process.env.DOCUSIGN_ACCESS_TOKEN
  })
})

export default router
