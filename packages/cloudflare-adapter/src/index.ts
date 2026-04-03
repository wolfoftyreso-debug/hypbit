/**
 * @wavult/cloudflare-adapter
 *
 * Single entry point for all Cloudflare API operations in Wavult OS.
 *
 * ARCHITECTURE RULE: No other package may call api.cloudflare.com directly.
 * All Cloudflare interactions MUST go through this adapter.
 */

export { CloudflareClient, CloudflareError, CloudflareAuthError, CloudflareNotFoundError } from './client.js';
export type { CFClientConfig, CFResponse, TokenType } from './client.js';

export { DNSService } from './dns.service.js';
export type { DNSRecord, DNSRecordType, CreateDNSRecord } from './dns.service.js';

export { ZoneService } from './zone.service.js';
export type { Zone, ZoneAnalytics } from './zone.service.js';

export { PagesService } from './pages.service.js';
export type { PagesProject, PagesDeployment } from './pages.service.js';

export { TunnelService } from './tunnel.service.js';
export type { Tunnel, TunnelConnection } from './tunnel.service.js';

export { WAFService } from './waf.service.js';
export type { FirewallRule, Ruleset, WAFConfig } from './waf.service.js';

// ─── CloudflareAdapter (high-level facade) ─────────────────────────────────

import { CloudflareClient } from './client.js';
import { DNSService } from './dns.service.js';
import { ZoneService } from './zone.service.js';
import { PagesService } from './pages.service.js';
import { TunnelService } from './tunnel.service.js';
import { WAFService } from './waf.service.js';

const WAVULT_ACCOUNT_ID = 'b65ff6fbc9b5a7a7da71bb0d3f1beb28';

export interface CloudflareAdapterConfig {
  dnsToken?: string;
  readToken?: string;
  tunnelToken?: string;
  pagesToken?: string;
  accountId?: string;
}

export class CloudflareAdapter {
  public readonly dns: DNSService;
  public readonly zones: ZoneService;
  public readonly pages: PagesService;
  public readonly tunnels: TunnelService;
  public readonly waf: WAFService;
  private readonly client: CloudflareClient;

  constructor(config: CloudflareAdapterConfig = {}) {
    const dnsToken    = config.dnsToken    ?? process.env['CF_DNS_TOKEN']           ?? '';
    const readToken   = config.readToken   ?? process.env['CF_ZONE_READ_TOKEN']     ?? '';
    const tunnelToken = config.tunnelToken ?? process.env['CF_TUNNEL_TOKEN']        ?? '';
    const pagesToken  = config.pagesToken  ?? process.env['CLOUDFLARE_PAGES_TOKEN'] ?? '';
    const accountId   = config.accountId   ?? WAVULT_ACCOUNT_ID;

    if (!dnsToken || !readToken || !tunnelToken || !pagesToken) {
      throw new Error(
        'CloudflareAdapter: missing token(s). Ensure CF_DNS_TOKEN, CF_ZONE_READ_TOKEN, ' +
        'CF_TUNNEL_TOKEN, and CLOUDFLARE_PAGES_TOKEN are set in the environment.',
      );
    }

    this.client  = new CloudflareClient({ dnsToken, readToken, tunnelToken, pagesToken });
    this.dns     = new DNSService(this.client);
    this.zones   = new ZoneService(this.client);
    this.pages   = new PagesService(this.client, accountId);
    this.tunnels = new TunnelService(this.client, accountId);
    this.waf     = new WAFService(this.client);
  }

  /** Returns the request audit log (no token values included). */
  getRequestLog() {
    return this.client.getRequestLog();
  }

  /** Quick health check across DNS, Pages, and Tunnel. */
  async healthCheck(): Promise<{
    zones: number;
    pages: number;
    tunnelStatus: string;
    ok: boolean;
  }> {
    const [zones, projects, tunnels] = await Promise.all([
      this.zones.listZones(),
      this.pages.listProjects(),
      this.tunnels.listTunnels(),
    ]);

    const bernt = tunnels.find((t) => t.name === 'bernt-gateway');

    return {
      zones: zones.length,
      pages: projects.length,
      tunnelStatus: bernt?.status ?? 'not-found',
      ok: true,
    };
  }
}

/**
 * Factory function — reads tokens from environment automatically.
 * @example
 * const cf = createCloudflareAdapter();
 * const records = await cf.dns.getDNSRecords('5bed27e91d719b3f9d82c234d191ad99');
 */
export function createCloudflareAdapter(config?: CloudflareAdapterConfig): CloudflareAdapter {
  return new CloudflareAdapter(config);
}
