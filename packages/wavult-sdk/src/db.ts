import { WavultClient } from './client'

export interface QueryOptions {
  table: string
  select?: string
  where?: Record<string, unknown>
  order?: { column: string; ascending?: boolean }
  limit?: number
  offset?: number
}

export class DbModule {
  constructor(private client: WavultClient) {}

  // REGEL: Aldrig direktaccess — alltid via wavult-core API
  async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
    return this.client.fetch('/api/db/query', {
      method: 'POST',
      body: JSON.stringify({ sql, params })
    })
  }

  async from<T>(options: QueryOptions): Promise<T[]> {
    return this.client.fetch('/api/db/select', {
      method: 'POST',
      body: JSON.stringify(options)
    })
  }

  async insert<T>(table: string, data: Record<string, unknown>): Promise<T> {
    return this.client.fetch(`/api/db/${table}`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async update<T>(table: string, id: string, data: Record<string, unknown>): Promise<T> {
    return this.client.fetch(`/api/db/${table}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async delete(table: string, id: string): Promise<void> {
    await this.client.fetch(`/api/db/${table}/${id}`, { method: 'DELETE' })
  }
}
