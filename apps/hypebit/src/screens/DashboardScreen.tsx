import { useNavigate } from 'react-router-dom'
import { getGreeting, getDaysToThailand, WavultUser } from '../auth'

interface Props {
  user: WavultUser
}

// ─── Demo KPI data ────────────────────────────────────────────────────────────

const KPI_DATA = [
  { label: 'Pipeline-värde',   value: '2.4 MSEK', sub: '+18% MoM',  color: 'text-accent',  bg: 'bg-accent-dim' },
  { label: 'Månads-revenue',   value: '184 KSEK', sub: '+12% MoM',  color: 'text-success', bg: 'bg-success/10' },
  { label: 'Aktiva tasks',     value: '23',       sub: '8 idag',    color: 'text-warning', bg: 'bg-warning/10' },
  { label: 'Thailand om',      value: '--',       sub: 'dagar kvar', color: 'text-info',   bg: 'bg-info/10', isMDays: true },
]

const ACTIVITY = [
  { time: '5 min sedan',  icon: '🤝', text: 'Erik stängde deal med Infragruppen AB' },
  { time: '1h sedan',     icon: '✅', text: 'Leon markerade QuixZoom-brief som klar' },
  { time: '3h sedan',     icon: '💬', text: 'Dennis lade till notering på Optisk Insight-avtal' },
]

export default function DashboardScreen({ user }: Props) {
  const navigate = useNavigate()
  const greeting = getGreeting(user.name)
  const daysLeft = getDaysToThailand()

  const kpis = KPI_DATA.map(k =>
    k.isMDays ? { ...k, value: String(daysLeft) } : k
  )

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <p className="text-xs text-text-secondary uppercase tracking-widest mb-1">Wavult OS</p>
        <h1 className="text-2xl font-bold text-text-primary">{greeting}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{user.role}</p>
      </div>

      {/* Thailand countdown banner */}
      <div className="mx-5 mb-5 bg-accent-dim border border-accent/25 rounded-2xl p-4 flex items-center gap-4">
        <div className="text-3xl">🇹🇭</div>
        <div className="flex-1">
          <p className="text-xs text-accent uppercase tracking-wider font-semibold">Thailand Workcamp</p>
          <p className="text-2xl font-bold text-text-primary leading-tight">{daysLeft} dagar kvar</p>
          <p className="text-xs text-text-secondary">11 april 2026 · Bangkok</p>
        </div>
      </div>

      {/* KPI cards — horizontal scroll */}
      <div className="px-5 mb-5">
        <p className="text-xs text-text-secondary uppercase tracking-widest mb-3">Nyckeltal</p>
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
          {kpis.map(k => (
            <div key={k.label}
                 className={`flex-shrink-0 w-36 ${k.bg} border border-white/[0.06] rounded-2xl p-4`}>
              <p className="text-xs text-text-secondary mb-2 leading-tight">{k.label}</p>
              <p className={`text-2xl font-bold ${k.color} leading-none mb-1`}>{k.value}</p>
              <p className="text-[11px] text-text-muted">{k.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="px-5 mb-5">
        <p className="text-xs text-text-secondary uppercase tracking-widest mb-3">Senaste aktivitet</p>
        <div className="bg-card rounded-2xl border border-white/[0.07] divide-y divide-white/[0.05]">
          {ACTIVITY.map((a, i) => (
            <div key={i} className="flex items-start gap-3 p-4">
              <span className="text-xl mt-0.5">{a.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary leading-snug">{a.text}</p>
                <p className="text-xs text-text-muted mt-0.5 font-mono">{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-5">
        <p className="text-xs text-text-secondary uppercase tracking-widest mb-3">Snabbåtgärder</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '+ Task',    icon: '✓', action: () => navigate('/tasks') },
            { label: '+ Deal',    icon: '◉', action: () => navigate('/crm') },
            { label: '+ Notering', icon: '✏', action: () => navigate('/crm') },
          ].map(btn => (
            <button
              key={btn.label}
              onClick={btn.action}
              className="bg-card border border-white/[0.07] rounded-2xl p-4 flex flex-col items-center gap-2 active:bg-card2 transition-colors min-h-[80px]"
            >
              <span className="text-xl text-accent font-mono">{btn.icon}</span>
              <span className="text-xs text-text-secondary font-medium">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
