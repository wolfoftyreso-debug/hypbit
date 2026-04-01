import { useState } from 'react'

interface Props {
  to: string
  label?: string
  message?: string
}

type CallStatus = 'idle' | 'calling' | 'connected' | 'error'

export function VoiceCallButton({ to, label, message }: Props) {
  const [status, setStatus] = useState<CallStatus>('idle')

  async function initiateCall() {
    setStatus('calling')
    try {
      const res = await fetch('/api/voice/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, message }),
      })
      const data = (await res.json()) as { success?: boolean }
      if (data.success) {
        setStatus('connected')
        setTimeout(() => setStatus('idle'), 5000)
      } else {
        setStatus('error')
        setTimeout(() => setStatus('idle'), 4000)
      }
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 4000)
    }
  }

  const config: Record<CallStatus, { cls: string; text: string }> = {
    idle:      { cls: 'bg-green-600 hover:bg-green-500 cursor-pointer',       text: `Ring ${label || to}` },
    calling:   { cls: 'bg-yellow-600 animate-pulse cursor-wait',              text: 'Ringer...' },
    connected: { cls: 'bg-blue-600 cursor-default',                           text: 'Ansluten' },
    error:     { cls: 'bg-red-600 hover:bg-red-500 cursor-pointer',           text: 'Fel — försök igen' },
  }

  const { cls, text } = config[status]

  return (
    <button
      onClick={status === 'idle' || status === 'error' ? initiateCall : undefined}
      disabled={status === 'calling' || status === 'connected'}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium transition-all ${cls}`}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
      </svg>
      {text}
    </button>
  )
}
