/**
 * LoginPage — Wavult OS inloggning
 *
 * Supabase email/lösenord-auth. Efter lyckad inloggning
 * fortsätter flödet till rollvalet (RoleLogin).
 */

import { useState, FormEvent } from 'react'
import { useAuth } from './AuthContext'

export function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await signIn(email.trim(), password)
    if (error) {
      setError(translateError(error))
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#07080F] flex flex-col items-center justify-center p-6">
      {/* Card */}
      <div className="max-w-sm w-full bg-[#0D0F1A] border border-white/[0.06] rounded-2xl p-8">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/20 mb-4">
            <span className="text-2xl font-bold text-[#8B5CF6]">W</span>
          </div>
          <h1 className="text-xl font-semibold text-white">Wavult OS</h1>
          <p className="text-xs text-gray-600 font-mono mt-1 tracking-widest uppercase">Wavult Group</p>
          <p className="text-sm text-gray-500 mt-2">Logga in för att fortsätta</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
              E-post
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="namn@hypbit.com"
              required
              autoComplete="email"
              className={`w-full bg-[#141720] border rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none transition-colors ${
                error
                  ? 'border-red-500/60 focus:border-red-500'
                  : 'border-white/[0.06] focus:border-[#8B5CF6]'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
              Lösenord
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className={`w-full bg-[#141720] border rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none transition-colors ${
                error
                  ? 'border-red-500/60 focus:border-red-500'
                  : 'border-white/[0.06] focus:border-[#8B5CF6]'
              }`}
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 mt-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-2"
          >
            {loading ? 'Loggar in...' : 'Logga in'}
          </button>
        </form>
      </div>

      <p className="mt-6 text-xs text-gray-700 font-mono">
        Wavult OS · Intern access · Kontakta admin vid problem
      </p>
    </div>
  )
}

// ─── Error translation ────────────────────────────────────────────────────────

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Fel e-post eller lösenord'
  if (msg.includes('Email not confirmed')) return 'E-postadressen är inte bekräftad — kolla din inbox'
  if (msg.includes('Too many requests')) return 'För många försök — vänta en stund och försök igen'
  if (msg.includes('User not found')) return 'Ingen användare med den e-postadressen hittades'
  if (msg.includes('network')) return 'Nätverksfel — kontrollera din internetanslutning'
  return msg
}
