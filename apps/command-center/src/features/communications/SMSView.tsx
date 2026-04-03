import { useState } from 'react'
import { MessageSquare, Send, CheckCircle, XCircle, Clock } from 'lucide-react'

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'https://api.wavult.com'

interface SMSLog {
  id: string
  to: string
  toName: string
  message: string
  status: 'sent' | 'failed' | 'pending'
  timestamp: string
}

const TEAM_CONTACTS = [
  { name: 'Leon Russo De Cerame', number: '+46738968949', role: 'CEO Operations' },
  { name: 'Winston Bjarnemark', number: '+46768123548', role: 'CFO' },
  { name: 'Johan Berglund', number: '+46736977576', role: 'Group CTO' },
  { name: 'Dennis Bjarnemark', number: '+46761474243', role: 'Chief Legal' },
  { name: 'Erik Svensson', number: '+46709123223', role: 'Chairman & Group CEO' },
]

export function SMSView() {
  const [log, setLog] = useState<SMSLog[]>([])
  const [recipient, setRecipient] = useState('')
  const [customNumber, setCustomNumber] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showForm, setShowForm] = useState(false)

  async function sendSMS() {
    const to = recipient === 'custom' ? customNumber : recipient
    if (!to || !message.trim()) return
    const contact = TEAM_CONTACTS.find(c => c.number === to)
    const id = `sms-${Date.now()}`

    const pending: SMSLog = {
      id,
      to,
      toName: contact?.name ?? to,
      message,
      status: 'pending',
      timestamp: new Date().toISOString(),
    }
    setLog(prev => [pending, ...prev])
    setSending(true)
    setMessage('')
    setRecipient('')
    setCustomNumber('')
    setShowForm(false)

    try {
      const res = await fetch(`${API_BASE}/api/sms/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, message, from: 'Wavult' }),
      })
      const status: 'sent' | 'failed' = res.ok ? 'sent' : 'failed'
      setLog(prev => prev.map(s => s.id === id ? { ...s, status } : s))
    } catch {
      setLog(prev => prev.map(s => s.id === id ? { ...s, status: 'failed' } : s))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-green-400" />
          <span className="text-sm font-semibold text-[#0A3D62]">SMS via 46elks</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20">
            ✓ Konfigurerad
          </span>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/20 hover:bg-blue-500/25 transition-colors"
        >
          <Send size={11} />
          Nytt SMS
        </button>
      </div>

      {/* Compose */}
      {showForm && (
        <div className="bg-white border border-[#DDD5C5] rounded-xl p-4 space-y-3">
          <div>
            <label className="text-[10px] font-mono text-[#8A8A9A] uppercase tracking-wider mb-1 block">Mottagare</label>
            <select
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              className="w-full bg-[#EDE8DC] border border-[#DDD5C5] rounded-lg px-3 py-2 text-xs text-[#0A3D62] focus:outline-none focus:border-blue-500/50"
            >
              <option value="">Välj kontakt…</option>
              {TEAM_CONTACTS.map(c => (
                <option key={c.number} value={c.number}>{c.name} — {c.role}</option>
              ))}
              <option value="custom">Ange nummer manuellt…</option>
            </select>
          </div>

          {recipient === 'custom' && (
            <div>
              <label className="text-[10px] font-mono text-[#8A8A9A] uppercase tracking-wider mb-1 block">Nummer</label>
              <input
                value={customNumber}
                onChange={e => setCustomNumber(e.target.value)}
                placeholder="+46…"
                className="w-full bg-[#EDE8DC] border border-[#DDD5C5] rounded-lg px-3 py-2 text-xs text-[#0A3D62] placeholder-[#8A8A9A] focus:outline-none focus:border-blue-500/50"
              />
            </div>
          )}

          <div>
            <label className="text-[10px] font-mono text-[#8A8A9A] uppercase tracking-wider mb-1 block">
              Meddelande ({message.length}/160)
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value.slice(0, 160))}
              placeholder="Skriv SMS…"
              rows={3}
              className="w-full bg-[#EDE8DC] border border-[#DDD5C5] rounded-lg px-3 py-2 text-xs text-[#0A3D62] placeholder-[#8A8A9A] focus:outline-none focus:border-blue-500/50 resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#8A8A9A] font-mono">Avsändare: Wavult · Provider: 46elks</span>
            <button
              onClick={sendSMS}
              disabled={sending || !recipient || !message.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={11} />
              {sending ? 'Skickar…' : 'Skicka'}
            </button>
          </div>
        </div>
      )}

      {/* Log */}
      <div className="bg-white border border-[#DDD5C5] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#DDD5C5] flex items-center justify-between">
          <span className="text-xs font-semibold text-[#0A3D62]">Skickade SMS</span>
          <span className="text-[10px] text-[#8A8A9A]">{log.length} denna session</span>
        </div>
        {log.length === 0 ? (
          <div className="p-8 flex flex-col items-center gap-3 text-center">
            <MessageSquare size={24} className="text-[#8A8A9A]" />
            <p className="text-xs text-[#8A8A9A]">Inga SMS skickade ännu</p>
            <p className="text-[10px] text-[#8A8A9A]">SMS-historik är session-baserad</p>
          </div>
        ) : (
          <div className="divide-y divide-[#DDD5C5]">
            {log.map(sms => (
              <div key={sms.id} className="px-4 py-3 flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  {sms.status === 'sent' ? <CheckCircle size={14} className="text-green-400" />
                    : sms.status === 'failed' ? <XCircle size={14} className="text-red-400" />
                    : <Clock size={14} className="text-yellow-400 animate-pulse" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-[#0A3D62]">{sms.toName}</span>
                    <span className="text-[10px] text-[#8A8A9A] font-mono">{sms.to}</span>
                    <span className="ml-auto text-[10px] text-[#8A8A9A] font-mono">
                      {new Date(sms.timestamp).toLocaleTimeString('sv-SE')}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7280]">{sms.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Kontakter */}
      <div className="bg-white border border-[#DDD5C5] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#DDD5C5]">
          <span className="text-xs font-semibold text-[#0A3D62]">Team-kontakter</span>
        </div>
        <div className="divide-y divide-[#DDD5C5]">
          {TEAM_CONTACTS.map(c => (
            <div key={c.number} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1">
                <p className="text-xs font-medium text-[#0A3D62]">{c.name}</p>
                <p className="text-[10px] text-[#8A8A9A]">{c.role}</p>
              </div>
              <span className="text-xs font-mono text-[#8A8A9A]">{c.number}</span>
              <button
                onClick={() => { setRecipient(c.number); setShowForm(true) }}
                className="text-[10px] px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
              >
                SMS
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
