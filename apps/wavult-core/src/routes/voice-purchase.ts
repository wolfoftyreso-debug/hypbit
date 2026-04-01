/**
 * 46elks Number Purchase Helper
 *
 * Kör: npx tsx src/routes/voice-purchase.ts
 * Köper ett svenskt telefonnummer med röstkapacitet från 46elks.
 *
 * Kräver env vars:
 *   FORTYSIX_ELKS_USERNAME
 *   FORTYSIX_ELKS_PASSWORD
 *   PUBLIC_BASE_URL (t.ex. https://api.wavult.com)
 */

const ELKS_USER   = process.env.FORTYSIX_ELKS_USERNAME
const ELKS_PASS   = process.env.FORTYSIX_ELKS_PASSWORD
const PUBLIC_BASE = process.env.PUBLIC_BASE_URL || 'https://api.wavult.com'

async function purchaseNumber(): Promise<void> {
  if (!ELKS_USER || !ELKS_PASS) {
    console.error('Saknar FORTYSIX_ELKS_USERNAME och/eller FORTYSIX_ELKS_PASSWORD')
    process.exit(1)
  }

  const auth = 'Basic ' + Buffer.from(`${ELKS_USER}:${ELKS_PASS}`).toString('base64')

  // Lista tillgängliga nummer
  console.log('Hämtar tillgängliga svenska nummer...')
  const listRes = await fetch('https://api.46elks.com/a1/numbers?country=se&capabilities=voice', {
    headers: { Authorization: auth },
  })

  if (!listRes.ok) {
    console.error(`Kunde inte hämta nummer: ${listRes.status}`)
    process.exit(1)
  }

  const available = (await listRes.json()) as { data?: Array<{ number: string }> }
  console.log('Tillgängliga nummer:', available.data?.map((n) => n.number))

  // Köp ett nummer
  console.log('\nKöper nummer...')
  const form = new URLSearchParams({
    country: 'se',
    voice: `${PUBLIC_BASE}/voice/inbound`,
    capabilities: 'voice',
  })

  const buyRes = await fetch('https://api.46elks.com/a1/numbers', {
    method: 'POST',
    headers: {
      Authorization: auth,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  })

  const data = (await buyRes.json()) as Record<string, unknown>

  if (!buyRes.ok) {
    console.error('Köp misslyckades:', data)
    process.exit(1)
  }

  console.log('\nKöpt nummer:', data)
  console.log('\nLägg till i SSM:')
  console.log(`  FORTYSIX_ELKS_NUMBER = ${data['number'] ?? '(se ovan)'}`)
  console.log('\nSSM-kommando:')
  console.log(
    `  aws ssm put-parameter --name "/wavult/prod/FORTYSIX_ELKS_NUMBER" --value "${data['number'] ?? 'DITT_NUMMER'}" --type String --overwrite`
  )
}

purchaseNumber().catch((err: unknown) => {
  console.error('Fel:', err)
  process.exit(1)
})
