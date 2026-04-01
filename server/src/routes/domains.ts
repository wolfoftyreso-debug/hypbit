// ─── Domain Routes ─────────────────────────────────────────────────────────────
// GET /api/domains/status — Cloudflare zones with NS status and expiry

import { Router, Request, Response } from 'express'

const router = Router()

const CF_API = 'https://api.cloudflare.com/client/v4'

function cfHeaders(): Record<string, string> {
  const email = process.env.CF_EMAIL ?? process.env.CLOUDFLARE_EMAIL ?? ''
  const key = process.env.CLOUDFLARE_API_TOKEN ?? process.env.CF_GLOBAL_KEY ?? ''
  return {
    'X-Auth-Email': email,
    'X-Auth-Key': key,
    'Content-Type': 'application/json',
  }
}

function isCloudflarNS(ns: string): boolean {
  return ns.toLowerCase().includes('cloudflare.com')
}

// ─── GET /api/domains/status ─────────────────────────────────────────────────

router.get('/api/domains/status', async (_req: Request, res: Response) => {
  try {
    // Fetch all zones from Cloudflare account
    const zonesRes = await fetch(
      `${CF_API}/zones?account.id=${process.env.CF_ACCOUNT_ID ?? 'b65ff6fbc9b5a7a7da71bb0d3f1beb28'}&per_page=100`,
      { headers: cfHeaders() }
    )

    if (!zonesRes.ok) {
      const body = await zonesRes.text()
      return res.status(zonesRes.status).json({ error: `Cloudflare API: ${zonesRes.statusText}`, body })
    }

    const zonesData = await zonesRes.json() as {
      success: boolean;
      result: Array<{
        id: string;
        name: string;
        status: string;
        name_servers: string[];
        original_name_servers: string[];
        meta?: { registrar_name?: string };
        expires_on?: string;
      }>;
    }

    if (!zonesData.success) {
      return res.status(500).json({ error: 'Cloudflare API returned success=false' })
    }

    const domains = (zonesData.result ?? []).map(zone => {
      const ns = zone.name_servers ?? []
      const nsConfigured = ns.length > 0 && ns.every(n => isCloudflarNS(n))

      // status mapping
      let domainStatus: 'active' | 'pending' | 'inactive' | 'unknown' = 'unknown'
      if (zone.status === 'active') domainStatus = 'active'
      else if (zone.status === 'pending') domainStatus = 'pending'
      else if (zone.status === 'initializing' || zone.status === 'moved') domainStatus = 'pending'
      else if (zone.status === 'deactivated' || zone.status === 'deleted') domainStatus = 'inactive'

      return {
        name: zone.name,
        zoneId: zone.id,
        status: domainStatus,
        nsConfigured,
        currentNS: ns,
        nsRequired: ['amy.ns.cloudflare.com', 'dylan.ns.cloudflare.com'],
        expires: zone.expires_on ?? null,
        registrar: zone.meta?.registrar_name ?? null,
      }
    }).sort((a, b) => {
      // Active first, then by name
      if (a.status === 'active' && b.status !== 'active') return -1
      if (b.status === 'active' && a.status !== 'active') return 1
      return a.name.localeCompare(b.name)
    })

    return res.json({ domains, total: domains.length })
  } catch (err: unknown) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Serverfel' })
  }
})

// ─── POST /api/domains — lägg till ny Cloudflare-zon ─────────────────────────

router.post('/api/domains', async (req: Request, res: Response) => {
  try {
    const { name, account_id, jump_start } = req.body as { name: string; account_id?: string; jump_start?: boolean }

    if (!name) {
      return res.status(400).json({ error: 'name krävs' })
    }

    const payload = {
      name,
      account: { id: account_id ?? process.env.CF_ACCOUNT_ID ?? 'b65ff6fbc9b5a7a7da71bb0d3f1beb28' },
      jump_start: jump_start ?? true,
    }

    const createRes = await fetch(`${CF_API}/zones`, {
      method: 'POST',
      headers: cfHeaders(),
      body: JSON.stringify(payload),
    })

    const createData = await createRes.json() as { success: boolean; result?: { id: string; name: string; status: string; name_servers: string[] }; errors?: Array<{ message: string }> }

    if (!createData.success) {
      const msg = createData.errors?.[0]?.message ?? 'Cloudflare API error'
      return res.status(400).json({ error: msg })
    }

    const zone = createData.result!

    // ── Knowledge Engine: trigga AI-artikel för den nya domänen ──
    const PORT = process.env.PORT ?? 3001
    fetch(`http://localhost:${PORT}/api/knowledge/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'domain.added',
        entity: { name: zone.name, zoneId: zone.id, status: zone.status, nameservers: zone.name_servers },
      }),
    }).catch((err: unknown) => console.error('[knowledge-engine] Domain trigger misslyckades:', err))

    return res.status(201).json({ zone })
  } catch (err: unknown) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Serverfel' })
  }
})

export default router
