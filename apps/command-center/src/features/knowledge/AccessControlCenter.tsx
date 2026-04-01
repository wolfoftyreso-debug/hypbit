import { useState, useEffect, useMemo } from 'react'
import { SYSTEM_REGISTRY, type SystemCategory, type AccessStatus, type SystemEntry, type SystemAction } from './systemRegistry'

const CATEGORIES: SystemCategory[] = ["Core", "Dev", "Finance", "Legal", "Ops", "Comms"]
const STATUSES: AccessStatus[] = ["ACTIVE", "MISSING", "PENDING", "RESTRICTED"]

function handleAction(entry: SystemEntry, action: SystemAction) {
  if (entry.kafkaEvent) {
    console.log("[kafka]", {
      event: entry.kafkaEvent,
      system_id: entry.id,
      timestamp: new Date().toISOString(),
    })
  }
  if (action.action === "open") {
    const url = action.url ?? entry.url
    if (url) {
      if (url.startsWith("/")) {
        window.location.href = url
      } else {
        window.open(url, "_blank", "noopener,noreferrer")
      }
    }
  }
}

function StatusDot({ status }: { status: AccessStatus }) {
  const classes: Record<AccessStatus, string> = {
    ACTIVE: "bg-green-500",
    MISSING: "bg-red-500",
    PENDING: "bg-yellow-500 animate-pulse",
    RESTRICTED: "bg-orange-500",
  }
  return <div className={`absolute top-3 right-3 h-2 w-2 rounded-full ${classes[status]}`} />
}

function StatusBadge({ status }: { status: AccessStatus }) {
  const styles: Record<AccessStatus, string> = {
    ACTIVE: "bg-green-500/10 text-green-400 border-green-500/20",
    MISSING: "bg-red-500/10 text-red-400 border-red-500/20",
    PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    RESTRICTED: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  }
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${styles[status]}`}>
      {status}
    </span>
  )
}

function SystemCard({ entry }: { entry: SystemEntry }) {
  const cardClass =
    entry.status === "ACTIVE"
      ? "bg-gray-900 border-gray-700 hover:border-gray-500"
      : entry.status === "MISSING"
      ? "bg-red-950/30 border-red-800/50 hover:border-red-600"
      : entry.status === "RESTRICTED"
      ? "bg-orange-950/20 border-orange-800/40 hover:border-orange-600"
      : "bg-yellow-950/20 border-yellow-800/40 hover:border-yellow-600"

  return (
    <div className={`relative p-4 rounded-xl border transition-all ${cardClass}`}>
      <StatusDot status={entry.status} />

      <div className="text-2xl mb-2">{entry.icon}</div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
          {entry.category}
        </span>
        {entry.isInternal && (
          <span className="text-[10px] font-mono text-blue-500/70">INTERNAL</span>
        )}
      </div>
      <div className="font-semibold text-white mb-1 pr-4">{entry.name}</div>
      <div className="text-xs text-gray-400 mb-3 line-clamp-2 leading-relaxed">
        {entry.description}
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        {entry.actions.map((action, i) => (
          <button
            key={i}
            onClick={() => handleAction(entry, action)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              action.variant === "primary"
                ? "bg-blue-600 hover:bg-blue-500 text-white"
                : action.variant === "danger"
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-gray-700 hover:bg-gray-600 text-gray-200"
            }`}
          >
            {action.label}
          </button>
        ))}
        <StatusBadge status={entry.status} />
      </div>
    </div>
  )
}

export function AccessControlCenter() {
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<SystemCategory | "Alla">("Alla")
  const [statusFilter, setStatusFilter] = useState<AccessStatus | "Alla">("Alla")

  // CMD+K focus
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        const input = document.getElementById("system-search")
        if (input) (input as HTMLInputElement).focus()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const filtered = useMemo(() => {
    return SYSTEM_REGISTRY.filter(entry => {
      const matchSearch =
        search === "" ||
        entry.name.toLowerCase().includes(search.toLowerCase()) ||
        entry.description.toLowerCase().includes(search.toLowerCase()) ||
        entry.category.toLowerCase().includes(search.toLowerCase())
      const matchCat = categoryFilter === "Alla" || entry.category === categoryFilter
      const matchStatus = statusFilter === "Alla" || entry.status === statusFilter
      return matchSearch && matchCat && matchStatus
    })
  }, [search, categoryFilter, statusFilter])

  const activeCount = SYSTEM_REGISTRY.filter(e => e.status === "ACTIVE").length
  const total = SYSTEM_REGISTRY.length

  const needsAction = SYSTEM_REGISTRY.filter(e => e.status !== "ACTIVE")

  return (
    <div className="h-full overflow-y-auto space-y-5 pr-1">
      {/* USER STATUS HEADER */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-gray-400 mb-1 tracking-widest">INLOGGAD SOM</div>
            <div className="text-lg font-bold text-white">Erik Svensson</div>
            <div className="text-sm text-gray-400">Chairman & Group CEO · Wavult Group</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-400">
              {activeCount}/{total}
            </div>
            <div className="text-xs text-gray-400 font-mono tracking-widest">SYSTEM AKTIVA</div>
          </div>
        </div>
        <div className="mt-3 h-1 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: `${(activeCount / total) * 100}%` }}
          />
        </div>
      </div>

      {/* SEARCH + FILTER */}
      <div className="space-y-3">
        <div className="relative">
          <input
            id="system-search"
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Sök system… (CMD+K)"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700">
            ⌘K
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["Alla", ...CATEGORIES] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat as SystemCategory | "Alla")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                categoryFilter === cat
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/40"
                  : "bg-gray-800 text-gray-400 border border-gray-700 hover:text-gray-200 hover:border-gray-600"
              }`}
            >
              {cat}
            </button>
          ))}
          <div className="w-px bg-gray-700 mx-1 self-stretch" />
          {(["Alla", ...STATUSES] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s as AccessStatus | "Alla")}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
                statusFilter === s
                  ? "bg-gray-700 text-white border border-gray-500"
                  : "bg-gray-900 text-gray-500 border border-gray-700 hover:text-gray-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* NEXT ACTIONS PANEL */}
      {needsAction.length > 0 && statusFilter === "Alla" && categoryFilter === "Alla" && search === "" && (
        <div className="bg-red-950/20 border border-red-800/40 rounded-xl p-4">
          <div className="text-xs font-mono text-red-400 mb-3 tracking-widest">ÅTGÄRDER KRÄVS</div>
          <div className="space-y-2">
            {needsAction.map(entry => (
              <div key={entry.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base flex-shrink-0">{entry.icon}</span>
                  <div className="min-w-0">
                    <span className="text-sm text-white font-medium">{entry.name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {entry.status === "PENDING" ? "Väntar på bekräftelse" : "Saknar åtkomst"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={entry.status} />
                  {entry.actions
                    .filter(a => a.action === "fix" || a.action === "request")
                    .slice(0, 1)
                    .map((a, i) => (
                      <button
                        key={i}
                        onClick={() => handleAction(entry, a)}
                        className="px-2 py-0.5 rounded text-xs bg-red-600 hover:bg-red-500 text-white transition-colors"
                      >
                        Åtgärda →
                      </button>
                    ))}
                  {entry.actions.filter(a => a.action === "fix" || a.action === "request").length === 0 && (
                    <button
                      onClick={() => handleAction(entry, entry.actions[0])}
                      className="px-2 py-0.5 rounded text-xs bg-yellow-700 hover:bg-yellow-600 text-white transition-colors"
                    >
                      Öppna →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SYSTEM GRID */}
      <div>
        <div className="text-xs font-mono text-gray-500 mb-3 tracking-widest">
          {filtered.length} SYSTEM {filtered.length !== SYSTEM_REGISTRY.length && `(filtrerat från ${SYSTEM_REGISTRY.length})`}
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">
            Inga system matchar din sökning.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map(entry => (
              <SystemCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
