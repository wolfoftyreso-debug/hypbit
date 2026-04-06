// CORP_ENTITIES and BRAND_GROUPS are imported here to keep this file
// as the single source that pulls from systemData. OkrDashboard uses them directly.
import { CORP_ENTITIES as _CE, BRAND_GROUPS as _BG } from '../../shared/data/systemData'
export type { } // satisfy isolatedModules

export type OKRStatus = 'on_track' | 'at_risk' | 'behind' | 'completed' | 'not_started'
export type OKRCycle = 'Q1-2026' | 'Q2-2026' | 'Q3-2026' | 'Q4-2026' | 'FY-2026'

export interface KeyResult {
  id: string
  title: string
  metric: string
  current: number
  target: number
  unit: string
  currentValue: string
  targetValue: string
  status: OKRStatus
  owner: string
  lastUpdated: string
}

export interface Objective {
  id: string
  entityId: string
  cycle: OKRCycle
  title: string
  description: string
  status: OKRStatus
  progress: number
  keyResults: KeyResult[]
  owner: string
}

export const OBJECTIVES: Objective[] = [
  // ── WAVULT GROUP (wg-dmcc) ─────────────────────────────────────────────────
  {
    id: 'obj-wg-1',
    entityId: 'wg-dmcc',
    cycle: 'Q2-2026',
    title: 'Etablera juridisk och finansiell grundstruktur',
    description: 'Alla bolag registrerade, bankkonton öppnade, IP-avtal på plats',
    status: 'behind',
    progress: 15,
    owner: 'erik',
    keyResults: [
      { id: 'kr-wg-1-1', title: 'Dubai DMCC-ansökan godkänd', metric: 'DMCC-licens', current: 20, target: 100, unit: '%', currentValue: 'Under ansökan', targetValue: 'Godkänd', status: 'at_risk', owner: 'dennis', lastUpdated: '2026-04-01' },
      { id: 'kr-wg-1-2', title: 'Bankkonton öppnade för alla bolag', metric: 'bankkonton', current: 0, target: 100, unit: '%', currentValue: '0 av 4 bolag', targetValue: '4 bankkonton', status: 'behind', owner: 'winston', lastUpdated: '2026-04-01' },
      { id: 'kr-wg-1-3', title: 'IP-avtal signerade (Dubai → dotterbolag)', metric: 'avtal', current: 0, target: 100, unit: '%', currentValue: '0 av 4 avtal', targetValue: '4 IP-avtal', status: 'not_started', owner: 'dennis', lastUpdated: '2026-04-01' },
    ],
  },
  {
    id: 'obj-wg-2',
    entityId: 'wg-dmcc',
    cycle: 'Q2-2026',
    title: 'Thailand Workcamp — team aligned och produkter klara',
    description: 'Hela teamet samlat, kodbas klar, alla produkter redo för lansering',
    status: 'on_track',
    progress: 60,
    owner: 'erik',
    keyResults: [
      { id: 'kr-wg-2-1', title: 'Alla 5 teammedlemmar på plats Bangkok 11 april', metric: 'teammedlemmar', current: 100, target: 100, unit: '%', currentValue: '5/5 bokade', targetValue: '5 bokade', status: 'completed', owner: 'erik', lastUpdated: '2026-04-05' },
      { id: 'kr-wg-2-2', title: 'Wavult DS MVP-funktioner klara', metric: 'features', current: 75, target: 100, unit: '%', currentValue: '75% klart', targetValue: '100% klart', status: 'on_track', owner: 'johan', lastUpdated: '2026-04-06' },
      { id: 'kr-wg-2-3', title: 'Tiffany med på resan (pass + visum)', metric: 'pass', current: 100, target: 100, unit: '%', currentValue: 'Pass skannat', targetValue: 'Pass + resa', status: 'on_track', owner: 'erik', lastUpdated: '2026-04-06' },
    ],
  },

  // ── quiXzoom (oz-lt + oz-us) ─────────────────────────────────────────────────
  {
    id: 'obj-qz-1',
    entityId: 'quixzoom',
    cycle: 'Q2-2026',
    title: 'Bevisa product-market fit Sverige',
    description: 'Lansering juni 2026, 500 aktiva zoomers, första kommunkontrakt',
    status: 'at_risk',
    progress: 25,
    owner: 'leon',
    keyResults: [
      { id: 'kr-qz-1-1', title: 'quiXzoom-app live (iOS + Android)', metric: 'app', current: 60, target: 100, unit: '%', currentValue: 'Beta klar', targetValue: 'App Store live', status: 'at_risk', owner: 'johan', lastUpdated: '2026-04-01' },
      { id: 'kr-qz-1-2', title: '500 aktiva zoomers registrerade', metric: 'zoomers', current: 25, target: 100, unit: '%', currentValue: '127 zoomers', targetValue: '500 zoomers', status: 'at_risk', owner: 'leon', lastUpdated: '2026-04-01' },
      { id: 'kr-qz-1-3', title: '3 kommunkontrakt signerade Q2', metric: 'kontrakt', current: 0, target: 100, unit: '%', currentValue: '0 av 3', targetValue: '3 kontrakt', status: 'not_started', owner: 'leon', lastUpdated: '2026-04-01' },
    ],
  },
  {
    id: 'obj-qz-2',
    entityId: 'quixzoom',
    cycle: 'Q3-2026',
    title: 'EU-expansion — Nederländerna pilot',
    description: '2 pilotkontrakt i Amsterdam/Rotterdam via OZ-LT',
    status: 'not_started',
    progress: 0,
    owner: 'leon',
    keyResults: [
      { id: 'kr-qz-2-1', title: 'Amsterdam municipality pilot startat', metric: 'pilot', current: 0, target: 100, unit: '%', currentValue: 'Ej kontaktad', targetValue: 'Signerat', status: 'not_started', owner: 'leon', lastUpdated: '2026-04-01' },
      { id: 'kr-qz-2-2', title: '50 aktiva NL-zoomers', metric: 'zoomers', current: 0, target: 100, unit: '%', currentValue: '0', targetValue: '50', status: 'not_started', owner: 'leon', lastUpdated: '2026-04-01' },
    ],
  },

  // ── LandveX ─────────────────────────────────────────────────────────────────
  {
    id: 'obj-lv-1',
    entityId: 'landvex',
    cycle: 'Q2-2026',
    title: 'LandveX Sverige kommersiell lansering',
    description: 'Bolagets namnbyte klart, bankkonto öppnat, första kund betalande',
    status: 'at_risk',
    progress: 30,
    owner: 'leon',
    keyResults: [
      { id: 'kr-lv-1-1', title: 'Namnbyte LandveX AB klart (Bolagsverket)', metric: 'namnbyte', current: 50, target: 100, unit: '%', currentValue: 'Inskickat', targetValue: 'Registrerat', status: 'on_track', owner: 'dennis', lastUpdated: '2026-04-01' },
      { id: 'kr-lv-1-2', title: 'SEB bankkonto öppnat', metric: 'bankkonto', current: 30, target: 100, unit: '%', currentValue: 'Möte 9 april', targetValue: 'Konto aktivt', status: 'at_risk', owner: 'winston', lastUpdated: '2026-04-01' },
      { id: 'kr-lv-1-3', title: 'Första betalande kommunkund', metric: 'kund', current: 0, target: 100, unit: '%', currentValue: '0 betalande', targetValue: '1 kund', status: 'not_started', owner: 'leon', lastUpdated: '2026-04-01' },
      { id: 'kr-lv-1-4', title: 'Grant Thornton revision uppstart', metric: 'revision', current: 40, target: 100, unit: '%', currentValue: 'Möte 7 april', targetValue: 'Uppdrag signerat', status: 'on_track', owner: 'winston', lastUpdated: '2026-04-01' },
    ],
  },
  {
    id: 'obj-lv-2',
    entityId: 'landvex',
    cycle: 'Q3-2026',
    title: 'LandveX Inc Houston — US market entry',
    description: 'EIN klar, bankkonto öppnat, första Texas-kontrakt',
    status: 'at_risk',
    progress: 20,
    owner: 'dennis',
    keyResults: [
      { id: 'kr-lv-2-1', title: 'EIN klar (via Northwest)', metric: 'ein', current: 60, target: 100, unit: '%', currentValue: 'Pågår', targetValue: 'EIN aktivt', status: 'at_risk', owner: 'winston', lastUpdated: '2026-04-01' },
      { id: 'kr-lv-2-2', title: '83(b) Election inlämnad i tid', metric: '83b', current: 100, target: 100, unit: '%', currentValue: 'Inlämnad', targetValue: 'Inlämnad', status: 'completed', owner: 'dennis', lastUpdated: '2026-03-27' },
      { id: 'kr-lv-2-3', title: 'JPMorgan Chase bankkonto aktivt', metric: 'bankkonto', current: 20, target: 100, unit: '%', currentValue: 'Under ansökan', targetValue: 'Aktivt', status: 'behind', owner: 'winston', lastUpdated: '2026-04-01' },
    ],
  },
]

// Helpers
export function getObjectivesForEntity(entityId: string): Objective[] {
  return OBJECTIVES.filter(o => o.entityId === entityId)
}

export function getOverallProgress(objectives: Objective[]): number {
  if (!objectives.length) return 0
  return Math.round(objectives.reduce((sum, o) => sum + o.progress, 0) / objectives.length)
}

export const STATUS_CONFIG: Record<OKRStatus, { label: string; color: string; bg: string; icon: string }> = {
  on_track:    { label: 'På spår',    color: '#2D7A4F', bg: '#E8F5ED', icon: '🟢' },
  at_risk:     { label: 'Risk',       color: '#B8760A', bg: '#FDF3E0', icon: '🟡' },
  behind:      { label: 'Efter',      color: '#C0392B', bg: '#FDECEA', icon: '🔴' },
  completed:   { label: 'Klar',       color: '#0A3D62', bg: '#EFF6FF', icon: '✅' },
  not_started: { label: 'Ej startad', color: '#8A8278', bg: '#F5F0E8', icon: '⚪' },
}

export const CYCLE_OPTIONS: { id: OKRCycle; label: string }[] = [
  { id: 'Q1-2026', label: 'Q1 2026 (jan-mar)' },
  { id: 'Q2-2026', label: 'Q2 2026 (apr-jun)' },
  { id: 'Q3-2026', label: 'Q3 2026 (jul-sep)' },
  { id: 'Q4-2026', label: 'Q4 2026 (okt-dec)' },
  { id: 'FY-2026', label: 'Helår 2026' },
]

// Suppress unused import warnings
void _CE
void _BG
