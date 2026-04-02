// ─── Apollo Intelligence Routes ───────────────────────────────────────────────
// Sales & account intelligence API endpoints.
// Complements /v1/intelligence/semrush (market signals) with B2B account data.

import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/requireAuth'
import { apolloService, persistApolloSignals } from '../services/apollo.service'

const router = Router()
router.use(requireAuth)

// POST /v1/intelligence/apollo/contacts
// Search ICP-matching contacts
router.post('/v1/intelligence/apollo/contacts', async (req: Request, res: Response) => {
  const { titles, industries, countries, per_page = 25, page = 1 } = req.body

  try {
    const signals = await apolloService.searchContacts({ titles, industries, countries, per_page, page })
    const high_priority = signals.filter(s => s.priority_score > 0.7)

    await persistApolloSignals(high_priority) // Only persist high-priority
    res.json({
      signals,
      total: signals.length,
      high_priority_count: high_priority.length,
      recommended: high_priority.map(s => s.recommended_action),
    })
  } catch (e: any) {
    res.status(500).json({ error: e.message, code: 'APOLLO_ERROR' })
  }
})

// POST /v1/intelligence/apollo/companies
// Search ICP-matching companies
router.post('/v1/intelligence/apollo/companies', async (req: Request, res: Response) => {
  const { industries, countries, keywords, per_page = 25 } = req.body

  try {
    const signals = await apolloService.searchOrganizations({ industries, countries, keywords, per_page })
    const high_priority = signals.filter(s => s.signal_strength > 0.6)

    await persistApolloSignals(high_priority)
    res.json({ signals, total: signals.length, icp_matches: high_priority.length })
  } catch (e: any) {
    res.status(500).json({ error: e.message, code: 'APOLLO_ERROR' })
  }
})

// POST /v1/intelligence/apollo/enrich/contact
// Enrich a single contact
router.post('/v1/intelligence/apollo/enrich/contact', async (req: Request, res: Response) => {
  const { email, linkedin_url } = req.body
  if (!email && !linkedin_url) return res.status(400).json({ error: 'email or linkedin_url required' })

  try {
    const signal = await apolloService.enrichContact(email, linkedin_url)
    if (!signal) return res.status(404).json({ error: 'Contact not found in Apollo' })

    if (signal.priority_score > 0.6) await persistApolloSignals([signal])
    res.json(signal)
  } catch (e: any) {
    res.status(500).json({ error: e.message, code: 'APOLLO_ERROR' })
  }
})

// POST /v1/intelligence/apollo/enrich/company
// Enrich a company by domain
router.post('/v1/intelligence/apollo/enrich/company', async (req: Request, res: Response) => {
  const { domain } = req.body
  if (!domain) return res.status(400).json({ error: 'domain required' })

  try {
    const signal = await apolloService.enrichOrganization(domain)
    if (!signal) return res.status(404).json({ error: 'Organization not found in Apollo' })

    await persistApolloSignals([signal])
    res.json(signal)
  } catch (e: any) {
    res.status(500).json({ error: e.message, code: 'APOLLO_ERROR' })
  }
})

// GET /v1/intelligence/apollo/deals
// Get current pipeline
router.get('/v1/intelligence/apollo/deals', async (req: Request, res: Response) => {
  const { stage, owner_id, page } = req.query as Record<string, string>

  try {
    const signals = await apolloService.getDeals({ stage, owner_id, page: page ? parseInt(page) : 1 })
    res.json({ deals: signals, total: signals.length })
  } catch (e: any) {
    res.status(500).json({ error: e.message, code: 'APOLLO_ERROR' })
  }
})

// GET /v1/intelligence/apollo/deals/recent
// Get deals changed in last N hours (change detection)
router.get('/v1/intelligence/apollo/deals/recent', async (req: Request, res: Response) => {
  const hours = parseInt(req.query.hours as string || '24', 10)

  try {
    const signals = await apolloService.getRecentDealChanges(hours)
    const high_value = signals.filter(s => (s.deal_value ?? 0) > 50000)

    await persistApolloSignals(high_value)
    res.json({ changed_deals: signals, high_value_count: high_value.length })
  } catch (e: any) {
    res.status(500).json({ error: e.message, code: 'APOLLO_ERROR' })
  }
})

// POST /v1/intelligence/apollo/account
// Full account intelligence for a domain
router.post('/v1/intelligence/apollo/account', async (req: Request, res: Response) => {
  const { domain } = req.body
  if (!domain) return res.status(400).json({ error: 'domain required' })

  try {
    const intel = await apolloService.getAccountIntelligence(domain)

    // Auto-create Wavult OS task for high-ICP accounts
    if (intel.icp_score > 0.75 && intel.recommended_actions.length) {
      const allSignals = [intel.company, ...intel.key_contacts].filter(Boolean)
      await persistApolloSignals(allSignals as any)
    }

    res.json(intel)
  } catch (e: any) {
    res.status(500).json({ error: e.message, code: 'APOLLO_ERROR' })
  }
})

// POST /v1/intelligence/apollo/scan/municipalities
// Nightly job: scan Swedish municipalities for LandveX ICP contacts
router.post('/v1/intelligence/apollo/scan/municipalities', async (req: Request, res: Response) => {
  try {
    const signals = await apolloService.scanSwedishMunicipalities()
    await persistApolloSignals(signals)

    const prioritized = signals
      .sort((a, b) => b.priority_score - a.priority_score)
      .slice(0, 10)
      .map(s => ({
        name: s.contact_name,
        title: s.contact_title,
        company: s.company_name,
        icp_score: s.priority_score,
        action: s.recommended_action,
      }))

    res.json({
      total_found: signals.length,
      high_priority: signals.filter(s => s.priority_score > 0.7).length,
      top_10: prioritized,
    })
  } catch (e: any) {
    res.status(500).json({ error: e.message, code: 'APOLLO_ERROR' })
  }
})

// POST /v1/intelligence/apollo/combined-signal
// Combine Semrush + Apollo signals for a domain (the power combo)
// "Market is searching → right contacts now exist" = prioritize outreach
router.post('/v1/intelligence/apollo/combined-signal', async (req: Request, res: Response) => {
  const { domain, keyword } = req.body
  if (!domain) return res.status(400).json({ error: 'domain required' })

  try {
    const [accountIntel] = await Promise.all([
      apolloService.getAccountIntelligence(domain),
    ])

    // Merge recommendation
    const combined = {
      domain,
      keyword_context: keyword || null,
      account: {
        icp_score: accountIntel.icp_score,
        company: accountIntel.company?.company_name,
        key_contacts: accountIntel.key_contacts.map(c => ({
          name: c.contact_name,
          title: c.contact_title,
          score: c.priority_score,
        })),
      },
      recommendation: accountIntel.icp_score > 0.7
        ? `🔴 HIGH: ${domain} matches ICP (score: ${accountIntel.icp_score.toFixed(2)}). ${accountIntel.recommended_actions[0] || 'Initiate outreach this week.'}`
        : `🟡 MEDIUM: ${domain} partially matches ICP. Monitor and enrich.`,
      priority: accountIntel.icp_score > 0.7 ? 'P1' : 'P2',
      owner: 'leon',
      actions: accountIntel.recommended_actions,
    }

    res.json(combined)
  } catch (e: any) {
    res.status(500).json({ error: e.message, code: 'APOLLO_ERROR' })
  }
})

export default router
