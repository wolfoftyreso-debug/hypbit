import { WavultClient } from './client'

export interface WavultUser {
  id: string
  email: string
  role: string
  name?: string
}

export class AuthModule {
  constructor(private client: WavultClient) {}

  async getUser(token?: string): Promise<WavultUser | null> {
    try {
      return await this.client.fetch<WavultUser>('/api/auth/me', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
    } catch { return null }
  }

  async login(email: string, password: string): Promise<{ token: string; user: WavultUser }> {
    return this.client.fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
  }

  async logout(): Promise<void> {
    await this.client.fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
  }

  async validatePassword(password: string): Promise<boolean> {
    try {
      await this.client.fetch('/api/auth/validate-password', {
        method: 'POST',
        body: JSON.stringify({ password })
      })
      return true
    } catch { return false }
  }
}
