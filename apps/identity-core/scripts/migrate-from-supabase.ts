/**
 * Migration script: Supabase Auth → Identity Core
 * Run ONCE before cutover. Safe to re-run (idempotent via ON CONFLICT DO NOTHING).
 *
 * NOTE: Supabase passwords are bcrypt — we cannot migrate hashes directly.
 * Users will need to reset password on first Identity Core login.
 *
 * Usage:
 *   DB_HOST=... DB_PASSWORD=... SUPABASE_URL=... SUPABASE_SERVICE_KEY=... \
 *   npx tsx scripts/migrate-from-supabase.ts
 */

import { db } from '../src/db/postgres'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

async function migrate() {
  console.log('[Migration] Starting Supabase → Identity Core migration')

  const { data: users, error } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (error) throw error

  console.log('[Migration] Users found in Supabase', { count: users.users.length })

  let migrated = 0
  let skipped = 0

  for (const user of users.users) {
    const email = user.email
    if (!email) { skipped++; continue }

    // Idempotent: ON CONFLICT DO NOTHING — safe to re-run
    const result = await db.query(
      `INSERT INTO ic_users
       (id, email, email_verified, full_name, org_id, roles, migrated_from, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'supabase', $7)
       ON CONFLICT (email) DO NOTHING`,
      [
        user.id,
        email,
        user.email_confirmed_at !== null,
        user.user_metadata?.name || null,
        user.user_metadata?.org_id || 'wavult',
        user.user_metadata?.roles || [],
        user.created_at,
      ]
    )

    if (result.rowCount && result.rowCount > 0) {
      migrated++
      console.log('[Migration] Migrated user', { email })
    } else {
      skipped++
    }
  }

  console.log('[Migration] Complete', { migrated, skipped })
}

migrate().catch(console.error).finally(() => db.end())
