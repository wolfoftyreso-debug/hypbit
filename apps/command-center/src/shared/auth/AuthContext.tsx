/**
 * AuthContext — wavult-core autentisering för Wavult OS
 *
 * Hanterar:
 * - JWT via wavult-core Identity Core (/v1/auth/login)
 * - Exponerar getToken() för API-anrop
 * - VITE_BYPASS_AUTH=true returnerar dummy-token direkt
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

const API_URL = import.meta.env.VITE_API_URL ?? 'https://api.wavult.com'
const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === 'true'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthState {
  session: null
  user: { email: string } | null
  loading: boolean
  getToken: () => Promise<string | null>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ email: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (BYPASS_AUTH) {
      setUser({ email: 'bypass@wavult.com' })
      setLoading(false)
      return
    }

    // Restore session from localStorage
    const token = localStorage.getItem('ic_token')
    const email = localStorage.getItem('ic_email')
    if (token && email) {
      setUser({ email })
    }
    setLoading(false)
  }, [])

  async function getToken(): Promise<string | null> {
    if (BYPASS_AUTH) return 'bypass-token'
    return localStorage.getItem('ic_token')
  }

  async function signIn(email: string, password: string): Promise<{ error: string | null }> {
    const normalizedEmail = email.trim().toLowerCase()
    try {
      const res = await fetch(`${API_URL}/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        return { error: body?.message ?? `HTTP ${res.status}` }
      }
      const data = await res.json()
      if (data?.data?.access_token) {
        localStorage.setItem('ic_token', data.data.access_token)
        localStorage.setItem('ic_refresh', data.data.refresh_token || '')
        localStorage.setItem('ic_session', data.data.session_id || '')
        localStorage.setItem('ic_email', normalizedEmail)
        setUser({ email: normalizedEmail })
      }
      return { error: null }
    } catch (err) {
      return { error: 'Inloggning misslyckades — kontrollera nätverket' }
    }
  }

  async function signOut(): Promise<void> {
    localStorage.removeItem('ic_token')
    localStorage.removeItem('ic_refresh')
    localStorage.removeItem('ic_session')
    localStorage.removeItem('ic_email')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ session: null, user, loading, getToken, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth måste användas inom AuthProvider')
  return ctx
}
