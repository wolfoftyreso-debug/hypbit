// Flow Engine — Explicit money, data and user flows
// No implicit relations. All flows declared here.

export type FlowType = 'data' | 'money' | 'user' | 'tech' | 'ownership'
export type FlowStatus = 'active' | 'planned' | 'building'

export interface Flow {
  id: string
  name: string
  type: FlowType
  from: string       // entity id or actor
  to: string         // entity id or actor
  description: string
  steps: string[]
  status: FlowStatus
  value?: string     // e.g. "4 900–49 000 SEK/mån"
}

export const FLOWS: Flow[] = [
  // ─── DATA GENERATION ──────────────────────────────────────────────────────
  {
    id: 'flow-data-001',
    name: 'Data Generation — Zoomer → System',
    type: 'data',
    from: 'zoomer',
    to: 'quixzoom-uab',
    description: 'Zoomers execute geo-tagged photo assignments. Data enters the Quixzoom platform.',
    steps: [
      'Assignment created in Quixzoom platform',
      'Zoomer accepts and executes photo assignment',
      'Geo-tagged media uploaded to S3 (eu-north-1)',
      'Data validated and stored in Quixzoom database',
      'Data available to Landvex and Quixzoom Ads',
    ],
    status: 'building',
  },
  // ─── LANDVEX REVENUE ──────────────────────────────────────────────────────
  {
    id: 'flow-money-001',
    name: 'Landvex Revenue — Customer → FinanceCo',
    type: 'money',
    from: 'landvex-customer',
    to: 'finance-co',
    description: 'Municipality or infrastructure owner pays for Landvex subscription. All payments routed through FinanceCo.',
    steps: [
      'Customer uses Landvex portal',
      'Optical insight data analysed, alerts generated',
      'Customer pays subscription to FinanceCo',
      'FinanceCo distributes: revenue share to Landvex AB/Inc, tech fee to DevOps, profit to Wavult Group',
    ],
    status: 'planned',
    value: '4 900–49 000 SEK/mån',
  },
  // ─── QUIXZOOM ADS ─────────────────────────────────────────────────────────
  {
    id: 'flow-money-002',
    name: 'Quixzoom Ads Revenue — Buyer → FinanceCo',
    type: 'money',
    from: 'ads-buyer',
    to: 'finance-co',
    description: 'Business buys a lead/data package from Quixzoom Ads. FinanceCo receives and distributes.',
    steps: [
      'Data package created from Quixzoom data',
      'Package listed in Quixzoom Ads marketplace',
      'Business purchases lead package',
      'Payment received by FinanceCo',
      'Revenue distributed: Quixzoom, DevOps, Wavult Group',
    ],
    status: 'planned',
  },
  // ─── ZOOMER PAYOUTS ───────────────────────────────────────────────────────
  {
    id: 'flow-money-003',
    name: 'Zoomer Payouts — FinanceCo → Zoomer',
    type: 'money',
    from: 'finance-co',
    to: 'zoomer',
    description: 'Upon verified assignment completion, FinanceCo initiates payout to Zoomer.',
    steps: [
      'Zoomer completes assignment',
      'Assignment verified by automated validation',
      'Payment trigger sent to FinanceCo',
      'FinanceCo initiates payout (Swish/SEPA/Wise)',
      'Zoomer receives 75% of assignment value',
    ],
    status: 'building',
    value: '25–500 SEK per uppdrag (75% till zoomer)',
  },
  // ─── INTERNAL BILLING ─────────────────────────────────────────────────────
  {
    id: 'flow-money-004',
    name: 'Internal Billing — DevOps → All',
    type: 'money',
    from: 'devops-co',
    to: 'all-entities',
    description: "DevOps bills all operating entities for tech services. Arm's length pricing per OECD.",
    steps: [
      'DevOps provides platform, infrastructure, AI to all entities',
      'Monthly invoice issued to each entity',
      'Entities pay via FinanceCo internal settlement',
    ],
    status: 'planned',
    value: '8–15% of revenue per entity',
  },
  // ─── OWNERSHIP / IP ───────────────────────────────────────────────────────
  {
    id: 'flow-ownership-001',
    name: 'IP Licensing — Wavult Group → All',
    type: 'ownership',
    from: 'wavult-group',
    to: 'all-entities',
    description: 'Wavult Group holds all IP. Subsidiaries pay royalty for IP usage.',
    steps: [
      'Wavult Group owns all trademarks, code, domains',
      'IP license agreement signed with each subsidiary',
      'Royalty: 5–15% of revenue paid to Wavult Group',
    ],
    status: 'planned',
    value: '5–15% royalty per entity',
  },
]

export function getFlowsByEntity(entityId: string): Flow[] {
  return FLOWS.filter(f => f.from === entityId || f.to === entityId)
}

export function getFlowsByType(type: FlowType): Flow[] {
  return FLOWS.filter(f => f.type === type)
}
