// Nordea Open Banking API Integration
// Docs: https://developer.nordeaopenbanking.com/
//
// SETUP:
// 1. Register at: https://developer.nordeaopenbanking.com/
// 2. Create app → get Client ID + Client Secret
// 3. Add redirect URI: https://app.wavult.com/oauth/nordea/callback
// 4. Set env: VITE_NORDEA_CLIENT_ID + NORDEA_CLIENT_SECRET (backend only)
// 5. Company org nr: 559141-7042 (Sommarliden Holding AB)
// NOTE: Mail sent to openbanking@nordea.com 2026-03-29 requesting access

export interface NordeaAccount {
  id: string
  account_numbers: Array<{ value: string; type: 'BBAN' | 'IBAN' }>
  currency: string
  product: string
  status: 'OPEN' | 'CLOSED'
  credit_limit?: { value: string; currency: string }
  available_balance?: { value: string; currency: string }
  booked_balance?: { value: string; currency: string }
}

export interface NordeaTransaction {
  transaction_id: string
  booking_date: string
  value_date: string
  amount: string
  currency: string
  credit_debit_indicator: 'CRDT' | 'DBIT'
  status: 'BOOK' | 'HOLD' | 'INFO' | 'OTHER'
  transaction_text?: string
  message?: string
  reference?: string
  debtor_name?: string
  creditor_name?: string
}

const NORDEA_BASE = 'https://api.nordeaopenbanking.com/v6'

export async function getNordeaAccounts(accessToken: string): Promise<NordeaAccount[]> {
  const res = await fetch(`${NORDEA_BASE}/accounts`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-IBM-Client-Id': import.meta.env.VITE_NORDEA_CLIENT_ID || '',
    }
  })
  if (!res.ok) throw new Error(`Nordea API error: ${res.status}`)
  const data = await res.json()
  return data.response || []
}

export async function getNordeaTransactions(
  accessToken: string,
  accountId: string,
  fromDate: string,
  toDate: string
): Promise<NordeaTransaction[]> {
  const params = new URLSearchParams({ fromDate, toDate })
  const res = await fetch(`${NORDEA_BASE}/accounts/${accountId}/transactions?${params}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-IBM-Client-Id': import.meta.env.VITE_NORDEA_CLIENT_ID || '',
    }
  })
  if (!res.ok) throw new Error(`Nordea transactions error: ${res.status}`)
  const data = await res.json()
  return data.response?.transactions || []
}
