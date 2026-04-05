/**
 * Wavult DS — System Data Layer
 *
 * ENDA platsen där bolag, team och hierarki definieras.
 * Alla komponenter importerar härifrån eller använder hooks.
 *
 * När ett bolag läggs till/tas bort/byter namn → ändra HÄR.
 * Allt annat uppdateras automatiskt.
 */

// ── BOLAG (source of truth) ───────────────────────────────────────────────────

export interface CorpEntity {
  id: string
  shortName: string
  name: string
  jurisdiction: string
  jurisdictionCode: string
  flag: string
  color: string
  status: 'aktiv' | 'forming' | 'planerad' | 'avvecklad'
  /** Maps to org-graph active_status: 'aktiv' → 'live', 'forming' → 'forming', 'planerad' → 'planned' */
  active_status: 'live' | 'forming' | 'planned'
  layer: number          // 0=holding, 1=sub-holding, 2=operative
  parentId?: string
  /** Alias for parentId — for compatibility with legacy ownedBy references */
  ownedBy?: string
  /** Alias for parentId — for compatibility with legacy parent_entity_id references */
  parent_entity_id: string | null
  foundedDate?: string
  products: string[]     // vilka produkter bolaget driver
  description: string
  metadata?: Record<string, string>
}

export const CORP_ENTITIES: CorpEntity[] = [
  {
    id: 'wgh',
    shortName: 'WGH',
    name: 'Wavult Group Holding DMCC',
    jurisdiction: 'UAE (DIFC)',
    jurisdictionCode: 'AE',
    flag: '🇦🇪',
    color: '#E8B84B',
    status: 'aktiv',
    active_status: 'live',
    layer: 0,
    parentId: undefined,
    ownedBy: undefined,
    parent_entity_id: null,
    foundedDate: '2025-06-01',
    products: [],
    description: 'Moderbolag — Dubai DMCC. Äger alla dotterbolag.',
  },
  {
    id: 'woh',
    shortName: 'WOH',
    name: 'Wavult Operations Holding AB',
    jurisdiction: 'Sverige',
    jurisdictionCode: 'SE',
    flag: '🇸🇪',
    color: '#0A3D62',
    status: 'aktiv',
    active_status: 'live',
    layer: 1,
    parentId: 'wgh',
    ownedBy: 'wgh',
    parent_entity_id: 'wgh',
    foundedDate: '2024-01-15',
    products: ['Wavult DS'],
    description: 'Operativt holdingbolag Sverige. Äger OZ-LT och OZ-US.',
  },
  {
    id: 'oz-lt',
    shortName: 'OZ-LT',
    name: 'Optical Zoom UAB',
    jurisdiction: 'Litauen',
    jurisdictionCode: 'LT',
    flag: '🇱🇹',
    color: '#2D7A4F',
    status: 'aktiv',
    active_status: 'live',
    layer: 2,
    parentId: 'woh',
    ownedBy: 'woh',
    parent_entity_id: 'woh',
    foundedDate: '2025-03-01',
    products: ['quiXzoom EU'],
    description: 'EU tech-hub. quiXzoom-plattformen för EU-marknaden.',
  },
  {
    id: 'oz-us',
    shortName: 'OZ-US',
    name: 'Optical Zoom Inc',
    jurisdiction: 'Delaware, USA',
    jurisdictionCode: 'US-DE',
    flag: '🇺🇸',
    color: '#2C6EA6',
    status: 'aktiv',
    active_status: 'live',
    layer: 2,
    parentId: 'woh',
    ownedBy: 'woh',
    parent_entity_id: 'woh',
    foundedDate: '2026-03-27',
    products: ['quiXzoom US'],
    description: 'US-entitet (Delaware C-Corp) via Stripe Atlas.',
  },
  {
    id: 'lvx-ae',
    shortName: 'LVX-AE',
    name: 'LandveX AC',
    jurisdiction: 'UAE (DIFC)',
    jurisdictionCode: 'AE',
    flag: '🇦🇪',
    color: '#C9A84C',
    status: 'forming',
    active_status: 'forming',
    layer: 1,
    parentId: 'wgh',
    ownedBy: 'wgh',
    parent_entity_id: 'wgh',
    products: ['LandveX AE'],
    description: 'LandveX UAE/MENA. Under etablering.',
  },
  {
    id: 'lvx-us',
    shortName: 'LVX-US',
    name: 'LandveX Inc',
    jurisdiction: 'Texas, USA',
    jurisdictionCode: 'US-TX',
    flag: '🇺🇸',
    color: '#4A7A5B',
    status: 'forming',
    active_status: 'forming',
    layer: 1,
    parentId: 'wgh',
    ownedBy: 'wgh',
    parent_entity_id: 'wgh',
    foundedDate: '2026-03-31',
    products: ['LandveX US'],
    description: 'LandveX för USA-marknaden. Texas LLC via Northwest.',
  },
]

// ── BRAND GROUPS ─────────────────────────────────────────────────────────────

export interface BrandGroup {
  id: string
  name: string
  shortName: string
  flag: string
  color: string
  entityIds: string[]    // vilka bolag ingår
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
    description: 'Crowdsourcad kamerainfrastruktur — EU + US',
    products: ['quiXzoom EU', 'quiXzoom US'],
  },
  {
    id: 'landvex',
    name: 'LandveX',
    shortName: 'LVX',
    flag: '🏗️',
    color: '#C9A84C',
    entityIds: ['lvx-ae', 'lvx-us'],
    description: 'Infrastrukturintelligens — UAE + USA',
    products: ['LandveX AE', 'LandveX US'],
  },
  {
    id: 'wavult-holdings',
    name: 'Wavult Holdings',
    shortName: 'WHD',
    flag: '🏛️',
    color: '#0A3D62',
    entityIds: ['wgh', 'woh'],
    description: 'Holdingstruktur — Dubai + Sverige',
    products: ['Wavult DS'],
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getChildren(entityId: string): CorpEntity[] {
  return CORP_ENTITIES.filter(e => e.parentId === entityId)
}
export function getParent(entityId: string): CorpEntity | undefined {
  const entity = CORP_ENTITIES.find(e => e.id === entityId)
  return entity?.parentId ? CORP_ENTITIES.find(e => e.id === entity.parentId) : undefined
}
export function getEntityById(id: string): CorpEntity | undefined {
  return CORP_ENTITIES.find(e => e.id === id)
}
export function getActiveEntities(): CorpEntity[] {
  return CORP_ENTITIES.filter(e => e.status === 'aktiv')
}

// ── TEAM (source of truth) ────────────────────────────────────────────────────

export interface TeamMember {
  id: string
  name: string
  role: string
  title: string           // formell titel
  email: string
  phone?: string
  entityIds: string[]     // vilka bolag de är aktiva i
  reportsTo: string | null
  roleId: string          // matchar RoleContext: 'group-ceo' | 'cto' | etc
  avatar?: string
  location?: string
  startDate?: string
  /** Responsibility domains */
  owns?: string[]
  kpis: Array<{
    label: string
    value: string
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
    entityIds: ['wgh', 'woh', 'oz-lt', 'oz-us', 'lvx-ae', 'lvx-us'],
    reportsTo: null,
    roleId: 'group-ceo',
    avatar: '/avatars/erik.png',
    location: 'Stockholm / Dubai',
    startDate: '2024-01-01',
    owns: ['Group strategy', 'Capital allocation', 'IP & brand ownership', 'System architecture', 'Market & vision'],
    kpis: [
      { label: 'Bolag etablerade', value: '4/6', status: 'warning' },
      { label: 'Sverige go-live', value: 'Juni 2026', status: 'on_track' },
      { label: 'Thailand workcamp', value: '11 april', status: 'on_track' },
      { label: 'Bankkonton öppnade', value: '0', status: 'critical' },
    ],
  },
  {
    id: 'leon',
    name: 'Leon Russo De Cemare',
    role: 'CEO — Wavult Operations',
    title: 'Chief Executive Officer, Operations',
    email: 'leon@hypbit.com',
    phone: '+46738968949',
    entityIds: ['woh'],
    reportsTo: 'erik',
    roleId: 'ceo-ops',
    avatar: '/avatars/leon.png',
    location: 'Stockholm',
    owns: ['Daglig exekvering', 'Resurshantering', 'Sales & revenue', 'Team-koordinering'],
    kpis: [
      { label: 'Aktiva projekt', value: '4', status: 'active' },
      { label: 'First MRR', value: 'Pre-revenue', status: 'pending' },
    ],
  },
  {
    id: 'winston',
    name: 'Winston Bjarnemark',
    role: 'CFO',
    title: 'Chief Financial Officer',
    email: 'winston@hypbit.com',
    phone: '+46768123548',
    entityIds: ['wgh', 'woh'],
    reportsTo: 'erik',
    roleId: 'cfo',
    avatar: '/avatars/winston.png',
    location: 'Stockholm',
    owns: ['Finansiella flöden', 'Intercompany billing', 'Budget & forecast', 'Banking'],
    kpis: [
      { label: 'Bankkonton öppnade', value: '0', status: 'critical' },
      { label: 'Intercompany avtal', value: '1 signerat', status: 'warning' },
      { label: 'EIN-ansökan LandveX', value: 'Pågår', status: 'warning' },
    ],
  },
  {
    id: 'johan',
    name: 'Johan Berglund',
    role: 'Group CTO',
    title: 'Chief Technology Officer',
    email: 'johan@hypbit.com',
    phone: '+46736977576',
    entityIds: ['wgh', 'woh'],
    reportsTo: 'erik',
    roleId: 'cto',
    avatar: '/avatars/johan.png',
    location: 'Stockholm',
    owns: ['Systemarkitektur', 'Infrastruktur', 'CI/CD & DevOps', 'Säkerhet'],
    kpis: [
      { label: 'ECS-tjänster live', value: '11/13', status: 'on_track' },
      { label: 'System uptime', value: '99%+', status: 'good' },
      { label: 'Gitea repos', value: '50 (0 tomma)', status: 'good' },
    ],
  },
  {
    id: 'dennis',
    name: 'Dennis Bjarnemark',
    role: 'Board Member / Chief Legal',
    title: 'Chief Legal & Operations Officer (Interim)',
    email: 'dennis@hypbit.com',
    phone: '+46761474243',
    entityIds: ['wgh', 'woh', 'oz-us', 'lvx-us'],
    reportsTo: 'erik',
    roleId: 'clo',
    avatar: '/avatars/dennis.png',
    location: 'Stockholm',
    owns: ['Bolagsstruktur', 'Avtal & juridik', 'IP-skydd', 'Compliance'],
    kpis: [
      { label: 'Bolag inkorporerade', value: '4/6', status: 'warning' },
      { label: '83(b) Election', value: '22d kvar', status: 'critical' },
      { label: 'DMCC-förnyelse', value: '57d', status: 'warning' },
    ],
  },
  {
    id: 'tiffany',
    name: 'Tiffany Molly Catarina Svensson',
    role: 'Arvtagare',
    title: "Founder's Heir",
    email: '',
    entityIds: ['wgh'],
    reportsTo: 'erik',
    roleId: 'viewer',
    location: 'Stockholm / Thailand (from May 3)',
    owns: [],
    kpis: [],
  },
]

export function getMemberById(id: string): TeamMember | undefined {
  return TEAM_MEMBERS.find(m => m.id === id)
}
export function getMembersForEntity(entityId: string): TeamMember[] {
  return TEAM_MEMBERS.filter(m => m.entityIds.includes(entityId))
}
export function getDirectReports(managerId: string): TeamMember[] {
  return TEAM_MEMBERS.filter(m => m.reportsTo === managerId)
}
