// ─── Knowledge Hub — Data Layer ──────────────────────────────────────────────

export type DocCategory = 'Wavult Group' | 'QuiXzoom' | 'Landvex' | 'Internt' | 'Juridik' | 'Idéportfolio'

export interface KnowledgeDoc {
  id: string
  title: string
  category: DocCategory
  summary: string
  tags: string[]
  updatedAt: string
  content: string
}

export const KNOWLEDGE_DOCS: KnowledgeDoc[] = [
  {
    id: 'doc-001',
    title: 'Wavult Group — Bolagsstruktur',
    category: 'Wavult Group',
    summary: 'Komplett bolagsstruktur: Dubai holding, Litauen UAB, Delaware Inc. Pengaflöde och juridisk separation.',
    tags: ['holding', 'dubai', 'struktur', 'entiteter'],
    updatedAt: '2026-03-25',
    content: `## Wavult Group — Bolagsstruktur

**Koncernhierarki:**
- Wavult Group (Dubai, holding + IP)
- Wavult Operations (Dubai, drift + personal)
- QuiXzoom UAB (Litauen, EU-verksamhet)
- QuiXzoom Inc (Delaware, USA-verksamhet)
- Landvex UAB (Litauen, EU-verksamhet)
- Landvex Inc (Delaware, USA-verksamhet)

**Pengaflöde:** Intäkter i lokala bolag → fees till Operations → royalty 5–15% till Group.

**Juridisk separation:** Separata konton, styrelser och avtal för varje bolag.`
  },
  {
    id: 'doc-002',
    title: 'Dubai-struktur — Free Zone Setup',
    category: 'Wavult Group',
    summary: 'Hur Dubai Free Zone fungerar, fördelar med UAE-struktur, skattestrategi och IP-skydd.',
    tags: ['dubai', 'free zone', 'skatt', 'ip'],
    updatedAt: '2026-03-25',
    content: `## Dubai Free Zone Setup

**Fördelar:**
- 0% bolagsskatt (upp till en gräns)
- 100% utländskt ägande tillåtet
- Full kapitalrepatriering
- Stark IP-skyddslagstiftning

**Free Zone alternativ:** IFZA, DIFC, ADGM
**Rekommendation:** IFZA för operationsbolag, DIFC för IP-holding

**IP-strategi:** Wavult Group äger all kod, varumärken och arkitektur. Licensierar till driftsbolag via IP-avtal.`
  },
  {
    id: 'doc-003',
    title: 'QuiXzoom — Plattformsarkitektur',
    category: 'QuiXzoom',
    summary: 'Crowdsourcad kamerainfrastruktur: arkitektur, tech stack, mikrotjänster på AWS ECS.',
    tags: ['arkitektur', 'aws', 'ecs', 'microservices', 'react-native'],
    updatedAt: '2026-03-23',
    content: `## QuiXzoom Platform Architecture

**Koncept:** Global crowdsourcad kamerainfrastruktur — fotografer tar uppdrag via karta, levererar bilddata, tjänar pengar.

**Tech Stack:**
- Mobile: React Native (Expo) + Mapbox + Vision Camera
- Backend: Node.js/TypeScript på AWS ECS Fargate
- Data: PostgreSQL (RDS Multi-AZ) + S3 + CloudFront
- Events: SNS/SQS event bus

**Services:** mission-service, auth-service, media-service, notification-service, billing-service

**Region:** eu-north-1 (primär) → multi-region`
  },
  {
    id: 'doc-004',
    title: 'Landvex — Produktspec & Marknad',
    category: 'Landvex',
    summary: 'AI-driven inspektionsplattform för infrastruktur. Marknad: kommuner, Trafikverket, fastighetsbolag.',
    tags: ['landvex', 'infrastruktur', 'ai', 'kommuner', 'b2b'],
    updatedAt: '2026-03-25',
    content: `## Landvex — Produktspec

**Produktbeskrivning:** AI-analyserad intelligens för infrastrukturägare. Händelsebaserade alerts, inte rådata.

**Målkunder:**
- Kommuner och regioner
- Trafikverket och transportmyndigheter  
- Fastighetsbolag med infrastrukturansvar
- Hamnar och logistikterminaler

**Marknad:**
- Sverige (lansering juni 2026 — skärgården som startpunkt)
- Nederländerna (Q1 2027)
- Övriga EU

**Bolagsstruktur:** Landvex UAB (Litauen) + Landvex Inc (Delaware)`
  },
  {
    id: 'doc-005',
    title: 'Landvex — Deploy & Infrastruktur',
    category: 'Landvex',
    summary: 'AWS-infrastruktur, deployment pipeline och techniska specifikationer för Landvex.',
    tags: ['aws', 'deploy', 'infrastructure', 'ecs'],
    updatedAt: '2026-03-20',
    content: `## Landvex Deploy

**Infrastruktur:** AWS ECS Fargate, eu-north-1
**CI/CD:** GitHub Actions → ECR → ECS
**Databas:** Aurora PostgreSQL Serverless v2
**CDN:** CloudFront + S3

**Miljöer:**
- dev: landvex-dev.hypbit.com
- staging: landvex-staging.hypbit.com  
- prod: landvex.com + app.landvex.com`
  },
  {
    id: 'doc-006',
    title: 'Wavult OS — Systemarkitektur',
    category: 'Internt',
    summary: 'Wavult OS (Hypbit) systemarkitektur: React frontend, modulstruktur, entity-scope, rollhantering.',
    tags: ['wavult-os', 'hypbit', 'frontend', 'react', 'arkitektur'],
    updatedAt: '2026-03-25',
    content: `## Wavult OS (Hypbit) — Systemarkitektur

**Tech Stack:**
- Frontend: React 18 + TypeScript + Vite
- UI: Tailwind CSS + shadcn/ui
- State: React Context + localStorage
- Deploy: Cloudflare Pages

**Modulstruktur:** features/ (dashboard, crm, finance, legal, communications, etc.)

**Kärnkoncept:**
- RoleContext: admin/ceo/cfo/cto/ops
- EntityScopeContext: filtrera per bolag
- Shell: sidebar-layout med nav-grupper
- MaturityModel: modul-mognadsnivåer (alpha/beta/stable)`
  },
  {
    id: 'doc-007',
    title: 'Internt Handbok v1',
    category: 'Internt',
    summary: 'Wavult Groups interna handbok: roller, ansvar, processer och kulturella principer.',
    tags: ['handbok', 'roller', 'processer', 'kultur'],
    updatedAt: '2026-03-20',
    content: `## Wavult Intern Handbok v1

**Principer:**
- Snabbt > Perfekt i tidiga faser
- Dokumentera allt som ska överleva en session
- Dubai-strukturen är ryggraden — respektera juridiska gränser

**Team:**
- Erik Svensson — Chairman + Group CEO
- Dennis Bjarnemark — Chief Legal & Operations
- Leon Russo De Cerame — CEO Wavult Operations
- Winston Bjarnemark — CFO
- Johan Berglund — Group CTO

**Kommunikation:** Telegram-first för interna uppdateringar
**Kodnorm:** TypeScript strict, Prettier, ESLint`
  },
  {
    id: 'doc-008',
    title: 'API-integrationer — Översikt',
    category: 'Internt',
    summary: 'Alla externa API:er som används: Cloudflare, AWS, BankID, n8n, Supabase.',
    tags: ['api', 'integrationer', 'cloudflare', 'aws', 'bankid'],
    updatedAt: '2026-03-22',
    content: `## API-integrationer

**Cloudflare:**
- Pages Deploy: wrangler CLI
- DNS: zones per domän
- Email Workers (planerat)

**AWS:**
- ECS Fargate: wavult-os-api, quixzoom-api, n8n, team-pulse
- Region: eu-north-1
- Account: 155407238699

**BankID:**
- Planerat för Landvex (myndighetsinloggning)
- Kräver avtal via Visma eller liknande

**n8n:** Automation hub, körs på ECS
**Supabase:** command-center frontend DB`
  },
  {
    id: 'doc-009',
    title: 'Juridiska Dokument — Status',
    category: 'Juridik',
    summary: 'Status på bolagsregistreringar, avtal och juridiska milestones för hela koncernen.',
    tags: ['juridik', 'bolagsregistrering', 'avtal', 'compliance'],
    updatedAt: '2026-03-25',
    content: `## Juridiska Dokument — Status

**Bolagsregistreringar:**
- Wavult Group (Dubai): Planerad Q2 2026
- Wavult Operations (Dubai): Planerad Q2 2026  
- QuiXzoom UAB: Planerad Q2 2026
- Landvex UAB: Planerad Q2 2026

**Kritiska avtal att upprätta:**
- IP-licensavtal: Wavult Group → alla operationsbolag
- Management Service Agreement: Operations → alla bolag
- Shareholders Agreement

**Signaturkrav:** L3 (Board-nivå) krävs för bolagsavtal
**Signaturmetod:** DocuSign för internationella avtal`
  },
  {
    id: 'doc-010',
    title: 'Thailand Workcamp — Plan',
    category: 'Internt',
    summary: 'Teamcamp i Thailand 11 april 2026: vecka 1 teambuilding + utbildning, sedan projektlansering.',
    tags: ['thailand', 'workcamp', 'team', 'utbildning'],
    updatedAt: '2026-03-21',
    content: `## Thailand Workcamp — April 2026

**Datum:** 11 april 2026
**Plats:** Thailand (TBD)

**Schema:**
- Vecka 1: Teambuilding + Wavult OS-utbildning
- Vecka 2+: Projektlansering — quiXzoom, Landvex, Wavult OS

**Mål:**
- Hela teamet certifierat på Wavult OS
- QuiXzoom MVP-demo klar
- Landvex beta-site live
- Dubai-struktur presenterad och förankrad

**Deltagare:** Erik, Dennis, Leon, Winston, Johan`
  },
  {
    id: 'doc-011',
    title: 'Domänportfölj — Wavult',
    category: 'Internt',
    summary: 'Alla domäner i Wavult Groups portfölj med status, DNS och Cloudflare zone-IDs.',
    tags: ['domäner', 'dns', 'cloudflare', 'wavult', 'quixzoom'],
    updatedAt: '2026-03-25',
    content: `## Domänportfölj

| Domän | Status | Zone ID |
|-------|--------|---------|
| wavult.com | Pending (NS ej satt) | 5bed27e91d719b3f9d82c234d191ad99 |
| quixzoom.com | Active | e9a9520b64cd67eca1d8d926ca9daa79 |
| hypbit.com | Active | 128f872b669d059d1dfca3c9474098f1 |
| landvex.com | TBD | — |

**NS för wavult.com:**
- arch.ns.cloudflare.com
- gina.ns.cloudflare.com

**DNS-provider:** Cloudflare (alla domäner)`
  },
  {
    id: 'doc-012',
    title: 'QuiXzoom — Zoomer-certifiering',
    category: 'QuiXzoom',
    summary: 'Certifieringsprogram för QuiXzoom-fotografer: kvalitetskrav, betygssystem och uppdragstyper.',
    tags: ['zoomer', 'certifiering', 'fotograf', 'kvalitet'],
    updatedAt: '2026-03-20',
    content: `## Zoomer-certifiering

**Syfte:** Säkerställa kvalitet i QuiXzoom-nätverket

**Certifieringsnivåer:**
- Standard Zoomer: Klarat grundkurs + 5 godkända uppdrag
- Pro Zoomer: 50+ uppdrag, 4.5+ betyg
- Elite Zoomer: 200+ uppdrag, 4.8+ betyg, specialistutbildning

**Krav för Standard:**
- Genomfört Zoomer-certifieringskursen
- Klarat quiz (80% rätt)
- 5 godkända testuppdrag
- Accepterat plattformsavtalet

**Belöningssystem:** Högre nivå = fler uppdrag, bättre betalning, prioritet i app`
  }
]

// ─── Knowledge Graph Nodes ────────────────────────────────────────────────────

export type NodeType = 'holding' | 'operations' | 'product' | 'system' | 'person' | 'market'

export interface GraphNode {
  id: string
  name: string
  type: NodeType
  color: string
  description: string
  layer: number
  links?: string[]
}

export const GRAPH_NODES: GraphNode[] = [
  {
    id: 'wavult-group',
    name: 'Wavult Group',
    type: 'holding',
    color: '#8B5CF6',
    description: 'Ultimate parent. Äger all IP, varumärken och kod. Dubai Free Zone.',
    layer: 0,
    links: ['wavult-ops', 'quixzoom-uab', 'quixzoom-inc', 'landvex-uab', 'landvex-inc']
  },
  {
    id: 'wavult-ops',
    name: 'Wavult Operations',
    type: 'operations',
    color: '#6366F1',
    description: 'Central driftsenhet. Anställer personal, kör Hypbit, hanterar payments. Dubai.',
    layer: 1,
    links: ['hypbit', 'bernt', 'quixzoom-uab', 'landvex-uab']
  },
  {
    id: 'quixzoom-uab',
    name: 'QuiXzoom UAB',
    type: 'product',
    color: '#F59E0B',
    description: 'QuiXzoom EU-verksamhet. Litauen UAB. Crowdsourcad kamerainfrastruktur.',
    layer: 2,
    links: ['quixzoom-app', 'quixzoom-api']
  },
  {
    id: 'quixzoom-inc',
    name: 'QuiXzoom Inc',
    type: 'product',
    color: '#F59E0B',
    description: 'QuiXzoom USA-verksamhet. Delaware Inc.',
    layer: 2,
    links: ['quixzoom-app', 'quixzoom-api']
  },
  {
    id: 'landvex-uab',
    name: 'Landvex UAB',
    type: 'product',
    color: '#10B981',
    description: 'Landvex EU-verksamhet. Litauen UAB. AI-driven infrastrukturinspektion.',
    layer: 2,
    links: ['landvex-app']
  },
  {
    id: 'landvex-inc',
    name: 'Landvex Inc',
    type: 'product',
    color: '#10B981',
    description: 'Landvex USA-verksamhet. Delaware Inc.',
    layer: 2,
    links: ['landvex-app']
  },
  {
    id: 'hypbit',
    name: 'Wavult OS (Hypbit)',
    type: 'system',
    color: '#3B82F6',
    description: 'Internt OS för hela koncernen. React + TypeScript, Cloudflare Pages. INTE ett bolag.',
    layer: 3,
    links: ['bernt']
  },
  {
    id: 'quixzoom-app',
    name: 'QuiXzoom App',
    type: 'system',
    color: '#FCD34D',
    description: 'React Native mobilapp. Mapbox + Vision Camera. Fotografernas verktyg.',
    layer: 3,
    links: ['quixzoom-api']
  },
  {
    id: 'quixzoom-api',
    name: 'QuiXzoom API',
    type: 'system',
    color: '#FCD34D',
    description: 'Node.js backend på AWS ECS. Mission, auth, media, notification services.',
    layer: 3
  },
  {
    id: 'landvex-app',
    name: 'Landvex Platform',
    type: 'system',
    color: '#34D399',
    description: 'AI-analyserad infrastrukturdata. Händelsebaserade alerts för kommuner och myndigheter.',
    layer: 3
  },
  {
    id: 'bernt',
    name: 'Bernt (AI)',
    type: 'person',
    color: '#EC4899',
    description: 'Wavult Groups AI-agent. Kör i Wavult OS. Hjälper hela teamet med drift, analys och beslut.',
    layer: 4
  },
  {
    id: 'dubai',
    name: 'Dubai (UAE)',
    type: 'market',
    color: '#EF4444',
    description: 'Primär juridisk hemvist. Free Zone LLC. 0% skatt, full kapitalrepatriering.',
    layer: 1,
    links: ['wavult-group', 'wavult-ops']
  },
  {
    id: 'eu-market',
    name: 'EU Market',
    type: 'market',
    color: '#0EA5E9',
    description: 'Litauen som EU-bas. GDPR-hemvist, SEPA-betalningar, EU-upphandlingar.',
    layer: 2,
    links: ['quixzoom-uab', 'landvex-uab']
  },
  {
    id: 'usa-market',
    name: 'USA Market',
    type: 'market',
    color: '#0EA5E9',
    description: 'Delaware Inc för USA-verksamhet. Enkel bolagsform, välkänd för investerare.',
    layer: 2,
    links: ['quixzoom-inc', 'landvex-inc']
  }
]

// ─── Idéportfolio — 13 Lovable-projekt (klonare 2026-03-27) ──────────────────

export const IDEA_PORTFOLIO = [
  {
    id: 'mlcs',
    title: 'MLCS Protokoll',
    domain: 'Kliniskt ledningssystem',
    pages: 103,
    updated: '2026-03-17',
    status: 'aktiv' as const,
    description: 'Meta-Level Clinical Structuring — beslutsarkitektur för klinisk och organisatorisk styrning. Evidensbaserat, med artikel-scoring, governance, certifiering och forum. Djupt och välbyggt.',
    potential: 'Knowledge Hub, certifieringsmodul, governance-ramverk för Wavult',
    tags: ['Sjukvård', 'Governance', 'Certifiering', 'B2B', 'Sverige'],
    repo: 'mlcs',
  },
  {
    id: 'certified-academy',
    title: 'Certified Academy',
    domain: 'Editorial + Certifieringsplattform',
    pages: 41,
    updated: '2026-03-14',
    status: 'aktiv' as const,
    description: 'LinkedIn Learning möter The Economist. Kurser, certifikat, redaktionellt innehåll, regionala byråer, annonsörer, governance. 157 Supabase-migrationer.',
    potential: 'Zoomer-utbildning, intern academy för Wavult-teamet',
    tags: ['Utbildning', 'Certifiering', 'Media', 'SaaS'],
    repo: 'certified-academy',
  },
  {
    id: 'dissg',
    title: 'DISSG / Lambda System',
    domain: 'Civilisations-oscilloskop',
    pages: 115,
    updated: '2026-03-16',
    status: 'aktiv' as const,
    description: 'Ett instrument som mäter samhällssignaler utan narrativ eller åsikter. Geo-kontext, AI-diagnos, city nodes, causal DAG, global intelligence layer. WEF Davos-pitch klar.',
    potential: 'Data-layer för Landvex/Quixom Ads, global intelligence API',
    tags: ['Data', 'AI', 'Samhälle', 'Global', 'API'],
    repo: 'dissg',
  },
  {
    id: 'strimdev',
    title: 'STRIM',
    domain: 'Missbruksvård / Samhällsstöd',
    pages: 192,
    updated: '2026-03-17',
    status: 'aktiv' as const,
    description: 'Stiftelsen för Samordning och Riktlinjer inom Missbruksvård. Hjälper människor navigera stöd- och vårdsystemet i Sverige. Transparent, värderingsfri, AI-driven. Störst av alla projekt.',
    potential: 'Eget venture / stiftelse. Potentiell samhällsfinansiering.',
    tags: ['Hälsa', 'Samhälle', 'Sverige', 'Stiftelse', 'AI'],
    repo: 'strimdev',
  },
  {
    id: 'certified-spark-engine',
    title: 'Certified Spark Engine',
    domain: 'Certifieringsplattform v2',
    pages: 32,
    updated: '2026-03-16',
    status: 'aktiv' as const,
    description: 'Nästa generations certifierings-OS. DISC-analys, kompetenshantering, globalt certifieringsregister, auditramverk, OrbILab, MLCS-protokoll integrerat.',
    potential: 'Vidareutveckling av certified-academy + mlcs till en plattform',
    tags: ['Certifiering', 'DISC', 'Kompetens', 'Global', 'SaaS'],
    repo: 'certified-spark-engine',
  },
  {
    id: 'cert-integrity-engine',
    title: 'Cert Integrity Engine',
    domain: 'Labb-certifiering / Konsumenthälsa',
    pages: 32,
    updated: '2026-03-16',
    status: 'aktiv' as const,
    description: 'Oberoende laboratorietestning och certifiering för konsumenthälsoprodukter. QR-ingrediensanalys, förpackningsstandarder, EU-partner-labb, dokumentregister.',
    potential: 'Eget venture inom konsumenthälsa / regulatorisk compliance',
    tags: ['Hälsa', 'Labb', 'EU', 'Certifiering', 'B2B'],
    repo: 'cert-integrity-engine',
  },
  {
    id: 'honest-shelves-builder',
    title: 'Honest Shelves Builder',
    domain: 'E-handel Kosttillskott / Hudvård',
    pages: 16,
    updated: '2026-03-16',
    status: 'aktiv' as const,
    description: 'Transparent e-handel för naturliga/kliniska kosttillskott. Shopify-integrerat, klinisk potens-data, tredjepartsverifiering, B2B-portal. Komplement till cert-integrity-engine.',
    potential: 'Eget D2C-varumärke eller SaaS-plattform för naturproduktsbolag',
    tags: ['E-handel', 'Shopify', 'Hälsa', 'D2C', 'B2B'],
    repo: 'honest-shelves-builder',
  },
  {
    id: 'vision-kredit-byggare',
    title: 'Vision Kredit Byggare',
    domain: 'B2B Fintech — Fakturakredit',
    pages: 21,
    updated: '2026-03-14',
    status: 'aktiv' as const,
    description: 'Fakturakredit, utrustningsleasing, sale-leaseback, leverantörsfaktura, one-click invoice. Manifest om teknik som demokratiserar kredit för svenska företag.',
    potential: 'Eget fintech-venture eller integration med Revolut Business',
    tags: ['Fintech', 'Kredit', 'Leasing', 'B2B', 'Sverige'],
    repo: 'vision-kredit-byggare',
  },
  {
    id: 'lucid-bridge-build',
    title: 'Lucid Bridge Build',
    domain: 'B2B CRM + AI-försäljning',
    pages: 25,
    updated: '2026-01-13',
    status: 'pausad' as const,
    description: 'AI-driven B2B-försäljningsplattform. Dashboard med leads, pipeline, live news feed, market pulse, smart timing. AI genererar e-post och analyserar företag automatiskt.',
    potential: 'CRM-modul för Wavult OS eller fristående SaaS',
    tags: ['CRM', 'AI', 'Försäljning', 'B2B', 'SaaS'],
    repo: 'lucid-bridge-build',
  },
  {
    id: 'it-insight-weaver',
    title: 'IT Insight Weaver',
    domain: 'IT-analys PDF-generator',
    pages: 3,
    updated: '2026-03-15',
    status: 'aktiv' as const,
    description: '14 branscher, 17-sektioners systemanalysrapport, ROI-beräkning, PDFMonkey-integration. Riktar sig mot IT-konsulter som säljer analysunderlag till småföretag.',
    potential: 'Säljverktyg för Landvex-konsulter eller fristående produkt',
    tags: ['IT-konsult', 'PDF', 'ROI', 'B2B', 'Sverige'],
    repo: 'it-insight-weaver',
  },
  {
    id: 'story-weaver-ai',
    title: 'Story Weaver AI',
    domain: 'AI Filmproduktion',
    pages: 5,
    updated: '2026-02-12',
    status: 'pausad' as const,
    description: 'Komplett pre-production suite för AI-genererat filminnehåll. Karaktärer, scener, manus, branding, kontinuitet, media, export.',
    potential: 'Content-verktyg för QuiXzoom-marknadsföring eller fristående',
    tags: ['Film', 'AI', 'Content', 'Kreativt'],
    repo: 'story-weaver-ai',
  },
  {
    id: 'smart-founder-engine',
    title: 'Smart Founder Engine',
    domain: 'Grundar-wizard',
    pages: 2,
    updated: '2025-12-23',
    status: 'tidig' as const,
    description: 'Guided onboarding för grundare: affärsidé → bolagsform → bank → försäkring → tillstånd → registrering. Komplett wizard för att starta bolag i Sverige.',
    potential: 'Integration med vision-kredit-byggare eller fristående fintech',
    tags: ['Startup', 'Bolagsregistrering', 'Sverige', 'Wizard'],
    repo: 'smart-founder-engine',
  },
  {
    id: 'projekt-q',
    title: 'Projekt Q — System Build Handbook',
    domain: 'Teknisk specifikation',
    pages: 0,
    updated: '2026-01-22',
    status: 'referens' as const,
    description: 'Professionellt system build-handbook för externa devteam. Modulbaserat med OVERVIEW/TASKS/ACCEPTANCE per modul. Troligen grunden för en tidigare QuiXzoom-iteration.',
    potential: 'Referensdokument för Thailand-workcamp-bygge',
    tags: ['Dokumentation', 'Devteam', 'RFP', 'Moduler'],
    repo: 'projekt-q',
  },
]
