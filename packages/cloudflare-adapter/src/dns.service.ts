import { CloudflareClient } from './client.js';

export type DNSRecordType =
  | 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'SRV'
  | 'NS' | 'CAA' | 'PTR' | 'SSHFP' | 'TLSA';

export interface DNSRecord {
  id: string;
  type: DNSRecordType;
  name: string;
  content: string;
  proxied: boolean;
  ttl: number;
  zone_id: string;
  zone_name: string;
  created_on: string;
  modified_on: string;
}

export interface CreateDNSRecord {
  type: DNSRecordType;
  name: string;
  content: string;
  proxied?: boolean;
  ttl?: number;
  priority?: number;
}

export class DNSService {
  constructor(private readonly client: CloudflareClient) {}

  /** List all DNS records in a zone. */
  async getDNSRecords(zoneId: string): Promise<DNSRecord[]> {
    const res = await this.client.cfFetch<DNSRecord[]>(
      `/zones/${zoneId}/dns_records?per_page=100`,
      'dns',
    );
    return res.result;
  }

  /** Create a new DNS record. */
  async createDNSRecord(zoneId: string, record: CreateDNSRecord): Promise<DNSRecord> {
    const res = await this.client.cfFetch<DNSRecord>(
      `/zones/${zoneId}/dns_records`,
      'dns',
      { method: 'POST', body: JSON.stringify(record) },
    );
    return res.result;
  }

  /** Partially update an existing DNS record. */
  async updateDNSRecord(
    zoneId: string,
    recordId: string,
    patch: Partial<CreateDNSRecord>,
  ): Promise<DNSRecord> {
    const res = await this.client.cfFetch<DNSRecord>(
      `/zones/${zoneId}/dns_records/${recordId}`,
      'dns',
      { method: 'PATCH', body: JSON.stringify(patch) },
    );
    return res.result;
  }

  /** Delete a DNS record by ID. */
  async deleteDNSRecord(zoneId: string, recordId: string): Promise<{ id: string }> {
    const res = await this.client.cfFetch<{ id: string }>(
      `/zones/${zoneId}/dns_records/${recordId}`,
      'dns',
      { method: 'DELETE' },
    );
    return res.result;
  }

  /**
   * Upsert a DNS record — finds an existing record matching type+name and updates it,
   * or creates a new one if none exists.
   */
  async upsertDNSRecord(zoneId: string, record: CreateDNSRecord): Promise<DNSRecord> {
    const existing = await this.getDNSRecords(zoneId);
    const match = existing.find(
      (r) => r.type === record.type && r.name === record.name,
    );
    if (match) {
      return this.updateDNSRecord(zoneId, match.id, record);
    }
    return this.createDNSRecord(zoneId, record);
  }
}
