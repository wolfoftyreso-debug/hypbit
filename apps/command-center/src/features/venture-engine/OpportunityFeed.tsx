// ─── Panel A: Opportunity Feed ────────────────────────────────────────────────

import { useState, forwardRef, useImperativeHandle } from 'react'
import {
  TrendingUp, CheckCircle2, AlertCircle, Loader2,
  Building2, Truck, Heart, GraduationCap, DollarSign,
} from 'lucide-react'
import { useOpportunities, useValidateOpportunity } from './useVentureEngine'
import type { Industry, Opportunity } from './types'

const INDUSTRY_TABS: { value: Industry | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Government', label: 'Government' },
  { value: 'Logistics', label: 'Logistics' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Education', label: 'Education' },
]

const INDUSTRY_COLORS: Record<Industry, { bg: string; text: string; dot: string }> = {
  Healthcare:  { bg: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-400' },
  Government:  { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-400' },
  Logistics:   { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-400' },
  Finance:     { bg: 'bg-green-50', text: 'text-green-600', dot: 'bg-green-400' },
  Education:   { bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-400' },
}

const COMPLEXITY_COLORS = (score: number) =>
  score <= 3 ? 'bg-green-50 text-green-700' :
  score <= 6 ? 'bg-amber-50 text-amber-700' :
               'bg-red-50 text-red-700'

function industryIcon(industry: Industry) {
  const cls = 'w-3.5 h-3.5'
  switch (industry) {
    case 'Healthcare':  return <Heart className={cls} />
    case 'Government':  return <Building2 className={cls} />
    case 'Logistics':   return <Truck className={cls} />
    case 'Finance':     return <DollarSign className={cls} />
    case 'Education':   return <GraduationCap className={cls} />
  }
}

function ImpactSegmentBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2.5 rounded-sm transition-colors ${
              i < score
                ? score >= 8 ? 'bg-green-500' : score >= 6 ? 'bg-amber-500' : 'bg-gray-400'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <span className="text-xs font-semibold text-[#8A8A9A] tabular-nums">{score}/10</span>
    </div>
  )
}

interface Props {
  onCreateVenture: (opp: Opportunity) => void
}

export const OpportunityFeed = forwardRef<{ reload: () => void }, Props>(
  function OpportunityFeed({ onCreateVenture }, ref) {
    const [filterIndustry, setFilterIndustry] = useState<Industry | ''>('')

    const { opportunities, loading, error, reload } = useOpportunities(
      filterIndustry || undefined,
      undefined,
    )
    const { validate, loading: validating } = useValidateOpportunity()

    useImperativeHandle(ref, () => ({ reload }))

    async function handleValidate(id: string) {
      await validate(id)
      reload()
    }

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-[#0A3D62]">Opportunity Feed</h2>
          <p className="text-xs text-[#8A8A9A] mt-0.5">Ranked by impact — highest friction, highest priority</p>
        </div>

        {/* Industry filter tabs */}
        <div className="flex items-center gap-1 mb-3 flex-wrap">
          {INDUSTRY_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilterIndustry(tab.value as Industry | '')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                filterIndustry === tab.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#EDE8DC] text-[#8A8A9A] hover:text-[#6B7280] hover:bg-[#EDE8DC]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[#8A8A9A]">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span className="text-sm">Scanning for inefficiencies...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {opportunities.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 gap-2">
                <span className="text-2xl">🔍</span>
                <p className="text-sm text-[#8A8A9A] text-center">Scanning for inefficiencies...</p>
                <p className="text-xs text-[#8A8A9A] text-center">No opportunities match the current filter.</p>
              </div>
            )}
            {opportunities.map(opp => {
              const ic = INDUSTRY_COLORS[opp.industry]
              const costEur = opp.cost_saving_potential ?? 0
              const costLabel = costEur >= 1_000_000
                ? `€${(costEur / 1_000_000).toFixed(1)}M`
                : `€${(costEur / 1_000).toFixed(0)}k`

              return (
                <div
                  key={opp.id}
                  className="border border-[#DDD5C5] rounded-xl p-3 bg-white hover:border-[#C8BCA8] hover:bg-[#F5F0E8] transition-all"
                >
                  {/* Industry badge + status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${ic.bg} ${ic.text}`}>
                      {industryIcon(opp.industry)}
                      {opp.industry}
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium capitalize ${
                      opp.status === 'detected'   ? 'bg-[#EDE8DC] text-[#6B7280]' :
                      opp.status === 'validated'  ? 'bg-blue-50 text-blue-700' :
                      opp.status === 'building'   ? 'bg-amber-50 text-amber-700' :
                      opp.status === 'invested'   ? 'bg-purple-50 text-purple-700' :
                                                    'bg-green-50 text-green-700'
                    }`}>
                      {opp.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-[#0A3D62] mb-1">{opp.title}</h3>
                  <p className="text-xs text-[#8A8A9A] leading-relaxed mb-2 line-clamp-2">
                    {opp.inefficiency_description}
                  </p>

                  {/* Impact bar + complexity */}
                  <div className="space-y-1.5 mb-2">
                    <div>
                      <p className="text-xs text-[#8A8A9A] mb-1">Impact score</p>
                      <ImpactSegmentBar score={opp.impact_score} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${COMPLEXITY_COLORS(opp.complexity_score)}`}>
                        Complexity {opp.complexity_score}/10
                      </span>
                    </div>
                  </div>

                  {/* Cost saving + actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-green-400 font-medium">
                      <TrendingUp className="w-3 h-3" />
                      {costLabel} potential savings
                    </div>
                    <div className="flex items-center gap-1.5">
                      {opp.status === 'detected' && (
                        <button
                          onClick={() => void handleValidate(opp.id)}
                          disabled={validating}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-300 bg-blue-900/50 border border-blue-700 rounded-lg hover:bg-blue-900 disabled:opacity-50 transition-colors"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Validate
                        </button>
                      )}
                      {(opp.status === 'validated' || opp.status === 'building') && (
                        <button
                          onClick={() => onCreateVenture(opp)}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Create Venture →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }
)
