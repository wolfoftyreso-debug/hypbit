/**
 * Tax Automation Engine
 * Auto-payment via Revolut + SRU file generation for Skatteverket
 * Principle: System executes automatically. Human approves before payment.
 */
import { Router, Request, Response } from 'express'
import { createClient } from '@supabase/supabase-js'

const router = Router()
const sb = () => createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

// ─── SRU FILE GENERATION (Skatteverket format) ─────────────────────────────────

function generateSRU(declaration: any): string {
  // SRU = Skatteredovisningsunderlag — Skatteverkets standardformat
  const d = declaration.data || {}
  const lines: string[] = []
  
  lines.push('#BLANKETT MOMS')
  lines.push('#IDENTITET')
  lines.push(`#UPPGIFT 7011 ${declaration.entity_id}`) // organisationsnummer
  lines.push(`#UPPGIFT 7012 ${declaration.period_from?.replace(/-/g, '')}`)
  lines.push(`#UPPGIFT 7013 ${declaration.period_to?.replace(/-/g, '')}`)
  
  if (declaration.declaration_type === 'moms') {
    lines.push('#BLANKETTSLUT')
    lines.push('#BLANKETT MOMS-HUVUD')
    // Momsrader
    if (d.utgaende_moms) lines.push(`#UPPGIFT 05 ${Math.round(d.utgaende_moms)}`)   // Utgående moms
    if (d.ingaende_moms) lines.push(`#UPPGIFT 48 ${Math.round(d.ingaende_moms)}`)   // Ingående moms
    if (d.net_to_pay)    lines.push(`#UPPGIFT 49 ${Math.round(d.net_to_pay)}`)       // Moms att betala/återfå
  }
  
  if (declaration.declaration_type === 'agd') {
    lines.push('#BLANKETTSLUT')
    lines.push('#BLANKETT AGI')
    if (d.bruttoloner)         lines.push(`#UPPGIFT 011 ${Math.round(d.bruttoloner)}`)
    if (d.arbetsgivaravgifter) lines.push(`#UPPGIFT 081 ${Math.round(d.arbetsgivaravgifter)}`)
    if (d.total_to_pay)        lines.push(`#UPPGIFT 082 ${Math.round(d.total_to_pay)}`)
  }
  
  lines.push('#BLANKETTSLUT')
  lines.push('#FIL_SLUT')
  return lines.join('\n')
}

// ─── REVOLUT TAX PAYMENT ───────────────────────────────────────────────────────

async function getRevolutToken(): Promise<string | null> {
  // Hämta Revolut access token via refresh token flow
  const refreshToken = process.env.REVOLUT_REFRESH_TOKEN
  const clientId = process.env.REVOLUT_CLIENT_ID
  const privateKey = process.env.REVOLUT_PRIVATE_KEY
  
  if (!refreshToken || !clientId) return null
  
  try {
    const response = await fetch('https://b2b.revolut.com/api/1.0/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
      })
    })
    const data = await response.json() as any
    return data.access_token || null
  } catch { return null }
}

async function initiateRevolutPayment(
  amount: number,
  currency: string,
  description: string,
  beneficiaryAccountNumber: string,
  reference: string
) {
  const token = await getRevolutToken()
  if (!token) throw new Error('Revolut not authenticated')
  
  const response = await fetch('https://b2b.revolut.com/api/1.0/pay', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      request_id: `tax-${Date.now()}`,
      account_id: process.env.REVOLUT_ACCOUNT_ID,
      receiver: {
        counterparty_id: process.env.REVOLUT_SKATTEVERKET_COUNTERPARTY_ID || null,
        account_id: null,
      },
      amount: Math.round(amount * 100), // öre
      currency,
      reference: reference.slice(0, 18), // Skatteverkets OCR max 18 tecken
    })
  })
  return response.json()
}

// ─── ROUTES ────────────────────────────────────────────────────────────────────

// POST /api/tax-automation/:entityId/generate-sru — generera SRU-fil
router.post('/:entityId/generate-sru/:declarationId', async (req: Request, res: Response) => {
  try {
    const { data: declaration } = await sb()
      .from('tax_declarations')
      .select('*')
      .eq('id', req.params.declarationId)
      .eq('entity_id', req.params.entityId)
      .single()
    
    if (!declaration) return res.status(404).json({ error: 'Declaration not found' })
    
    const sru = generateSRU(declaration)
    
    // Spara SRU i S3
    const s3Key = `tax/sru/${declaration.entity_id}/${declaration.id}.sru`
    // Note: S3 upload would go here in production
    
    // Uppdatera declaration med SRU-data
    await sb().from('tax_declarations').update({
      data: { ...declaration.data, sru_content: sru, sru_generated_at: new Date().toISOString() },
      status: 'prepared',
      updated_at: new Date().toISOString(),
    }).eq('id', req.params.declarationId)
    
    res.json({
      ok: true,
      sru_content: sru,
      instructions: {
        step1: 'Download SRU file',
        step2: 'Log in to skatteverket.se → Mina sidor → Deklarera moms',
        step3: 'Upload SRU file or enter figures manually',
        step4: 'Confirm with BankID',
        alternative: 'Use accounting firm as ombud for fully automated filing'
      }
    })
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

// POST /api/tax-automation/:entityId/initiate-payment — initiera skattebetalning via Revolut
router.post('/:entityId/initiate-payment/:declarationId', async (req: Request, res: Response) => {
  try {
    const { approved_by } = req.body
    if (!approved_by) return res.status(400).json({ error: 'approved_by required — all tax payments require explicit human approval' })
    
    const { data: declaration } = await sb()
      .from('tax_declarations')
      .select('*')
      .eq('id', req.params.declarationId)
      .eq('entity_id', req.params.entityId)
      .single()
    
    if (!declaration) return res.status(404).json({ error: 'Not found' })
    if (declaration.amount_due <= 0) return res.status(400).json({ error: 'No amount due' })
    
    // Skatteverkets bankgiro per deklarationstyp
    const paymentTargets: Record<string, { bg: string; name: string }> = {
      'SE:moms': { bg: '5050-1055', name: 'Skatteverket moms' },
      'SE:agd':  { bg: '5050-1055', name: 'Skatteverket arbetsgivaravgifter' },
      'SE:ink2': { bg: '5050-1055', name: 'Skatteverket inkomstskatt' },
    }
    
    const targetKey = `${declaration.jurisdiction}:${declaration.declaration_type}`
    const target = paymentTargets[targetKey]
    
    if (!target) {
      return res.json({
        ok: false,
        message: 'Manual payment required for this jurisdiction',
        amount: declaration.amount_due,
        currency: declaration.currency,
        reference: declaration.submission_ref || declaration.id,
      })
    }
    
    // Initiera Revolut-betalning
    let paymentResult: any = { status: 'pending', note: 'Revolut not configured' }
    try {
      paymentResult = await initiateRevolutPayment(
        declaration.amount_due,
        declaration.currency,
        `${target.name} ${declaration.period_from} – ${declaration.period_to}`,
        target.bg,
        declaration.submission_ref || declaration.id.slice(0, 18)
      )
    } catch (e: any) {
      paymentResult = { error: e.message, note: 'Configure REVOLUT_REFRESH_TOKEN in SSM to enable auto-payment' }
    }
    
    // Update declaration
    await sb().from('tax_declarations').update({
      status: paymentResult.id ? 'submitted' : 'prepared',
      updated_at: new Date().toISOString(),
      data: { ...declaration.data, payment_result: paymentResult, approved_by, payment_initiated_at: new Date().toISOString() }
    }).eq('id', declaration.id)
    
    // Audit log
    await sb().from('audit_log').insert({
      actor: approved_by,
      action: 'tax_payment_initiated',
      resource_type: 'tax_declaration',
      resource_id: declaration.id,
      details: {
        amount: declaration.amount_due,
        currency: declaration.currency,
        type: declaration.declaration_type,
        jurisdiction: declaration.jurisdiction,
        revolut_result: paymentResult.id || 'pending'
      },
      severity: 'info'
    }).catch(() => null)
    
    res.json({
      ok: true,
      declaration_id: declaration.id,
      amount: declaration.amount_due,
      currency: declaration.currency,
      payment: paymentResult,
      approved_by,
    })
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

// GET /api/tax-automation/:entityId/auto-schedule — vad ska betalas automatiskt de nästa 30 dagarna
router.get('/:entityId/auto-schedule', async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const in30days = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
    
    const { data } = await sb()
      .from('tax_declarations')
      .select('*')
      .eq('entity_id', req.params.entityId)
      .gte('deadline', today)
      .lte('deadline', in30days)
      .in('status', ['prepared', 'draft'])
      .order('deadline', { ascending: true })
    
    const schedule = (data ?? []).map(d => ({
      id: d.id,
      type: `${d.jurisdiction} ${d.declaration_type}`,
      deadline: d.deadline,
      amount: d.amount_due,
      currency: d.currency,
      auto_payable: d.jurisdiction === 'SE', // SE fully supported
      action_required: d.amount_due > 0 ? 'approve_and_pay' : 'file_only',
    }))
    
    res.json({
      entity_id: req.params.entityId,
      schedule,
      total_due: schedule.reduce((s, d) => s + (d.amount || 0), 0),
    })
  } catch { res.json({ schedule: [] }) }
})

export default router
