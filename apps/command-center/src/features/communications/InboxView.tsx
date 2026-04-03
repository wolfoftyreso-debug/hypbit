import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Mail, AlertCircle, Inbox } from 'lucide-react'

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'https://api.wavult.com'

interface EmailSummary {
  id: string
  uid: string
  from: string
  subject: string
  date: string
  read: boolean
  snippet: string
}

function relTime(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const diff = Date.now() - d.getTime()
    const h = Math.floor(diff / 3_600_000)
    if (h < 1) return 'just nu'
    if (h < 24) return `${h}h sedan`
    return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
  } catch { return dateStr }
}

function extractDisplayName(from: string): string {
  if (!from) return '—'
  const m = from.match(/^"?([^"<]+)"?\s*</)
  return m ? m[1].trim() : from.replace(/<[^>]+>/, '').trim() || from
}

function initials(name: string): string {
  return name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const AVATAR_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899']
function avatarColor(str: string): string {
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

export function InboxView() {
  const [emails, setEmails] = useState<EmailSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<EmailSummary | null>(null)

  const fetchInbox = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch(`${API_BASE}/api/communications/inbox`, {
        signal: AbortSignal.timeout(20_000),
      })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const data = await r.json() as { emails: EmailSummary[]; count: number }
      setEmails(data.emails ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunde inte hämta mail')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchInbox() }, [fetchInbox])

  const unread = emails.filter(e => !e.read).length

  return (
    <div className="flex h-full gap-4">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 flex flex-col gap-0 bg-white border border-[#DDD5C5] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#DDD5C5]">
          <div className="flex items-center gap-2">
            <Inbox size={14} className="text-blue-400" />
            <span className="text-xs font-semibold text-[#0A3D62]">Inkorg</span>
            {unread > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {unread}
              </span>
            )}
          </div>
          <button
            onClick={fetchInbox}
            disabled={loading}
            className="text-[#8A8A9A] hover:text-[#6B7280] transition-colors"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading && emails.length === 0 ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3 items-start animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-[#EDE8DC] flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-[#EDE8DC] rounded w-3/4" />
                    <div className="h-2 bg-[#F0EBE1] rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-4 flex flex-col items-center gap-3 text-center">
              <AlertCircle size={20} className="text-red-400" />
              <p className="text-xs text-red-400">{error}</p>
              <button onClick={fetchInbox} className="text-xs text-[#8A8A9A] hover:text-[#6B7280]">Försök igen</button>
            </div>
          ) : emails.length === 0 ? (
            <div className="p-8 flex flex-col items-center gap-3 text-center">
              <Mail size={24} className="text-[#8A8A9A]" />
              <p className="text-xs text-[#8A8A9A]">Inga mail i inkorgen</p>
            </div>
          ) : (
            emails.map(email => {
              const name = extractDisplayName(email.from)
              const color = avatarColor(email.from)
              const isSelected = selected?.id === email.id
              return (
                <button
                  key={email.id}
                  onClick={() => setSelected(email)}
                  className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b border-[#DDD5C5] transition-colors ${
                    isSelected ? 'bg-blue-500/10 border-l-2 border-l-blue-500' : 'hover:bg-[#EDE8DC]'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: color + '25', color, border: `1px solid ${color}40` }}
                  >
                    {initials(name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className={`text-xs truncate ${email.read ? 'text-[#8A8A9A]' : 'text-[#0A3D62] font-semibold'}`}>
                        {name}
                      </span>
                      <span className="text-[10px] text-[#8A8A9A] font-mono flex-shrink-0">{relTime(email.date)}</span>
                    </div>
                    <p className={`text-xs truncate ${email.read ? 'text-[#8A8A9A]' : 'text-[#6B7280]'}`}>
                      {email.subject || '(inget ämne)'}
                    </p>
                  </div>
                  {!email.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />}
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Detail pane */}
      <div className="flex-1 bg-white border border-[#DDD5C5] rounded-xl overflow-hidden">
        {selected ? (
          <div className="p-6 h-full overflow-auto">
            <div className="flex items-start gap-4 mb-6">
              {(() => {
                const name = extractDisplayName(selected.from)
                const color = avatarColor(selected.from)
                return (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: color + '25', color, border: `1px solid ${color}40` }}
                  >
                    {initials(name)}
                  </div>
                )
              })()}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#0A3D62]">{extractDisplayName(selected.from)}</span>
                  <span className="text-xs text-[#8A8A9A] font-mono">{selected.date}</span>
                </div>
                <div className="text-xs text-[#8A8A9A]">{selected.from}</div>
              </div>
            </div>
            <h2 className="text-base font-bold text-[#0A3D62] mb-4">{selected.subject || '(inget ämne)'}</h2>
            <div className="text-xs text-[#6B7280] bg-[#F0EBE1] rounded-xl p-4">
              Öppna detta mail i Loopia Webmail för att läsa hela innehållet.
              <br /><br />
              <a
                href="https://webmail.loopia.se"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Öppna Loopia Webmail →
              </a>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Mail size={32} className="text-[#8A8A9A] mx-auto mb-3" />
              <p className="text-xs text-[#8A8A9A]">Välj ett mail för att läsa det</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
