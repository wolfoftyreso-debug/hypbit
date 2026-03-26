// ─── Deploy Blueprint — AWS Multi-Region Infrastructure ─────────────────────
// Production deployment architecture: EU + US + UAE regions.
// PCI-isolated vault. Event bus. Database topology.

import { DEPLOYMENT_BLUEPRINT, ARCH_LAYERS, getComponentById } from './paymentOsData'

// ─── Elite Stack Summary ────────────────────────────────────────────────────

interface StackItem {
  category: string
  components: { name: string; tech: string; role: string; repo: string | null }[]
}

const ELITE_STACK: StackItem[] = [
  {
    category: 'CORE',
    components: [
      { name: 'Hyperswitch', tech: 'Rust', role: 'Global payment switch', repo: 'juspay/hyperswitch' },
      { name: 'Custom Ledger', tech: 'PostgreSQL', role: 'Double-entry source of truth', repo: null },
      { name: 'Temporal', tech: 'Go', role: 'Workflow orchestration (exact-once)', repo: 'temporalio/temporal' },
    ],
  },
  {
    category: 'MONEY',
    components: [
      { name: 'Mojaloop', tech: 'Node.js', role: 'Intercompany settlement', repo: 'mojaloop/mojaloop' },
      { name: 'Moov', tech: 'Go', role: 'Banking primitives (ACH, RTP)', repo: 'moov-io/moov' },
    ],
  },
  {
    category: 'DATA',
    components: [
      { name: 'Kafka (MSK)', tech: 'Java', role: 'Event streaming', repo: null },
      { name: 'Aurora PostgreSQL', tech: 'PostgreSQL', role: 'Primary database', repo: null },
      { name: 'OpenMetadata', tech: 'Java', role: 'Data lineage (audit trail)', repo: 'open-metadata/OpenMetadata' },
    ],
  },
  {
    category: 'AUTOMATION',
    components: [
      { name: 'n8n', tech: 'TypeScript', role: 'Edge automation + glue', repo: 'n8n-io/n8n' },
      { name: 'AI Agents', tech: 'Python/TS', role: 'Financial AI (risk, reporting)', repo: null },
      { name: 'Rule Engine', tech: 'TypeScript', role: 'Compliance as code (YAML rules)', repo: null },
    ],
  },
  {
    category: 'COMPLIANCE',
    components: [
      { name: 'Audit Log', tech: 'PostgreSQL', role: 'Immutable append-only event log', repo: null },
      { name: 'Apache Superset', tech: 'Python', role: 'BI + financial reporting', repo: 'apache/superset' },
      { name: 'OpenFinTech', tech: 'JSON', role: 'ISO layer (banks, PSPs, currencies)', repo: 'openfintechio/openfintech' },
    ],
  },
]

// ─── AWS Infra Diagram ──────────────────────────────────────────────────────

function AWSInfraDiagram() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 mb-6">
      <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-4">AWS Infrastructure</h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
          <div className="text-[10px] text-[#22D3EE] font-bold mb-2">COMPUTE</div>
          <div className="space-y-1 text-[10px] text-gray-500">
            <div>EKS (Kubernetes) — ALL services</div>
            <div>ECS Fargate — simpler start option</div>
            <div>Lambda — FX engine, cron jobs</div>
          </div>
        </div>
        <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
          <div className="text-[10px] text-[#8B5CF6] font-bold mb-2">DATABASE</div>
          <div className="space-y-1 text-[10px] text-gray-500">
            <div>Aurora PostgreSQL — multi-region</div>
            <div>Write: EU (Stockholm)</div>
            <div>Read replicas: US + UAE</div>
          </div>
        </div>
        <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
          <div className="text-[10px] text-[#F59E0B] font-bold mb-2">EVENTING</div>
          <div className="space-y-1 text-[10px] text-gray-500">
            <div>EventBridge — business events</div>
            <div>MSK (Kafka) — payment streams</div>
            <div>SQS — async processing</div>
          </div>
        </div>
        <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
          <div className="text-[10px] text-[#EF4444] font-bold mb-2">SECURITY</div>
          <div className="space-y-1 text-[10px] text-gray-500">
            <div>Secrets Manager — credentials</div>
            <div>KMS — encryption at rest</div>
            <div>WAF + CloudFront — edge</div>
            <div>Route53 — geo routing</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Region Cards ───────────────────────────────────────────────────────────

function RegionCards() {
  const regionColor: Record<string, string> = {
    'eu-north-1 (Stockholm)': '#0EA5E9',
    'us-east-1 (Virginia)': '#22D3EE',
    'me-south-1 (Bahrain)': '#8B5CF6',
    'eu-north-1 (Stockholm)___vault': '#EF4444',
  }

  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Multi-Region Deployment</h3>
      <div className="space-y-3">
        {DEPLOYMENT_BLUEPRINT.map(node => {
          const color = node.id === 'deploy-vault' ? '#EF4444' : regionColor[node.region] ?? '#6B7280'
          return (
            <div key={node.id} className="rounded-xl border bg-white/[0.02] px-5 py-4"
              style={{ borderColor: color + '25' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold"
                  style={{ background: color + '20', color }}>
                  {node.region.split(' ')[0].split('-').map(s => s[0]).join('').toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{node.region}</div>
                  <div className="text-[10px] text-gray-600">{node.provider} — {node.purpose}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {node.services.map(svcId => {
                  const comp = getComponentById(svcId)
                  const layer = ARCH_LAYERS.find(l => l.components.some(c => c.id === svcId))
                  return comp ? (
                    <span key={svcId} className="text-[9px] px-2 py-0.5 rounded-lg font-mono"
                      style={{ background: (layer?.color ?? '#6B7280') + '15', color: layer?.color ?? '#6B7280' }}>
                      {comp.name}
                    </span>
                  ) : null
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Elite Stack Table ──────────────────────────────────────────────────────

function EliteStackTable() {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Elite Stack</h3>
      <div className="space-y-4">
        {ELITE_STACK.map(cat => (
          <div key={cat.category}>
            <div className="text-[10px] text-gray-700 font-mono mb-2">{cat.category}</div>
            <div className="space-y-1.5">
              {cat.components.map(comp => (
                <div key={comp.name} className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-white w-40 flex-shrink-0">{comp.name}</span>
                    <span className="text-[10px] font-mono text-gray-600 w-20 flex-shrink-0">{comp.tech}</span>
                    <span className="text-xs text-gray-400 flex-1">{comp.role}</span>
                    {comp.repo && (
                      <span className="text-[9px] text-gray-700 font-mono flex-shrink-0">{comp.repo}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Deploy Strategy ────────────────────────────────────────────────────────

function DeployStrategy() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Deploy Strategy</h3>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
          <div className="text-[10px] font-bold text-gray-400 mb-1">DEV</div>
          <div className="text-[10px] text-gray-600 space-y-0.5">
            <div>Local Docker + k3s</div>
            <div>Hot-reload all services</div>
            <div>Local PostgreSQL</div>
          </div>
        </div>
        <div className="rounded-lg border border-[#F59E0B20] bg-[#F59E0B06] p-3">
          <div className="text-[10px] font-bold text-[#F59E0B] mb-1">STAGING</div>
          <div className="text-[10px] text-gray-600 space-y-0.5">
            <div>Separate AWS account</div>
            <div>Full multi-region mirror</div>
            <div>Test payment data only</div>
          </div>
        </div>
        <div className="rounded-lg border border-[#10B98120] bg-[#10B98106] p-3">
          <div className="text-[10px] font-bold text-[#10B981] mb-1">PRODUCTION</div>
          <div className="text-[10px] text-gray-600 space-y-0.5">
            <div>Multi-region (EU + US)</div>
            <div>PCI-isolated vault</div>
            <div>High availability</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main ───────────────────────────────────────────────────────────────────

export function DeployView() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-white">Deployment Blueprint</h2>
          <p className="text-[10px] text-gray-600 mt-0.5">AWS multi-region infrastructure — EU + US + UAE</p>
        </div>

        <AWSInfraDiagram />
        <RegionCards />
        <EliteStackTable />
        <DeployStrategy />
      </div>
    </div>
  )
}
