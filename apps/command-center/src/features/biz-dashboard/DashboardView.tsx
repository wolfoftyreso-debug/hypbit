// ─── CEO Dashboard — Revenue, Cash, Pipeline, Capacity, Issues ──────────────
// Five numbers. Three issues. Nothing else.

import { useNavigate } from 'react-router-dom'

export function DashboardView() {
  const navigate = useNavigate()

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl">
        <h1 className="text-[15px] font-semibold text-[#E0E1E4] mb-5">Dashboard</h1>

        {/* KPIs — five numbers */}
        <div className="grid grid-cols-5 gap-3 mb-8">
          <KPI label="Revenue MTD" value="67 400" unit="SEK" trend="+15.8%" trendUp onClick={() => navigate('/finance')} />
          <KPI label="Cash position" value="252 770" unit="SEK" onClick={() => navigate('/finance')} />
          <KPI label="Pipeline" value="807 000" unit="SEK" sub="5 deals" onClick={() => navigate('/sales')} />
          <KPI label="Burn rate" value="52 100" unit="SEK/mo" onClick={() => navigate('/finance')} />
          <KPI label="Runway" value="4.9" unit="months" onClick={() => navigate('/finance')} />
        </div>

        {/* Active issues — max 3 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] font-medium text-[#6B7280]">Issues requiring attention</h2>
            <button onClick={() => navigate('/operations')} className="text-[11px] text-[#4A7A9B] hover:text-[#6B9FBF] transition-colors">
              All issues
            </button>
          </div>
          <div className="space-y-2">
            <IssueRow
              problem="No revenue from US market"
              impact="0 SEK inflow"
              owner="Erik"
              next="Complete EIN + bank setup"
              deadline="Apr 30"
            />
            <IssueRow
              problem="No GTM launched for LandveX"
              impact="Zero paying customers"
              owner="Erik"
              next="Launch beta to 3 municipalities"
              deadline="Apr 15"
            />
            <IssueRow
              problem="Transfer pricing docs missing"
              impact="Royalty structure at risk"
              owner="Dennis"
              next="Engage TP advisor"
              deadline="Q3"
            />
          </div>
        </div>

        {/* Active work — top 5 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] font-medium text-[#6B7280]">Active work</h2>
            <button onClick={() => navigate('/operations')} className="text-[11px] text-[#4A7A9B] hover:text-[#6B9FBF] transition-colors">
              All work
            </button>
          </div>
          <div className="space-y-1">
            <WorkRow title="LandveX beta launch — SE market" owner="Erik" deadline="Apr 15" status="active" />
            <WorkRow title="QuiXzoom MVP — image pipeline" owner="Johan" deadline="May 1" status="active" />
            <WorkRow title="Dubai FZCO registration" owner="Dennis" deadline="Jun 1" status="active" />
            <WorkRow title="Stripe US entity setup" owner="Winston" deadline="Apr 30" status="blocked" />
            <WorkRow title="Fortnox integration" owner="Johan" deadline="May 15" status="queued" />
          </div>
        </div>

        {/* Team capacity */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] font-medium text-[#6B7280]">Team capacity</h2>
            <button onClick={() => navigate('/people')} className="text-[11px] text-[#4A7A9B] hover:text-[#6B9FBF] transition-colors">
              People
            </button>
          </div>
          <div className="flex gap-3">
            <CapacityBar name="Erik" pct={95} />
            <CapacityBar name="Johan" pct={85} />
            <CapacityBar name="Leon" pct={70} />
            <CapacityBar name="Winston" pct={60} />
            <CapacityBar name="Dennis" pct={50} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Components ─────────────────────────────────────────────────────────────

function KPI({ label, value, unit, sub, trend, trendUp, onClick }: {
  label: string; value: string; unit: string; sub?: string; trend?: string; trendUp?: boolean; onClick?: () => void
}) {
  return (
    <button onClick={onClick} className="rounded-lg border border-[#1A1C24] bg-[#0E0F14] px-4 py-3 text-left hover:border-[#252830] transition-colors">
      <div className="text-[11px] text-[#4A4F5C]">{label}</div>
      <div className="text-[18px] font-semibold text-[#E0E1E4] font-mono mt-0.5">{value}</div>
      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-[10px] text-[#4A4F5C]">{unit}</span>
        {trend && <span className="text-[10px]" style={{ color: trendUp ? '#4A7A5B' : '#B04040' }}>{trend}</span>}
        {sub && <span className="text-[10px] text-[#3D4452]">{sub}</span>}
      </div>
    </button>
  )
}

function IssueRow({ problem, impact, owner, next, deadline }: {
  problem: string; impact: string; owner: string; next: string; deadline: string
}) {
  return (
    <div className="rounded-lg border border-[#1A1C24] bg-[#0E0F14] px-4 py-3">
      <div className="text-[13px] text-[#E0E1E4] font-medium">{problem}</div>
      <div className="grid grid-cols-4 gap-3 mt-1.5 text-[12px]">
        <div><span className="text-[#3D4452]">Impact: </span><span className="text-[#9CA3AF]">{impact}</span></div>
        <div><span className="text-[#3D4452]">Owner: </span><span className="text-[#9CA3AF]">{owner}</span></div>
        <div><span className="text-[#3D4452]">Next: </span><span className="text-[#9CA3AF]">{next}</span></div>
        <div><span className="text-[#3D4452]">Deadline: </span><span className="text-[#9CA3AF] font-mono">{deadline}</span></div>
      </div>
    </div>
  )
}

function WorkRow({ title, owner, deadline, status }: { title: string; owner: string; deadline: string; status: string }) {
  const color = status === 'active' ? '#4A7A5B' : status === 'blocked' ? '#B04040' : '#6B7280'
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#1A1C24] bg-[#0E0F14] px-4 py-2.5">
      <span className="text-[10px] px-2 py-0.5 rounded font-mono" style={{ background: color + '20', color }}>{status}</span>
      <span className="text-[13px] text-[#E0E1E4] flex-1">{title}</span>
      <span className="text-[12px] text-[#6B7280]">{owner}</span>
      <span className="text-[11px] text-[#3D4452] font-mono">{deadline}</span>
    </div>
  )
}

function CapacityBar({ name, pct }: { name: string; pct: number }) {
  const color = pct > 85 ? '#B04040' : pct > 60 ? '#9A7A30' : '#4A7A5B'
  return (
    <div className="flex-1 rounded-lg border border-[#1A1C24] bg-[#0E0F14] px-3 py-2 text-center">
      <div className="text-[11px] text-[#6B7280]">{name}</div>
      <div className="h-1.5 rounded-full bg-[#1A1C24] overflow-hidden mt-1.5">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="text-[10px] font-mono mt-1" style={{ color }}>{pct}%</div>
    </div>
  )
}
