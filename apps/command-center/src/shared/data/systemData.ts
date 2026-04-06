/**
 * Wavult DS — System Data Layer (KORRIGERAD 2026-04-06)
 * Baserad på faktiska mail, bolagsverket-ärenden och registreringsbevis.
 * 
 * UPPDATERA HÄR → allt uppdateras automatiskt överallt
 */

export interface CorpEntity {
  id: string
  shortName: string
  name: string
  legalName?: string        // juridiskt namn om det skiljer sig
  orgNumber?: string
  jurisdiction: string
  jurisdictionCode: string
  flag: string
  color: string
  status: 'aktiv' | 'forming' | 'planerad' | 'under_namnbyte' | 'avvecklad'
  layer: number             // 0=koncerntopp, 1=sub-holding, 2=operativt
  parentId?: string
  foundedDate?: string
  products: string[]
  description: string
  registrationRef?: string  // Bolagsverket ärende, DMCC-ansökningsnr etc
}

export const CORP_ENTITIES: CorpEntity[] = [
  // ── DUBAI (planerade/under registrering) ────────────────────────────────────
  {
    id: 'wg-dmcc',
    shortName: 'WG DMCC',
    name: 'Wavult Group DMCC',
    jurisdiction: 'UAE (DMCC Free Zone)',
    jurisdictionCode: 'AE',
    flag: '🇦🇪',
    color: '#E8B84B',
    status: 'forming',
    layer: 0,
    products: [],
    description: 'IP Holding — äger all koncernens IP (SaaS, plattformar, data). Royalties från dotterbolag.',
  },
  {
    id: 'fc-fzco',
    shortName: 'FinanceCo',
    name: 'Wavult FinanceCo FZCO',
    jurisdiction: 'UAE (DMCC Free Zone)',
    jurisdictionCode: 'AE',
    flag: '🇦🇪',
    color: '#C9A84C',
    status: 'forming',
    layer: 1,
    parentId: 'wg-dmcc',
    products: [],
    description: 'Group treasury — intercompany-lån, kapitalallokering, finansiell hub.',
  },
  {
    id: 'dvo-fzco',
    shortName: 'DevOps FZCO',
    name: 'Wavult DevOps FZCO',
    jurisdiction: 'UAE (DMCC Free Zone)',
    jurisdictionCode: 'AE',
    flag: '🇦🇪',
    color: '#0A3D62',
    status: 'forming',
    layer: 1,
    parentId: 'wg-dmcc',
    products: ['Wavult DS'],
    description: 'Teknisk driftenhet — system, infrastruktur, plattformsutveckling.',
  },

  // ── SVERIGE ─────────────────────────────────────────────────────────────────
  {
    id: 'lvx-ab',
    shortName: 'LandveX AB',
    name: 'LandveX AB',
    legalName: 'Sommarliden Holding AB (namnbyte pågår)',
    orgNumber: '559141-7042',
    jurisdiction: 'Sverige',
    jurisdictionCode: 'SE',
    flag: '🇸🇪',
    color: '#2D7A4F',
    status: 'under_namnbyte',
    layer: 2,
    parentId: 'fc-fzco',
    foundedDate: '2024-03-15',
    products: ['LandveX', 'Optical Insight'],
    description: 'Operativt bolag Sverige. SaaS-abonnemang till kommuner och infrastrukturägare. Namnbyte till LandveX AB pågår (Bolagsverket ärendenr 178303/2026).',
    registrationRef: 'Bolagsverket 178303/2026',
  },

  // ── LITAUEN ─────────────────────────────────────────────────────────────────
  {
    id: 'oz-lt',
    shortName: 'QZ-LT',
    name: 'quiXzoom UAB',
    jurisdiction: 'Litauen',
    jurisdictionCode: 'LT',
    flag: '🇱🇹',
    color: '#2D7A4F',
    status: 'aktiv',
    layer: 2,
    parentId: 'dvo-fzco',
    foundedDate: '2025-03-01',
    products: ['quiXzoom EU'],
    description: 'quiXzoom UAB — EU tech-hub. quiXzoom-plattformen för EU-marknaden.',
  },

  // ── USA DELAWARE ─────────────────────────────────────────────────────────────
  {
    id: 'oz-us',
    shortName: 'QZ-US',
    name: 'quiXzoom Inc',
    jurisdiction: 'Delaware, USA',
    jurisdictionCode: 'US-DE',
    flag: '🇺🇸',
    color: '#2C6EA6',
    status: 'aktiv',
    layer: 2,
    parentId: 'dvo-fzco',
    foundedDate: '2026-03-27',
    products: ['quiXzoom US'],
    description: 'quiXzoom Inc — Delaware C-Corp via Stripe Atlas. quiXzoom US-marknad.',
  },

  // ── USA TEXAS ────────────────────────────────────────────────────────────────
  {
    id: 'lvx-us',
    shortName: 'LandveX Inc',
    name: 'LandveX Inc',
    jurisdiction: 'Houston, Texas, USA',
    jurisdictionCode: 'US-TX',
    flag: '🇺🇸',
    color: '#4A7A5B',
    status: 'aktiv',
    layer: 2,
    parentId: 'wg-dmcc',
    foundedDate: '2026-03-31',
    products: ['LandveX US'],
    description: 'LandveX Inc — Texas LLC. Houston-baserat. US-marknad för LandveX infrastrukturintelligens.',
  },

]

// Helpers
export function getChildren(entityId: string): CorpEntity[] {
  return CORP_ENTITIES.filter(e => e.parentId === entityId)
}
export function getEntityById(id: string): CorpEntity | undefined {
  return CORP_ENTITIES.find(e => e.id === id)
}
export function getActiveEntities(): CorpEntity[] {
  return CORP_ENTITIES.filter(e => ['aktiv', 'under_namnbyte'].includes(e.status))
}

// Brand groups
export interface BrandGroup {
  id: string
  name: string
  shortName: string
  flag: string
  color: string
  entityIds: string[]
  description: string
  products: string[]
}

export const BRAND_GROUPS: BrandGroup[] = [
  {
    id: 'quixzoom',
    name: 'quiXzoom',
    shortName: 'QZ',
    flag: '📷',
    color: '#2D7A4F',
    entityIds: ['oz-lt', 'oz-us'],
    description: 'Crowdsourcad kamerainfrastruktur — EU (Litauen) + US (Delaware)',
    products: ['quiXzoom EU', 'quiXzoom US'],
  },
  {
    id: 'landvex',
    name: 'LandveX',
    shortName: 'LVX',
    flag: '🏗️',
    color: '#C9A84C',
    entityIds: ['lvx-ab', 'lvx-us'],
    description: 'Infrastrukturintelligens — Sverige + UAE + USA',
    products: ['LandveX SE', 'LandveX AE', 'LandveX US'],
  },
  {
    id: 'dubai-ops',
    name: 'Dubai Operations',
    shortName: 'DXB',
    flag: '🇦🇪',
    color: '#E8B84B',
    entityIds: ['wg-dmcc', 'fc-fzco', 'dvo-fzco'],
    description: 'Dubai-entiteter — IP Holding + FinanceCo + DevOps FZCO',
    products: [],
  }]

// ── TEAM (source of truth) ────────────────────────────────────────────────────

export interface TeamMember {
  id: string
  name: string
  role: string
  title: string
  email: string
  phone?: string
  entityIds: string[]
  reportsTo?: string
  roleId: string
  avatar?: string
  location?: string
  kpis: Array<{
    label: string
    value: string | (() => string)
    status: 'good' | 'warning' | 'critical' | 'pending' | 'on_track' | 'active'
  }>
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'erik',
    name: 'Erik Svensson',
    role: 'Chairman & Group CEO',
    title: 'Styrelseordförande och Group CEO',
    email: 'erik@hypbit.com',
    phone: '+46709123223',
    entityIds: ['wg-dmcc', 'fc-fzco', 'dvo-fzco', 'lvx-ab', 'oz-lt', 'oz-us', 'lvx-us'],
    roleId: 'group-ceo',
    avatar: '/avatars/erik.png',
    location: 'Stockholm / Dubai',
    kpis: [
      { label: 'Dubai DMCC-ansökan', value: 'Pågår', status: 'warning' },
      { label: 'LandveX AB namnbyte', value: 'Väntar Bolagsverket', status: 'warning' },
      { label: 'Sverige go-live', value: 'Juni 2026', status: 'on_track' },
      { label: '83(b) Election OZ-US', value: () => `${Math.max(0, Math.ceil((new Date('2026-04-27').getTime() - Date.now()) / 86400000))}d kvar`, status: 'critical' }],
  },
  {
    id: 'leon',
    name: 'Leon Russo De Cemare',
    role: 'CEO — Wavult Operations',
    title: 'Chief Executive Officer, Operations',
    email: 'leon@hypbit.com',
    phone: '+46738968949',
    entityIds: ['dvo-fzco', 'lvx-ab'],
    reportsTo: 'erik',
    roleId: 'ceo-ops',
    avatar: '/avatars/leon.png',
    location: 'Stockholm',
    kpis: [
      { label: 'Aktiva projekt', value: '4', status: 'active' },
      { label: 'First revenue', value: 'Pre-revenue', status: 'pending' }],
  },
  {
    id: 'winston',
    name: 'Winston Bjarnemark',
    role: 'CFO',
    title: 'Chief Financial Officer',
    email: 'winston@hypbit.com',
    phone: '+46768123548',
    entityIds: ['wg-dmcc', 'fc-fzco', 'lvx-ab'],
    reportsTo: 'erik',
    roleId: 'cfo',
    avatar: '/avatars/winston.png',
    location: 'Stockholm',
    kpis: [
      { label: 'Bankkonton öppnade', value: '0/3 bolag', status: 'critical' },
      { label: 'LandveX Inc EIN', value: 'Pågår via Northwest', status: 'warning' },
      { label: 'Intercompany avtal', value: '1', status: 'warning' }],
  },
  {
    id: 'johan',
    name: 'Johan Berglund',
    role: 'Group CTO',
    title: 'Chief Technology Officer',
    email: 'johan@hypbit.com',
    phone: '+46736977576',
    entityIds: ['wg-dmcc', 'dvo-fzco'],
    reportsTo: 'erik',
    roleId: 'cto',
    avatar: '/avatars/johan.png',
    location: 'Stockholm',
    kpis: [
      { label: 'ECS-tjänster live', value: '11/13', status: 'on_track' },
      { label: 'System uptime', value: '99%+', status: 'good' },
      { label: 'Gitea repos', value: '50', status: 'good' }],
  },
  {
    id: 'dennis',
    name: 'Dennis Bjarnemark',
    role: 'Board / Chief Legal',
    title: 'Chief Legal & Operations Officer (Interim)',
    email: 'dennis@hypbit.com',
    phone: '+46761474243',
    entityIds: ['wg-dmcc', 'oz-us', 'lvx-us'],
    reportsTo: 'erik',
    roleId: 'clo',
    avatar: '/avatars/dennis.png',
    location: 'Stockholm',
    kpis: [
      { label: 'Dubai FZCO-ansökan', value: '3 entiteter', status: 'warning' },
      { label: '83(b) OZ-US', value: () => `${Math.max(0, Math.ceil((new Date('2026-04-27').getTime() - Date.now()) / 86400000))}d kvar`, status: 'critical' },
      { label: 'FinCEN BOI report', value: 'Ej inlämnad', status: 'warning' }],
  },
  {
    id: 'tiffany',
    name: 'Tiffany Molly Catarina Svensson',
    role: 'Founder\'s Heir',
    title: 'Designerad arvtagare',
    email: '',
    entityIds: ['wg-dmcc'],
    reportsTo: 'erik',
    roleId: 'viewer',
    location: 'Stockholm → Thailand (3 maj)',
    kpis: [],
  }]

export function getMemberById(id: string): TeamMember | undefined {
  return TEAM_MEMBERS.find(m => m.id === id)
}
export function getMembersForEntity(entityId: string): TeamMember[] {
  return TEAM_MEMBERS.filter(m => m.entityIds.includes(entityId))
}
export function getDirectReports(managerId: string): TeamMember[] {
  return TEAM_MEMBERS.filter(m => m.reportsTo === managerId)
}

// ── LEGACY ENTITIES (bara synliga för group-ceo / systemadmin) ───────────────

export interface LegacyEntity {
  id: string
  name: string
  flag: string
  status: 'avvecklad' | 'fusionerad' | 'bytt_namn'
  successorId?: string
  note: string
  closedDate?: string
}

export const LEGACY_ENTITIES: LegacyEntity[] = [
  {
    id: 'sommarliden',
    name: 'Sommarliden Holding AB',
    flag: '🇸🇪',
    status: 'bytt_namn',
    successorId: 'lvx-ab',
    note: 'Namnbyte till LandveX AB pågår (Bolagsverket 178303/2026). Org.nr 559141-7042 behålls.',
    closedDate: '2026-03-25',
  },
  {
    id: 'hypbit',
    name: 'Hypbit (varumärke)',
    flag: '🇸🇪',
    status: 'avvecklad',
    note: 'Gammalt produktnamn — avvecklat. Ersatt av Wavult Group. Hypbit.com-mailadresser temporärt kvar.',
  },
  {
    id: 'pixdrift',
    name: 'Pixdrift',
    flag: '🇸🇪',
    status: 'avvecklad',
    note: 'Gammalt bolagsnamn — avvecklat. Ersatt av Wavult.',
  }]
