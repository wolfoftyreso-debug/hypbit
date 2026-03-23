const PROJECTS = [
  { name: 'quiXzoom', phase: 'MVP', progress: 72, color: '#2563EB', icon: '📍' },
  { name: 'Optic Insights', phase: 'Planning', progress: 35, color: '#7C3AED', icon: '🔭' },
  { name: 'Infrastructure', phase: 'Setup', progress: 85, color: '#059669', icon: '⚙️' },
  { name: 'Thailand Prep', phase: '19 dagar', progress: 60, color: '#D97706', icon: '🇹🇭' },
]

export function ProjectProgressWidget() {
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <p className="text-sm font-medium text-white/70">Projekt</p>
      </div>
      <div className="p-4 space-y-4">
        {PROJECTS.map(p => (
          <div key={p.name}>
            <div className="flex justify-between items-center mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-base">{p.icon}</span>
                <span className="text-sm font-medium text-white">{p.name}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-white/40">{p.phase}</span>
                <span className="text-xs text-white/60 ml-2">{p.progress}%</span>
              </div>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${p.progress}%`, backgroundColor: p.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
