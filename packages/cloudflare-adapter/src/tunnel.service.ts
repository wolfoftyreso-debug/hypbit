import { CloudflareClient } from './client.js';

export interface Tunnel {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'degraded' | 'down';
  created_at: string;
  deleted_at?: string;
  connections: TunnelConnection[];
  remote_config: boolean;
  tun_type: string;
}

export interface TunnelConnection {
  id: string;
  client_id: string;
  client_version: string;
  colo_name: string;
  is_pending_reconnect: boolean;
  origin_ip: string;
  opened_at: string;
}

export class TunnelService {
  constructor(
    private readonly client: CloudflareClient,
    private readonly accountId: string,
  ) {}

  /** List all Cloudflare Tunnels. */
  async listTunnels(): Promise<Tunnel[]> {
    const res = await this.client.cfFetch<Tunnel[]>(
      `/accounts/${this.accountId}/cfd_tunnel?per_page=20`,
      'tunnel',
    );
    return res.result;
  }

  /** Get a single tunnel by ID. */
  async getTunnel(id: string): Promise<Tunnel> {
    const res = await this.client.cfFetch<Tunnel>(
      `/accounts/${this.accountId}/cfd_tunnel/${id}`,
      'tunnel',
    );
    return res.result;
  }

  /** Get tunnel status (active/inactive/down). */
  async getTunnelStatus(id: string): Promise<Tunnel['status']> {
    const tunnel = await this.getTunnel(id);
    return tunnel.status;
  }

  /** Get active connections for a tunnel. */
  async getTunnelConnections(id: string): Promise<TunnelConnection[]> {
    const tunnel = await this.getTunnel(id);
    return tunnel.connections ?? [];
  }
}
