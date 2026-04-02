/**
 * Revolut Business API — JWT Authentication
 * Revolut requires signed JWT client assertion, not simple refresh token
 * Docs: https://developer.revolut.com/docs/business/server-side-api-auth
 */
import * as crypto from 'crypto'
import * as https from 'https'

const REVOLUT_BASE = 'https://b2b.revolut.com/api/1.0'
const CLIENT_ID = process.env.REVOLUT_CLIENT_ID || ''
const PRIVATE_KEY = process.env.REVOLUT_PRIVATE_KEY || ''
// iss must be the domain registered with Revolut (without https://)
const ISSUER_DOMAIN = process.env.REVOLUT_ISSUER_DOMAIN || 'api.wavult.com'
let _accessToken: string | null = null
let _tokenExpiry = 0

function base64url(input: Buffer | string): string {
  const b64 = Buffer.isBuffer(input)
    ? input.toString('base64')
    : Buffer.from(input).toString('base64')
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function buildJWT(): string {
  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = base64url(JSON.stringify({
    iss: ISSUER_DOMAIN,
    sub: CLIENT_ID,
    aud: 'https://revolut.com',
    iat: now,
    exp: now + 180, // 3 minute JWT
  }))
  const signing_input = `${header}.${payload}`
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(signing_input)
  const signature = base64url(sign.sign(PRIVATE_KEY))
  return `${signing_input}.${signature}`
}

async function httpPost(path: string, body: string, headers: Record<string, string> = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(path.startsWith('http') ? path : REVOLUT_BASE + path)
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
        ...headers
      }
    }, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
        catch { resolve({ status: res.statusCode, body: data }) }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

async function httpGet(path: string, token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(path.startsWith('http') ? path : REVOLUT_BASE + path)
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    }, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
        catch { resolve({ status: res.statusCode, body: data }) }
      })
    })
    req.on('error', reject)
    req.end()
  })
}

export async function getRevolutToken(): Promise<string | null> {
  if (_accessToken && Date.now() < _tokenExpiry) return _accessToken
  if (!CLIENT_ID || !PRIVATE_KEY) {
    console.error('Revolut: REVOLUT_CLIENT_ID or REVOLUT_PRIVATE_KEY not set')
    return null
  }

  const REFRESH_TOKEN = process.env.REVOLUT_REFRESH_TOKEN || ''
  if (!REFRESH_TOKEN) { console.error('Revolut: REVOLUT_REFRESH_TOKEN not set'); return null }

  const jwt = buildJWT()
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: REFRESH_TOKEN,
    client_id: CLIENT_ID,
    client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    client_assertion: jwt,
  }).toString()

  const res = await httpPost('/auth/token', body)
  if (res.status === 200 && res.body.access_token) {
    _accessToken = res.body.access_token
    _tokenExpiry = Date.now() + (res.body.expires_in - 30) * 1000
    console.log('Revolut: token refreshed successfully')
    return _accessToken
  }
  console.error('Revolut token refresh failed:', res.status, JSON.stringify(res.body).slice(0, 200))
  return null
}

export async function getAccounts(): Promise<any[]> {
  const token = await getRevolutToken()
  if (!token) return []
  const res = await httpGet('/accounts', token)
  return res.status === 200 ? (Array.isArray(res.body) ? res.body : []) : []
}

export async function getTransactions(fromDate?: string, toDate?: string): Promise<any[]> {
  const token = await getRevolutToken()
  if (!token) return []
  const params = new URLSearchParams()
  if (fromDate) params.set('from', fromDate)
  if (toDate) params.set('to', toDate)
  const res = await httpGet(`/transactions?${params}`, token)
  return res.status === 200 ? (Array.isArray(res.body) ? res.body : []) : []
}

export async function createPayment(params: {
  amount: number
  currency: string
  description: string
  reference: string
  counterparty_id?: string
  account_id?: string
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const token = await getRevolutToken()
  if (!token) return { ok: false, error: 'No token' }

  const ACCOUNT_ID = process.env.REVOLUT_ACCOUNT_ID || ''
  const body = JSON.stringify({
    request_id: `wavult-${Date.now()}`,
    account_id: ACCOUNT_ID,
    receiver: params.counterparty_id ? { counterparty_id: params.counterparty_id } : undefined,
    amount: Math.round(params.amount * 100),
    currency: params.currency,
    reference: params.reference.slice(0, 18),
  })

  const res = await new Promise<any>((resolve, reject) => {
    const url = new URL(REVOLUT_BASE + '/pay')
    const req = https.request({
      hostname: url.hostname, path: url.pathname, method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let data = ''; res.on('data', c => data += c)
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(data) }) } catch { resolve({ status: res.statusCode, body: data }) } })
    })
    req.on('error', reject); req.write(body); req.end()
  })

  if (res.status === 200 && res.body.id) return { ok: true, id: res.body.id }
  return { ok: false, error: JSON.stringify(res.body).slice(0, 200) }
}
