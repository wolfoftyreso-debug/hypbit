import { useState, useEffect, useRef } from 'react'
import { ModuleHeader } from '../../shared/illustrations/ModuleIllustration'

interface CommandResult { id: string; command: string; output: string; status: 'success' | 'error'; timestamp: string }

export default function CommandView() {
  const [history, setHistory] = useState<CommandResult[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/command/history')
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(d => setHistory(d.history ?? []))
      .catch(e => setError(String(e)))
  }, [])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [history])

  const run = async () => {
    if (!input.trim()) return
    const cmd = input.trim()
    setInput('')
    setLoading(true)
    try {
      const r = await fetch('/api/command/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ command: cmd }) })
      const d = await r.json()
      setHistory(h => [...h, { id: Date.now().toString(), command: cmd, output: d.output ?? '', status: r.ok ? 'success' : 'error', timestamp: new Date().toISOString() }])
    } catch (e) {
      setHistory(h => [...h, { id: Date.now().toString(), command: cmd, output: String(e), status: 'error', timestamp: new Date().toISOString() }])
    } finally { setLoading(false) }
  }

  return (
    <div>
      <ModuleHeader
        route="/command-view"
        label="Wavult OS"
        title="Command Center"
        description="Kör kommandon och inspektera systemet"
        illustrationSize="md"
      />
  )
}
