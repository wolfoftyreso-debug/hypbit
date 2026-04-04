/**
 * SUPABASE CLOUD WRITE GUARD
 * Blockerar ALLA skrivningar (POST/PUT/PATCH/DELETE) till Supabase Cloud.
 * Kräver header X-Supabase-Override: Erik1987 för att häva.
 *
 * Beslut: Erik Svensson 2026-04-04 09:00
 * Plan: Supabase Cloud stängs ned 2026-04-04 kväll.
 */

import { Request, Response, NextFunction } from 'express'

const CLOUD_SUPABASE_HOSTS = [
  'znmxtnxxjpmgtycmsqjv.supabase.co',
  'lpeipzdmnnlbcoxlfhoe.supabase.co',
]

const OVERRIDE_PASSWORD = 'Erik1987'

const isCloudUrl = (url: string) =>
  CLOUD_SUPABASE_HOSTS.some(host => url.includes(host))

export function supabaseCloudWriteGuard() {
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const usingCloud = isCloudUrl(supabaseUrl)

  if (usingCloud) {
    console.error('🚨🚨🚨 SUPABASE CLOUD WRITE GUARD AKTIV 🚨🚨🚨')
    console.error(`🚨 SUPABASE_URL pekar mot cloud: ${supabaseUrl}`)
    console.error('🚨 POST/PUT/PATCH/DELETE är blockerade. Byt till self-hosted!')
  } else {
    console.log('✅ Supabase Guard: self-hosted aktiv, inga begränsningar.')
  }

  return (req: Request, res: Response, next: NextFunction) => {
    if (!usingCloud) return next()

    // Läsning OK (för migration/fallback)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()

    // Override-header
    if (req.headers['x-supabase-override'] === OVERRIDE_PASSWORD) {
      console.warn(`⚠️  Supabase cloud override: ${req.method} ${req.path}`)
      return next()
    }

    // BLOCKERA
    console.error(`🚨 BLOCKAD: ${req.method} ${req.path}`)
    return res.status(503).json({
      error: 'Supabase Cloud är avvecklad',
      message: 'Skrivningar till cloud Supabase är blockerade.',
      override: 'Sätt header X-Supabase-Override med rätt lösenord',
    })
  }
}
