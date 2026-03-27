import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { MOCK_USER } from './mockData'

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://znmxtnxxjpmgtycmsqjv.supabase.co'
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
  },
})

export type AuthUser = {
  id: string
  name: string
  email: string
  role: string
  organization: string
  initials: string
}

function mapSupabaseUser(supaUser: { id: string; email?: string | null }): AuthUser {
  const email = supaUser.email || ''
  const name = email.split('@')[0] || 'User'
  const initials = name
    .split('.')
    .map((p: string) => p[0]?.toUpperCase() || '')
    .join('')
    .slice(0, 2) || 'U'
  return {
    id: supaUser.id,
    name,
    email,
    role: 'Team Member',
    organization: 'Wavult Group',
    initials,
  }
}

export async function login(email: string, password: string): Promise<AuthUser> {
  // Demo mode bypass
  if (email === 'demo@wavult.com') {
    return MOCK_USER
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Fel e-post eller lösenord.')
      }
      throw new Error(error.message)
    }
    if (!data.user) throw new Error('Inloggning misslyckades')
    return mapSupabaseUser(data.user)
  } catch (err: any) {
    // Network error → demo mode fallback
    if (
      err.message?.includes('Network request failed') ||
      err.message?.includes('Failed to fetch') ||
      err.message?.includes('ECONNREFUSED') ||
      err.name === 'TimeoutError'
    ) {
      return MOCK_USER
    }
    throw err
  }
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut()
}

export async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token || null
}

export async function refreshToken(): Promise<string | null> {
  const { data } = await supabase.auth.refreshSession()
  return data.session?.access_token || null
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser()
  return data.user
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const { data } = await supabase.auth.getSession()
  if (data.session?.user) {
    return mapSupabaseUser(data.session.user)
  }
  return null
}
