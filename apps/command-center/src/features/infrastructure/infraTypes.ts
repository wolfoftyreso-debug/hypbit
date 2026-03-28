// ─── Wavult OS — Infrastructure Types ────────────────────────────────────────
// WG-TECH-2026-INFRA — Datamodell för Infrastructure Operations Center

export type ServiceStatus = 'operational' | 'degraded' | 'down' | 'unknown' | 'maintenance'
export type AlertSeverity = 'info' | 'warning' | 'critical' | 'resolved'

export interface ServiceDefinition {
  id: string
  name: string
  category: 'compute' | 'database' | 'storage' | 'cdn' | 'api' | 'monitoring' | 'payment'
  provider: 'aws' | 'cloudflare' | 'supabase' | 'github' | 'stripe' | 'whoop' | 'mapbox' | 'other'
  endpoint?: string           // health check URL
  region?: string
  criticalityLevel: 1 | 2 | 3 // 1=kritisk, 2=viktig, 3=nice-to-have
  owner: string               // RoleId
  refCode: string             // WG-TECH-2026-XXX

  // Status
  status: ServiceStatus
  lastChecked: string | null
  uptime30d?: number          // procent

  // Betalning/kopplade kort
  billing?: {
    provider: string          // 'aws' | 'stripe' | 'revolut'
    accountId?: string
    monthlyEstimate: number   // SEK
    billingEmail: string
    cardLastFour?: string
    nextBillingDate?: string
    status: 'active' | 'trial' | 'unpaid' | 'cancelled'
  }

  // Failover
  failover?: {
    primary: string           // service id
    secondary?: string        // service id
    tertiary?: string         // service id
    autoFailover: boolean
    rto: string               // Recovery Time Objective: "5 min"
    rpo: string               // Recovery Point Objective: "1 timme"
  }

  // Larm
  alerts: ServiceAlert[]

  // Inställningar
  settings: Record<string, string | number | boolean>
}

export interface ServiceAlert {
  id: string
  serviceId: string
  severity: AlertSeverity
  message: string
  createdAt: string
  resolvedAt: string | null
  acknowledgedBy?: string
}

export interface InfraHealthCheck {
  serviceId: string
  url: string
  method: 'GET' | 'HEAD'
  expectedStatus: number
  timeout: number             // ms
  interval: number            // sekunder
}

export interface HealthCheckResult {
  serviceId: string
  status: ServiceStatus
  latency: number | null      // ms, null om check misslyckades
  lastChecked: string
  httpStatus?: number
  error?: string
}
