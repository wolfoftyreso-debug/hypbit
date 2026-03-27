type Status = 'aktiv' | 'ledig' | 'offline'

interface Member {
  id: string
  name: string
  role: string
  email: string
  phone: string
  status: Status
  initials: string
  timezone: string
  location: string
}

const STATUS_STYLE: Record<Status, { dot: string; label: string; text: string }> = {
  aktiv:   { dot: 'bg-success', label: 'Aktiv',   text: 'text-green-400' },
  ledig:   { dot: 'bg-warning', label: 'Ledig',   text: 'text-yellow-400' },
  offline: { dot: 'bg-white/20', label: 'Offline', text: 'text-text-muted' },
}

const TEAM: Member[] = [
  {
    id: 'erik',
    name: 'Erik Svensson',
    role: 'Chairman & Group CEO',
    email: 'erik@hypbit.com',
    phone: '+46709123223',
    status: 'aktiv',
    initials: 'ES',
    timezone: 'Europe/Stockholm (GMT+2)',
    location: 'Stockholm, Sverige',
  },
  {
    id: 'leon',
    name: 'Leon Russo De Cerame',
    role: 'CEO Wavult Operations',
    email: 'leon@hypbit.com',
    phone: '+46738968949',
    status: 'aktiv',
    initials: 'LR',
    timezone: 'Europe/Stockholm (GMT+2)',
    location: 'Stockholm, Sverige',
  },
  {
    id: 'winston',
    name: 'Winston Bjarnemark',
    role: 'CFO',
    email: 'winston@hypbit.com',
    phone: '0768123548',
    status: 'ledig',
    initials: 'WB',
    timezone: 'Europe/Stockholm (GMT+2)',
    location: 'Stockholm, Sverige',
  },
  {
    id: 'dennis',
    name: 'Dennis Bjarnemark',
    role: 'Chief Legal & Operations',
    email: 'dennis@hypbit.com',
    phone: '0761474243',
    status: 'aktiv',
    initials: 'DB',
    timezone: 'Europe/Stockholm (GMT+2)',
    location: 'Stockholm, Sverige',
  },
  {
    id: 'johan',
    name: 'Johan Berglund',
    role: 'Group CTO',
    email: 'johan@hypbit.com',
    phone: '+46736977576',
    status: 'offline',
    initials: 'JB',
    timezone: 'Europe/Stockholm (GMT+2)',
    location: 'Stockholm, Sverige',
  },
]

const ACCENT_COLORS = [
  'from-accent to-purple-800',
  'from-info to-blue-800',
  'from-success to-emerald-800',
  'from-warning to-amber-800',
  'from-danger to-red-800',
]

export default function TeamScreen() {
  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <p className="text-xs text-text-secondary uppercase tracking-widest mb-1">Team</p>
        <h1 className="text-2xl font-bold text-text-primary">Wavult Group</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          {TEAM.filter(m => m.status === 'aktiv').length} av {TEAM.length} aktiva nu
        </p>
      </div>

      {/* Team cards */}
      <div className="px-5 flex flex-col gap-3">
        {TEAM.map((member, i) => {
          const st = STATUS_STYLE[member.status]
          return (
            <div
              key={member.id}
              className="bg-card border border-white/[0.07] rounded-2xl overflow-hidden"
            >
              {/* Card header */}
              <div className={`bg-gradient-to-r ${ACCENT_COLORS[i % ACCENT_COLORS.length]} p-4 flex items-center gap-4 opacity-90`}>
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {member.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-base leading-tight">{member.name}</p>
                  <p className="text-white/70 text-xs mt-0.5">{member.role}</p>
                </div>
                {/* Status badge */}
                <div className={`flex items-center gap-1.5 bg-black/30 px-3 py-1 rounded-full flex-shrink-0`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                  <span className={`text-[11px] font-semibold text-white/80`}>{st.label}</span>
                </div>
              </div>

              {/* Card body */}
              <div className="p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-text-muted w-4">✉</span>
                  <a href={`mailto:${member.email}`} className="text-accent text-sm">{member.email}</a>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-text-muted w-4">☎</span>
                  <a href={`tel:${member.phone}`} className="text-text-secondary text-sm">{member.phone}</a>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-text-muted w-4">📍</span>
                  <span className="text-text-secondary text-sm">{member.location}</span>
                </div>

                {/* Message button */}
                <button className="mt-2 w-full h-10 border border-white/[0.1] hover:border-accent/40 rounded-xl text-xs text-text-secondary hover:text-text-primary font-medium transition-all active:scale-[0.98]">
                  Skicka meddelande
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Thailand countdown for team */}
      <div className="mx-5 mt-5 bg-card border border-white/[0.07] rounded-2xl p-4 text-center">
        <p className="text-xs text-text-muted mb-1">Nästa gång vi ses</p>
        <p className="text-accent font-bold">Thailand Workcamp · 11 april 2026 🇹🇭</p>
      </div>
    </div>
  )
}
