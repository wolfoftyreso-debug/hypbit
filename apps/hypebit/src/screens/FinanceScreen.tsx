interface KPIProps {
  label: string
  value: string
  sub?: string
  trend?: string
  up?: boolean
  color?: string
}

function KPICard({ label, value, sub, trend, up, color = 'text-text-primary' }: KPIProps) {
  return (
    <div className="bg-card border border-white/[0.07] rounded-2xl p-4">
      <p className="text-xs text-text-secondary uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-2xl font-bold ${color} leading-none mb-1`}>{value}</p>
      <div className="flex items-center gap-2">
        {trend && (
          <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
            up ? 'bg-success/10 text-green-300' : 'bg-danger/10 text-red-300'
          }`}>
            {up ? '↑' : '↓'} {trend}
          </span>
        )}
        {sub && <span className="text-[11px] text-text-muted">{sub}</span>}
      </div>
    </div>
  )
}

const COMPANIES = [
  { name: 'Hypbit AB',           revenue: '84 000 SEK',  color: 'bg-accent',    pct: 46 },
  { name: 'QuixZoom LLC (USA)',   revenue: '52 000 SEK',  color: 'bg-info',      pct: 28 },
  { name: 'Optical Insight UAB',  revenue: '36 000 SEK',  color: 'bg-success',   pct: 20 },
  { name: 'Holding Dubai',        revenue: '12 000 SEK',  color: 'bg-warning',   pct: 6 },
]

const TRANSACTIONS = [
  { date: '26 mar', desc: 'Abonnemangsintäkt — TechCorp',     amount: '+18 400 SEK', type: 'in' },
  { date: '25 mar', desc: 'AWS ECS — prod cluster',           amount: '-4 200 SEK',  type: 'out' },
  { date: '24 mar', desc: 'Lön — Erik Svensson',              amount: '-35 000 SEK', type: 'out' },
  { date: '22 mar', desc: 'Abonnemangsintäkt — StartupX',     amount: '+12 900 SEK', type: 'in' },
  { date: '20 mar', desc: 'Loopia — hosting & e-post',        amount: '-890 SEK',    type: 'out' },
]

export default function FinanceScreen() {
  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <p className="text-xs text-text-secondary uppercase tracking-widest mb-1">Finans</p>
        <h1 className="text-2xl font-bold text-text-primary">Ekonomi</h1>
      </div>

      {/* KPI grid */}
      <div className="px-5 mb-5 grid grid-cols-2 gap-3">
        <KPICard label="Månads-revenue"   value="184 KSEK" trend="12.4%" up  sub="vs feb"  color="text-success" />
        <KPICard label="Kassabehållning"  value="1.24 MSEK" sub="3 bolag" color="text-text-primary" />
        <KPICard label="Burn rate"        value="94 KSEK"  sub="/mån"    trend="3%" up={false} color="text-warning" />
        <KPICard label="Runway"           value="13 mån"   sub="vid nuv. burn" color="text-info" />
      </div>

      {/* Revenue per bolag */}
      <div className="px-5 mb-5">
        <p className="text-xs text-text-secondary uppercase tracking-widest mb-3">Omsättning per bolag</p>
        <div className="bg-card border border-white/[0.07] rounded-2xl p-4 flex flex-col gap-4">
          {COMPANIES.map(c => (
            <div key={c.name}>
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-sm text-text-primary">{c.name}</span>
                <span className="text-sm font-bold text-text-primary font-mono">{c.revenue}</span>
              </div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className={`h-full ${c.color} rounded-full transition-all`}
                  style={{ width: `${c.pct}%` }}
                />
              </div>
              <p className="text-[11px] text-text-muted mt-1">{c.pct}% av total</p>
            </div>
          ))}
        </div>
      </div>

      {/* Senaste transaktioner */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-text-secondary uppercase tracking-widest">Senaste transaktioner</p>
          <a
            href="https://hypbit.com/finance"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent underline"
          >
            Se mer →
          </a>
        </div>

        <div className="bg-card border border-white/[0.07] rounded-2xl divide-y divide-white/[0.05]">
          {TRANSACTIONS.map((tx, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                tx.type === 'in' ? 'bg-success/15 text-green-400' : 'bg-danger/10 text-red-400'
              }`}>
                {tx.type === 'in' ? '↓' : '↑'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary truncate">{tx.desc}</p>
                <p className="text-[11px] text-text-muted font-mono">{tx.date}</p>
              </div>
              <span className={`text-sm font-bold font-mono flex-shrink-0 ${
                tx.type === 'in' ? 'text-success' : 'text-text-secondary'
              }`}>
                {tx.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
