import { CloudflareClient } from './client.js';

export interface FirewallRule {
  id: string;
  description: string;
  action: string;
  priority: number;
  paused: boolean;
  filter: { expression: string; paused: boolean };
}

export interface Ruleset {
  id: string;
  name: string;
  description: string;
  kind: 'managed' | 'custom' | 'root' | 'zone';
  phase: string;
  version: string;
}

export interface WAFConfig {
  firewallRules: FirewallRule[];
  rulesets: Ruleset[];
}

export class WAFService {
  constructor(private readonly client: CloudflareClient) {}

  /** Get legacy firewall rules for a zone. */
  async getFirewallRules(zoneId: string): Promise<FirewallRule[]> {
    const res = await this.client.cfFetch<FirewallRule[]>(
      `/zones/${zoneId}/firewall/rules?per_page=50`,
      'read',
    );
    return res.result;
  }

  /** Get all rulesets for a zone. */
  async getRulesets(zoneId: string): Promise<Ruleset[]> {
    const res = await this.client.cfFetch<Ruleset[]>(
      `/zones/${zoneId}/rulesets`,
      'read',
    );
    return res.result;
  }

  /** Get combined WAF configuration for a zone. */
  async getWAFConfig(zoneId: string): Promise<WAFConfig> {
    const [firewallRules, rulesets] = await Promise.all([
      this.getFirewallRules(zoneId),
      this.getRulesets(zoneId),
    ]);
    return { firewallRules, rulesets };
  }
}
