/**
 * Wavult OS — Cloudflare Module
 * 
 * ARKITEKTUREGEL: Alla Cloudflare-anrop går via denna modul.
 * Ingen annan del av systemet får anropa api.cloudflare.com direkt.
 * 
 * Token-mappning:
 *   CF_DNS_TOKEN       → DNS:Write, Zone:Read (alla zoner)
 *   CF_ZONE_READ_TOKEN → Zone:Read, DNS:Read (monitoring/healthcheck)
 *   CF_TUNNEL_TOKEN    → Cloudflare Tunnel:Write/Read
 *   CLOUDFLARE_PAGES_TOKEN (eller CRAAA) → Pages:Write/Read
 * 
 * Token IDs (värden i credentials.env, ALDRIG i kod):
 *   wavult-dns-manager:    3fca812d390ed64f37526a465574a9cc
 *   wavult-zone-read:      a029589b168a26816a0cf9cdaa4e9b75
 *   wavult-tunnel-manager: 3784523b6ea774a9068d5a51619eec0e
 *   Wrangler Pages Deploy 2026: d428b1c90d91764bee5bb112b97e2e75
 */

const CF_BASE = 'https://api.cloudflare.com/client/v4';
const ACCOUNT_ID = 'b65ff6fbc9b5a7a7da71bb0d3f1beb28';

type CFResponse<T = unknown> = {
  success: boolean;
  result: T;
  errors: Array<{ code: number; message: string }>;
};

function getToken(type: 'dns' | 'read' | 'tunnel' | 'pages'): string {
  const map = {
    dns:    process.env.CF_DNS_TOKEN,
    read:   process.env.CF_ZONE_READ_TOKEN,
    tunnel: process.env.CF_TUNNEL_TOKEN,
    pages:  process.env.CLOUDFLARE_PAGES_TOKEN,
  };
  const token = map[type];
  if (!token) throw new Error(`Missing Cloudflare token: CF_${type.toUpperCase()}_TOKEN`);
  return token;
}

async function cfFetch<T>(
  path: string,
  tokenType: 'dns' | 'read' | 'tunnel' | 'pages',
  options: RequestInit = {}
): Promise<CFResponse<T>> {
  const token = getToken(tokenType);
  const res = await fetch(`${CF_BASE}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  return res.json() as Promise<CFResponse<T>>;
}

// ─── DNS ────────────────────────────────────────────────────────────────────

export async function getDNSRecords(zoneId: string) {
  return cfFetch(`/zones/${zoneId}/dns_records?per_page=100`, 'dns');
}

export async function createDNSRecord(zoneId: string, record: {
  type: string; name: string; content: string; proxied?: boolean; ttl?: number;
}) {
  return cfFetch(`/zones/${zoneId}/dns_records`, 'dns', {
    method: 'POST',
    body: JSON.stringify(record),
  });
}

export async function updateDNSRecord(zoneId: string, recordId: string, record: object) {
  return cfFetch(`/zones/${zoneId}/dns_records/${recordId}`, 'dns', {
    method: 'PATCH',
    body: JSON.stringify(record),
  });
}

export async function deleteDNSRecord(zoneId: string, recordId: string) {
  return cfFetch(`/zones/${zoneId}/dns_records/${recordId}`, 'dns', {
    method: 'DELETE',
  });
}

// ─── ZONE INFO (read-only) ───────────────────────────────────────────────────

export async function listZones() {
  return cfFetch('/zones?per_page=50', 'read');
}

export async function getZone(zoneId: string) {
  return cfFetch(`/zones/${zoneId}`, 'read');
}

export async function getZoneAnalytics(zoneId: string) {
  return cfFetch(`/zones/${zoneId}/analytics/dashboard`, 'read');
}

// ─── PAGES ──────────────────────────────────────────────────────────────────

export async function listPagesProjects() {
  return cfFetch(`/accounts/${ACCOUNT_ID}/pages/projects`, 'pages');
}

export async function getPagesProject(projectName: string) {
  return cfFetch(`/accounts/${ACCOUNT_ID}/pages/projects/${projectName}`, 'pages');
}

export async function triggerPagesDeploy(projectName: string) {
  return cfFetch(`/accounts/${ACCOUNT_ID}/pages/projects/${projectName}/deployments`, 'pages', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

// ─── TUNNEL ─────────────────────────────────────────────────────────────────

export async function listTunnels() {
  return cfFetch(`/accounts/${ACCOUNT_ID}/cfd_tunnel`, 'tunnel');
}

export async function getTunnel(tunnelId: string) {
  return cfFetch(`/accounts/${ACCOUNT_ID}/cfd_tunnel/${tunnelId}`, 'tunnel');
}

export async function getTunnelConnections(tunnelId: string) {
  return cfFetch(`/accounts/${ACCOUNT_ID}/cfd_tunnel/${tunnelId}/connections`, 'tunnel');
}

// ─── HEALTHCHECK ────────────────────────────────────────────────────────────

export async function healthCheck(): Promise<{
  zones: number; pages: number; tunnel: string; ok: boolean;
}> {
  try {
    const [zones, pages, tunnels] = await Promise.all([
      listZones(),
      listPagesProjects(),
      listTunnels(),
    ]);

    const zoneCount = Array.isArray((zones as CFResponse<unknown[]>).result)
      ? (zones as CFResponse<unknown[]>).result.length : 0;
    const pagesCount = Array.isArray((pages as CFResponse<unknown[]>).result)
      ? (pages as CFResponse<unknown[]>).result.length : 0;
    const tunnelList = (tunnels as CFResponse<Array<{id: string; status: string; name: string}>>).result || [];
    const bernt = tunnelList.find((t) => t.name === 'bernt-gateway');

    return {
      zones: zoneCount,
      pages: pagesCount,
      tunnel: bernt?.status || 'not-found',
      ok: zones.success && pages.success,
    };
  } catch (err) {
    return { zones: 0, pages: 0, tunnel: 'error', ok: false };
  }
}

export default {
  getDNSRecords,
  createDNSRecord,
  updateDNSRecord,
  deleteDNSRecord,
  listZones,
  getZone,
  getZoneAnalytics,
  listPagesProjects,
  getPagesProject,
  triggerPagesDeploy,
  listTunnels,
  getTunnel,
  getTunnelConnections,
  healthCheck,
};
