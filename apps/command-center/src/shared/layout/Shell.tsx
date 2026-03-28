import React, { useMemo, useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, AlertTriangle, GitBranch, Network, Building2,
  Users, Target, Calendar, Megaphone, Image,
  DollarSign, Receipt, FileText, ShoppingCart, UserCheck,
  Scale, Globe, Shield, Briefcase,
  Cpu, Database, Server, Activity, Settings,
  BookOpen, GraduationCap, Lightbulb, Map,
  BarChart3, TrendingUp, PieChart,
  MessageSquare, Bell,
  Zap, Layers,
} from 'lucide-react'
import { EntitySwitcher } from '../../features/entity-switcher/EntitySwitcher'
import { useRole, ROLES } from '../auth/RoleContext'
import { generateIncidents } from '../../features/incidents/incidentEngine'
import { useEntityScope } from '../scope/EntityScopeContext'
import { LEGAL_DOCUMENTS } from '../../features/legal/data'
import { MODULE_REGISTRY } from '../maturity/maturityModel'
import { MaturityBadge } from '../maturity/MaturityBadge'
import { BerntWidget } from '../../features/bernt/BerntWidget'
import { OnboardingOverlay } from '../../features/onboarding'
import { NotificationCenter } from '../../features/communications/NotificationCenter'
import { GuidanceProvider } from '../guidance/GuidanceSystem'
import { GuidanceToast } from '../guidance/GuidanceToast'

function ContentArea({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const fullBleed = pathname.startsWith('/org') || pathname.startsWith('/entities') || pathname.startsWith('/org/command') || pathname.startsWith('/incidents') || pathname.startsWith('/markets') || pathname.startsWith('/campaigns') || pathname.startsWith('/company-launch') || pathname.startsWith('/finance') || pathname.startsWith('/procurement') || pathname.startsWith('/communications') || pathname.startsWith('/reports') || pathname.startsWith('/media')
  return (
    <div className={`h-full ${fullBleed ? '' : 'overflow-auto p-4 md:p-6'}`}>
      {children}
    </div>
  )
}

interface ShellProps {
  children: React.ReactNode
}

// ─── Nav structure ────────────────────────────────────────────────────────────

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavGroup {
  label: string | null
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [
      { to: '/incidents',   label: 'Alerts',         icon: AlertTriangle },
      { to: '/org/command', label: 'Org Hierarchy',  icon: Network },
      { to: '/org',         label: 'Group Structure', icon: Building2 },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { to: '/dashboard',       label: 'Dashboard',     icon: LayoutDashboard },
      { to: '/crm',             label: 'CRM',           icon: Users },
      { to: '/milestones',      label: 'Milestones',    icon: Target },
      { to: '/meeting-cadence', label: 'Möteshierarki', icon: Calendar },
      { to: '/campaigns',       label: 'Kampanjer',     icon: Megaphone },
      { to: '/media',           label: 'Media & Ads',   icon: Image },
      { to: '/submissions',     label: 'Submissions',   icon: FileText },
    ],
  },
  {
    label: 'FINANCE',
    items: [
      { to: '/finance',      label: 'Finance',       icon: DollarSign },
      { to: '/transactions', label: 'Transaktioner', icon: Receipt },
      { to: '/payroll',      label: 'Lön & Personal', icon: UserCheck },
      { to: '/procurement',  label: 'Inköp',         icon: ShoppingCart },
    ],
  },
  {
    label: 'ORGANISATION',
    items: [
      { to: '/entities',       label: 'Entities',            icon: Layers },
      { to: '/corporate',      label: 'Bolagsadmin',         icon: Briefcase },
      { to: '/company-launch', label: 'Company Launch',      icon: Zap },
      { to: '/legal',          label: 'Legal Hub',           icon: Scale },
      { to: '/insurance',      label: 'Insurance',           icon: Shield },
      { to: '/people',         label: 'Team',                icon: Users },
      { to: '/team-map',       label: 'Team Map',            icon: Map },
      { to: '/decisions',      label: 'Beslutssystem',       icon: GitBranch },
      { to: '/governance',     label: 'Governance Register', icon: Globe },
    ],
  },
  {
    label: 'INSIGHTS',
    items: [
      { to: '/people-intelligence', label: 'People Insights', icon: TrendingUp },
      { to: '/system-intelligence', label: 'System Health',   icon: Activity },
      { to: '/talent-radar',        label: 'Recruitment',     icon: GraduationCap },
      { to: '/strategic-brief',     label: 'Strategy',        icon: PieChart },
    ],
  },
  {
    label: 'ANALYTICS',
    items: [
      { to: '/reports', label: 'Rapporter', icon: BarChart3 },
    ],
  },
  {
    label: 'KUNSKAP',
    items: [
      { to: '/knowledge', label: 'Kunskapshub', icon: BookOpen },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { to: '/causal-os',       label: 'Causal OS',          icon: Cpu },
      { to: '/infrastructure',  label: 'Infrastruktur & Drift', icon: Server },
      { to: '/whoop',           label: 'WHOOP',              icon: Activity },
      { to: '/api-hub',         label: 'API Hub',            icon: Database },
      { to: '/llm-hub',         label: 'LLM Hub',            icon: Lightbulb },
      { to: '/communications',  label: 'Kommunikation',      icon: MessageSquare },
      { to: '/settings',        label: 'Inställningar',      icon: Settings },
      { to: '/system-status',   label: 'System Status',      icon: Bell },
    ],
  },
]

// Bottom nav pinned items for mobile (most used)
interface BottomNavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const BOTTOM_NAV: BottomNavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/incidents', label: 'Incidents',  icon: AlertTriangle },
  { to: '/milestones', label: 'Milestones', icon: Target },
  { to: '/finance',   label: 'Finance',   icon: DollarSign },
  { to: '/settings',  label: 'Menu',      icon: Settings },
]

// ─── Breadcrumb map ───────────────────────────────────────────────────────────

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/crm': 'CRM',
  '/entities': 'Entities',
  '/incidents': 'Alerts',
  '/org/command': 'Org Hierarchy',
  '/org/context': 'My Position',
  '/org': 'Group Structure',
  '/markets': 'Market Deployment',
  '/campaigns': 'Kampanjer',
  '/projects': 'Projekt & KPI',
  '/tasks': 'Task Board',
  '/people': 'Team',
  '/payroll': 'Lön & Personal',
  '/transactions': 'Transaktioner',
  '/submissions': 'Submissions',
  '/legal': 'Legal Hub',
  '/company-launch': 'Company Launch',
  '/finance': 'Finance',
  '/procurement': 'Inköp',
  '/milestones': 'Milestones',
  '/settings': 'Inställningar',
  '/corporate': 'Bolagsadmin',
  '/communications': 'Kommunikation',
  '/media': 'Media & Ads',
  '/reports': 'Rapporter',
  '/system-status': 'System Status',
  '/knowledge': 'Knowledge Hub',
  '/people-intelligence': 'People Insights',
  '/system-intelligence': 'System Health',
  '/talent-radar': 'Recruitment',
  '/strategic-brief': 'Strategy',
  '/api-hub': 'API Hub',
  '/llm-hub': 'LLM Hub',
  '/whoop': 'WHOOP Team Pulse',
  '/insurance': 'Insurance Hub',
  '/team-map': 'Team Map',
  '/meeting-cadence': 'Möteshierarki',
  '/decisions': 'Beslutssystem',
  '/decisions/new': 'Nytt möte',
  '/governance': 'Governance Register',
  '/infrastructure': 'Infrastruktur & Drift',
  '/causal-os': 'Causal OS',
}

function getBreadcrumb(pathname: string): string {
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname]
  const match = Object.keys(ROUTE_LABELS)
    .filter(k => pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0]
  return match ? ROUTE_LABELS[match] : 'Wavult OS'
}

// ─── Clock ────────────────────────────────────────────────────────────────────

function HeaderClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const timeStr = now.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })

  return (
    <span className="text-xs font-mono text-gray-500">{timeStr}</span>
  )
}

// ─── Hamburger icon ───────────────────────────────────────────────────────────

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <div className="flex flex-col justify-center items-center w-5 h-5 gap-[5px]">
      <span className={`block h-px w-5 bg-gray-400 transition-all duration-200 ${open ? 'rotate-45 translate-y-[6px]' : ''}`} />
      <span className={`block h-px w-5 bg-gray-400 transition-all duration-200 ${open ? 'opacity-0' : ''}`} />
      <span className={`block h-px w-5 bg-gray-400 transition-all duration-200 ${open ? '-rotate-45 -translate-y-[6px]' : ''}`} />
    </div>
  )
}

// ─── Sidebar Nav Content ──────────────────────────────────────────────────────

function SidebarNav({
  criticalIncidentCount,
  pendingLegalCount,
  onNavigate,
}: {
  criticalIncidentCount: number
  pendingLegalCount: number
  onNavigate?: () => void
}) {
  return (
    <nav className="flex-1 px-2 py-2 overflow-y-auto">
      {NAV_GROUPS.map((group, gi) => (
        <div key={gi}>
          {group.label && (
            <div className="px-3 py-1 text-xs font-mono text-gray-700 uppercase tracking-widest mt-4">
              {group.label}
            </div>
          )}
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const pathId = item.to.replace(/^\//, '')
              const mod = MODULE_REGISTRY.find(m => m.id === pathId || m.path === item.to)

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors min-w-0 ${
                      isActive
                        ? 'bg-[#8B5CF6]/10 text-[#8B5CF6] border-l-2 border-[#8B5CF6]'
                        : 'text-gray-400 hover:text-white hover:bg-white/[0.04] border-l-2 border-transparent'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 min-w-0 truncate">{item.label}</span>

                  {mod && (
                    <span className="flex-shrink-0">
                      <MaturityBadge level={mod.level} size="xs" />
                    </span>
                  )}

                  {item.to === '/incidents' && criticalIncidentCount > 0 && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white flex-shrink-0">
                      {criticalIncidentCount}
                    </span>
                  )}
                  {item.to === '/legal' && pendingLegalCount > 0 && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-black flex-shrink-0">
                      {pendingLegalCount}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}

// ─── Shell ────────────────────────────────────────────────────────────────────

export function Shell({ children }: ShellProps) {
  const { role, setRole, isAdmin, viewAs, setViewAs, effectiveRole } = useRole()
  const { activeEntity: scopeEntity, scopedEntities } = useEntityScope()
  const { pathname } = useLocation()
  const nonAdminRoles = ROLES.filter(r => r.id !== 'admin')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  const criticalIncidentCount = useMemo(() => {
    try {
      const incs = generateIncidents()
      return incs.filter(i => i.severity === 'critical' || i.escalated).length
    } catch { return 0 }
  }, [])

  const pendingLegalCount = useMemo(
    () => LEGAL_DOCUMENTS.filter(d => d.status === 'proposed').length,
    []
  )

  const breadcrumb = getBreadcrumb(pathname)
  const notificationCount = 3

  return (
    <div className="flex h-screen bg-[#07080F] overflow-hidden">

      {/* ── Mobile overlay backdrop ───────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40
        w-56 flex-shrink-0
        bg-[#07080F] border-r border-white/[0.06]
        flex flex-col
        transition-transform duration-250 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold text-white">Wavult OS</span>
            <span className="text-xs text-gray-600 font-mono">v2</span>
          </div>
          {/* Close btn (mobile) */}
          <button
            className="ml-auto md:hidden p-1 text-gray-500 hover:text-gray-300"
            onClick={() => setSidebarOpen(false)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Entity Switcher */}
        <div className="px-3 py-3 border-b border-white/[0.06]">
          <EntitySwitcher />
        </div>

        {/* Scope indicator */}
        <div className="px-3 py-1.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: scopeEntity.color }} />
            <span className="text-[9px] text-gray-600 font-mono">
              {scopeEntity.layer === 0 ? 'Group view' : `${scopeEntity.shortName} view`}
            </span>
            <span className="text-[9px] text-gray-700 ml-auto font-mono">{scopedEntities.length}e</span>
            {pendingLegalCount > 0 && (
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" title={`${pendingLegalCount} juridiska dokument kräver åtgärd`} />
            )}
          </div>
        </div>

        {/* Nav */}
        <SidebarNav
          criticalIncidentCount={criticalIncidentCount}
          pendingLegalCount={pendingLegalCount}
          onNavigate={() => setSidebarOpen(false)}
        />

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/[0.06]">
          <p className="text-xs text-gray-700 font-mono">Wavult Group © 2026</p>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top bar */}
        <header className="h-14 flex-shrink-0 border-b border-white/[0.06] flex items-center justify-between px-4 bg-[#07080F]/80 backdrop-blur-sm">

          {/* Left: hamburger (mobile) + status + breadcrumb */}
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            {/* Hamburger — mobile only */}
            <button
              className="md:hidden flex-shrink-0 p-1 -ml-1"
              onClick={() => setSidebarOpen(v => !v)}
              aria-label="Toggle menu"
            >
              <HamburgerIcon open={sidebarOpen} />
            </button>

            {/* Status dot — hidden on very small screens */}
            <div className="hidden sm:flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <span className="text-xs text-gray-700 font-mono">OPERATIONAL</span>
            </div>
            <span className="hidden sm:block text-gray-700 text-xs">/</span>

            <span className="text-sm text-gray-400 font-medium truncate">{breadcrumb}</span>
          </div>

          {/* Right: clock + entity + role + bell + exit */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <HeaderClock />

            {/* Entity indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg border border-white/[0.06]">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: scopeEntity.color }} />
              <span className="text-xs font-mono text-gray-500 truncate max-w-[80px]">
                {scopeEntity.shortName ?? scopeEntity.name}
              </span>
            </div>

            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(v => !v)}
                className="relative p-1.5 text-gray-600 hover:text-gray-300 transition-colors rounded-lg hover:bg-white/[0.06]"
              >
                <Bell className="w-4 h-4" />
                {notificationCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center leading-none">
                    {notificationCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {notifOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotifOpen(false)}
                  />
                  {/* Panel */}
                  <div className="absolute right-0 top-full mt-2 z-50 w-[min(420px,calc(100vw-1rem))] max-h-[80vh] overflow-y-auto rounded-2xl border border-white/[0.1] shadow-2xl"
                    style={{ background: '#0D0F1A' }}>
                    <div className="p-4">
                      <NotificationCenter />
                    </div>
                  </div>
                </>
              )}
            </div>

            {role && effectiveRole && (
              <>
                {isAdmin ? (
                  <select
                    value={viewAs?.id ?? ''}
                    onChange={e => {
                      const found = nonAdminRoles.find(r => r.id === e.target.value) ?? null
                      setViewAs(found)
                    }}
                    className="hidden sm:block text-xs bg-[#0D0F1A] border border-white/[0.08] rounded-lg px-2.5 py-1 font-mono cursor-pointer focus:outline-none appearance-none"
                    style={{ color: viewAs ? viewAs.color : '#6B7280' }}
                  >
                    <option value="">Admin</option>
                    {nonAdminRoles.map(r => (
                      <option key={r.id} value={r.id}>{r.title}</option>
                    ))}
                  </select>
                ) : (
                  <span className="hidden sm:block text-xs font-mono px-2 py-1 rounded"
                    style={{ background: effectiveRole.color + '15', color: effectiveRole.color }}>
                    {effectiveRole.title}
                  </span>
                )}
                <button
                  onClick={() => { setRole(null); setViewAs(null) }}
                  className="text-xs text-gray-700 hover:text-gray-400 transition-colors font-mono"
                >
                  exit
                </button>
              </>
            )}
          </div>
        </header>

        {/* Content — add bottom padding on mobile for bottom nav */}
        <div className="flex-1 overflow-hidden pb-[env(safe-area-inset-bottom)]">
          <div className="h-full md:pb-0 pb-16">
            <ContentArea>{children}</ContentArea>
          </div>
        </div>
      </main>

      {/* ── Mobile Bottom Nav ──────────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-[#07080F] border-t border-white/[0.06] flex items-stretch" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {BOTTOM_NAV.map((item) => (
          item.to === '/settings'
            ? (
              // "Menu" button opens sidebar
              <button
                key="menu"
                onClick={() => setSidebarOpen(v => !v)}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[9px] font-mono">{item.label}</span>
              </button>
            )
            : (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors ${
                    isActive ? 'text-[#8B5CF6]' : 'text-gray-500 hover:text-gray-300'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[9px] font-mono">{item.label}</span>
                {item.to === '/incidents' && criticalIncidentCount > 0 && (
                  <span className="absolute top-1 h-2 w-2 rounded-full bg-red-500" />
                )}
              </NavLink>
            )
        ))}
      </nav>

      {/* Bernt — persistent AI widget */}
      <BerntWidget />

      {/* Onboarding — first-run guided tour */}
      <OnboardingOverlay />

      {/* Guidance toast — smart contextual hints (bottom-left) */}
      <GuidanceToast />
    </div>
  )
}

/**
 * ShellWithGuidance wraps Shell in the GuidanceProvider so that
 * GuidanceSystem has access to the React Router context (useLocation).
 */
export function ShellWithGuidance({ children }: { children: React.ReactNode }) {
  return (
    <GuidanceProvider>
      <Shell>{children}</Shell>
    </GuidanceProvider>
  )
}
