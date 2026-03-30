// ─── System Graph — Wavult Infrastructure Map ────────────────────────────────
// Enterprise-grade, dark theme, readable nodes, layer filters.

import React, { useCallback, useState, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  Position,
  Handle,
  MarkerType,
  BackgroundVariant,
} from '@xyflow/react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceStatus = 'live' | 'degraded' | 'inactive' | 'pending'
type ServiceKind = 'api' | 'data' | 'edge' | 'automation' | 'event' | 'planned'
type LayerFilter = 'all' | ServiceKind

interface SystemNodeData {
  label: string
  sublabel?: string
  status: ServiceStatus
  kind: ServiceKind
  owner?: string
  latency?: string
  uptime?: string
  description?: string
}

// ─── Color tokens ─────────────────────────────────────────────────────────────

const KIND_COLOR: Record<ServiceKind, { border: string; label: string; dot: string }> = {
  api:        { border: '#3B82F6', label: 'API',        dot: '#3B82F6' },
  data:       { border: '#F97316', label: 'Data',       dot: '#F97316' },
  edge:       { border: '#06B6D4', label: 'Edge',       dot: '#06B6D4' },
  automation: { border: '#A855F7', label: 'Automation', dot: '#A855F7' },
  event:      { border: '#10B981', label: 'Event',      dot: '#10B981' },
  planned:    { border: '#52525B', label: 'Planned',    dot: '#52525B' },
}

const STATUS_COLOR: Record<ServiceStatus, string> = {
  live:     '#10B981',
  degraded: '#EF4444',
  inactive: '#52525B',
  pending:  '#F59E0B',
}

// ─── System Node ─────────────────────────────────────────────────────────────

function SystemNode({ data, selected }: { data: SystemNodeData; selected?: boolean }) {
  const kind = KIND_COLOR[data.kind]
  const statusColor = STATUS_COLOR[data.status]

  return (
    <div style={{
      background: selected ? '#1C1C1E' : '#141414',
      border: `1px solid ${selected ? kind.border : '#2A2A2A'}`,
      borderLeft: `3px solid ${kind.border}`,
      borderRadius: 6,
      padding: '10px 14px',
      minWidth: 200,
      maxWidth: 260,
      boxShadow: selected ? `0 0 0 1px ${kind.border}40, 0 4px 20px rgba(0,0,0,0.4)` : '0 2px 8px rgba(0,0,0,0.3)',
      fontFamily: 'ui-monospace, "SF Mono", monospace',
      cursor: 'pointer',
      transition: 'border 0.15s, box-shadow 0.15s',
    }}>
      <Handle type="target" position={Position.Left}
        style={{ background: kind.border, width: 7, height: 7, border: '2px solid #141414', left: -5 }} />
      <Handle type="source" position={Position.Right}
        style={{ background: kind.border, width: 7, height: 7, border: '2px solid #141414', right: -5 }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#F4F4F5', lineHeight: 1.3, letterSpacing: '-0.01em' }}>
            {data.label}
          </div>
          {data.sublabel && (
            <div style={{ fontSize: 10, color: '#71717A', marginTop: 2, lineHeight: 1.4, fontFamily: 'ui-monospace, monospace' }}>
              {data.sublabel}
            </div>
          )}
        </div>
        {/* Status dot */}
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: statusColor, flexShrink: 0, marginTop: 3,
          boxShadow: data.status === 'live' ? `0 0 6px ${statusColor}80` : 'none',
        }} />
      </div>

      {/* Metrics */}
      {(data.latency || data.uptime) && (
        <div style={{ display: 'flex', gap: 10, marginTop: 8, borderTop: '1px solid #2A2A2A', paddingTop: 6 }}>
          {data.latency && (
            <span style={{ fontSize: 9, color: '#52525B' }}>
              <span style={{ color: '#71717A' }}>p50 </span>
              <span style={{ color: '#A1A1AA' }}>{data.latency}</span>
            </span>
          )}
          {data.uptime && (
            <span style={{ fontSize: 9, color: '#52525B' }}>
              <span style={{ color: '#71717A' }}>up </span>
              <span style={{ color: '#A1A1AA' }}>{data.uptime}</span>
            </span>
          )}
        </div>
      )}

      {/* Kind badge */}
      <div style={{
        marginTop: 7,
        display: 'inline-block',
        padding: '1px 6px',
        borderRadius: 3,
        background: `${kind.border}18`,
        border: `1px solid ${kind.border}40`,
        fontSize: 9,
        fontWeight: 700,
        color: kind.border,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}>
        {kind.label}
      </div>
    </div>
  )
}

// ─── Layer Label Node ─────────────────────────────────────────────────────────

function LayerNode({ data }: { data: { label: string; sublabel?: string } }) {
  return (
    <div style={{
      background: 'transparent',
      border: '1px solid #1E1E1E',
      borderTop: '2px solid #2A2A2A',
      borderRadius: 8,
      padding: '8px 14px 6px',
      pointerEvents: 'none',
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#3F3F46', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {data.label}
      </div>
      {data.sublabel && (
        <div style={{ fontSize: 9, color: '#27272A', marginTop: 1 }}>{data.sublabel}</div>
      )}
    </div>
  )
}

// ─── Node Definitions ─────────────────────────────────────────────────────────
// Layout: left → right, 280px between layers, 120px between nodes vertically

const ALL_NODES: Node[] = [
  // ── Layer backgrounds ──────────────────────────────────────────────────────
  { id: 'l-edge', type: 'layer', position: { x: -20, y: -50 },
    data: { label: 'Edge', sublabel: 'CDN · DNS · WAF' },
    style: { width: 240, height: 380, zIndex: -1 }, draggable: false, selectable: false },
  { id: 'l-compute', type: 'layer', position: { x: 260, y: -50 },
    data: { label: 'Compute', sublabel: 'ECS Fargate · eu-north-1' },
    style: { width: 240, height: 640, zIndex: -1 }, draggable: false, selectable: false },
  { id: 'l-event', type: 'layer', position: { x: 540, y: -50 },
    data: { label: 'Event Backbone', sublabel: 'Kafka · async' },
    style: { width: 240, height: 140, zIndex: -1 }, draggable: false, selectable: false },
  { id: 'l-data', type: 'layer', position: { x: 540, y: 130 },
    data: { label: 'Data', sublabel: 'Supabase · RDS · S3 · DynamoDB' },
    style: { width: 240, height: 520, zIndex: -1 }, draggable: false, selectable: false },
  { id: 'l-automation', type: 'layer', position: { x: 820, y: -50 },
    data: { label: 'Automation', sublabel: 'n8n · Scheduler' },
    style: { width: 240, height: 260, zIndex: -1 }, draggable: false, selectable: false },
  { id: 'l-planned', type: 'layer', position: { x: 820, y: 250 },
    data: { label: 'Planned', sublabel: 'Thailand sprint' },
    style: { width: 240, height: 380, zIndex: -1 }, draggable: false, selectable: false },

  // ── Edge layer ─────────────────────────────────────────────────────────────
  { id: 'cloudflare', type: 'system', position: { x: 20, y: 20 },
    data: { label: 'Cloudflare', sublabel: 'DNS · WAF · CDN', status: 'live', kind: 'edge',
      owner: 'Johan', description: 'DNS, WAF, CDN for quixzoom.com + wavult.com + evasvensson.se' }},
  { id: 'cf-pages', type: 'system', position: { x: 20, y: 150 },
    data: { label: 'Cloudflare Pages', sublabel: 'wavult-os · landvex · optical-insight', status: 'live', kind: 'edge',
      owner: 'Johan', description: 'Static frontends — CF Pages CDN globally distributed' }},
  { id: 'alb', type: 'system', position: { x: 20, y: 280 },
    data: { label: 'ALB', sublabel: 'hypbit-api-alb · eu-north-1', status: 'live', kind: 'edge',
      owner: 'Johan', latency: '42ms', description: 'Application Load Balancer routing all API traffic' }},

  // ── Compute layer ──────────────────────────────────────────────────────────
  { id: 'wavult-api', type: 'system', position: { x: 280, y: 20 },
    data: { label: 'Wavult OS API', sublabel: 'hypbit-api · port 3001', status: 'live', kind: 'api',
      owner: 'Johan', latency: '42ms', uptime: '99.8%', description: 'Main Wavult OS backend. BOS tasks, auth, WHOOP, comms.' }},
  { id: 'quixzoom-api', type: 'system', position: { x: 280, y: 160 },
    data: { label: 'quiXzoom API', sublabel: 'quixzoom-api · Node.js', status: 'live', kind: 'api',
      owner: 'Johan', latency: '38ms', uptime: '99.1%', description: 'quiXzoom: missions, zoomers, submissions, payouts' }},
  { id: 'wavult-core', type: 'system', position: { x: 280, y: 300 },
    data: { label: 'Wavult Core', sublabel: 'Financial Engine · port 3007', status: 'live', kind: 'api',
      owner: 'Johan', description: 'Split engine, fraud detection, event bus, state machine' }},
  { id: 'landvex-api', type: 'system', position: { x: 280, y: 420 },
    data: { label: 'LandveX API', sublabel: 'port 3006 · B2G', status: 'live', kind: 'api',
      owner: 'Johan', description: 'B2G API: /v1/objects, /v1/alerts, BOS webhooks' }},
  { id: 'identity-core', type: 'system', position: { x: 280, y: 540 },
    data: { label: 'Identity Core', sublabel: 'port 3005 · JWT/KMS', status: 'live', kind: 'api',
      owner: 'Johan', description: 'Sovereign auth: Argon2id, JWT/KMS, session epochs' }},

  // ── Event backbone ─────────────────────────────────────────────────────────
  { id: 'kafka', type: 'system', position: { x: 560, y: 20 },
    data: { label: 'Kafka', sublabel: '172.31.25.69:9092 · ECS · EFS', status: 'live', kind: 'event',
      owner: 'Johan', description: '16 topics — wavult.missions.* · wavult.alerts.* · wavult.comms.send · wavult.system.audit' }},

  // ── Data layer ─────────────────────────────────────────────────────────────
  { id: 'supabase-wavult', type: 'system', position: { x: 560, y: 160 },
    data: { label: 'Supabase — Wavult OS', sublabel: 'znmxtnxx · eu-west-1', status: 'live', kind: 'data',
      description: 'BOS tasks, events, audit log, team_locations' }},
  { id: 'supabase-quixzoom', type: 'system', position: { x: 560, y: 290 },
    data: { label: 'Supabase — quiXzoom', sublabel: 'lpeipzdm · eu-west-1', status: 'live', kind: 'data',
      description: 'Missions, assignments, submissions, payouts' }},
  { id: 'rds', type: 'system', position: { x: 560, y: 420 },
    data: { label: 'RDS PostgreSQL', sublabel: 'wavult-identity · eu-north-1', status: 'live', kind: 'data',
      description: 'Identity Core DB: ic_users, ic_auth_events' }},
  { id: 'dynamo', type: 'system', position: { x: 560, y: 500 },
    data: { label: 'DynamoDB', sublabel: 'ic-sessions · ic-refresh-tokens', status: 'live', kind: 'data',
      description: 'Session store with TTL, strong consistent reads' }},
  { id: 's3-eu', type: 'system', position: { x: 560, y: 580 },
    data: { label: 'S3 EU', sublabel: 'wavult-images-eu-primary + backup', status: 'live', kind: 'data',
      description: 'EU image storage. CRR → eu-backup (STANDARD_IA). GDPR: never replicates to US.' }},

  // ── Automation layer ───────────────────────────────────────────────────────
  { id: 'n8n', type: 'system', position: { x: 840, y: 20 },
    data: { label: 'n8n', sublabel: 'port 5678 · EFS · Morning Brief', status: 'live', kind: 'automation',
      owner: 'Johan', description: 'Morning Brief, BOS webhooks, WHOOP sync, email via SES' }},
  { id: 'bos-scheduler', type: 'system', position: { x: 840, y: 150 },
    data: { label: 'BOS Scheduler', sublabel: '500ms loop · watchdog', status: 'live', kind: 'automation',
      owner: 'Johan', description: 'Job queue: DEADLINE_CHECK (5m), RECONCILE (10m), FLOW (15m)' }},

  // ── Planned layer ──────────────────────────────────────────────────────────
  { id: 'optical-insight', type: 'system', position: { x: 840, y: 290 },
    data: { label: 'Optical Insight', sublabel: 'Thailand sprint — not built', status: 'inactive', kind: 'planned',
      description: 'AI/optical analysis engine for LandveX. Triggers alerts from quiXzoom imagery.' }},
  { id: 'quixzoom-mobile', type: 'system', position: { x: 840, y: 420 },
    data: { label: 'quiXzoom Mobile', sublabel: 'Expo RN · TestFlight pending', status: 'pending', kind: 'planned',
      description: 'Zoomer field app. Code ready — needs Apple Dev Account + EAS build.' }},
  { id: 'wavult-mobile', type: 'system', position: { x: 840, y: 550 },
    data: { label: 'Wavult Mobile', sublabel: 'Expo RN · Bernt voice', status: 'pending', kind: 'planned',
      description: 'Internal team app. VoiceButton → Bernt. Wavult ID KYC. Siri shortcut.' }},
]

// ─── Edge Definitions ─────────────────────────────────────────────────────────

const edgeStyle = (type: 'sync' | 'async' | 'event'): Partial<Edge> => ({
  style: {
    stroke: type === 'event' ? '#10B981' : type === 'async' ? '#A855F7' : '#3F3F46',
    strokeWidth: 1.5,
    strokeDasharray: type === 'async' ? '5,3' : type === 'event' ? '3,3' : undefined,
  },
  markerEnd: {
    type: MarkerType.ArrowClosed, width: 10, height: 10,
    color: type === 'event' ? '#10B981' : type === 'async' ? '#A855F7' : '#3F3F46',
  },
  animated: type === 'event',
  type: 'smoothstep',
  labelStyle: { fontSize: 9, fill: '#52525B', fontFamily: 'ui-monospace, monospace' },
  labelBgStyle: { fill: '#0D0D0D', fillOpacity: 0.9 },
  labelBgPadding: [3, 5] as [number, number],
})

const ALL_EDGES: Edge[] = [
  // Edge → Compute
  { id: 'e1', source: 'cloudflare', target: 'cf-pages', label: 'DNS', ...edgeStyle('sync') },
  { id: 'e2', source: 'cloudflare', target: 'alb', label: 'route', ...edgeStyle('sync') },
  { id: 'e3', source: 'alb', target: 'wavult-api', label: 'api.*', ...edgeStyle('sync') },
  { id: 'e4', source: 'alb', target: 'quixzoom-api', label: 'api.quixzoom', ...edgeStyle('sync') },
  { id: 'e5', source: 'alb', target: 'identity-core', label: '/v1/auth', ...edgeStyle('sync') },
  { id: 'e6', source: 'alb', target: 'n8n', label: '/n8n/*', ...edgeStyle('sync') },

  // Compute → Kafka
  { id: 'ek1', source: 'wavult-api', target: 'kafka', label: 'publish', ...edgeStyle('event') },
  { id: 'ek2', source: 'quixzoom-api', target: 'kafka', label: 'publish', ...edgeStyle('event') },
  { id: 'ek3', source: 'landvex-api', target: 'kafka', label: 'publish', ...edgeStyle('event') },

  // Compute → Data
  { id: 'ed1', source: 'wavult-api', target: 'supabase-wavult', label: 'bos_tasks', ...edgeStyle('async') },
  { id: 'ed2', source: 'quixzoom-api', target: 'supabase-quixzoom', label: 'missions', ...edgeStyle('async') },
  { id: 'ed3', source: 'quixzoom-api', target: 's3-eu', label: 'images', ...edgeStyle('async') },
  { id: 'ed4', source: 'identity-core', target: 'rds', label: 'ic_users', ...edgeStyle('async') },
  { id: 'ed5', source: 'identity-core', target: 'dynamo', label: 'sessions', ...edgeStyle('async') },

  // Automation
  { id: 'ea1', source: 'bos-scheduler', target: 'supabase-wavult', label: 'poll', ...edgeStyle('async') },
  { id: 'ea2', source: 'n8n', target: 'wavult-api', label: 'webhooks', ...edgeStyle('async') },

  // Planned
  { id: 'ep1', source: 'quixzoom-api', target: 'optical-insight', label: 'images', ...edgeStyle('async') },
  { id: 'ep2', source: 'landvex-api', target: 'optical-insight', label: 'alerts', ...edgeStyle('async') },
]

// ─── Filter bar ───────────────────────────────────────────────────────────────

const FILTERS: { key: LayerFilter; label: string }[] = [
  { key: 'all',        label: 'All' },
  { key: 'edge',       label: 'Edge' },
  { key: 'api',        label: 'API' },
  { key: 'event',      label: 'Events' },
  { key: 'data',       label: 'Data' },
  { key: 'automation', label: 'Automation' },
  { key: 'planned',    label: 'Planned' },
]

// ─── Main Component ───────────────────────────────────────────────────────────

const nodeTypes = { system: SystemNode, layer: LayerNode }

export function SystemGraph() {
  const [filter, setFilter] = useState<LayerFilter>('all')
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)

  const visibleNodes = useMemo(() => {
    if (filter === 'all') return ALL_NODES
    return ALL_NODES.filter(n =>
      n.type === 'layer' ||
      (n.data as SystemNodeData).kind === filter
    )
  }, [filter])

  const visibleEdges = useMemo(() => {
    const ids = new Set(visibleNodes.map(n => n.id))
    return ALL_EDGES.filter(e => ids.has(e.source) && ids.has(e.target))
  }, [visibleNodes])

  const [nodes, , onNodesChange] = useNodesState(visibleNodes)
  const [edges, , onEdgesChange] = useEdgesState(visibleEdges)

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === 'layer') return
    setSelectedNode(prev => prev?.id === node.id ? null : node)
  }, [])

  const liveCount = ALL_NODES.filter(n => n.type === 'system' && (n.data as SystemNodeData).status === 'live').length
  const degradedCount = ALL_NODES.filter(n => n.type === 'system' && (n.data as SystemNodeData).status === 'degraded').length
  const pendingCount = ALL_NODES.filter(n => n.type === 'system' && ['inactive', 'pending'].includes((n.data as SystemNodeData).status)).length
  const selectedData = selectedNode?.data as unknown as SystemNodeData | undefined

  return (
    <div style={{ height: '100%', display: 'flex', background: '#0A0A0A', fontFamily: 'ui-monospace, "SF Mono", monospace' }}>
      {/* Graph canvas */}
      <div style={{ flex: 1, position: 'relative' }}>

        {/* Top bar */}
        <div style={{
          position: 'absolute', top: 12, left: 12, right: 12, zIndex: 20,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          {/* Status */}
          <div style={{
            background: '#141414', border: '1px solid #2A2A2A', borderRadius: 6,
            padding: '7px 14px', display: 'flex', gap: 16, alignItems: 'center',
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#A1A1AA', letterSpacing: '0.1em' }}>WAVULT SYSTEM</span>
            <div style={{ width: 1, height: 12, background: '#2A2A2A' }} />
            {[
              { color: '#10B981', label: `${liveCount} Live` },
              { color: '#EF4444', label: `${degradedCount} Degraded` },
              { color: '#52525B', label: `${pendingCount} Planned` },
            ].map(({ color, label }) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#71717A' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: color === '#10B981' ? `0 0 5px ${color}80` : 'none' }} />
                {label}
              </span>
            ))}
          </div>

          {/* Layer filters */}
          <div style={{
            display: 'flex', gap: 4, background: '#141414',
            border: '1px solid #2A2A2A', borderRadius: 6, padding: 4,
          }}>
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => { setFilter(f.key); setSelectedNode(null) }}
                style={{
                  padding: '4px 10px', borderRadius: 4, border: 'none', cursor: 'pointer',
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.04em',
                  background: filter === f.key ? '#2A2A2A' : 'transparent',
                  color: filter === f.key ? '#F4F4F5' : '#52525B',
                  transition: 'all 0.15s',
                }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div style={{
          position: 'absolute', bottom: 52, left: 12, zIndex: 20,
          background: '#141414', border: '1px solid #2A2A2A', borderRadius: 6,
          padding: '10px 12px',
        }}>
          <div style={{ fontSize: 8, fontWeight: 700, color: '#3F3F46', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7 }}>Edges</div>
          {[
            { color: '#3F3F46', dash: undefined, label: 'Sync (HTTP)' },
            { color: '#A855F7', dash: '5,3', label: 'Async (Event)' },
            { color: '#10B981', dash: '3,3', label: 'Kafka stream' },
          ].map(({ color, dash, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <svg width="24" height="10">
                <line x1="0" y1="5" x2="24" y2="5"
                  stroke={color} strokeWidth="1.5"
                  strokeDasharray={dash}
                />
              </svg>
              <span style={{ fontSize: 9, color: '#52525B' }}>{label}</span>
            </div>
          ))}
        </div>

        <ReactFlow
          nodes={filter === 'all' ? nodes : visibleNodes}
          edges={filter === 'all' ? edges : visibleEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          style={{ background: '#0A0A0A' }}
          minZoom={0.15}
          maxZoom={2.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={28} size={1} color="#1A1A1A" />
          <Controls
            showInteractive={false}
            style={{
              bottom: 12, right: selectedNode ? 312 : 12, top: 'auto',
              background: '#141414', border: '1px solid #2A2A2A', borderRadius: 6,
            }}
          />
        </ReactFlow>
      </div>

      {/* Detail panel */}
      {selectedNode && selectedData && (
        <div style={{
          width: 300, borderLeft: '1px solid #1E1E1E',
          background: '#0D0D0D', padding: '20px', overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#F4F4F5', letterSpacing: '-0.01em' }}>
                {selectedData.label}
              </div>
              <div style={{ fontSize: 10, color: '#52525B', marginTop: 3, fontFamily: 'ui-monospace' }}>
                {selectedData.sublabel}
              </div>
            </div>
            <button onClick={() => setSelectedNode(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3F3F46', fontSize: 16, padding: 2, lineHeight: 1 }}>
              ✕
            </button>
          </div>

          {/* Status badge */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 4,
              background: `${STATUS_COLOR[selectedData.status]}18`,
              border: `1px solid ${STATUS_COLOR[selectedData.status]}30`,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: STATUS_COLOR[selectedData.status] }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: STATUS_COLOR[selectedData.status], letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {selectedData.status}
              </span>
            </div>
            <div style={{
              padding: '4px 10px', borderRadius: 4,
              background: `${KIND_COLOR[selectedData.kind].border}18`,
              border: `1px solid ${KIND_COLOR[selectedData.kind].border}30`,
              fontSize: 10, fontWeight: 700, color: KIND_COLOR[selectedData.kind].border,
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              {KIND_COLOR[selectedData.kind].label}
            </div>
          </div>

          {/* Description */}
          <div style={{
            padding: '12px', background: '#141414', borderRadius: 6,
            fontSize: 11, color: '#A1A1AA', lineHeight: 1.7,
            border: '1px solid #1E1E1E',
          }}>
            {selectedData.description || 'No description.'}
          </div>

          {/* Metrics */}
          {(selectedData.owner || selectedData.latency || selectedData.uptime) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[
                selectedData.owner   && ['Owner',   selectedData.owner],
                selectedData.latency && ['p50',     selectedData.latency],
                selectedData.uptime  && ['Uptime',  selectedData.uptime],
              ].filter(Boolean).map(([k, v]) => (
                <div key={String(k)} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1A1A1A', fontSize: 11 }}>
                  <span style={{ color: '#3F3F46' }}>{String(k)}</span>
                  <span style={{ color: '#A1A1AA', fontFamily: 'ui-monospace' }}>{String(v)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
