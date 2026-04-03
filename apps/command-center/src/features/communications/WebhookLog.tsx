// ─── Webhook Log — Wavult OS ─────────────────────────────────────────────────
// Visar inkommande webhooks från Stripe, 46elks etc.
// Data hämtas från /api/events/webhooks

import { useState, useEffect, useCallback } from 'react'
import { Webhook, RefreshCw, AlertCircle, Activity } from 'lucide-react'

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'https://api.wavult.com'

interface WebhookEntry {
  id: string
  source: string
  event: string
  status: number
  timestamp: string
  payload?: unknown
}

export function WebhookLog() {
  const [events, setEvents] = useState<WebhookEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sourceFilter, setSourceFilter] = useState('all')

  const fetchWebhooks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch(`${API_BASE}/api/events/webhooks?limit=50`, { signal: AbortSignal.timeout(8_000) })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const d = await r.json() as { events: WebhookEntry[] }
      setEvents(d.events ?? [])
    } catch {
      setEvents([])
      setError(null) // Endpoint finns ej ännu — visa empty state
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchWebhooks() }, [fetchWebhooks])

  const sources = ['all', ...Array.from(new Set(events.map(e => e.source)))]
  const filtered = sourceFilter === 'all' ? events : events.filter(e => e.source === sourceFilter)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Webhook size={14} className="text-blue-400" />
          <span className="text-xs font-semibold text-[#0A3D62]">Webhook-logg</span>
        </div>
        <button
          onClick={fetchWebhooks}
          className="text-[#8A8A9A] hover:text-[#6B7280] transition-colors"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Source filter */}
      {events.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {sources.map(s => (
            <button
              key={s}
              onClick={() => setSourceFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                sourceFilter === s
                  ? 'bg-[#EDE8DC] border-[#DDD5C5] text-[#0A3D62]'
                  : 'border-[#DDD5C5] text-[#8A8A9A] hover:border-[#DDD5C5]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      <div className="bg-white border border-[#DDD5C5] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <RefreshCw size={18} className="text-[#8A8A9A] animate-spin" />
          </div>
        ) : error ? (
          <div className="p-6 flex items-center gap-2">
            <AlertCircle size={14} className="text-red-400" />
            <span className="text-xs text-red-400">{error}</span>
          </div>
        ) : events.length === 0 ? (
          <div className="p-10 flex flex-col items-center gap-3 text-center">
            <Activity size={24} className="text-[#8A8A9A]" />
            <p className="text-sm font-medium text-[#8A8A9A]">Inga webhooks ännu</p>
            <p className="text-xs text-[#8A8A9A]">
              Webhooks loggas här när de anländer från Stripe, 46elks m.fl.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#DDD5C5]">
            {filtered.map(evt => (
              <div key={evt.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className="text-[10px] font-mono w-10 text-center py-0.5 rounded flex-shrink-0"
                  style={{
                    background: evt.status < 400 ? '#34D39920' : '#F8717120',
                    color: evt.status < 400 ? '#34D399' : '#F87171',
                  }}
                >
                  {evt.status}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#6B7280] font-mono truncate">{evt.event}</p>
                  <p className="text-[10px] text-[#8A8A9A]">{evt.source}</p>
                </div>
                <span className="text-[10px] text-[#8A8A9A] font-mono flex-shrink-0">
                  {new Date(evt.timestamp).toLocaleTimeString('sv-SE')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
