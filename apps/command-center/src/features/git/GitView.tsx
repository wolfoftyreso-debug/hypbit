/**
 * Git View — Repo + Version Thumbnails
 * ARKIV (left) → LIVE 🟢🔒 (center, largest) → DEV (right)
 * Live data from Gitea API. Topics: status-live/dev/archive, domain-xxx-xxx
 */
import { useState } from 'react'
import { useGiteaRepos, useGiteaBranches, GiteaRepo, GiteaBranch } from './useGiteaRepos'

type RepoStatus = 'live' | 'dev' | 'offline' | 'archive'
type SortKey = 'status' | 'name'

interface Version {
  id: string
  slot: 'archive' | 'live' | 'dev'
  version: string
  url?: string
  label?: string
}

interface Repo {
  id: string
  name: string
  domain: string
  repo_url: string
  status: RepoStatus
  description: string
  versions: Version[]
  heroImage?: string
  isApp?: boolean
  fullName: string
}

// ── Mapping helpers ────────────────────────────────────────────────────────────

const slotMap: Record<string, 'live' | 'dev' | 'archive'> = {
  live: 'live', production: 'live',
  dev: 'dev', 'in-development': 'dev', 'pre-launch': 'dev',
  archive: 'archive', legacy: 'archive', offline: 'archive',
}

function branchToSlot(branchName: string): 'live' | 'dev' | 'archive' | null {
  const n = branchName.toLowerCase()
  if (n === 'main' || n === 'master') return 'live'
  if (n === 'dev' || n === 'develop' || n === 'staging') return 'dev'
  if (n === 'archive' || n === 'legacy') return 'archive'
  return null
}

function giteaToRepo(r: GiteaRepo): Repo {
  const topics = r.topics ?? []
  const statusTag = topics.find(t => t.startsWith('status-'))?.replace('status-', '') ?? 'dev'
  const domainTag = topics
    .find(t => t.startsWith('domain-'))
    ?.replace('domain-', '')
    .replace(/-/g, '.') ?? ''

  const slot = slotMap[statusTag] ?? 'dev'
  const liveUrl = r.website || (domainTag ? `https://${domainTag}` : undefined)

  return {
    id: `gitea-${r.id}`,
    name: r.name,
    fullName: r.full_name,
    domain: domainTag || r.name,
    status: slot === 'live' ? 'live' : 'dev',
    description: r.description || '',
    repo_url: r.html_url,
    heroImage: liveUrl ? `https://image.thum.io/get/width/1200/${liveUrl}` : undefined,
    isApp: topics.includes('app') || r.name.includes('mobile') || r.name.includes('app'),
    versions: [
      {
        id: `${r.id}-${slot}`,
        slot,
        version: r.default_branch || 'main',
        url: liveUrl,
        label: slot === 'live' ? 'Production' : slot === 'dev' ? 'Development' : 'Archive',
      }
    ]
  }
}

function branchesToVersions(repoId: number, branches: GiteaBranch[], baseUrl?: string): Version[] {
  const versions: Version[] = []
  for (const b of branches) {
    const slot = branchToSlot(b.name)
    if (!slot) continue
    versions.push({
      id: `${repoId}-branch-${b.name}`,
      slot,
      version: b.name,
      url: slot === 'live' ? baseUrl : undefined,
      label: slot === 'live' ? 'Production' : slot === 'dev' ? 'Development' : 'Archive',
    })
  }
  // Deduplicate by slot (keep first)
  const seen = new Set<string>()
  return versions.filter(v => { if (seen.has(v.slot)) return false; seen.add(v.slot); return true })
}

// ── Lock SVG ──────────────────────────────────────────────────────────────────
const LockIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ display: 'inline', flexShrink: 0 }}>
    <rect x="3" y="11" width="18" height="11" rx="2" fill="#0A3D62" stroke="#E8B84B" strokeWidth="1.5" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#0A3D62" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="16" r="1.5" fill="#E8B84B" />
  </svg>
)

// ── Viewports ─────────────────────────────────────────────────────────────────
const VIEWPORTS = [
  { id: 'desktop', label: '🖥 Desktop', width: '100%', height: '100%' },
  { id: 'ipad', label: '⬜ iPad', width: '768px', height: '1024px' },
  { id: 'mobile', label: '📱 Mobile', width: '390px', height: '844px' },
]

// ── Cockpit overlay ───────────────────────────────────────────────────────────
function CockpitOverlay({
  url, label, isLive, onClose,
}: {
  url?: string; label: string; isLive: boolean; onClose: () => void
}) {
  const [viewport, setViewport] = useState('desktop')
  const [iframeBlocked, setIframeBlocked] = useState(false)
  const vp = VIEWPORTS.find(v => v.id === viewport) || VIEWPORTS[0]

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#050510', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', background: '#0A0A1A', borderBottom: '1px solid rgba(232,184,75,.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: isLive ? '#00FF88' : '#FFB800' }} />
          <span style={{ color: '#E8B84B', fontFamily: 'monospace', fontSize: 12, fontWeight: 700 }}>COCKPIT — {label.toUpperCase()}</span>
          {!isLive && <span style={{ background: '#332200', color: '#FFB800', padding: '2px 8px', borderRadius: 3, fontSize: 9, fontFamily: 'monospace', fontWeight: 700 }}>SANDBOX</span>}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {VIEWPORTS.map(v => (
            <button key={v.id} onClick={() => setViewport(v.id)} style={{ background: viewport === v.id ? 'rgba(232,184,75,.2)' : 'rgba(255,255,255,.06)', border: `1px solid ${viewport === v.id ? '#E8B84B' : 'rgba(255,255,255,.1)'}`, color: viewport === v.id ? '#E8B84B' : 'rgba(255,255,255,.5)', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12, transition: 'all .15s' }}>
              {v.label}
            </button>
          ))}
          <button onClick={onClose} style={{ background: '#E8B84B', border: 'none', color: '#050510', padding: '5px 14px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>✕</button>
        </div>
      </div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 320px', overflow: 'hidden' }}>
        <div style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080818' }}>
          <div style={{ width: vp.width, height: vp.height, border: viewport !== 'desktop' ? '2px solid rgba(255,255,255,.1)' : 'none', borderRadius: viewport === 'mobile' ? '20px' : viewport === 'ipad' ? '12px' : '0', overflow: 'hidden', transition: 'all .3s', position: 'relative', flexShrink: 0 }}>
            {url && !iframeBlocked ? (
              <iframe
                src={url}
                style={{ width: '100%', height: '100%', border: 'none' }}
                sandbox={isLive ? 'allow-scripts allow-same-origin allow-forms' : 'allow-scripts'}
                onError={() => setIframeBlocked(true)}
              />
            ) : iframeBlocked ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 16, background: '#0A0A1A' }}>
                <span style={{ fontSize: 36 }}>🔒</span>
                <span style={{ color: 'rgba(255,255,255,.4)', fontFamily: 'monospace', fontSize: 12, textAlign: 'center' }}>
                  Sajten blockerar inbäddning<br />
                  <span style={{ opacity: .5, fontSize: 10 }}>X-Frame-Options / CSP</span>
                </span>
                {url && (
                  <a href={url} target="_blank" rel="noopener noreferrer"
                    style={{ padding: '8px 20px', background: '#E8B84B', color: '#050510', borderRadius: 6, textDecoration: 'none', fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>
                    Öppna i nytt fönster ↗
                  </a>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12 }}>
                <span style={{ fontSize: 48 }}>🚧</span>
                <span style={{ color: 'rgba(255,255,255,.3)', fontFamily: 'monospace', fontSize: 13 }}>No URL configured</span>
              </div>
            )}
            {!isLive && (
              <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' }}>
                <span style={{ background: 'rgba(51,34,0,.9)', color: '#FFB800', padding: '6px 16px', borderRadius: 6, fontFamily: 'monospace', fontSize: 11, fontWeight: 700 }}>⚠ SANDBOX</span>
              </div>
            )}
          </div>
        </div>
        <div style={{ background: '#080818', borderLeft: '1px solid rgba(232,184,75,.12)', padding: 16, overflow: 'auto' }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,.3)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 8 }}>Site</div>
          <div style={{ background: '#0A0A1A', borderRadius: 6, padding: '10px 12px', fontFamily: 'monospace', fontSize: 11, color: 'rgba(245,240,232,.7)', lineHeight: 1.8, marginBottom: 16 }}>
            <div><span style={{ color: 'rgba(255,255,255,.3)' }}>URL: </span>{url || '—'}</div>
            <div><span style={{ color: 'rgba(255,255,255,.3)' }}>STATUS: </span><span style={{ color: isLive ? '#00FF88' : '#FFB800' }}>{isLive ? '● LIVE' : '○ SANDBOX'}</span></div>
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,.3)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 8 }}>Controls</div>
          {['🚀 Deploy', '🗄 Database', '🌐 CDN', '🔐 Auth', '📊 Stats'].map(c => (
            <button key={c} style={{ width: '100%', background: '#0D0D28', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.6)', padding: '7px 12px', borderRadius: 5, cursor: 'pointer', fontSize: 11, fontFamily: 'monospace', textAlign: 'left', marginBottom: 6, transition: 'all .15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E8B84B'; (e.currentTarget as HTMLElement).style.color = '#E8B84B' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,.1)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,.6)' }}
            >{c}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Version Thumbnail ──────────────────────────────────────────────────────────
function Thumb({ v, repoName, repo, onClick }: { v: Version; repoName: string; repo: Repo; onClick: () => void }) {
  const isLive = v.slot === 'live'
  const isApp = !!repoName.match(/mobile|app|ios|android/i) || !!repo.isApp
  const W = isApp ? (isLive ? 390 : 300) : (isLive ? 720 : 540)
  const H = isApp ? (isLive ? 720 : 555) : (isLive ? 450 : 345)

  const colors = {
    archive: { border: 'rgba(10,61,98,.2)', bg: 'rgba(10,61,98,.04)', tag: 'ARKIV', tagColor: 'rgba(10,61,98,.45)' },
    live: { border: 'rgba(45,122,79,.55)', bg: 'rgba(45,122,79,.05)', tag: 'LIVE', tagColor: '#1A5C3A' },
    dev: { border: 'rgba(232,184,75,.4)', bg: 'rgba(232,184,75,.07)', tag: 'DEV', tagColor: '#8B6914' },
  }[v.slot]

  return (
    <div
      onClick={onClick}
      style={{ width: W, cursor: 'pointer', borderRadius: isApp ? 20 : 10, overflow: 'hidden', border: `1.5px solid ${colors.border}`, background: colors.bg, transition: 'transform .15s, box-shadow .15s', flexShrink: 0, boxShadow: isApp ? 'inset 0 0 0 3px rgba(10,61,98,.08)' : 'none' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 28px rgba(10,61,98,.14)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '' }}
    >
      {/* Hero image */}
      <div style={{ width: '100%', height: H, overflow: 'hidden', position: 'relative', background: '#F5F0E8' }}>
        {repo.heroImage ? (
          <img
            src={repo.heroImage}
            alt={`${repo.name} screenshot`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }}
            onError={e => {
              (e.currentTarget as HTMLImageElement).style.display = 'none'
              const fb = e.currentTarget.nextSibling as HTMLElement
              if (fb) fb.style.display = 'flex'
            }}
          />
        ) : null}
        <div style={{ display: repo.heroImage ? 'none' : 'flex', position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', background: '#F5F0E8' }}>
          <span style={{ fontSize: 28, opacity: 0.35 }}>🌐</span>
        </div>
        {isApp && (
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 40, height: 14, background: colors.bg, borderRadius: '0 0 10px 10px', zIndex: 2 }} />
        )}
        {isLive && (
          <div style={{ position: 'absolute', top: 7, right: 7, background: '#2D7A4F', borderRadius: 20, padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#7AE0A6' }} />
            <span style={{ fontSize: 8, fontWeight: 700, color: 'white', fontFamily: 'monospace' }}>LIVE</span>
          </div>
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,61,98,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .2s' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(10,61,98,.45)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(10,61,98,0)'}
        >
          <span style={{ fontSize: isLive ? 12 : 10, fontFamily: 'monospace', fontWeight: 700, color: '#E8B84B', opacity: 0, transition: 'opacity .2s', pointerEvents: 'none' }}>⬡ Cockpit</span>
        </div>
      </div>
      {/* Footer */}
      <div style={{ padding: `${isLive ? 10 : 7}px ${isLive ? 14 : 10}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: isLive ? 13 : 11, fontWeight: 700, fontFamily: 'monospace', color: '#0A3D62' }}>{v.version}</div>
          {v.label && <div style={{ fontSize: 9, color: 'rgba(10,61,98,.45)', marginTop: 1 }}>{v.label}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {isLive && <LockIcon />}
          <span style={{ fontSize: 9, fontFamily: 'monospace', fontWeight: 700, color: colors.tagColor }}>{colors.tag}</span>
        </div>
      </div>
    </div>
  )
}

const Arrow = () => (
  <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px', paddingTop: 55, color: 'rgba(10,61,98,.2)', fontSize: 18, flexShrink: 0 }}>→</div>
)

// ── Repo Row ──────────────────────────────────────────────────────────────────
function RepoRow({ repo }: { repo: Repo }) {
  const [cockpit, setCockpit] = useState<Version | null>(null)
  const [open, setOpen] = useState(true)

  // Fetch branches for this repo
  const { data: branches = [] } = useGiteaBranches(repo.fullName)

  // Merge: if we have real branches, use them to build versions; else fall back to topic-derived versions
  const versions: Version[] = branches.length > 0
    ? (() => {
        const bv = branchesToVersions(
          parseInt(repo.id.replace('gitea-', ''), 10),
          branches,
          repo.versions.find(v => v.slot === 'live')?.url
        )
        return bv.length > 0 ? bv : repo.versions
      })()
    : repo.versions

  const archive = versions.filter(v => v.slot === 'archive')
  const live = versions.filter(v => v.slot === 'live')
  const dev = versions.filter(v => v.slot === 'dev')

  const statusColors: Record<RepoStatus, string> = { live: '#2D7A4F', dev: '#2C3E6B', offline: '#B8760A', archive: 'rgba(10,61,98,.3)' }
  const statusLabels: Record<RepoStatus, string> = { live: 'live', dev: 'dev', offline: 'offline', archive: 'archive' }

  return (
    <div style={{ marginBottom: 20, background: '#FDFAF5', border: '1px solid rgba(10,61,98,.1)', borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', cursor: 'pointer', borderBottom: open ? '1px solid rgba(10,61,98,.07)' : 'none' }}>
        <span style={{ fontSize: 12, color: 'rgba(10,61,98,.3)', fontFamily: 'monospace' }}>📁</span>
        <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: '#0A3D62' }}>{repo.domain}/</span>
        <span style={{ fontSize: 11, color: 'rgba(10,61,98,.4)', fontFamily: 'monospace' }}>{repo.name}</span>
        <a href={repo.repo_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
          style={{ fontSize: 9, color: '#E8B84B', fontFamily: 'monospace', textDecoration: 'none', marginLeft: 4 }}>git ↗</a>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: statusColors[repo.status], marginLeft: 4 }} />
        <span style={{ fontSize: 9, fontFamily: 'monospace', color: statusColors[repo.status], textTransform: 'uppercase' }}>{statusLabels[repo.status]}</span>
        {repo.description && <span style={{ fontSize: 11, color: 'rgba(10,61,98,.35)', marginLeft: 8 }}>{repo.description}</span>}
        {branches.length > 0 && (
          <span style={{ fontSize: 9, color: 'rgba(10,61,98,.3)', fontFamily: 'monospace', marginLeft: 4 }}>
            {branches.length} branches
          </span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(10,61,98,.25)' }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, padding: '16px 20px', overflow: 'auto', paddingBottom: 20 }}>
          {/* ARCHIVE */}
          {archive.length > 0 && <>
            {archive.map((v, i) => (
              <div key={v.id} style={{ display: 'flex', alignItems: 'center' }}>
                {i > 0 && <Arrow />}
                <Thumb v={v} repoName={repo.name} repo={repo} onClick={() => setCockpit(v)} />
              </div>
            ))}
            <Arrow />
          </>}
          {archive.length === 0 && (
            <div style={{ width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 55, color: 'rgba(10,61,98,.15)', fontSize: 16 }}>—</div>
          )}

          {/* LIVE */}
          {live.length > 0
            ? live.map(v => <Thumb key={v.id} v={v} repoName={repo.name} repo={repo} onClick={() => setCockpit(v)} />)
            : (
              <div style={{ width: 720, height: 450, border: '1.5px dashed rgba(10,61,98,.12)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,61,98,.02)', flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: 'rgba(10,61,98,.25)', fontFamily: 'monospace' }}>No live version</span>
              </div>
            )
          }

          {/* DEV */}
          {dev.length > 0 && <>
            <Arrow />
            {dev.map((v, i) => (
              <div key={v.id} style={{ display: 'flex', alignItems: 'center' }}>
                {i > 0 && <Arrow />}
                <Thumb v={v} repoName={repo.name} repo={repo} onClick={() => setCockpit(v)} />
              </div>
            ))}
          </>}
        </div>
      )}

      {cockpit && (
        <CockpitOverlay
          url={cockpit.url}
          label={`${repo.domain} ${cockpit.version}`}
          isLive={cockpit.slot === 'live'}
          onClose={() => setCockpit(null)}
        />
      )}
    </div>
  )
}

// ── STATUS FILTER ─────────────────────────────────────────────────────────────
const STATUS_FILTERS: { key: RepoStatus | 'all'; label: string; color: string }[] = [
  { key: 'all', label: 'All', color: 'rgba(10,61,98,.5)' },
  { key: 'live', label: '🟢 Live', color: '#2D7A4F' },
  { key: 'dev', label: '🔵 Dev', color: '#2C3E6B' },
  { key: 'offline', label: '🟡 Offline', color: '#B8760A' },
  { key: 'archive', label: '⚪ Archive', color: 'rgba(10,61,98,.3)' },
]

// ── Main View ─────────────────────────────────────────────────────────────────
export function GitView() {
  const { data: giteaRepos = [], isLoading, error } = useGiteaRepos()
  const repos: Repo[] = giteaRepos.map(giteaToRepo)

  const [filter, setFilter] = useState<RepoStatus | 'all'>('all')
  const [sort, setSort] = useState<SortKey>('status')
  const [search, setSearch] = useState('')

  const filtered = repos
    .filter(r => filter === 'all' || r.status === filter)
    .filter(r => !search || r.domain.toLowerCase().includes(search.toLowerCase()) || r.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'status') {
        const order: Record<RepoStatus, number> = { live: 0, dev: 1, offline: 2, archive: 3 }
        return order[a.status] - order[b.status]
      }
      return a.domain.localeCompare(b.domain)
    })

  const counts = {
    all: repos.length,
    live: repos.filter(r => r.status === 'live').length,
    dev: repos.filter(r => r.status === 'dev').length,
    offline: repos.filter(r => r.status === 'offline').length,
    archive: repos.filter(r => r.status === 'archive').length,
  }

  return (
    <div style={{ padding: '0 0 40px', fontFamily: 'system-ui,sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0A3D62,#0d4d78)', borderRadius: 12, padding: '20px 24px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(232,184,75,.7)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 6 }}>
            Repositories &amp; Deployments
            {!isLoading && !error && <span style={{ marginLeft: 8, color: 'rgba(16,185,129,.7)' }}>● Gitea live</span>}
            {error && <span style={{ marginLeft: 8, color: 'rgba(232,75,75,.7)' }}>✕ Gitea unreachable</span>}
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#F5F0E8', margin: 0 }}>
            {isLoading ? 'Hämtar repos...' : `${counts.live} live · ${counts.dev} dev · ${counts.offline} offline`}
          </h2>
          <p style={{ fontSize: 11, color: 'rgba(245,240,232,.4)', margin: '4px 0 0', fontFamily: 'monospace' }}>
            {repos.length} repos totalt · ARKIV → LIVE 🟢🔒 → DEV
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Sök repos..."
            style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.08)', color: '#F5F0E8', fontSize: 12, outline: 'none', width: 180 }}
          />
          <a href="https://git.wavult.com" target="_blank" rel="noopener noreferrer"
            style={{ padding: '7px 14px', borderRadius: 6, background: 'rgba(232,184,75,.15)', border: '1px solid rgba(232,184,75,.3)', color: '#E8B84B', fontSize: 11, fontFamily: 'monospace', textDecoration: 'none', fontWeight: 700 }}>
            Gitea ↗
          </a>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(10,61,98,.4)', fontSize: 13, fontFamily: 'monospace' }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>⟳</div>
          Hämtar repos från Gitea...
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div style={{ padding: '32px', textAlign: 'center', background: '#FFF5F5', border: '1px solid rgba(232,75,75,.2)', borderRadius: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#8B1A1A', fontFamily: 'monospace', marginBottom: 4 }}>Gitea svarar inte</div>
          <div style={{ fontSize: 12, color: 'rgba(139,26,26,.6)', fontFamily: 'monospace' }}>
            {error instanceof Error ? error.message : 'Okänt fel — kontrollera VITE_GITEA_URL och token'}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      {!isLoading && !error && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{ padding: '6px 14px', borderRadius: 6, border: `1.5px solid ${filter === f.key ? f.color : 'rgba(10,61,98,.12)'}`, background: filter === f.key ? `${f.color}12` : 'transparent', color: filter === f.key ? f.color : 'rgba(10,61,98,.5)', cursor: 'pointer', fontSize: 12, fontWeight: filter === f.key ? 700 : 400, transition: 'all .15s', fontFamily: 'inherit' }}>
              {f.label} <span style={{ fontSize: 10, opacity: .7 }}>({counts[f.key as keyof typeof counts] ?? counts.all})</span>
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {(['status', 'name'] as SortKey[]).map(s => (
              <button key={s} onClick={() => setSort(s)}
                style={{ padding: '6px 12px', borderRadius: 6, border: `1.5px solid ${sort === s ? 'rgba(10,61,98,.4)' : 'rgba(10,61,98,.1)'}`, background: sort === s ? 'rgba(10,61,98,.08)' : 'transparent', color: sort === s ? '#0A3D62' : 'rgba(10,61,98,.4)', cursor: 'pointer', fontSize: 11, fontFamily: 'monospace', transition: 'all .15s' }}>
                Sort: {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Repos */}
      {!isLoading && !error && filtered.map(repo => <RepoRow key={repo.id} repo={repo} />)}

      {!isLoading && !error && filtered.length === 0 && repos.length > 0 && (
        <div style={{ padding: 48, textAlign: 'center', color: 'rgba(10,61,98,.3)', fontSize: 14 }}>Inga repos matchar filtret</div>
      )}
    </div>
  )
}
