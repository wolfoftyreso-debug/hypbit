// Visar teammedlemmarnas senaste aktivitet + roll
// Data hårdkodad för nu (inga live-signaler ännu)

const TEAM = [
  { name: 'Erik', role: 'CEO', emoji: '👑', status: 'active', lastSeen: 'Nu' },
  { name: 'Dennis', role: 'Bolagsdrift', emoji: '⚖️', status: 'active', lastSeen: '2h sedan' },
  { name: 'Leon', role: 'Sälj', emoji: '🎯', status: 'away', lastSeen: '4h sedan' },
  { name: 'Winston', role: 'Tech', emoji: '⚙️', status: 'active', lastSeen: '1h sedan' },
  { name: 'Johan', role: 'Tech', emoji: '💻', status: 'active', lastSeen: '30m sedan' },
]

export function TeamStatusWidget() {
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.06] flex justify-between items-center">
        <p className="text-sm font-medium text-white/70">Team</p>
        <span className="text-xs text-emerald-400">
          {TEAM.filter(m => m.status === 'active').length} aktiva
        </span>
      </div>
      {TEAM.map(member => (
        <div key={member.name} className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm">
              {member.emoji}
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#0A0A1B] ${member.status === 'active' ? 'bg-emerald-400' : 'bg-yellow-400'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">{member.name}</p>
            <p className="text-xs text-white/40">{member.role}</p>
          </div>
          <span className="text-xs text-white/30">{member.lastSeen}</span>
        </div>
      ))}
    </div>
  )
}
