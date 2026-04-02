// ─── Wavult OS — Media Department ─────────────────────────────────────────────
// YouTube-kanal + Field Documentarian-rekrytering + produktion.
// Winston & Leon = huvud. 6 månaders delay-policy. Real business, not content.
// MASTER PROMPT: Field Documentarian v1.0 — Authority: Absolute

import { useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ContentStatus = 'filming' | 'editing' | 'queue' | 'published' | 'concept'
type RecruitStatus = 'open' | 'contacted' | 'interview' | 'hired' | 'declined'

interface ContentEpisode {
  id: string
  title: string
  description: string
  filmed: string | null
  publishDate: string | null
  status: ContentStatus
  stars: string[]
  tags: string[]
  duration?: string
}

interface DocumentarianCandidate {
  id: string
  name: string
  age?: number
  location: string
  english: 'basic' | 'good' | 'fluent'
  status: RecruitStatus
  note: string
  platform?: string
}

// ─── Data Seeds ───────────────────────────────────────────────────────────────

const EPISODES: ContentEpisode[] = [
  {
    id: 'ep-001',
    title: 'Day 1 — Bangkok Workcamp',
    description: 'We land. The team assembles. First real session on building a global system. No script.',
    filmed: '2026-04-11',
    publishDate: '2026-10-11',
    status: 'concept',
    stars: ['Leon', 'Winston'],
    tags: ['thailand', 'day-1', 'team'],
    duration: '~12 min',
  },
  {
    id: 'ep-002',
    title: 'How We Incorporated in Delaware in 3 Days',
    description: 'quiXzoom Inc. — Stripe Atlas, EIN, bank account. Step by step, no filters.',
    filmed: null,
    publishDate: null,
    status: 'concept',
    stars: ['Winston', 'Dennis'],
    tags: ['corp', 'usa', 'legal'],
    duration: '~18 min',
  },
  {
    id: 'ep-003',
    title: 'Leon Makes Cold Calls Live — and Closes',
    description: 'No script. Just Leon, a headset and a CRM. Three calls. We film what happens.',
    filmed: null,
    publishDate: null,
    status: 'concept',
    stars: ['Leon'],
    tags: ['sales', 'crm', 'reality'],
    duration: '~25 min',
  },
  {
    id: 'ep-004',
    title: 'Infrastructure for a Startup — Our Stack and Why',
    description: 'AWS ECS, Cloudflare, Supabase, GitHub Actions. Winston and Johan break it down.',
    filmed: null,
    publishDate: null,
    status: 'concept',
    stars: ['Winston', 'Johan'],
    tags: ['tech', 'infra', 'stack'],
    duration: '~30 min',
  },
  {
    id: 'ep-005',
    title: 'What Is quiXzoom? We Explain to a 12-Year-Old',
    description: 'Leon tests the pitch against different audiences — live, on the streets of Bangkok.',
    filmed: null,
    publishDate: null,
    status: 'concept',
    stars: ['Leon'],
    tags: ['product', 'pitch', 'quixzoom'],
    duration: '~15 min',
  },
  {
    id: 'ep-006',
    title: 'Money Flow — How We Set Up Payments',
    description: 'Revolut Business, Stripe, zoomer wallets. Winston and Leon on payment architecture.',
    filmed: null,
    publishDate: null,
    status: 'concept',
    stars: ['Winston', 'Leon'],
    tags: ['fintech', 'payments', 'stripe'],
    duration: '~22 min',
  },
]

const CANDIDATES: DocumentarianCandidate[] = [
  {
    id: 'cand-open',
    location: 'Bangkok / Thailand',
    english: 'good',
    status: 'open',
    note: 'Position open. Recruiting via Instagram, Facebook groups, Bangkok university boards.',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ContentStatus, { label: string; color: string; bg: string }> = {
  concept:   { label: 'CONCEPT',    color: '#8B919A', bg: '#3D445215' },
  filming:   { label: 'FILMING',    color: '#C4961A', bg: '#C4961A15' },
  editing:   { label: 'EDITING',    color: '#4A7A9B', bg: '#4A7A9B15' },
  queue:     { label: '6-MO QUEUE', color: '#8B5CF6', bg: '#8B5CF615' },
  published: { label: 'LIVE',       color: '#4A7A5B', bg: '#4A7A5B15' },
}

const RECRUIT_CONFIG: Record<RecruitStatus, { label: string; color: string }> = {
  open:      { label: 'OPEN',       color: '#C4961A' },
  contacted: { label: 'CONTACTED',  color: '#4A7A9B' },
  interview: { label: 'INTERVIEW',  color: '#8B5CF6' },
  hired:     { label: 'HIRED',      color: '#4A7A5B' },
  declined:  { label: 'DECLINED',   color: '#D94040' },
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Channel Overview ─────────────────────────────────────────────────────────

function ChannelOverview() {
  return (
    <div className="px-5 mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-label text-tx-tertiary font-mono uppercase">📺 The Channel</h2>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-signal-amber/15 text-signal-amber border border-signal-amber/30">
          PLANNING
        </span>
      </div>

      <div className="app-card mb-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
            style={{ background: '#C4961A15', border: '1px solid #C4961A30' }}>
            🎬
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-tx-primary">Wavult — Building in the Open</p>
            <p className="text-[10px] text-tx-muted font-mono mt-0.5">
              Real business. No gurus. No scripts.
            </p>
            <p className="text-[9px] text-tx-tertiary mt-2 leading-relaxed">
              We're documenting the construction of a global system. Winston manages the money, Leon closes the deals. Nobody else shows this at this scale — because nobody else is doing this at this scale.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-w-border">
          <div className="text-center">
            <p className="text-stat font-bold text-signal-amber">6 mo</p>
            <p className="text-[8px] text-tx-muted font-mono">DELAY POLICY</p>
          </div>
          <div className="text-center">
            <p className="text-stat font-bold" style={{ color: '#C4961A' }}>2</p>
            <p className="text-[8px] text-tx-muted font-mono">LEADS</p>
          </div>
          <div className="text-center">
            <p className="text-stat font-bold" style={{ color: '#4A7A5B' }}>3 yrs</p>
            <p className="text-[8px] text-tx-muted font-mono">SERIES TARGET</p>
          </div>
        </div>
      </div>

      {/* The stars */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { name: 'Leon Russo', role: 'The Sales Engine', initials: 'LR', color: '#C4961A', bio: 'Deals, prospecting, real sales — no edits.' },
          { name: 'Winston Bjarnemark', role: 'The CFO', initials: 'WB', color: '#8B5CF6', bio: 'Cashflow, structure, financial decisions.' },
        ].map(star => (
          <div key={star.name} className="app-card">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                style={{ background: star.color + '20', color: star.color, border: `1px solid ${star.color}30` }}>
                {star.initials}
              </div>
              <div>
                <p className="text-xs font-bold text-tx-primary">{star.name.split(' ')[0]}</p>
                <p className="text-[9px] font-mono" style={{ color: star.color }}>{star.role}</p>
              </div>
            </div>
            <p className="text-[9px] text-tx-muted leading-relaxed">{star.bio}</p>
          </div>
        ))}
      </div>

      {/* Delay policy */}
      <div className="app-card mt-3 flex items-start gap-2">
        <span className="text-base flex-shrink-0">🔒</span>
        <div>
          <p className="text-xs font-semibold text-tx-primary">6-Month Delay — Non-Negotiable</p>
          <p className="text-[9px] text-tx-secondary leading-relaxed mt-1">
            We film everything now. Nothing publishes for 6 months. Active deals stay protected. Competitors see nothing. Viewers get authentic business — in the rearview mirror.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Content Pipeline ─────────────────────────────────────────────────────────

function ContentPipeline() {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? EPISODES : EPISODES.slice(0, 3)

  return (
    <div className="px-5 mt-6">
      <button
        className="w-full flex items-center justify-between mb-3"
        onClick={() => setExpanded(e => !e)}
      >
        <h2 className="text-label text-tx-tertiary font-mono uppercase">🎞 Content Pipeline</h2>
        <span className="text-[9px] font-mono text-tx-muted">{expanded ? '▲ collapse' : `▼ all (${EPISODES.length})`}</span>
      </button>

      <div className="space-y-2">
        {visible.map((ep, i) => {
          const cfg = STATUS_CONFIG[ep.status]
          return (
            <div key={ep.id} className="app-card">
              <div className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-tx-muted font-mono"
                  style={{ background: '#1C2030', border: '1px solid #2A3044' }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-tx-primary leading-snug">{ep.title}</p>
                  <p className="text-[9px] text-tx-muted mt-0.5 leading-relaxed">{ep.description}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    {ep.stars.map(s => (
                      <span key={s} className="text-[8px] font-mono px-1.5 py-0.5 rounded-full"
                        style={{ background: '#C4961A15', color: '#C4961A', border: '1px solid #C4961A30' }}>
                        {s}
                      </span>
                    ))}
                    {ep.duration && (
                      <span className="text-[8px] font-mono text-tx-muted ml-auto">{ep.duration}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-w-border">
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full"
                  style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                  {cfg.label}
                </span>
                <div className="flex items-center gap-3">
                  {ep.filmed && <span className="text-[8px] text-tx-muted font-mono">🎥 {formatDate(ep.filmed)}</span>}
                  {ep.publishDate && <span className="text-[8px] font-mono text-signal-amber">📅 {formatDate(ep.publishDate)}</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Field Documentarian Role ─────────────────────────────────────────────────

function FieldDocumentarianRole() {
  const [section, setSection] = useState<string | null>(null)
  const toggle = (s: string) => setSection(prev => prev === s ? null : s)

  return (
    <div className="px-5 mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-label text-tx-tertiary font-mono uppercase">🎥 Field Documentarian</h2>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
          style={{ background: '#D9404015', color: '#D94040', border: '1px solid #D9404030' }}>
          HIRING
        </span>
      </div>

      {/* Role headline */}
      <div className="app-card mb-3">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-xl flex-shrink-0">📡</span>
          <div>
            <p className="text-xs font-bold text-tx-primary">Field Documentarian</p>
            <p className="text-[9px] font-mono text-signal-amber mt-0.5">Bangkok · April 2026 · Full-Time</p>
            <p className="text-[9px] text-tx-secondary mt-2 leading-relaxed">
              This is not a videographer. This is not a content creator. This is a real-time operator responsible for capturing the creation of a global system.
            </p>
          </div>
        </div>

        {/* Style reference */}
        <div className="rounded-lg p-3 mb-3"
          style={{ background: '#0F1220', border: '1px solid #2A3044' }}>
          <p className="text-[8px] font-mono text-tx-tertiary uppercase mb-1.5">Style Reference</p>
          <p className="text-[10px] text-tx-primary font-semibold">NELK energy — applied to elite-level business execution.</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
            {[
              ['Raw', 'Intelligent'],
              ['Unfiltered', 'Strategic'],
              ['Fast', 'High-stakes'],
              ['Real', 'No nonsense'],
            ].map(([a, b]) => (
              <div key={a} className="contents">
                <span className="text-[9px] font-mono" style={{ color: '#C4961A' }}>✓ {a}</span>
                <span className="text-[9px] font-mono" style={{ color: '#4A7A9B' }}>✓ {b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* NOT / ARE */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg p-2.5" style={{ background: '#D9404008', border: '1px solid #D9404025' }}>
            <p className="text-[8px] font-mono text-[#D94040] uppercase mb-1.5">NOT looking for</p>
            {['Film school graduates', 'Corporate videographers', 'Over-edited creators'].map(s => (
              <p key={s} className="text-[9px] text-tx-muted flex items-start gap-1"><span className="text-[#D94040] flex-shrink-0">✗</span>{s}</p>
            ))}
          </div>
          <div className="rounded-lg p-2.5" style={{ background: '#4A7A5B08', border: '1px solid #4A7A5B25' }}>
            <p className="text-[8px] font-mono text-[#4A7A5B] uppercase mb-1.5">ARE looking for</p>
            {['Young & hungry', 'Obsessed with reality', 'Comfortable in chaos', 'Loyal & discreet'].map(s => (
              <p key={s} className="text-[9px] text-tx-muted flex items-start gap-1"><span className="text-[#4A7A5B] flex-shrink-0">✓</span>{s}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Expandable sections */}
      {[
        {
          id: 'capture',
          icon: '🎯',
          title: 'What Must Be Captured',
          items: [
            'Founder decision-making',
            'Team interactions',
            'Product development',
            'Problem-solving sessions',
            'Financial reviews',
            'Travel and movement',
            'Tension, stress, breakthroughs',
          ],
        },
        {
          id: 'schedule',
          icon: '📅',
          title: 'Recording Structure',
          items: [
            'Weekly — min. 1 full filming day',
            'Monthly — full team meetups + strategy',
            'Monthly — key decision moments',
            'Continuous — opportunistic filming',
            'Same-day upload, always',
          ],
        },
        {
          id: 'rules',
          icon: '⚡',
          title: 'Non-Negotiable Rules',
          items: [
            'Always ready to film',
            'Never miss key moments',
            'Never interrupt reality',
            'Never stage a scene',
            'If it feels staged → it is wrong',
            'Trust > skill',
          ],
        },
        {
          id: 'pipeline',
          icon: '💾',
          title: 'Storage & Pipeline',
          items: [
            'Upload same day — no exceptions',
            'Proper audio capture mandatory',
            'Stable but raw footage',
            'Follow naming conventions',
            'Include metadata on every file',
          ],
        },
        {
          id: 'brand',
          icon: '🏢',
          title: 'Brand Boundaries',
          items: [
            'Show quiXzoom operations',
            'Show LandveX client work',
            'DO NOT show internal structures',
            'DO NOT reference financial specifics',
            '6-month delay protects everything else',
          ],
        },
      ].map(sec => (
        <div key={sec.id} className="mb-2">
          <button
            className="w-full app-card flex items-center gap-3"
            onClick={() => toggle(sec.id)}
          >
            <span className="text-base flex-shrink-0">{sec.icon}</span>
            <span className="text-xs font-semibold text-tx-primary flex-1 text-left">{sec.title}</span>
            <span className="text-[9px] font-mono text-tx-muted flex-shrink-0">{section === sec.id ? '▲' : '▼'}</span>
          </button>
          {section === sec.id && (
            <div className="app-card mt-1 animate-fade-in"
              style={{ background: '#0F1220', border: '1px solid #2A3044' }}>
              <div className="space-y-1">
                {sec.items.map(item => (
                  <p key={item} className="text-[9px] text-tx-secondary flex items-start gap-2">
                    <span className="text-signal-amber flex-shrink-0 font-mono">→</span>{item}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Long-term objective */}
      <div className="app-card mt-2"
        style={{ background: '#8B5CF608', borderColor: '#8B5CF625' }}>
        <p className="text-[9px] font-mono text-[#8B5CF6] uppercase mb-2">Long-Term Objective</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: '3-Year', sub: 'Documentary Series' },
            { label: 'Permanent', sub: 'Narrative Asset' },
            { label: 'Global', sub: 'Brand Driver' },
          ].map(o => (
            <div key={o.label}>
              <p className="text-sm font-bold" style={{ color: '#8B5CF6' }}>{o.label}</p>
              <p className="text-[8px] text-tx-muted font-mono">{o.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Recruitment Pipeline ─────────────────────────────────────────────────────

function RecruitmentPipeline() {
  const [showAd, setShowAd] = useState(false)

  return (
    <div className="px-5 mt-6">
      <h2 className="text-label text-tx-tertiary font-mono uppercase mb-3">🔍 Recruitment Pipeline</h2>

      {/* Channels */}
      <div className="app-card mb-3">
        <p className="text-[9px] font-mono text-tx-tertiary uppercase mb-2">Active Channels</p>
        <div className="space-y-1.5">
          {[
            { channel: 'Instagram Bangkok', sub: '#bangkokjobs #thaifreelancer #filmmaking', status: 'ACTIVE' },
            { channel: 'Facebook Groups', sub: 'Bangkok Expats / Jobs in Thailand / Thai Creatives', status: 'ACTIVE' },
            { channel: 'University Boards', sub: 'Chula, KMITL, Bangkok University', status: 'PLANNED' },
            { channel: 'Hotel Network', sub: 'Nysa Hotel Bangkok — Leon contacts', status: 'PLANNED' },
          ].map(c => (
            <div key={c.channel} className="flex items-center gap-3">
              <div className="h-5 w-5 rounded flex items-center justify-center flex-shrink-0 text-[8px] font-bold text-tx-muted"
                style={{ background: '#1C2030', border: '1px solid #2A3044' }}>
                {c.channel.slice(0, 1)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-tx-primary">{c.channel}</p>
                <p className="text-[8px] text-tx-muted font-mono truncate">{c.sub}</p>
              </div>
              <span className="text-[8px] font-mono flex-shrink-0"
                style={{ color: c.status === 'ACTIVE' ? '#4A7A5B' : '#C4961A' }}>
                {c.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Job ad toggle */}
      <button
        className="w-full flex items-center justify-between app-card mb-3"
        onClick={() => setShowAd(b => !b)}
      >
        <span className="text-xs font-semibold text-tx-primary">📄 Job Posting (Draft)</span>
        <span className="text-[9px] font-mono text-tx-muted">{showAd ? '▲' : '▼'}</span>
      </button>

      {showAd && (
        <div className="app-card mb-3 animate-fade-in"
          style={{ background: '#0F1220', border: '1px solid #2A3044' }}>
          <p className="text-[9px] font-mono text-signal-amber mb-3">— DRAFT — English only —</p>
          <div className="text-[10px] text-tx-secondary leading-relaxed space-y-3">
            <p className="font-bold text-tx-primary text-xs">🎥 Field Documentarian — Bangkok, April 2026</p>

            <p>We're building a global technology system from Bangkok. We need someone to film it.</p>

            <p><strong className="text-tx-primary">This is not a content creator role.</strong><br />
              This is a real-time operator capturing something that has never been filmed at this level before.
            </p>

            <div>
              <p className="text-tx-primary font-semibold mb-1">What you'll do:</p>
              <p>Follow the team. Film decisions, conversations, breakthroughs, setbacks. Capture reality as it unfolds. Upload same day. Never stage anything.</p>
            </div>

            <div>
              <p className="text-tx-primary font-semibold mb-1">What we need:</p>
              <p>✓ Fluent English — non-negotiable<br />
                ✓ You know how to operate a camera<br />
                ✓ You're available full-time from April 11th<br />
                ✓ You move fast, stay discreet, miss nothing<br />
                ✓ Based in Bangkok or willing to be<br />
                ◎ Age 18–25 preferred<br />
                ◎ Sony / Canon experience is a plus</p>
            </div>

            <div>
              <p className="text-tx-primary font-semibold mb-1">What you get:</p>
              <p>Paid position. Rare access. Your footage will be part of a 3-year documentary series reaching a global audience.</p>
            </div>

            <div className="pt-2 border-t border-w-border">
              <p><strong className="text-signal-amber">One rule:</strong> If it feels staged, it is wrong.</p>
            </div>

            <p className="text-tx-muted font-mono text-[8px]">Apply: [contact TBD] — Subject: FIELD DOC BANGKOK</p>
          </div>
        </div>
      )}

      {/* Candidate pipeline */}
      <p className="text-[9px] font-mono text-tx-tertiary uppercase mb-2">Candidate Pipeline</p>
      <div className="space-y-1.5">
        {CANDIDATES.map(c => {
          const cfg = RECRUIT_CONFIG[c.status]
          return (
            <div key={c.id} className="app-card flex items-center gap-3">
              <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm"
                style={{ background: '#1C2030', border: '1px solid #2A3044' }}>
                👤
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-tx-primary">{c.status === 'open' ? 'Position Open' : c.name ?? ''}</p>
                <p className="text-[9px] text-tx-muted font-mono truncate">{c.note}</p>
              </div>
              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full flex-shrink-0"
                style={{ background: cfg.color + '15', color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                {cfg.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Final directive */}
      <div className="app-card mt-4"
        style={{ background: '#0F1220', border: '1px solid #2A3044' }}>
        <p className="text-[8px] font-mono text-tx-tertiary uppercase mb-2">Final Directive</p>
        <div className="space-y-1">
          {['Move fast.', 'Capture everything.', 'Miss nothing.', '', 'This is not content.', 'This is history being recorded.'].map((line, i) =>
            line ? (
              <p key={i} className="text-xs font-semibold text-tx-primary">{line}</p>
            ) : (
              <div key={i} className="h-2" />
            )
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function MediaView() {
  return (
    <div className="pb-24 animate-fade-in overflow-y-auto">
      {/* Header */}
      <div className="px-5 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-label text-tx-tertiary font-mono uppercase">Wavult OS</p>
            <h1 className="text-action text-tx-primary mt-0.5">Media</h1>
          </div>
          <div className="h-10 w-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: '#C4961A15', border: '1px solid #C4961A30' }}>
            📺
          </div>
        </div>
        <p className="text-[10px] text-tx-muted font-mono mt-1">
          YouTube · Field Documentarian · 3-Year Series · 6-Month Delay
        </p>
      </div>

      <ChannelOverview />
      <ContentPipeline />
      <FieldDocumentarianRole />
      <RecruitmentPipeline />
    </div>
  )
}
