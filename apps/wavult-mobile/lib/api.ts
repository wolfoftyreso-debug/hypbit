import { getToken, logout } from './auth'
import { MOCK_CONTAINERS, MOCK_SEMANTIC_PROFILE } from './mockData'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001'

type RequestOptions = {
  retried?: boolean
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  opts: RequestOptions = {}
): Promise<T> {
  const token = await getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(8000),
    })

    // Token expired — clear session and redirect to login
    if (res.status === 401 && !opts.retried) {
      // Try refresh via Supabase auto-refresh (already handled by supabase client)
      // Re-get token after potential refresh
      const newToken = await getToken()
      if (newToken) {
        return request<T>(method, path, body, { retried: true })
      }
      await logout()
      throw new Error('UNAUTHORIZED')
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as any).message || `HTTP ${res.status}`)
    }

    return res.json()
  } catch (err: any) {
    // Fallback to mock data on connection errors
    if (
      err.name === 'TimeoutError' ||
      err.message?.includes('Network request failed') ||
      err.message?.includes('Failed to fetch') ||
      err.message?.includes('ECONNREFUSED')
    ) {
      return getMockFallback<T>(path)
    }
    throw err
  }
}

function getMockFallback<T>(path: string): T {
  if (path.startsWith('/api/containers'))
    return { data: MOCK_CONTAINERS, total: MOCK_CONTAINERS.length } as T
  if (path.startsWith('/api/semantic')) return MOCK_SEMANTIC_PROFILE as T
  if (path.startsWith('/api/auth/me'))
    return {
      id: 'u1',
      name: 'Erik Svensson',
      email: 'erik@hypbit.com',
      role: 'Chairman & Group CEO',
      organization: 'Wavult Group',
      initials: 'ES',
    } as T
  if (path.startsWith('/api/tasks')) return { data: [], total: 0 } as T
  return {} as T
}

// Named exports for existing usage
export function apiGet<T = unknown>(path: string): Promise<T> {
  return request<T>('GET', path)
}

export function apiPost<T = unknown>(path: string, body: unknown): Promise<T> {
  return request<T>('POST', path, body)
}

export function apiPatch<T = unknown>(path: string, body: unknown): Promise<T> {
  return request<T>('PATCH', path, body)
}

// Object-style api export for convenience
export const api = {
  get: <T = unknown>(path: string) => request<T>('GET', path),
  post: <T = unknown>(path: string, body: unknown) => request<T>('POST', path, body),
  patch: <T = unknown>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: <T = unknown>(path: string) => request<T>('DELETE', path),
}

export default api
