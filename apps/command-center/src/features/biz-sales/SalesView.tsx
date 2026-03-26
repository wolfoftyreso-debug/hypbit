// ─── Sales — Pipeline, Customers, Conversion ───────────────────────────────
// Real pipeline with real SEK values. No gamification.

import { useState } from 'react'

type DealStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost'

interface Deal {
  id: string
  company: string
  contact: string
  value: number
  stage: DealStage
  product: string
  nextAction: string
  closeDate: string
}

const DEALS: Deal[] = [
  { id: 'd1', company: 'Stockholms kommun', contact: 'Anna Lindberg', value: 180_000, stage: 'proposal', product: 'LandveX', nextAction: 'Demo scheduled Apr 2', closeDate: '2026-05' },
  { id: 'd2', company: 'Göteborgs Hamn AB', contact: 'Karl Pettersson', value: 250_000, stage: 'qualified', product: 'LandveX', nextAction: 'Send proposal', closeDate: '2026-06' },
  { id: 'd3', company: 'Fasadgruppen Nordic', contact: 'Maria Ek', value: 45_000, stage: 'negotiation', product: 'QuiXzoom IR', nextAction: 'Pricing discussion', closeDate: '2026-04' },
  { id: 'd4', company: 'CleanWindow AB', contact: 'Jonas Holm', value: 12_000, stage: 'lead', product: 'QuiXzoom IR', nextAction: 'Initial meeting', closeDate: '2026-05' },
  { id: 'd5', company: 'SBB Norden AB', contact: 'Sofia Strand', value: 320_000, stage: 'lead', product: 'LandveX', nextAction: 'Intro call', closeDate: '2026-Q3' },
  { id: 'd6', company: 'Riksbyggen', contact: 'Per Nilsson', value: 95_000, stage: 'closed-won', product: 'LandveX', nextAction: '-', closeDate: '2026-03' },
]

const STAGE_ORDER: DealStage[] = ['lead', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost']
const STAGE_LABEL: Record<DealStage, string> = { lead: 'Lead', qualified: 'Qualified', proposal: 'Proposal', negotiation: 'Negotiation', 'closed-won': 'Won', 'closed-lost': 'Lost' }
const STAGE_COLOR: Record<DealStage, string> = { lead: '#6B7280', qualified: '#4A7A9B', proposal: '#9A7A30', negotiation: '#8B5CF6', 'closed-won': '#4A7A5B', 'closed-lost': '#B04040' }

type TabId = 'pipeline' | 'customers'

export function SalesView() {
  const [tab, setTab] = useState<TabId>('pipeline')

  const pipeline = DEALS.filter(d => d.stage !== 'closed-won' && d.stage !== 'closed-lost')
  const pipelineValue = pipeline.reduce((s, d) => s + d.value, 0)
  const wonValue = DEALS.filter(d => d.stage === 'closed-won').reduce((s, d) => s + d.value, 0)

  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b border-[#1A1C24] px-6 pt-5 pb-0 bg-[#0C0D12]">
        <h1 className="text-[15px] font-semibold text-[#E0E1E4]">Sales</h1>
        <p className="text-[12px] text-[#4A4F5C] mt-0.5 mb-4">Pipeline, customers, conversion</p>
        <div className="flex gap-0 -mb-px">
          {[{ id: 'pipeline' as const, label: 'Pipeline' }, { id: 'customers' as const, label: 'Customers' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="text-[12px] pb-2.5 mr-5 border-b-2 transition-colors"
              style={{ color: tab === t.id ? '#E0E1E4' : '#4A4F5C', borderColor: tab === t.id ? '#4A7A9B' : 'transparent', fontWeight: tab === t.id ? 600 : 400 }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 max-w-5xl">
        {tab === 'pipeline' && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-[#1A1C24] bg-[#0E0F14] px-4 py-3">
                <div className="text-[11px] text-[#4A4F5C]">Pipeline value</div>
                <div className="text-[20px] font-semibold text-[#E0E1E4] font-mono">{pipelineValue.toLocaleString('sv-SE')}</div>
                <div className="text-[11px] text-[#4A4F5C]">{pipeline.length} deals</div>
              </div>
              <div className="rounded-lg border border-[#1A1C24] bg-[#0E0F14] px-4 py-3">
                <div className="text-[11px] text-[#4A4F5C]">Closed (MTD)</div>
                <div className="text-[20px] font-semibold text-[#4A7A5B] font-mono">{wonValue.toLocaleString('sv-SE')}</div>
              </div>
              <div className="rounded-lg border border-[#1A1C24] bg-[#0E0F14] px-4 py-3">
                <div className="text-[11px] text-[#4A4F5C]">Win rate</div>
                <div className="text-[20px] font-semibold text-[#E0E1E4]">
                  {DEALS.length > 0 ? Math.round(DEALS.filter(d => d.stage === 'closed-won').length / DEALS.length * 100) : 0}%
                </div>
              </div>
            </div>

            {/* Stage funnel */}
            <div>
              <h2 className="text-[12px] text-[#4A4F5C] font-medium mb-2">Funnel</h2>
              <div className="flex gap-2">
                {STAGE_ORDER.filter(s => s !== 'closed-lost').map(stage => {
                  const deals = DEALS.filter(d => d.stage === stage)
                  const value = deals.reduce((s, d) => s + d.value, 0)
                  return (
                    <div key={stage} className="flex-1 rounded-lg border border-[#1A1C24] bg-[#0E0F14] px-3 py-2 text-center">
                      <div className="text-[10px] font-medium" style={{ color: STAGE_COLOR[stage] }}>{STAGE_LABEL[stage]}</div>
                      <div className="text-[16px] font-semibold text-[#E0E1E4] font-mono">{deals.length}</div>
                      <div className="text-[10px] text-[#3D4452] font-mono">{value > 0 ? `${(value / 1000).toFixed(0)}k` : '-'}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Deal list */}
            <div>
              <h2 className="text-[12px] text-[#4A4F5C] font-medium mb-2">All deals</h2>
              <div className="space-y-1.5">
                {DEALS.map(deal => (
                  <div key={deal.id} className="flex items-center gap-3 rounded-lg border border-[#1A1C24] bg-[#0E0F14] px-4 py-3">
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono" style={{ background: STAGE_COLOR[deal.stage] + '20', color: STAGE_COLOR[deal.stage] }}>
                      {STAGE_LABEL[deal.stage]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-[#E0E1E4]">{deal.company}</div>
                      <div className="text-[11px] text-[#3D4452]">{deal.product} — {deal.nextAction}</div>
                    </div>
                    <span className="text-[13px] font-mono text-[#E0E1E4]">{deal.value.toLocaleString('sv-SE')}</span>
                    <span className="text-[11px] text-[#3D4452] font-mono">{deal.closeDate}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'customers' && (
          <div className="space-y-1.5">
            {DEALS.filter(d => d.stage === 'closed-won').map(deal => (
              <div key={deal.id} className="rounded-lg border border-[#1A1C24] bg-[#0E0F14] px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[13px] text-[#E0E1E4]">{deal.company}</div>
                    <div className="text-[11px] text-[#3D4452]">{deal.contact} — {deal.product}</div>
                  </div>
                  <div className="text-[14px] font-mono text-[#4A7A5B]">{deal.value.toLocaleString('sv-SE')} SEK</div>
                </div>
              </div>
            ))}
            {DEALS.filter(d => d.stage === 'closed-won').length === 0 && (
              <div className="text-[13px] text-[#3D4452] py-8 text-center">No customers yet. Close your first deal.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
