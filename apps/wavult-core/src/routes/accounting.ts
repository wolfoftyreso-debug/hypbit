/**
 * Accounting API — /api/accounting/*
 * Full double-entry bookkeeping per entity (company).
 * Landvex AB (559141-7042), Wavult Group, etc.
 */
import { Router, Request, Response } from 'express'
import { createClient } from '@supabase/supabase-js'

const router = Router()
const sb = () => createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

async function ensureTables() {
  await sb().rpc('exec_sql', { sql: `
    -- Chart of accounts (BAS-kontoplan)
    CREATE TABLE IF NOT EXISTS accounting_accounts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      entity_id TEXT NOT NULL,
      account_number TEXT NOT NULL,
      account_name TEXT NOT NULL,
      account_type TEXT NOT NULL, -- tillgång, skuld, eget_kapital, intäkt, kostnad
      account_class TEXT NOT NULL, -- 1-8 (BAS)
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(entity_id, account_number)
    );

    -- Journal entries (verifikationer)
    CREATE TABLE IF NOT EXISTS journal_entries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      entity_id TEXT NOT NULL,
      verification_number TEXT,
      date DATE NOT NULL,
      description TEXT NOT NULL,
      reference TEXT,
      created_by TEXT,
      locked BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Journal lines (konteringsrader)
    CREATE TABLE IF NOT EXISTS journal_lines (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      journal_entry_id UUID REFERENCES journal_entries(id),
      account_number TEXT NOT NULL,
      account_name TEXT,
      debit NUMERIC DEFAULT 0,
      credit NUMERIC DEFAULT 0,
      description TEXT,
      cost_center TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_je_entity ON journal_entries(entity_id);
    CREATE INDEX IF NOT EXISTS idx_je_date ON journal_entries(date DESC);
    CREATE INDEX IF NOT EXISTS idx_jl_entry ON journal_lines(journal_entry_id);
    CREATE INDEX IF NOT EXISTS idx_jl_account ON journal_lines(account_number);
    CREATE INDEX IF NOT EXISTS idx_aa_entity ON accounting_accounts(entity_id);
  ` }).catch((e: any) => console.log('Table create (ok):', e.message?.slice(0,100)))
}

// GET /api/accounting/:entityId/accounts — kontoplan
router.get('/:entityId/accounts', async (req: Request, res: Response) => {
  try {
    await ensureTables()
    const { data } = await sb()
      .from('accounting_accounts')
      .select('*')
      .eq('entity_id', req.params.entityId)
      .eq('is_active', true)
      .order('account_number')
    res.json(data ?? [])
  } catch { res.json([]) }
})

// POST /api/accounting/:entityId/accounts — skapa konto
router.post('/:entityId/accounts', async (req: Request, res: Response) => {
  try {
    await ensureTables()
    const { data, error } = await sb()
      .from('accounting_accounts')
      .insert({ ...req.body, entity_id: req.params.entityId })
      .select().single()
    if (error) throw error
    res.status(201).json(data)
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

// GET /api/accounting/:entityId/journal — verifikationsjournal
router.get('/:entityId/journal', async (req: Request, res: Response) => {
  try {
    const { from_date, to_date, limit = '100' } = req.query as Record<string, string>
    let query = sb()
      .from('journal_entries')
      .select('*, journal_lines(*)')
      .eq('entity_id', req.params.entityId)
      .order('date', { ascending: false })
      .limit(parseInt(limit))
    if (from_date) query = query.gte('date', from_date)
    if (to_date) query = query.lte('date', to_date)
    const { data } = await query
    res.json(data ?? [])
  } catch { res.json([]) }
})

// POST /api/accounting/:entityId/journal — skapa verifikat
router.post('/:entityId/journal', async (req: Request, res: Response) => {
  try {
    await ensureTables()
    const { lines, ...entry } = req.body
    const entryWithEntity = { ...entry, entity_id: req.params.entityId }

    // Validate: debits must equal credits
    const totalDebit = (lines || []).reduce((s: number, l: any) => s + (parseFloat(l.debit) || 0), 0)
    const totalCredit = (lines || []).reduce((s: number, l: any) => s + (parseFloat(l.credit) || 0), 0)
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({ error: `Debit (${totalDebit}) ≠ Credit (${totalCredit}). Bokföringen stämmer inte.` })
    }

    // Insert journal entry
    const { data: je, error: jeError } = await sb()
      .from('journal_entries').insert(entryWithEntity).select().single()
    if (jeError) throw jeError

    // Insert lines
    if (lines?.length) {
      const lineRows = lines.map((l: any) => ({ ...l, journal_entry_id: je.id }))
      const { error: lError } = await sb().from('journal_lines').insert(lineRows)
      if (lError) throw lError
    }

    res.status(201).json({ ...je, lines })
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

// GET /api/accounting/:entityId/balance-sheet — balansräkning
router.get('/:entityId/balance-sheet', async (req: Request, res: Response) => {
  try {
    const { as_of_date = new Date().toISOString().split('T')[0] } = req.query as Record<string, string>

    const { data: lines } = await sb()
      .from('journal_lines')
      .select('account_number, account_name, debit, credit, journal_entries!inner(entity_id, date, locked)')
      .eq('journal_entries.entity_id', req.params.entityId)
      .lte('journal_entries.date', as_of_date)

    // Aggregate by account
    const accounts: Record<string, { name: string; balance: number }> = {}
    for (const line of (lines ?? [])) {
      const acc = line.account_number
      if (!accounts[acc]) accounts[acc] = { name: line.account_name ?? acc, balance: 0 }
      accounts[acc].balance += (parseFloat(line.debit) || 0) - (parseFloat(line.credit) || 0)
    }

    const assets = Object.entries(accounts).filter(([k]) => k.startsWith('1'))
    const liabilities = Object.entries(accounts).filter(([k]) => k.startsWith('2'))

    res.json({
      entity_id: req.params.entityId,
      as_of_date,
      assets: assets.map(([num, v]) => ({ account: num, name: v.name, balance: v.balance })),
      liabilities: liabilities.map(([num, v]) => ({ account: num, name: v.name, balance: v.balance })),
      total_assets: assets.reduce((s, [, v]) => s + v.balance, 0),
      total_liabilities: liabilities.reduce((s, [, v]) => s + v.balance, 0),
    })
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

// GET /api/accounting/:entityId/income-statement — resultaträkning
router.get('/:entityId/income-statement', async (req: Request, res: Response) => {
  try {
    const {
      from_date = new Date().getFullYear() + '-01-01',
      to_date = new Date().toISOString().split('T')[0]
    } = req.query as Record<string, string>

    const { data: lines } = await sb()
      .from('journal_lines')
      .select('account_number, account_name, debit, credit, journal_entries!inner(entity_id, date)')
      .eq('journal_entries.entity_id', req.params.entityId)
      .gte('journal_entries.date', from_date)
      .lte('journal_entries.date', to_date)

    const revenue: Record<string, number> = {}
    const expenses: Record<string, number> = {}

    for (const line of (lines ?? [])) {
      const num = parseInt(line.account_number)
      const net = (parseFloat(line.credit) || 0) - (parseFloat(line.debit) || 0)
      if (num >= 3000 && num < 4000) revenue[line.account_number] = (revenue[line.account_number] || 0) + net
      if (num >= 4000 && num < 8000) expenses[line.account_number] = (expenses[line.account_number] || 0) + Math.abs(net)
    }

    const totalRevenue = Object.values(revenue).reduce((s, v) => s + v, 0)
    const totalExpenses = Object.values(expenses).reduce((s, v) => s + v, 0)

    res.json({
      entity_id: req.params.entityId,
      period: { from: from_date, to: to_date },
      revenue: Object.entries(revenue).map(([acc, amount]) => ({ account: acc, amount })),
      expenses: Object.entries(expenses).map(([acc, amount]) => ({ account: acc, amount })),
      total_revenue: totalRevenue,
      total_expenses: totalExpenses,
      net_result: totalRevenue - totalExpenses,
    })
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

// POST /api/accounting/:entityId/seed-chart — seed BAS-kontoplan för nytt bolag
router.post('/:entityId/seed-chart', async (req: Request, res: Response) => {
  try {
    await ensureTables()
    const entityId = req.params.entityId

    // Swedish BAS chart of accounts (standard)
    const basAccounts = [
      // Klass 1 — Tillgångar
      { account_number: '1010', account_name: 'Balanserade utgifter FoU', account_type: 'tillgång', account_class: '1' },
      { account_number: '1220', account_name: 'Inventarier och verktyg', account_type: 'tillgång', account_class: '1' },
      { account_number: '1500', account_name: 'Kundfordringar', account_type: 'tillgång', account_class: '1' },
      { account_number: '1630', account_name: 'Skattekonto', account_type: 'tillgång', account_class: '1' },
      { account_number: '1920', account_name: 'PlusGiro', account_type: 'tillgång', account_class: '1' },
      { account_number: '1930', account_name: 'Företagskonto / checkräkningskonto', account_type: 'tillgång', account_class: '1' },
      { account_number: '1940', account_name: 'Övriga bankkonton', account_type: 'tillgång', account_class: '1' },
      // Klass 2 — Skulder och eget kapital
      { account_number: '2010', account_name: 'Eget kapital', account_type: 'eget_kapital', account_class: '2' },
      { account_number: '2098', account_name: 'Årets resultat', account_type: 'eget_kapital', account_class: '2' },
      { account_number: '2440', account_name: 'Leverantörsskulder', account_type: 'skuld', account_class: '2' },
      { account_number: '2510', account_name: 'Skatteskulder', account_type: 'skuld', account_class: '2' },
      { account_number: '2610', account_name: 'Utgående moms 25%', account_type: 'skuld', account_class: '2' },
      { account_number: '2640', account_name: 'Ingående moms', account_type: 'tillgång', account_class: '2' },
      { account_number: '2710', account_name: 'Personalskatt', account_type: 'skuld', account_class: '2' },
      { account_number: '2731', account_name: 'Sociala avgifter', account_type: 'skuld', account_class: '2' },
      // Klass 3 — Intäkter
      { account_number: '3010', account_name: 'Försäljning tjänster 25% moms', account_type: 'intäkt', account_class: '3' },
      { account_number: '3040', account_name: 'Försäljning tjänster momsfri', account_type: 'intäkt', account_class: '3' },
      { account_number: '3740', account_name: 'Öres- och kronutjämning', account_type: 'intäkt', account_class: '3' },
      // Klass 4 — Inköp
      { account_number: '4010', account_name: 'Inköp varor och material', account_type: 'kostnad', account_class: '4' },
      // Klass 5 — Övriga externa kostnader
      { account_number: '5010', account_name: 'Lokalhyra', account_type: 'kostnad', account_class: '5' },
      { account_number: '5400', account_name: 'Förbrukningsinventarier', account_type: 'kostnad', account_class: '5' },
      { account_number: '5410', account_name: 'Förbrukningsmaterial', account_type: 'kostnad', account_class: '5' },
      { account_number: '5610', account_name: 'Drivmedel', account_type: 'kostnad', account_class: '5' },
      { account_number: '5800', account_name: 'Resekostnader', account_type: 'kostnad', account_class: '5' },
      { account_number: '5900', account_name: 'Reklam och PR', account_type: 'kostnad', account_class: '5' },
      { account_number: '6070', account_name: 'Representation', account_type: 'kostnad', account_class: '5' },
      { account_number: '6110', account_name: 'Kontorsmaterial', account_type: 'kostnad', account_class: '5' },
      { account_number: '6211', account_name: 'Mobiltelefon', account_type: 'kostnad', account_class: '5' },
      { account_number: '6230', account_name: 'Datakommunikation', account_type: 'kostnad', account_class: '5' },
      { account_number: '6310', account_name: 'Företagsförsäkringar', account_type: 'kostnad', account_class: '5' },
      { account_number: '6540', account_name: 'IT-tjänster/SaaS (molntjänster)', account_type: 'kostnad', account_class: '5' },
      { account_number: '6550', account_name: 'Programvaror och licenser', account_type: 'kostnad', account_class: '5' },
      { account_number: '6720', account_name: 'Revisionsarvode', account_type: 'kostnad', account_class: '5' },
      { account_number: '6730', account_name: 'Redovisningskonsult', account_type: 'kostnad', account_class: '5' },
      { account_number: '6750', account_name: 'Juridiska kostnader', account_type: 'kostnad', account_class: '5' },
      // Klass 7 — Personalkostnader
      { account_number: '7010', account_name: 'Löner till tjänstemän', account_type: 'kostnad', account_class: '7' },
      { account_number: '7090', account_name: 'Förändring semesterlöneskuld', account_type: 'kostnad', account_class: '7' },
      { account_number: '7210', account_name: 'Arbetsgivaravgifter', account_type: 'kostnad', account_class: '7' },
      { account_number: '7510', account_name: 'Pensionskostnader', account_type: 'kostnad', account_class: '7' },
      // Klass 8 — Finansiella poster
      { account_number: '8310', account_name: 'Ränteintäkter', account_type: 'intäkt', account_class: '8' },
      { account_number: '8410', account_name: 'Räntekostnader', account_type: 'kostnad', account_class: '8' },
      { account_number: '8910', account_name: 'Skatt på årets resultat', account_type: 'kostnad', account_class: '8' },
    ]

    const rows = basAccounts.map(a => ({ ...a, entity_id: entityId }))
    const { error } = await sb().from('accounting_accounts').upsert(rows, { onConflict: 'entity_id,account_number' })
    if (error) throw error

    res.json({ ok: true, accounts_created: rows.length, entity_id: entityId })
  } catch (e: any) { res.status(500).json({ error: e.message }) }
})

export default router
