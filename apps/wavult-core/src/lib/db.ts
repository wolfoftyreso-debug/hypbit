/**
 * db.ts — Wavult OS Database Guard
 *
 * MIGRATION: 2026-04-04
 * Cloud Supabase (znmxtnxxjpmgtycmsqjv.supabase.co) → Wavult OS egna RDS
 *
 * REGEL: SUPABASE_URL får ALDRIG peka mot *.supabase.co (cloud)
 * Använd alltid intern DB-URL via WAVULT_OS_DB_URL (AWS SSM /wavult/prod/WAVULT_OS_DB_URL)
 *
 * Om du ser detta fel: SUPABASE_URL är satt till cloud-URL → ändra ECS task definition
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const CLOUD_SUPABASE_PATTERN = /\.supabase\.co/i
const MIGRATION_DATE = '2026-04-04'

/**
 * Guard-funktion: kastar Error om SUPABASE_URL pekar mot cloud.
 * Anropas automatiskt vid appstart och vid varje createClient-anrop via getSupabaseClient().
 */
export function assertNotCloudSupabase(url?: string): void {
  const supabaseUrl = url ?? process.env.SUPABASE_URL ?? ''

  if (CLOUD_SUPABASE_PATTERN.test(supabaseUrl)) {
    throw new Error(
      `BLOCKED: Cloud Supabase writes are disabled as of ${MIGRATION_DATE}. ` +
      `SUPABASE_URL "${supabaseUrl}" pekar mot cloud Supabase. ` +
      `Använd WAVULT_OS_DB_URL (intern RDS) istället. ` +
      `Se ECS task definition för wavult-os-api och uppdatera SUPABASE_URL till intern URL.`
    )
  }
}

/**
 * Säker wrapper för createClient — kontrollerar alltid att URL är intern.
 * Ersätter direktanrop till createClient() från @supabase/supabase-js i alla routes.
 */
export function getSupabaseClient(
  url?: string,
  key?: string
): SupabaseClient {
  const resolvedUrl = url ?? process.env.SUPABASE_URL ?? ''
  const resolvedKey = key ?? process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

  // Blockera cloud-URL
  assertNotCloudSupabase(resolvedUrl)

  if (!resolvedUrl) {
    throw new Error('SUPABASE_URL är inte satt. Konfigurera intern URL i ECS task definition.')
  }

  return createClient(resolvedUrl, resolvedKey)
}

/**
 * Singleton-klient för moduler som vill återanvända en instans.
 * Lazy-initialiseras — guard körs vid första anrop.
 */
let _client: SupabaseClient | null = null

export function getDb(): SupabaseClient {
  if (!_client) {
    _client = getSupabaseClient()
  }
  return _client
}

// Exportera createClient-guard som default-hjälp för befintlig kod
export { createClient }

/**
 * Appstart-guard: anropa denna i index.ts/app.ts för att fånga felkonfiguration tidigt.
 * Kastar vid uppstart om cloud-URL är konfigurerad.
 */
export function validateDbConfig(): void {
  console.log('[db] Validerar databaskonfiguration...')
  assertNotCloudSupabase()

  const supabaseUrl = process.env.SUPABASE_URL ?? ''
  const dbUrl = process.env.DATABASE_URL ?? process.env.EOS_DATABASE_URL ?? ''

  if (!supabaseUrl && !dbUrl) {
    console.warn('[db] VARNING: Varken SUPABASE_URL eller DATABASE_URL är satt')
  } else {
    console.log(`[db] ✅ DB-konfiguration OK (URL: ${(supabaseUrl || dbUrl).substring(0, 40)}...)`)
  }
}
