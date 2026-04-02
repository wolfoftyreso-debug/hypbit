// ─── Apollo.io API Adapter ────────────────────────────────────────────────────
// B2B sales intelligence: contacts, companies, deals, enrichment, pipeline.
// Complements Semrush (market signals) with account-level sales signals.
//
// Usage: APOLLO_API_KEY in process.env (SSM Parameter Store in prod)
// Docs: https://apolloio.github.io/apollo-api-docs/
//
// Apollo rate limits: varies by plan — conservative 2 req/s, 5 concurrent.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ApolloEntityType = 'person' | 'company' | 'deal' | 'account'
export type ApolloSignalType =
  | 'new_contact'         // New contact found in target account
  | 'org_change'          // Person changed role/company
  | 'deal_stage_change'   // Deal moved in pipeline
  | 'icp_match'           // Company matches ICP criteria
  | 'intent_signal'       // Buying intent detected
  | 'enrichment_update'   // Firmographic data updated
  | 'hiring_signal'       // Company is hiring (growth signal)
  | 'funding_event'       // Company received funding

export interface ApolloSignal {
  source: 'apollo'
  entity_type: ApolloEntityType
  entity_id: string
  segment: string           // 'municipality' | 'enterprise' | 'smb' | 'startup'
  signal_type: ApolloSignalType
  signal_strength: number   // 0-1
  impact: 'high' | 'medium' | 'low'
  recommended_action: string
  priority_score: number    // 0-1
  timestamp: string
  // Enriched context
  company_name?: string
  company_domain?: string
  contact_name?: string
  contact_title?: string
  deal_value?: number
  deal_stage?: string
  raw?: Record<string, unknown>
}

// Apollo API response shapes (partial — only what we use)
interface ApolloContact {
  id: string
  first_name: string
  last_name: string
  name: string
  title: string
  email: string
  linkedin_url: string
  organization_id: string
  organization_name: string
  organization_domain: string
  seniority: string
  departments: string[]
  employment_history: Array<{ organization_name: string; title: string; current: boolean }>
}

interface ApolloOrganization {
  id: string
  name: string
  domain: string
  website_url: string
  linkedin_url: string
  industry: string
  employee_count: number
  annual_revenue: number
  funding_total: number
  latest_funding_stage: string
  latest_funding_round_date: string
  hq_city: string
  hq_country: string
  technologies: string[]
  keywords: string[]
}

interface ApolloDeal {
  id: string
  name: string
  amount: number
  stage: string
  owner_id: string
  account_id: string
  close_date: string
  created_at: string
  updated_at: string
}

// ─── Supabase ──────────────────────────────────────────────────────────────────

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )
}

// ─── Rate limiter (conservative for Apollo) ────────────────────────────────────

class ApolloRateLimiter {
  private queue: Array<() => void> = []
  private active = 0
  private readonly maxConcurrent = 5
  private readonly minIntervalMs = 500 // 2 req/s

  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.active >= this.maxConcurrent) {
      await new Promise<void>(resolve => this.queue.push(resolve))
    }
    this.active++
    try {
      return await fn()
    } finally {
      this.active--
      const next = this.queue.shift()
      if (next) setTimeout(next, this.minIntervalMs)
    }
  }
}

const limiter = new ApolloRateLimiter()

// ─── HTTP ──────────────────────────────────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.APOLLO_API_KEY
  if (!key) throw new Error('APOLLO_API_KEY not set in environment')
  return key
}

const BASE = 'https://api.apollo.io/v1'

async function apolloPost<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  return limiter.run(async () => {
    const resp = await fetch(`${BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': getApiKey(),
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify(body),
    })

    if (resp.status === 429) {
      const retryAfter = parseInt(resp.headers.get('Retry-After') || '10', 10)
      await new Promise(r => setTimeout(r, retryAfter * 1000))
      return apolloPost<T>(endpoint, body) // retry once
    }

    if (!resp.ok) {
      const text = await resp.text()
      throw new Error(`Apollo HTTP ${resp.status}: ${text}`)
    }

    return resp.json() as Promise<T>
  })
}

async function apolloGet<T>(endpoint: string, params: Record<string, unknown> = {}): Promise<T> {
  return limiter.run(async () => {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => [k, String(v)])
    ).toString()

    const url = `${BASE}${endpoint}${qs ? '?' + qs : ''}`
    const resp = await fetch(url, {
      headers: {
        'X-Api-Key': getApiKey(),
        'Cache-Control': 'no-cache',
      },
    })

    if (resp.status === 429) {
      await new Promise(r => setTimeout(r, 10000))
      return apolloGet<T>(endpoint, params)
    }

    if (!resp.ok) throw new Error(`Apollo HTTP ${resp.status}`)
    return resp.json() as Promise<T>
  })
}

// ─── ICP definition (Wavult's Ideal Customer Profile) ─────────────────────────

const WAVULT_ICP = {
  // For LandveX / quiXzoom
  industries: ['government', 'public_sector', 'real_estate', 'infrastructure', 'transportation'],
  company_sizes: ['51-200', '201-500', '501-1000', '1001-5000'],
  seniority_levels: ['vp', 'c_suite', 'director', 'manager'],
  target_titles: [
    'infrastrukturschef', 'digitaliseringschef', 'stadsbyggnadschef',
    'it-chef', 'cto', 'cdo', 'vd', 'teknisk chef',
    'head of infrastructure', 'digital transformation', 'facilities manager',
  ],
  target_countries: ['Sweden', 'Norway', 'Denmark', 'Finland', 'Netherlands'],
  // For MLCS
  healthcare_titles: ['it-chef', 'medicinskt ansvarig', 'verksamhetschef', 'cio', 'cmo'],
  // For STRIM
  strim_titles: ['socialchef', 'enhetschef missbruk', 'behandlingsansvarig'],
}

function scoreIcpMatch(org: ApolloOrganization, contact?: ApolloContact): number {
  let score = 0

  // Industry match
  if (WAVULT_ICP.industries.some(ind =>
    org.industry?.toLowerCase().includes(ind) ||
    org.keywords?.some(k => k.toLowerCase().includes(ind))
  )) score += 0.30

  // Size match
  const employees = org.employee_count || 0
  if (employees >= 51 && employees <= 5000) score += 0.20

  // Country match
  if (WAVULT_ICP.target_countries.includes(org.hq_country)) score += 0.20

  // Contact seniority
  if (contact) {
    if (WAVULT_ICP.seniority_levels.includes(contact.seniority?.toLowerCase())) score += 0.15
    if (WAVULT_ICP.target_titles.some(t =>
      contact.title?.toLowerCase().includes(t.toLowerCase())
    )) score += 0.15
  }

  return Math.min(1, score)
}

// ─── Signal generators ─────────────────────────────────────────────────────────

function contactToSignal(contact: ApolloContact): ApolloSignal {
  const icpScore = scoreIcpMatch(
    { name: contact.organization_name, domain: contact.organization_domain } as ApolloOrganization,
    contact
  )

  return {
    source: 'apollo',
    entity_type: 'person',
    entity_id: contact.id,
    segment: detectSegment(contact.organization_name, contact.title),
    signal_type: 'new_contact',
    signal_strength: icpScore,
    impact: icpScore > 0.7 ? 'high' : icpScore > 0.4 ? 'medium' : 'low',
    recommended_action: icpScore > 0.7
      ? `Leon: Prioritize outreach to ${contact.name} (${contact.title} at ${contact.organization_name})`
      : `Monitor ${contact.name} at ${contact.organization_name}`,
    priority_score: icpScore,
    timestamp: new Date().toISOString(),
    company_name: contact.organization_name,
    company_domain: contact.organization_domain,
    contact_name: contact.name,
    contact_title: contact.title,
    raw: contact as unknown as Record<string, unknown>,
  }
}

function orgToSignal(org: ApolloOrganization, signalType: ApolloSignalType = 'icp_match'): ApolloSignal {
  const icpScore = scoreIcpMatch(org)

  return {
    source: 'apollo',
    entity_type: 'company',
    entity_id: org.id,
    segment: detectSegment(org.name, org.industry),
    signal_type: signalType,
    signal_strength: icpScore,
    impact: icpScore > 0.7 ? 'high' : icpScore > 0.4 ? 'medium' : 'low',
    recommended_action: `Research ${org.name} (${org.employee_count} employees, ${org.hq_country}) for LandveX/quiXzoom fit`,
    priority_score: icpScore,
    timestamp: new Date().toISOString(),
    company_name: org.name,
    company_domain: org.domain,
    raw: org as unknown as Record<string, unknown>,
  }
}

function dealToSignal(deal: ApolloDeal): ApolloSignal {
  return {
    source: 'apollo',
    entity_type: 'deal',
    entity_id: deal.id,
    segment: 'pipeline',
    signal_type: 'deal_stage_change',
    signal_strength: 0.8,
    impact: deal.amount > 100000 ? 'high' : deal.amount > 25000 ? 'medium' : 'low',
    recommended_action: `Review deal "${deal.name}" (${deal.stage}, ${deal.amount ? `€${deal.amount.toLocaleString()}` : 'no value'})`,
    priority_score: deal.amount > 100000 ? 0.85 : 0.65,
    timestamp: deal.updated_at || new Date().toISOString(),
    deal_value: deal.amount,
    deal_stage: deal.stage,
    raw: deal as unknown as Record<string, unknown>,
  }
}

function detectSegment(name = '', titleOrIndustry = ''): string {
  const combined = `${name} ${titleOrIndustry}`.toLowerCase()
  if (combined.match(/kommun|municipality|stad|city|region|county|länsstyrelse|trafikverket|msb/)) return 'municipality'
  if (combined.match(/hospital|sjukhus|vård|health|klinik|clinic/)) return 'healthcare'
  if (combined.match(/fastighet|real.?estate|property|facility/)) return 'real_estate'
  if (combined.match(/startup|early.?stage|seed/)) return 'startup'
  if (combined.match(/enterprise|corporate|group|ab|inc|gmbh/)) return 'enterprise'
  return 'smb'
}

// ─── Main service ───────────────────────────────────────────────────────────────

export const apolloService = {

  // Search for contacts matching ICP
  async searchContacts(params: {
    titles?: string[]
    industries?: string[]
    countries?: string[]
    company_sizes?: string[]
    keywords?: string[]
    page?: number
    per_page?: number
  }): Promise<ApolloSignal[]> {
    const data = await apolloPost<{ contacts: ApolloContact[]; pagination: unknown }>('/mixed_people/search', {
      contact_titles: params.titles || WAVULT_ICP.target_titles.slice(0, 5),
      prospected_by_current_team: ['no'],
      person_seniorities: WAVULT_ICP.seniority_levels,
      contact_locations: (params.countries || WAVULT_ICP.target_countries).map(c => `country:${c}`),
      organization_industry_tag_ids: params.industries || [],
      page: params.page || 1,
      per_page: params.per_page || 25,
    })

    return (data.contacts || []).map(contactToSignal)
  },

  // Search for companies matching ICP
  async searchOrganizations(params: {
    industries?: string[]
    countries?: string[]
    employee_ranges?: string[]
    keywords?: string[]
    page?: number
    per_page?: number
  }): Promise<ApolloSignal[]> {
    const data = await apolloPost<{ organizations: ApolloOrganization[] }>('/mixed_companies/search', {
      organization_locations: (params.countries || WAVULT_ICP.target_countries).map(c => `country:${c}`),
      organization_num_employees_ranges: params.employee_ranges || WAVULT_ICP.company_sizes,
      organization_industry_tag_ids: params.industries || [],
      q_organization_keyword_tags: params.keywords || ['infrastructure', 'municipality', 'smart city'],
      page: params.page || 1,
      per_page: params.per_page || 25,
    })

    return (data.organizations || []).map(org => orgToSignal(org, 'icp_match'))
  },

  // Enrich a single contact by email or linkedin URL
  async enrichContact(email?: string, linkedin_url?: string): Promise<ApolloSignal | null> {
    if (!email && !linkedin_url) return null

    const data = await apolloPost<{ person: ApolloContact | null }>('/people/match', {
      email,
      linkedin_url,
      reveal_personal_emails: false,
    })

    if (!data.person) return null
    return contactToSignal(data.person)
  },

  // Enrich a company by domain
  async enrichOrganization(domain: string): Promise<ApolloSignal | null> {
    const data = await apolloPost<{ organization: ApolloOrganization | null }>('/organizations/enrich', {
      domain,
    })

    if (!data.organization) return null
    return orgToSignal(data.organization, 'enrichment_update')
  },

  // Get deals from pipeline (CRM sync)
  async getDeals(params?: { stage?: string; owner_id?: string; page?: number }): Promise<ApolloSignal[]> {
    const data = await apolloGet<{ opportunities: ApolloDeal[] }>('/opportunities', {
      stage_id: params?.stage,
      owner_id: params?.owner_id,
      page: params?.page || 1,
      per_page: 50,
    })

    return (data.opportunities || []).map(dealToSignal)
  },

  // Get recently updated deals (change detection)
  async getRecentDealChanges(sinceHours = 24): Promise<ApolloSignal[]> {
    const since = new Date(Date.now() - sinceHours * 3600 * 1000).toISOString()
    const data = await apolloGet<{ opportunities: ApolloDeal[] }>('/opportunities', {
      sort_by_field: 'opportunity_last_activity_date',
      sort_ascending: false,
      per_page: 50,
    })

    return (data.opportunities || [])
      .filter(d => d.updated_at >= since)
      .map(dealToSignal)
  },

  // Nightly enrichment job — enrich all competitor domains
  async enrichCompetitorDomains(domains: string[]): Promise<ApolloSignal[]> {
    const signals: ApolloSignal[] = []
    for (const domain of domains) {
      try {
        const signal = await this.enrichOrganization(domain)
        if (signal) signals.push(signal)
      } catch {
        // Non-fatal — log and continue
      }
    }
    return signals
  },

  // ICP scan — find target accounts in Sweden for LandveX pipeline
  async scanSwedishMunicipalities(): Promise<ApolloSignal[]> {
    const contacts = await this.searchContacts({
      titles: ['infrastrukturschef', 'digitaliseringschef', 'stadsbyggnadschef', 'cdo', 'it-chef'],
      countries: ['Sweden'],
      per_page: 50,
    })

    // Only return high-potential signals
    return contacts.filter(s => s.signal_strength > 0.5)
  },

  // Combined account + contact signal for a specific domain
  async getAccountIntelligence(domain: string): Promise<{
    company: ApolloSignal | null
    key_contacts: ApolloSignal[]
    icp_score: number
    recommended_actions: string[]
  }> {
    const [company, contactsData] = await Promise.allSettled([
      this.enrichOrganization(domain),
      apolloPost<{ contacts: ApolloContact[] }>('/mixed_people/search', {
        q_organization_domains: [domain],
        per_page: 10,
        person_seniorities: WAVULT_ICP.seniority_levels,
      }),
    ])

    const companySignal = company.status === 'fulfilled' ? company.value : null
    const contacts = contactsData.status === 'fulfilled'
      ? (contactsData.value.contacts || []).map(contactToSignal)
      : []

    const icpScore = Math.max(
      companySignal?.priority_score ?? 0,
      contacts.reduce((max, c) => Math.max(max, c.priority_score), 0)
    )

    const actions: string[] = []
    if (icpScore > 0.7) actions.push(`🔴 High priority: reach out to ${domain} this week`)
    const topContact = contacts.sort((a, b) => b.priority_score - a.priority_score)[0]
    if (topContact) actions.push(`Contact: ${topContact.contact_name} (${topContact.contact_title})`)
    if (companySignal?.raw) {
      const org = companySignal.raw as Partial<ApolloOrganization>
      if (org.latest_funding_round_date) actions.push(`Recent funding: ${org.latest_funding_stage} (${org.latest_funding_round_date})`)
      if ((org.employee_count ?? 0) > 500) actions.push(`Large org (${org.employee_count} employees) — may need enterprise terms`)
    }

    return { company: companySignal, key_contacts: contacts.slice(0, 5), icp_score: icpScore, recommended_actions: actions }
  },
}

// ─── Persist signals to Supabase ───────────────────────────────────────────────

export async function persistApolloSignals(signals: ApolloSignal[]) {
  if (!signals.length) return
  const sb = getSupabase()

  const rows = signals.map(s => ({
    source: 'apollo',
    category: s.entity_type === 'deal' ? 'market' : 'competitor',
    title: `${s.signal_type}: ${s.company_name || s.entity_id}${s.contact_name ? ` — ${s.contact_name}` : ''}`,
    summary: s.recommended_action,
    raw_content: s.raw ?? null,
    relevance_score: s.signal_strength,
    impact_score: s.impact === 'high' ? 0.8 : s.impact === 'medium' ? 0.55 : 0.3,
    probability_score: s.priority_score,
    urgency: s.priority_score > 0.75 ? '30d' : '90d',
    sentiment: 'positive',
    impact_type: 'opportunity',
    affects: detectAffectedProducts(s),
    recommendation_action: s.recommended_action,
    recommendation_owner: 'leon',
    status: s.priority_score > 0.7 ? 'new' : 'monitoring',
  }))

  await sb.from('intelligence_signals').insert(rows)
}

function detectAffectedProducts(s: ApolloSignal): string[] {
  const combined = `${s.segment} ${s.company_name || ''} ${s.contact_title || ''}`.toLowerCase()
  const products: string[] = []
  if (combined.match(/municipality|kommun|infrastruktur|trafikverket/)) products.push('landvex', 'quixzoom')
  if (combined.match(/health|sjukhus|klinik|vård/)) products.push('mlcs')
  if (combined.match(/startup|developer|api|fintech/)) products.push('apifly', 'uapix')
  if (!products.length) products.push('wavult_os')
  return products
}
