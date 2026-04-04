// ─── Agent Mesh Role Profiles ─────────────────────────────────────────────────
// Rollkoppling: varje person i Wavult-teamet har en definierad roll med
// tillgång till specifika agenter och en default-agent.

import type { AgentId } from './types'

export type WavultRole =
  | 'chairman-ceo'
  | 'chief-legal-ops'
  | 'group-cto'
  | 'ceo-operations'
  | 'cfo'

export interface RoleProfile {
  role: WavultRole
  person_id: string           // 'erik' | 'dennis' | 'johan' | 'leon' | 'winston'
  display_name: string
  email: string
  allowed_agents: AgentId[]
  default_agent: AgentId
  role_context: string        // Injiceras i systempromt — vem är personen, vad äger de
}

export const ROLE_PROFILES: Record<string, RoleProfile> = {

  erik: {
    role: 'chairman-ceo',
    person_id: 'erik',
    display_name: 'Erik Svensson',
    email: 'erik@hypbit.com',
    allowed_agents: ['qms', 'legal', 'finance', 'code', 'infra', 'people', 'risk', 'data', 'operations', 'product'],
    default_agent: 'product',
    role_context: `Du kommunicerar med Erik Svensson — Chairman of the Board & Group CEO, Wavult Group.

**Eriks ansvarsområden:**
- Övergripande koncernstrategi och vision
- Styrelseordförande — slutgiltig beslutsbefogenhet
- Produktportfölj: quiXzoom, LandveX, Optical Insight
- OKR-ägarskap för Wavult OS
- CAPA-2026-003: Kvalitetspolicy POL-001 måste godkännas (deadline 2026-04-30)
- Kompetens-gap: ISO 9001 intro (obligatorisk, ej avklarad), GDPR basics (obligatorisk, ej avklarad)

**Kontext:**
- Telefon: +46709123223
- Thailand Workcamp: 11 april 2026 — Erik leder strategidelen
- Kommunicerar alltid på svenska

Ge strategiska, beslutsfattande svar. Erik ser hela bilden — aggregera från alla domäner vid behov.`,
  },

  dennis: {
    role: 'chief-legal-ops',
    person_id: 'dennis',
    display_name: 'Dennis Bjarnemark',
    email: 'dennis@hypbit.com',
    allowed_agents: ['qms', 'legal', 'people', 'risk', 'operations', 'finance'],
    default_agent: 'qms',
    role_context: `Du kommunicerar med Dennis Bjarnemark — Chief Legal & Operations (Interim), Wavult Group.

**Dennis ansvarsområden:**
- ISO 9001/27001 Lead Auditor — QMS-ansvarig
- GDPR Data Protection Officer (de facto)
- Juridik: bolagsstruktur, DPA-avtal, SCC, leverantörsavtal
- HR & People: kompetensmatris, onboarding, Thailand-workcamp
- Riskansvar: RISK-2026-002 (GDPR/RoPA), RISK-2026-012 (DPA-avtal), RISK-2026-008 (NIS2)
- Aktiva CAPAs: CAPA-2026-002 (RoPA quiXzoom/LandveX, deadline 2026-05-31)

**ISO-kontroller Dennis äger:**
- ISO 27001 Tema 5 (Organisatoriska kontroller): 5.1–5.37
- ISO 27001 Tema 6 (Personalkontroller): 6.1–6.8
- ISO 9001 kl. 4, 5, 6.1, 6.2, 7.1–7.5, 8.2, 9.2, 10.2

**Kritiska DPA-gaps Dennis måste stänga:** OpenAI, ElevenLabs, Revolut

Ge alltid konkreta hänvisningar till specifika kontroller, lagrum och deadlines.`,
  },

  johan: {
    role: 'group-cto',
    person_id: 'johan',
    display_name: 'Johan Berglund',
    email: 'johan@hypbit.com',
    allowed_agents: ['code', 'infra', 'data', 'risk', 'qms'],
    default_agent: 'code',
    role_context: `Du kommunicerar med Johan Berglund — Group CTO, Wavult Group.

**Johans ansvarsområden:**
- Teknisk arkitektur: Node.js/TypeScript backend, React frontend, AWS ECS eu-north-1
- Gitea CI/CD (git.wavult.com) — alla deployments via Gitea Actions
- Databas: PostgreSQL 16 på AWS RDS
- CAPA-2026-001: MFA saknas (major, Johan ansvarar, deadline 2026-06-30)
- Riskansvar: RISK-2026-006 (MFA), RISK-2026-001 (API-nyckel exponering)

**ISO 27001-kontroller Johan äger:**
- Tema 8 (Tekniska kontroller): 8.1–8.34
- Kryptografi (8.24), Åtkomstkontroll (8.2–8.5), Loggning (8.15–8.17)

**ECS Services Johan driver:**
- wavult-os-api, identity-core, wavult-core, quixzoom-api
- n8n, landvex-api, gitea, bos-scheduler
- GPU-instans: g4dn.xlarge spot (PENDING — AWS quota)

**Telefon:** +46736977576

Ge alltid TypeScript-kod och konkreta AWS-kommandon.`,
  },

  leon: {
    role: 'ceo-operations',
    person_id: 'leon',
    display_name: 'Leon Russo',
    email: 'leon@hypbit.com',
    allowed_agents: ['operations', 'product', 'people', 'data'],
    default_agent: 'operations',
    role_context: `Du kommunicerar med Leon Maurizio Russo De Cerame — CEO Wavult Operations, Wavult Group.

**Leons ansvarsområden:**
- Operativ ledning av quiXzoom och LandveX
- Kundprocess, SLA-hantering, zoomer-onboarding
- Thailand Workcamp: Leon koordinerar boende (Nysa Hotel Bangkok, 11 april 2026)
- ISO 9001 kl. 8 (Drift): 8.1, 8.2, 8.5, 8.6, 8.7, 9.1.2

**Kompetens-gaps Leon arbetar med:**
- Strategisk ledning/OKR: nuläge 3/5, krav 4/5 → under förbättring
- Ekonomistyrning: nuläge 2/5, krav 4/5 → prioriterad utbildning

**quiXzoom go-live:** Sverige, mitten juni 2026. Startmarknad: Stockholms skärgård.
Kom ihåg: ALLTID "zoomers", ALDRIG "fotografer".

**Telefon:** +46738968949

Ge operationellt fokuserade svar med koppling till kundvärde och leverans.`,
  },

  winston: {
    role: 'cfo',
    person_id: 'winston',
    display_name: 'Winston Bjarnemark',
    email: 'winston@hypbit.com',
    allowed_agents: ['finance', 'data', 'risk', 'legal'],
    default_agent: 'finance',
    role_context: `Du kommunicerar med Winston Bjarnemark — CFO, Wavult Group.

**Winstons ansvarsområden:**
- Ekonomistyrning: budget 4,25 MSEK FY2026, likviditetsplanering
- Bokföring: dubbel bokföring (chart_of_accounts, journal_entries)
- Betalinfrastruktur: Revolut (banking), Stripe (kundbetalningar)
- ISO 9001 kl. 8.4: Leverantörskontroll och ekonomistyrning
- Transfer pricing policy saknas (WG-FIN-2026-002) — aktivt gap

**Riskansvar:**
- Finansiell riskexponering: DPA Revolut (post-Brexit UK) — ej signerat
- Intercompany-flöden utan dokumenterad arm's length-policy

**Telefon:** 0768123548

Ge alltid svar med konkreta siffror, konton (BAS-plan), perioder och kassaflödeskonsekvenser.`,
  },
}

/**
 * Hämtar rollprofil för en person.
 * Returnerar undefined om personen inte finns.
 */
export function getRoleProfile(personId: string): RoleProfile | undefined {
  return ROLE_PROFILES[personId.toLowerCase()]
}

/**
 * Kontrollerar om en person har tillgång till en specifik agent.
 */
export function canAccessAgent(personId: string, agentId: AgentId): boolean {
  const profile = getRoleProfile(personId)
  if (!profile) return false
  return profile.allowed_agents.includes(agentId)
}
