// ─── Jurisdiktionsmodul — Legal Boundary Intelligence ────────────────────────
// Filosofi: Vi opererar på EXAKT 100% av juridiska gränsen — kirurgisk precision.
// API ger fullständig regulatorisk karta per marknad, produkt och gap-status.

import { Router } from 'express'
import { Pool } from 'pg'

const router = Router()

function getDb() {
  return new Pool({
    connectionString: process.env.DATABASE_URL || process.env.WAVULT_OS_DB_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  })
}

// GET /v1/jurisdiction — lista alla aktiva jurisdiktioner med aggregerad status
router.get('/v1/jurisdiction', async (_req, res) => {
  const db = getDb()
  try {
    const { rows } = await db.query(`
      SELECT
        j.*,
        COUNT(DISTINCT jr.id)::int                                                AS regulation_count,
        COUNT(DISTINCT jp.id)::int                                                AS rule_count,
        SUM(CASE WHEN jr.our_status = 'gap'       THEN 1 ELSE 0 END)::int        AS gap_count,
        SUM(CASE WHEN jr.our_status = 'compliant' THEN 1 ELSE 0 END)::int        AS compliant_count,
        SUM(CASE WHEN jr.our_status = 'in_progress' THEN 1 ELSE 0 END)::int      AS in_progress_count,
        COUNT(DISTINCT je.id) FILTER (WHERE je.status = 'open')::int             AS open_events
      FROM jurisdictions j
      LEFT JOIN jurisdiction_regulations   jr ON jr.jurisdiction_id = j.id
      LEFT JOIN jurisdiction_product_rules jp ON jp.jurisdiction_id = j.id
      LEFT JOIN jurisdiction_events        je ON je.jurisdiction_id = j.id
      WHERE j.status != 'exited'
      GROUP BY j.id
      ORDER BY
        CASE j.status WHEN 'active' THEN 0 WHEN 'planned' THEN 1 ELSE 2 END,
        j.country_name
    `)
    res.json(rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  } finally {
    await db.end()
  }
})

// GET /v1/jurisdiction/:code — fullständig jurisdiktionsprofil
router.get('/v1/jurisdiction/:code', async (req, res) => {
  const db = getDb()
  try {
    const code = req.params.code.toUpperCase()

    const { rows: [j] } = await db.query(
      'SELECT * FROM jurisdictions WHERE country_code = $1',
      [code]
    )
    if (!j) return res.status(404).json({ error: `Jurisdiction '${code}' not found` })

    const [{ rows: regulations }, { rows: product_rules }, { rows: open_events }] =
      await Promise.all([
        db.query(
          `SELECT * FROM jurisdiction_regulations
           WHERE jurisdiction_id = $1
           ORDER BY category, regulation_name`,
          [j.id]
        ),
        db.query(
          `SELECT * FROM jurisdiction_product_rules
           WHERE jurisdiction_id = $1
           ORDER BY product, rule_category`,
          [j.id]
        ),
        db.query(
          `SELECT * FROM jurisdiction_events
           WHERE jurisdiction_id = $1 AND status = 'open'
           ORDER BY
             CASE impact_level WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
             effective_date ASC NULLS LAST`,
          [j.id]
        ),
      ])

    res.json({ ...j, regulations, product_rules, open_events })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  } finally {
    await db.end()
  }
})

// GET /v1/jurisdiction/product/:product — regler per produkt, alla marknader
router.get('/v1/jurisdiction/product/:product', async (req, res) => {
  const db = getDb()
  try {
    const { rows } = await db.query(
      `SELECT
         j.country_code, j.country_name, j.region,
         j.status         AS market_status,
         j.legal_entity,
         jp.rule_category, jp.rule_title,
         jp.rule_description,
         jp.optimal_operation,
         jp.hard_limit,
         jp.current_practice,
         jp.gap_to_optimal,
         jp.status        AS rule_status,
         jp.responsible_person
       FROM jurisdiction_product_rules jp
       JOIN jurisdictions j ON j.id = jp.jurisdiction_id
       WHERE jp.product = $1
       ORDER BY j.country_code, jp.rule_category`,
      [req.params.product]
    )
    res.json(rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  } finally {
    await db.end()
  }
})

// GET /v1/jurisdiction/gaps — alla compliance-gaps och analyzing-items
router.get('/v1/jurisdiction/gaps', async (_req, res) => {
  const db = getDb()
  try {
    const { rows } = await db.query(`
      SELECT
        j.country_code, j.country_name, j.region,
        jr.regulation_code, jr.regulation_name, jr.category,
        jr.boundary_description,
        jr.optimal_point,
        jr.red_lines,
        jr.our_status,
        jr.compliance_notes,
        jr.responsible_person,
        jr.next_review_date
      FROM jurisdiction_regulations jr
      JOIN jurisdictions j ON j.id = jr.jurisdiction_id
      WHERE jr.our_status IN ('gap', 'analyzing')
      ORDER BY
        CASE jr.our_status WHEN 'gap' THEN 0 ELSE 1 END,
        j.country_code,
        jr.regulation_name
    `)
    res.json(rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  } finally {
    await db.end()
  }
})

// GET /v1/jurisdiction/events — öppna händelser, sorterade på impact + datum
router.get('/v1/jurisdiction/events', async (_req, res) => {
  const db = getDb()
  try {
    const { rows } = await db.query(`
      SELECT
        j.country_code, j.country_name,
        je.*
      FROM jurisdiction_events je
      JOIN jurisdictions j ON j.id = je.jurisdiction_id
      WHERE je.status = 'open'
      ORDER BY
        CASE je.impact_level WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
        je.effective_date ASC NULLS LAST
    `)
    res.json(rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  } finally {
    await db.end()
  }
})

export default router
