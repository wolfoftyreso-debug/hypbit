import { CloudflareClient } from './client.js';

export interface Zone {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'initializing' | 'moved' | 'deleted' | 'deactivated';
  paused: boolean;
  type: string;
  name_servers: string[];
  original_name_servers: string[];
  created_on: string;
  modified_on: string;
}

export interface ZoneAnalytics {
  totals: {
    requests: { all: number; cached: number; uncached: number };
    bandwidth: { all: number; cached: number; uncached: number };
    threats: number;
    pageviews: { all: number };
    uniques: { all: number };
  };
}

export class ZoneService {
  constructor(private readonly client: CloudflareClient) {}

  /** List all zones in the account. */
  async listZones(): Promise<Zone[]> {
    const res = await this.client.cfFetch<Zone[]>('/zones?per_page=50', 'read');
    return res.result;
  }

  /** Get a single zone by ID. */
  async getZone(zoneId: string): Promise<Zone> {
    const res = await this.client.cfFetch<Zone>(`/zones/${zoneId}`, 'read');
    return res.result;
  }

  /** Find a zone by domain name. Returns undefined if not found. */
  async getZoneByName(name: string): Promise<Zone | undefined> {
    const zones = await this.listZones();
    return zones.find((z) => z.name === name);
  }

  /**
   * Get zone traffic analytics.
   * @param since - ISO timestamp or relative like "-1440" (minutes)
   */
  async getZoneAnalytics(zoneId: string, since = '-10080'): Promise<ZoneAnalytics> {
    const res = await this.client.cfFetch<ZoneAnalytics>(
      `/zones/${zoneId}/analytics/dashboard?since=${since}`,
      'read',
    );
    return res.result;
  }
}
