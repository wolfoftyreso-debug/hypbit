/**
 * Tax Integration Layer
 * Sweden (Skatteverket), USA (IRS), UAE (FTA), Lithuania (VMI)
 *
 * Architecture: System prepares declarations from journal data.
 * Submission is initiated by user (never auto-submit).
 * Every submission is logged in audit_log.
 */
import { Router, Request, Response } from 'express'
import { createClient } from '@supabase/supabase-js'

const router = Router()
const sb = () => createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

async function ensureTables() {
  await (sb().rpc('exec_sql', { sql: `
    CREATE TABLE IF NOT EXISTS tax_declarations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      entity_id TEXT NOT NULL,
      jurisdiction TEXT NOT NULL,   -- SE, US-DE, US-TX, UAE, LT
      declaration_type TEXT NOT NULL, -- moms, agd, vat, corporate_tax, payroll
      period_from DATE NOT NULL,
      period_to DATE NOT NULL,
      deadline DATE,
      status TEXT DEFAULT 'draft',   -- draft, prepared, submitted, confirmed, overdue
      amount_due NUMERIC DEFAULT 0,
      currency TEXT DEFAULT 'SEK',
      reference TEXT,
      submission_ref TEXT,           -- Skatteverkets ärendenummer etc
      submitted_at TIMESTAMPTZ,
      submitted_by TEXT,
      auto_calculated BOOLEAN DEFAULT true,
      notes TEXT,
      data JSONB DEFAULT '{}',       -- full declaration data
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_tax_entity ON tax_declarations(entity_id);
    CREATE INDEX IF NOT EXISTS idx_tax_deadline ON tax_declarations(deadline ASC);
    CREATE INDEX IF NOT EXISTS idx_tax_status ON tax_declarations(status);
  ` }) as unknown as Promise<any>).catch(() => null)
}

// ─── SWEDEN ────────────────────────────────────────────────────────────────────

// Calculate Swedish VAT (moms) from journal entries
async function calculateSwedishVAT(entityId: string, fromDate: string, toDate: string) {
  const { data: lines } = await sb()
    .from('journal_lines')
    .select('account_number, debit, credit, journal_entries!inner(entity_id, date)')
    .eq('journal_entries.entity_id', entityId)
    .gte('journal_entries.date', fromDate)
    .lte('journal_entries.date', toDate)

  let utgaendeMoms = 0  // konto 2610-2629 (utgående moms = vi ska betala)
  let ingaendeMoms = 0  // konto 2640 (ingående moms = vi får tillbaka)

  for (const line of (lines ?? [])) {
    const num = parseInt(line.account_number)
    if (num >= 2610 && num <= 2629) {
      // Utgående moms: kredit ökar skulden
      utgaendeMoms += (parseFloat(line.credit as any) || 0) - (parseFloat(line.debit as any) || 0)
    }
    if (num === 2640 || num === 2641 || num === 2645) {
      // Ingående moms: debet ökar fordran
      ingaendeMoms += (parseFloat(line.debit as any) || 0) - (parseFloat(line.credit as any) || 0)
    }
  }

  const netMoms = utgaendeMoms - ingaendeMoms
  return {
    utgaende_moms: utgaendeMoms,
    ingaende_moms: ingaendeMoms,
    net_to_pay: netMoms,
    currency: 'SEK',
  }
}

// Calculate Swedish employer declaration (AGD)
async function calculateAGI(entityId: string, fromDate: string, toDate: string) {
  const { data: lines } = await sb()
    .from('journal_lines')
    .select('account_number, debit, credit, journal_entries!inner(entity_id, date)')
    .eq('journal_entries.entity_id', entityId)
    .gte('journal_entries.date', fromDate)
    .lte('journal_entries.date', toDate)

  let bruttoloner = 0          // konto 7010-7090
  let arbetsgivaravgifter = 0  // konto 7210

  for (const line of (lines ?? [])) {
    const num = parseInt(line.account_number)
    if (num >= 7010 && num <= 7090) {
      bruttoloner += (parseFloat(line.debit as any) || 0)
    }
    if (num === 7210) {
      arbetsgivaravgifter += (parseFloat(line.debit as any) || 0)
    }
  }

  return {
    bruttoloner,
    arbetsgivaravgifter,
    total_to_pay: arbetsgivaravgifter,
    currency: 'SEK',
    rate: '31.42%',
  }
}

// GET /api/tax/:entityId/declarations — list all declarations
router.get('/:entityId/declarations', async (req: Request, res: Response) => {
  try {
    await ensureTables()
    const { status, jurisdiction } = req.query as Record<string, string>
    let query = sb()
      .from('tax_declarations')
      .select('*')
      .eq('entity_id', req.params.entityId)
      .order('deadline', { ascending: true })
    if (status) query = query.eq('status', status)
    if (jurisdiction) query = query.eq('jurisdiction', jurisdiction)
    const { data } = await query
    res.json(data ?? [])
  } catch { res.json([]) }
})

// GET /api/tax/:entityId/upcoming — next deadlines (90 days)
router.get('/:entityId/upcoming', async (req: Request, res: Response) => {
  try {
    await ensureTables()
    const today = new Date().toISOString().split('T')[0]
    const in90days = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]
    const { data } = await sb()
      .from('tax_declarations')
      .select('*')
      .eq('entity_id', req.params.entityId)
      .gte('deadline', today)
      .lte('deadline', in90days)
      .in('status', ['draft', 'prepared', 'overdue'])
      .order('deadline', { ascending: true })
    res.json(data ?? [])
  } catch { res.json([]) }
})

// POST /api/tax/:entityId/calculate/se-moms — beräkna momsdeklaration
router.post('/:entityId/calculate/se-moms', async (req: Request, res: Response) => {
  try {
    await ensureTables()
    const { period_from, period_to, quarter } = req.body

    // Deadlines: Q1→12 maj, Q2→12 aug, Q3→12 nov, Q4→12 feb
    const qDeadlines: Record<string, string> = {
      'Q1': `${new Date().getFullYear()}-05-12`,
      'Q2': `${new Date().getFullYear()}-08-12`,
      'Q3': `${new Date().getFullYear()}-11-12`,
      'Q4': `${new Date().getFullYear() + 1}-02-12`,
    }

    const vatData = await calculateSwedishVAT(req.params.entityId, period_from, period_to)
    const deadline = quarter ? qDeadlines[quarter] : null

    const declaration = {
      entity_id: req.params.entityId,
      jurisdiction: 'SE',
      declaration_type: 'moms',
      period_from,
      period_to,
      deadline,
      status: 'prepared',
      amount_due: vatData.net_to_pay,
      currency: 'SEK',
      data: vatData,
    }

    const { data, error } = await sb()
      .from('tax_declarations')
      .insert(declaration)
      .select().single()
    if (error) throw error
    res.status(201).json(data)
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

// POST /api/tax/:entityId/calculate/se-agi — beräkna arbetsgivardeklaration
router.post('/:entityId/calculate/se-agi', async (req: Request, res: Response) => {
  try {
    await ensureTables()
    const { period_from, period_to, month } = req.body

    // AGD deadline: 12:e månaden efter
    const deadline = month ? `${month.slice(0, 7)}-12`.replace(/(\d{4})-(\d{2})/, (_, y, m) => {
      const next = new Date(parseInt(y), parseInt(m), 12)
      return next.toISOString().split('T')[0]
    }) : null

    const agiData = await calculateAGI(req.params.entityId, period_from, period_to)

    const { data, error } = await sb()
      .from('tax_declarations')
      .insert({
        entity_id: req.params.entityId,
        jurisdiction: 'SE',
        declaration_type: 'agd',
        period_from, period_to,
        deadline,
        status: 'prepared',
        amount_due: agiData.total_to_pay,
        currency: 'SEK',
        data: agiData,
      })
      .select().single()
    if (error) throw error
    res.status(201).json(data)
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

// POST /api/tax/:entityId/declarations/:declarationId/submit — mark as submitted (logs to audit)
router.post('/:entityId/declarations/:declarationId/submit', async (req: Request, res: Response) => {
  try {
    const { submission_ref, submitted_by } = req.body

    const { data, error } = await sb()
      .from('tax_declarations')
      .update({
        status: 'submitted',
        submission_ref,
        submitted_by,
        submitted_at: new Date().toISOString(),
      })
      .eq('id', req.params.declarationId)
      .eq('entity_id', req.params.entityId)
      .select().single()
    if (error) throw error

    // Audit log — varje inlämning loggas
    await (sb().from('audit_log').insert({
      actor: submitted_by || 'system',
      action: 'tax_declaration_submitted',
      resource_type: 'tax_declaration',
      resource_id: req.params.declarationId,
      details: {
        declaration_type: data.declaration_type,
        jurisdiction: data.jurisdiction,
        amount: data.amount_due,
        ref: submission_ref,
      },
      severity: 'info',
    }) as unknown as Promise<any>).catch(() => null)

    res.json(data)
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

// GET /api/tax/:entityId/skatteverket/status — integration info (BankID/cert required for live)
router.get('/:entityId/skatteverket/status', async (_req: Request, res: Response) => {
  res.json({
    integration: 'Skatteverket e-tjänster',
    status: 'requires_authentication',
    auth_method: 'BankID eller organisationscertifikat',
    api_docs: 'https://www.skatteverket.se/foretagochorganisationer/digitalaservicesandapi',
    note: 'Manual submission required. System prepares declaration data, user submits via Skatteverket Mina sidor or eSkattedeklaration.',
    skattekonto_url: 'https://skatteverket.se/foretagochorganisationer/skattersocialaavgifter/skattekonto',
  })
})

// GET /api/tax/:entityId/calendar — all tax deadlines next 12 months
router.get('/:entityId/calendar', async (req: Request, res: Response) => {
  const entityId = req.params.entityId
  const year = new Date().getFullYear()

  // Standard Swedish tax calendar
  const calendar = [
    // Moms (kvartalsredovisare, under 40 MSEK)
    { type: 'moms', period: `${year}-01-01 – ${year}-03-31`, deadline: `${year}-05-12`, jurisdiction: 'SE', description: 'Momsdeklaration Q1' },
    { type: 'moms', period: `${year}-04-01 – ${year}-06-30`, deadline: `${year}-08-12`, jurisdiction: 'SE', description: 'Momsdeklaration Q2' },
    { type: 'moms', period: `${year}-07-01 – ${year}-09-30`, deadline: `${year}-11-12`, jurisdiction: 'SE', description: 'Momsdeklaration Q3' },
    { type: 'moms', period: `${year}-10-01 – ${year}-12-31`, deadline: `${year + 1}-02-12`, jurisdiction: 'SE', description: 'Momsdeklaration Q4' },
    // AGD (månadsvis för bolag med lön)
    ...Array.from({ length: 12 }, (_, i) => {
      const month = new Date(year, i, 1)
      const deadlineMonth = new Date(year, i + 1, 12)
      return {
        type: 'agd',
        period: `${month.toISOString().slice(0, 7)}`,
        deadline: deadlineMonth.toISOString().slice(0, 10),
        jurisdiction: 'SE',
        description: `Arbetsgivardeklaration ${month.toLocaleString('sv', { month: 'long' })} ${year}`,
      }
    }),
    // Inkomstdeklaration (INK2)
    { type: 'ink2', period: `${year - 1}`, deadline: `${year}-07-01`, jurisdiction: 'SE', description: 'Inkomstdeklaration (INK2)' },
    // UAE VAT (quarterly)
    { type: 'vat', period: `${year}-Q1`, deadline: `${year}-04-28`, jurisdiction: 'UAE', description: 'UAE VAT Return Q1' },
    { type: 'vat', period: `${year}-Q2`, deadline: `${year}-07-28`, jurisdiction: 'UAE', description: 'UAE VAT Return Q2' },
    { type: 'vat', period: `${year}-Q3`, deadline: `${year}-10-28`, jurisdiction: 'UAE', description: 'UAE VAT Return Q3' },
    { type: 'vat', period: `${year}-Q4`, deadline: `${year + 1}-01-28`, jurisdiction: 'UAE', description: 'UAE VAT Return Q4' },
    // Lithuania VMI VAT (monthly)
    ...Array.from({ length: 12 }, (_, i) => {
      const month = new Date(year, i, 1)
      const deadline = new Date(year, i + 1, 25)
      return {
        type: 'vat',
        period: `${month.toISOString().slice(0, 7)}`,
        deadline: deadline.toISOString().slice(0, 10),
        jurisdiction: 'LT',
        description: `VMI PVM deklaracija ${month.toLocaleString('lt', { month: 'long' })} ${year}`,
      }
    }),
  ]

  const today = new Date().toISOString().split('T')[0]
  const upcoming = calendar
    .filter(d => d.deadline >= today)
    .sort((a, b) => a.deadline.localeCompare(b.deadline))

  res.json({ entity_id: entityId, calendar: upcoming, total: upcoming.length })
})

export default router
