// Revolut Business API Integration
// Docs: https://developer.revolut.com/docs/business/business-api
//
// SETUP:
// 1. Go to: https://app.revolut.com/business/api
// 2. Generate API certificate (RSA key pair)
// 3. Upload public key → get Client ID
// 4. Add redirect URI: https://app.wavult.com/oauth/revolut/callback
// 5. Save private key to: /home/erikwsl/.openclaw/secrets/revolut_private.pem
// 6. Set env: VITE_REVOLUT_CLIENT_ID

export interface RevolutAccount {
  id: string
  name: string
  balance: number
  currency: string
  state: 'active' | 'inactive'
  public: boolean
  type: 'current' | 'savings'
}

export interface RevolutTransaction {
  id: string
  type: string
  state: 'pending' | 'completed' | 'declined' | 'failed' | 'reverted'
  created_at: string
  updated_at: string
  completed_at?: string
  amount: number
  fee: number
  currency: string
  merchant?: { name: string; city: string; country_code: string; category_code: string }
  reference?: string
  description?: string
}

const REVOLUT_BASE = 'https://b2b.revolut.com/api/1.0'
export const REVOLUT_SANDBOX = 'https://sandbox-b2b.revolut.com/api/1.0'

export async function getRevolutAccounts(accessToken: string, sandbox = false): Promise<RevolutAccount[]> {
  const base = sandbox ? REVOLUT_SANDBOX : REVOLUT_BASE
  const res = await fetch(`${base}/accounts`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  })
  if (!res.ok) throw new Error(`Revolut API error: ${res.status}`)
  return res.json()
}

export async function getRevolutTransactions(
  accessToken: string,
  from: string,
  to: string,
  sandbox = false
): Promise<RevolutTransaction[]> {
  const base = sandbox ? REVOLUT_SANDBOX : REVOLUT_BASE
  const params = new URLSearchParams({ from, to, count: '1000' })
  const res = await fetch(`${base}/transactions?${params}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  })
  if (!res.ok) throw new Error(`Revolut transactions error: ${res.status}`)
  return res.json()
}
