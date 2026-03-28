import { Pool } from 'pg'
import { config } from '../config'

export const db = new Pool(config.db)

db.on('error', (err) => {
  console.error('[DB] Unexpected error:', err)
})

export async function testConnection(): Promise<boolean> {
  try {
    await db.query('SELECT 1')
    return true
  } catch {
    return false
  }
}
