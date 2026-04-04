// ─── OAuth SSO — Google, Microsoft, GitHub, Apple, GitLab, Bitbucket, Discord, Slack, LinkedIn ──
// Routes:
//   GET  /v1/auth/oauth/:provider          — initiate flow
//   GET  /v1/auth/oauth/:provider/callback — OAuth callback (browser redirect)
//   POST /v1/auth/oauth/apple/callback     — Apple form_post bridge

import { Router } from 'express'
import { Pool } from 'pg'
import { randomUUID } from 'crypto'

const router = Router()

const getDb = () =>
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

// ── Provider configs ──────────────────────────────────────────────────────────
const OAUTH_CONFIGS = {
  google: {
    auth_url:     'https://accounts.google.com/o/oauth2/v2/auth',
    token_url:    'https://oauth2.googleapis.com/token',
    userinfo_url: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scope:        'openid email profile',
    client_id:     process.env.GOOGLE_CLIENT_ID     || '',
    client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
  },
  microsoft: {
    auth_url:     'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    token_url:    'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    userinfo_url: 'https://graph.microsoft.com/v1.0/me',
    scope:        'openid email profile User.Read',
    client_id:     process.env.MICROSOFT_CLIENT_ID     || '',
    client_secret: process.env.MICROSOFT_CLIENT_SECRET || '',
  },
  github: {
    auth_url:     'https://github.com/login/oauth/authorize',
    token_url:    'https://github.com/login/oauth/access_token',
    userinfo_url: 'https://api.github.com/user',
    scope:        'user:email read:user',
    client_id:     process.env.GITHUB_CLIENT_ID     || '',
    client_secret: process.env.GITHUB_CLIENT_SECRET || '',
  },
  apple: {
    auth_url:     'https://appleid.apple.com/auth/authorize',
    token_url:    'https://appleid.apple.com/auth/token',
    userinfo_url: '',
    scope:        'name email',
    client_id:     process.env.APPLE_CLIENT_ID     || '',
    client_secret: process.env.APPLE_CLIENT_SECRET || '',
  },
  gitlab: {
    auth_url:     'https://gitlab.com/oauth/authorize',
    token_url:    'https://gitlab.com/oauth/token',
    userinfo_url: 'https://gitlab.com/api/v4/user',
    scope:        'read_user email',
    client_id:     process.env.GITLAB_CLIENT_ID     || '',
    client_secret: process.env.GITLAB_CLIENT_SECRET || '',
  },
  bitbucket: {
    auth_url:     'https://bitbucket.org/site/oauth2/authorize',
    token_url:    'https://bitbucket.org/site/oauth2/access_token',
    userinfo_url: 'https://api.bitbucket.org/2.0/user',
    scope:        'account email',
    client_id:     process.env.BITBUCKET_CLIENT_ID     || '',
    client_secret: process.env.BITBUCKET_CLIENT_SECRET || '',
  },
  discord: {
    auth_url:     'https://discord.com/api/oauth2/authorize',
    token_url:    'https://discord.com/api/oauth2/token',
    userinfo_url: 'https://discord.com/api/users/@me',
    scope:        'identify email',
    client_id:     process.env.DISCORD_CLIENT_ID     || '',
    client_secret: process.env.DISCORD_CLIENT_SECRET || '',
  },
  slack: {
    auth_url:     'https://slack.com/openid/connect/authorize',
    token_url:    'https://slack.com/api/openid.connect.token',
    userinfo_url: 'https://slack.com/api/openid.connect.userInfo',
    scope:        'openid email profile',
    client_id:     process.env.SLACK_CLIENT_ID     || '',
    client_secret: process.env.SLACK_CLIENT_SECRET || '',
  },
  linkedin: {
    auth_url:     'https://www.linkedin.com/oauth/v2/authorization',
    token_url:    'https://www.linkedin.com/oauth/v2/accessToken',
    userinfo_url: 'https://api.linkedin.com/v2/userinfo',
    scope:        'openid profile email',
    client_id:     process.env.LINKEDIN_CLIENT_ID     || '',
    client_secret: process.env.LINKEDIN_CLIENT_SECRET || '',
  },
  twitter: {
    auth_url:     'https://twitter.com/i/oauth2/authorize',
    token_url:    'https://api.twitter.com/2/oauth2/token',
    userinfo_url: 'https://api.twitter.com/2/users/me?user.fields=name,username,profile_image_url',
    scope:        'tweet.read users.read offline.access',
    client_id:     process.env.TWITTER_CLIENT_ID     || '',
    client_secret: process.env.TWITTER_CLIENT_SECRET || '',
  },
  atlassian: {
    auth_url:     'https://auth.atlassian.com/authorize',
    token_url:    'https://auth.atlassian.com/oauth/token',
    userinfo_url: 'https://api.atlassian.com/me',
    scope:        'read:me offline_access',
    client_id:     process.env.ATLASSIAN_CLIENT_ID     || '',
    client_secret: process.env.ATLASSIAN_CLIENT_SECRET || '',
  },
  twitch: {
    auth_url:     'https://id.twitch.tv/oauth2/authorize',
    token_url:    'https://id.twitch.tv/oauth2/token',
    userinfo_url: 'https://api.twitch.tv/helix/users',
    scope:        'user:read:email',
    client_id:     process.env.TWITCH_CLIENT_ID     || '',
    client_secret: process.env.TWITCH_CLIENT_SECRET || '',
  },
  figma: {
    auth_url:     'https://www.figma.com/oauth',
    token_url:    'https://www.figma.com/api/oauth/token',
    userinfo_url: 'https://api.figma.com/v1/me',
    scope:        'file_read',
    client_id:     process.env.FIGMA_CLIENT_ID     || '',
    client_secret: process.env.FIGMA_CLIENT_SECRET || '',
  },
  notion: {
    auth_url:     'https://api.notion.com/v1/oauth/authorize',
    token_url:    'https://api.notion.com/v1/oauth/token',
    userinfo_url: 'https://api.notion.com/v1/users/me',
    scope:        '',
    client_id:     process.env.NOTION_CLIENT_ID     || '',
    client_secret: process.env.NOTION_CLIENT_SECRET || '',
  },
  facebook: {
    auth_url:     'https://www.facebook.com/v18.0/dialog/oauth',
    token_url:    'https://graph.facebook.com/v18.0/oauth/access_token',
    userinfo_url: 'https://graph.facebook.com/me?fields=id,name,email',
    scope:        'email public_profile',
    client_id:     process.env.FACEBOOK_CLIENT_ID     || '',
    client_secret: process.env.FACEBOOK_CLIENT_SECRET || '',
  },
  digitalocean: {
    auth_url:     'https://cloud.digitalocean.com/v1/oauth/authorize',
    token_url:    'https://cloud.digitalocean.com/v1/oauth/token',
    userinfo_url: 'https://api.digitalocean.com/v2/account',
    scope:        'read',
    client_id:     process.env.DIGITALOCEAN_CLIENT_ID     || '',
    client_secret: process.env.DIGITALOCEAN_CLIENT_SECRET || '',
  },
  okta: {
    auth_url:     `https://${process.env.OKTA_DOMAIN || 'your-domain.okta.com'}/oauth2/v1/authorize`,
    token_url:    `https://${process.env.OKTA_DOMAIN || 'your-domain.okta.com'}/oauth2/v1/token`,
    userinfo_url: `https://${process.env.OKTA_DOMAIN || 'your-domain.okta.com'}/oauth2/v1/userinfo`,
    scope:        'openid email profile',
    client_id:     process.env.OKTA_CLIENT_ID     || '',
    client_secret: process.env.OKTA_CLIENT_SECRET || '',
  },
}

type Provider = keyof typeof OAUTH_CONFIGS

// ── State store (in-memory; use Redis in prod) ────────────────────────────────
const stateStore = new Map<string, {
  provider: Provider
  product: string
  redirect_uri: string
  created: number
}>()

const CALLBACK_BASE = 'https://api.wavult.com'

// ── GET /v1/auth/oauth/:provider — initiate OAuth flow ───────────────────────
router.get('/v1/auth/oauth/:provider', (req, res) => {
  const provider = req.params.provider as Provider
  const config = OAUTH_CONFIGS[provider]
  if (!config) return (res.status(400).json({ error: `Unknown provider: ${provider}` }), undefined)
  if (!config.client_id) return (res.status(503).json({ error: `${provider} OAuth not configured` }), undefined)

  const product      = (req.query.product      as string) || 'uapix'
  const redirect_uri = (req.query.redirect_uri as string) || `https://${product}.com/portal/login`

  const state = randomUUID()
  stateStore.set(state, { provider, product, redirect_uri, created: Date.now() })

  // Prune stale states (10 min TTL)
  const now = Date.now()
  for (const [k, v] of stateStore.entries()) {
    if (now - v.created > 600_000) stateStore.delete(k)
  }

  const params = new URLSearchParams({
    client_id:     config.client_id,
    redirect_uri:  `${CALLBACK_BASE}/v1/auth/oauth/${provider}/callback`,
    scope:         config.scope,
    response_type: 'code',
    state,
    ...(provider === 'microsoft' ? { response_mode: 'query' }     : {}),
    ...(provider === 'apple'     ? { response_mode: 'form_post' } : {}),
  })

  res.redirect(`${config.auth_url}?${params}`)
})

// ── POST /v1/auth/oauth/apple/callback — Apple form_post bridge ───────────────
router.post('/v1/auth/oauth/apple/callback', (req, res) => {
  const { code, state } = req.body as Record<string, string>
  res.redirect(`/v1/auth/oauth/apple/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`)
})

// ── GET /v1/auth/oauth/:provider/callback — exchange code + upsert customer ──
router.get('/v1/auth/oauth/:provider/callback', async (req, res) => {
  const provider = req.params.provider as Provider
  const { code, state, error } = req.query as Record<string, string>

  if (error) return (res.redirect(`/portal/login?error=${encodeURIComponent(error)}`), undefined)

  if (!state || !stateStore.has(state)) {
    return (res.redirect('/portal/login?error=invalid_state'), undefined)
  }

  const stateData = stateStore.get(state)!
  stateStore.delete(state)

  const config = OAUTH_CONFIGS[provider]
  if (!config) {
    return (res.redirect(`${stateData.redirect_uri}?error=unknown_provider`), undefined)
  }

  const db = getDb()

  try {
    // 1. Exchange code for access_token
    const tokenRes = await fetch(config.token_url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body:    new URLSearchParams({
        code,
        client_id:     config.client_id,
        client_secret: config.client_secret,
        redirect_uri:  `${CALLBACK_BASE}/v1/auth/oauth/${provider}/callback`,
        grant_type:    'authorization_code',
      }),
    })
    const tokenData    = await tokenRes.json() as Record<string, unknown>
    const access_token = (tokenData.access_token || tokenData.id_token) as string | undefined

    if (!access_token) {
      console.error('[oauth] token exchange failed', tokenData)
      return (res.redirect(`${stateData.redirect_uri}?error=token_exchange_failed`), undefined)
    }

    // 2. Fetch user info
    let email = ''
    let name  = ''

    if (provider === 'github') {
      const userRes = await fetch(config.userinfo_url, {
        headers: { Authorization: `Bearer ${access_token}`, 'User-Agent': 'Wavult-OAuth' },
      })
      const user = await userRes.json() as Record<string, unknown>
      name = (user.name as string) || (user.login as string) || ''

      const emailRes = await fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${access_token}`, 'User-Agent': 'Wavult-OAuth' },
      })
      const emails = await emailRes.json() as Array<{ email: string; primary: boolean }>
      email = emails.find(e => e.primary)?.email || emails[0]?.email || ''

    } else if (provider === 'microsoft') {
      const userRes = await fetch(config.userinfo_url, {
        headers: { Authorization: `Bearer ${access_token}` },
      })
      const user = await userRes.json() as Record<string, unknown>
      email = (user.mail as string) || (user.userPrincipalName as string) || ''
      name  = (user.displayName as string) || ''

    } else if (provider === 'gitlab') {
      const r2 = await fetch(config.userinfo_url, { headers: { Authorization: `Bearer ${access_token}` } })
      const u = await r2.json() as Record<string, unknown>
      email = (u.email as string) || ''
      name  = (u.name as string) || (u.username as string) || ''

    } else if (provider === 'bitbucket') {
      const r2 = await fetch(config.userinfo_url, { headers: { Authorization: `Bearer ${access_token}` } })
      const u = await r2.json() as Record<string, unknown>
      name = (u.display_name as string) || ''
      const emailR = await fetch('https://api.bitbucket.org/2.0/user/emails', { headers: { Authorization: `Bearer ${access_token}` } })
      const emails = await emailR.json() as { values?: Array<{ email: string; is_primary: boolean }> }
      email = emails.values?.find(e => e.is_primary)?.email || emails.values?.[0]?.email || ''

    } else if (provider === 'discord') {
      const r2 = await fetch(config.userinfo_url, { headers: { Authorization: `Bearer ${access_token}` } })
      const u = await r2.json() as Record<string, unknown>
      email = (u.email as string) || ''
      name  = (u.global_name as string) || (u.username as string) || ''

    } else if (provider === 'slack') {
      const r2 = await fetch(config.userinfo_url, { headers: { Authorization: `Bearer ${access_token}` } })
      const u = await r2.json() as Record<string, unknown>
      email = (u.email as string) || ''
      name  = (u.name as string) || ''

    } else if (provider === 'linkedin') {
      const r2 = await fetch(config.userinfo_url, { headers: { Authorization: `Bearer ${access_token}` } })
      const u = await r2.json() as Record<string, unknown>
      email = (u.email as string) || ''
      name  = (u.name as string) || ''

    } else if (provider === 'twitter') {
      const r2 = await fetch(config.userinfo_url, { headers: { Authorization: `Bearer ${access_token}` } })
      const u = await r2.json() as any
      name  = u.data?.name || u.data?.username || ''
      email = `${u.data?.username}@twitter.verified`

    } else if (provider === 'atlassian') {
      const r2 = await fetch(config.userinfo_url, { headers: { Authorization: `Bearer ${access_token}` } })
      const u = await r2.json() as any
      email = u.email || ''; name = u.name || u.displayName || ''

    } else if (provider === 'twitch') {
      const r2 = await fetch(config.userinfo_url, { headers: { Authorization: `Bearer ${access_token}`, 'Client-Id': config.client_id } })
      const u = await r2.json() as any
      const twitchUser = u.data?.[0]
      email = twitchUser?.email || `${twitchUser?.login}@twitch.verified`; name = twitchUser?.display_name || ''

    } else if (provider === 'figma') {
      const r2 = await fetch(config.userinfo_url, { headers: { Authorization: `Bearer ${access_token}` } })
      const u = await r2.json() as any
      email = u.email || ''; name = u.handle || ''

    } else if (provider === 'notion') {
      const r2 = await fetch(config.userinfo_url, { headers: { Authorization: `Bearer ${access_token}`, 'Notion-Version': '2022-06-28' } })
      const u = await r2.json() as any
      email = u.person?.email || `${u.id}@notion.verified`; name = u.name || ''

    } else if (provider === 'facebook') {
      const r2 = await fetch(config.userinfo_url, { headers: { Authorization: `Bearer ${access_token}` } })
      const u = await r2.json() as any
      email = u.email || ''; name = u.name || ''

    } else if (provider === 'digitalocean') {
      const r2 = await fetch(config.userinfo_url, { headers: { Authorization: `Bearer ${access_token}` } })
      const u = await r2.json() as any
      email = u.account?.email || ''; name = u.account?.name || ''

    } else if (provider === 'okta') {
      const r2 = await fetch(config.userinfo_url, { headers: { Authorization: `Bearer ${access_token}` } })
      const u = await r2.json() as any
      email = u.email || ''; name = u.name || ''

    } else {
      // google + apple (apple sends name in id_token, but we try userinfo first)
      if (config.userinfo_url) {
        const userRes = await fetch(config.userinfo_url, {
          headers: { Authorization: `Bearer ${access_token}` },
        })
        const user = await userRes.json() as Record<string, unknown>
        email = (user.email as string) || ''
        name  = (user.name as string)  || ''
      }
    }

    if (!email) {
      return (res.redirect(`${stateData.redirect_uri}?error=no_email`), undefined)
    }

    // 3. Upsert customer
    const table = stateData.product === 'apifly' ? 'apifly_customers' : 'uapix_customers'
    const { rows: [customer] } = await db.query<{
      id: string; email: string; name: string; plan: string
    }>(
      `INSERT INTO ${table} (email, name, status)
       VALUES ($1, $2, 'active')
       ON CONFLICT (email)
       DO UPDATE SET
         name       = COALESCE(EXCLUDED.name, ${table}.name),
         updated_at = NOW()
       RETURNING id, email, name, plan`,
      [email.toLowerCase(), name]
    )

    // 4. Generate session token (base64 JSON — same format as email login)
    const token = Buffer.from(JSON.stringify({
      id:       customer.id,
      email:    customer.email,
      name:     customer.name,
      plan:     customer.plan,
      provider,
      ts:       Date.now(),
    })).toString('base64')

    res.redirect(`${stateData.redirect_uri}?token=${encodeURIComponent(token)}&provider=${encodeURIComponent(provider)}`)

  } catch (err: unknown) {
    console.error('[oauth] callback error:', err)
    res.redirect(`${stateData.redirect_uri}?error=server_error`)
  } finally {
    await db.end()
  }
})

export default router
