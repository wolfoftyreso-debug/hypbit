// ─── seed-knowledge.ts ────────────────────────────────────────────────────────
// Genererar knowledge_articles för allt som redan finns i systemet:
//   - Alla company_launches
//   - AWS ECS-tjänster (eu-north-1)
//   - Cloudflare-zoner
//   - Befintliga API-integrationer
//
// Kör: npx ts-node server/src/scripts/seed-knowledge.ts

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://znmxtnxxjpmgtycmsqjv.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? ''
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const API_BASE = `http://localhost:${process.env.PORT ?? 3001}`

async function triggerKnowledgeEvent(eventType: string, entity: Record<string, unknown>) {
  try {
    const res = await fetch(`${API_BASE}/api/knowledge/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: eventType, entity }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error(`  ✗ ${eventType} ${entity.name}: HTTP ${res.status} — ${text}`)
      return false
    }

    const data = await res.json() as { article?: { title: string } }
    console.log(`  ✓ ${data.article?.title ?? entity.name}`)
    return true
  } catch (err) {
    console.error(`  ✗ Nätverksfel: ${err instanceof Error ? err.message : err}`)
    return false
  }
}

// Vänta lite mellan anrop för att undvika rate limits
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function seedCompanies() {
  console.log('\n📋 Bolags-artiklar...')
  const { data: companies, error } = await supabase
    .from('company_launches')
    .select('*')
    .order('priority', { ascending: true })

  if (error) {
    console.error('  ✗ Kunde inte hämta company_launches:', error.message)
    return
  }

  console.log(`  Hittade ${companies?.length ?? 0} bolag`)
  for (const company of companies ?? []) {
    await triggerKnowledgeEvent('company.added', {
      id: company.id,
      name: company.name,
      type: company.type,
      jurisdiction: company.jurisdiction,
      status: company.status,
      notes: company.notes,
    })
    await sleep(2000) // 2s mellanrum — respektera Perplexity rate limits
  }
}

async function seedEcsServices() {
  console.log('\n🖥️  ECS-tjänst-artiklar...')

  // Kända tjänster i Wavult ECS (eu-north-1, cluster: hypbit)
  const services = [
    { name: 'wavult-os-api', description: 'Wavult OS Core API — autentisering, bolag, missioner, domäner, röst-agent Bernt' },
    { name: 'quixzoom-api', description: 'QuiXzoom API — fotografer, uppdrag, bildleverans, betalningar' },
    { name: 'n8n', description: 'n8n automation-plattform — workflows, webhooks, integrationer' },
    { name: 'team-pulse', description: 'Team Pulse — personalövervakning, närvaro, välmående' },
  ]

  for (const svc of services) {
    await triggerKnowledgeEvent('ecs.deployed', {
      name: svc.name,
      description: svc.description,
      cluster: 'hypbit',
      region: 'eu-north-1',
      account: '155407238699',
    })
    await sleep(2000)
  }
}

async function seedCloudflareZones() {
  console.log('\n🌐 Domän-artiklar...')

  const cfEmail = process.env.CF_EMAIL ?? ''
  const cfKey = process.env.CLOUDFLARE_API_TOKEN ?? process.env.CF_GLOBAL_KEY ?? ''

  try {
    const res = await fetch(
      'https://api.cloudflare.com/client/v4/zones?account.id=b65ff6fbc9b5a7a7da71bb0d3f1beb28&per_page=100',
      {
        headers: {
          'X-Auth-Email': cfEmail,
          'X-Auth-Key': cfKey,
          'Content-Type': 'application/json',
        },
      }
    )

    const data = await res.json() as {
      success: boolean
      result?: Array<{ id: string; name: string; status: string; name_servers: string[] }>
    }

    if (!data.success || !data.result) {
      console.error('  ✗ Kunde inte hämta Cloudflare-zoner')
      return
    }

    // Filtrera bort inaktiva/deleted
    const activeZones = data.result.filter(z => z.status !== 'deleted')
    console.log(`  Hittade ${activeZones.length} zoner`)

    for (const zone of activeZones) {
      await triggerKnowledgeEvent('domain.added', {
        id: zone.id,
        name: zone.name,
        status: zone.status,
        nameservers: zone.name_servers,
      })
      await sleep(2000)
    }
  } catch (err) {
    console.error('  ✗ Cloudflare-fel:', err instanceof Error ? err.message : err)
  }
}

async function seedApiIntegrations() {
  console.log('\n🔌 API-integrations-artiklar...')

  const apis = [
    { name: 'Resend', category: 'email', description: 'E-postleverans — transaktionella mail, bekräftelser, notiser' },
    { name: '46elks', category: 'telephony', description: 'SMS och telefoni — röst-agent Bernt, OTP, aviseringar' },
    { name: 'Perplexity', category: 'ai', description: 'AI-sökning och innehållsgenerering — knowledge engine, research' },
    { name: 'OpenAI', category: 'ai', description: 'GPT och Whisper — textgenerering, transkription, Bernt-logik' },
    { name: 'ElevenLabs', category: 'tts', description: 'Text-till-tal — röst Sarah för Bernt, naturlig konversation' },
    { name: 'Stripe', category: 'payments', description: 'Betalningar — abonnemang, engångsbetalningar, webhooks' },
    { name: 'Revolut', category: 'banking', description: 'Affärsbankering — löner, leverantörsbetalningar, valutaväxling' },
    { name: 'Supabase', category: 'database', description: 'PostgreSQL-databas med realtid — all kärndata för Wavult OS' },
    { name: 'AWS ECS', category: 'infrastructure', description: 'Container-hosting — alla produktionstjänster i eu-north-1' },
    { name: 'Cloudflare', category: 'dns', description: 'DNS, CDN och säkerhet — alla Wavult-domäner' },
  ]

  for (const api of apis) {
    await triggerKnowledgeEvent('api.integrated', {
      name: api.name,
      category: api.category,
      description: api.description,
    })
    await sleep(2000)
  }
}

async function main() {
  console.log('🚀 Wavult Knowledge Engine — Seed-script')
  console.log('=========================================')
  console.log(`API: ${API_BASE}`)
  console.log(`Supabase: ${SUPABASE_URL}`)

  // Kontrollera att servern är igång
  try {
    const healthRes = await fetch(`${API_BASE}/health`)
    if (!healthRes.ok) throw new Error(`HTTP ${healthRes.status}`)
    console.log('✅ Server svarar\n')
  } catch {
    console.error(`\n❌ Servern svarar inte på ${API_BASE}`)
    console.error('   Starta servern med: cd server && npm run dev')
    console.error('   Kör sedan seed-scriptet igen.\n')
    process.exit(1)
  }

  await seedCompanies()
  await seedEcsServices()
  await seedCloudflareZones()
  await seedApiIntegrations()

  console.log('\n✅ Seed klar! Alla artiklar finns nu i knowledge_articles.')
  console.log('   Öppna Command Center → Kunskapsbas för att se resultatet.\n')
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
