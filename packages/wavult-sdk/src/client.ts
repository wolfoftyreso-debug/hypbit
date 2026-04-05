export interface WavultClientConfig {
  apiUrl?: string
  token?: string
  project?: string
}

export class WavultClient {
  readonly apiUrl: string
  private token: string | null
  readonly project: string

  constructor(config: WavultClientConfig = {}) {
    this.apiUrl = config.apiUrl
      ?? (typeof window !== 'undefined' ? (window as any).__WAVULT_API_URL__ : null)
      ?? process?.env?.VITE_API_URL
      ?? process?.env?.WAVULT_API_URL
      ?? 'https://api.wavult.com'
    this.token = config.token ?? null
    this.project = config.project ?? 'default'
  }

  setToken(token: string) { this.token = token }

  async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
      ...((options.headers as Record<string, string>) ?? {}),
    }
    const res = await fetch(`${this.apiUrl}${path}`, { ...options, headers })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }))
      throw new WavultError(err.error ?? res.statusText, res.status)
    }
    return res.json()
  }
}

export class WavultError extends Error {
  constructor(message: string, public status: number) {
    super(message)
    this.name = 'WavultError'
  }
}
