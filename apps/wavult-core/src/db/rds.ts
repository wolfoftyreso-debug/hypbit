import { Pool } from 'pg'

let pool: Pool | null = null

export function getRDSPool(): Pool {
  if (!pool) {
    if (!process.env.RDS_HOST_ECS) {
      console.error('[RDS] FATAL: RDS_HOST_ECS env var not set')
      process.exit(1)
    }
    pool = new Pool({
      host: process.env.RDS_HOST_ECS,
      port: 5432,
      database: process.env.RDS_DATABASE || 'wavult_identity',
      user: process.env.RDS_USER || 'wavult_admin',
      password: process.env.RDS_PASSWORD || '',
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })
    pool.on('error', (err) => {
      console.error('[RDS] Unexpected pool error:', err.message)
    })
  }
  return pool
}
