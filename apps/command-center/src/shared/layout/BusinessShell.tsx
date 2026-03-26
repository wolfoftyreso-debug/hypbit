// ─── Business OS Shell ──────────────────────────────────────────────────────
// Clean, operational layout. No drama, no neon.
// Left: navigation (5 core + secondary). Center: content. Top: minimal bar.

import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useRole, ROLES } from '../../shared/auth/RoleContext'

// ─── Navigation ─────────────────────────────────────────────────────────────

interface NavItem {
  path: string
  label: string
  section: 'core' | 'secondary' | 'system'
}

const NAV_ITEMS: NavItem[] = [
  // Core — always visible
  { path: '/dashboard', label: 'Dashboard', section: 'core' },
  { path: '/operations', label: 'Operations', section: 'core' },
  { path: '/sales', label: 'Sales', section: 'core' },
  { path: '/finance', label: 'Finance', section: 'core' },
  { path: '/people', label: 'People', section: 'core' },

  // Secondary — collapsed, accessible
  { path: '/entities', label: 'Entities', section: 'secondary' },
  { path: '/corporate', label: 'Structure', section: 'secondary' },
  { path: '/payment-os', label: 'Payment OS', section: 'secondary' },
  { path: '/wallet-os', label: 'Wallet OS', section: 'secondary' },
  { path: '/legal', label: 'Legal', section: 'secondary' },

  // System
  { path: '/org', label: 'Org Graph', section: 'system' },
]

function Sidebar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const core = NAV_ITEMS.filter(n => n.section === 'core')
  const secondary = NAV_ITEMS.filter(n => n.section === 'secondary')
  const system = NAV_ITEMS.filter(n => n.section === 'system')

  function isActive(path: string) {
    if (path === '/dashboard') return pathname === '/' || pathname === '/dashboard'
    return pathname.startsWith(path)
  }

  return (
    <aside className="w-48 flex-shrink-0 bg-[#0C0D12] border-r border-[#1A1C24] flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className="h-12 flex items-center px-4 border-b border-[#1A1C24] flex-shrink-0">
        <span className="text-[13px] font-semibold text-[#E0E1E4] tracking-wide">Wavult</span>
      </div>

      {/* Core nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        <div className="px-2">
          {core.map(item => {
            const active = isActive(item.path)
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-full text-left px-3 py-2 rounded-md text-[13px] transition-colors mb-0.5"
                style={{
                  background: active ? '#1A1C24' : 'transparent',
                  color: active ? '#E0E1E4' : '#6B7280',
                  fontWeight: active ? 600 : 400,
                }}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        {/* Secondary */}
        <div className="px-2 mt-4 pt-3 border-t border-[#1A1C24]">
          <div className="px-3 mb-1.5">
            <span className="text-[10px] text-[#3D4452] font-medium uppercase tracking-wider">Modules</span>
          </div>
          {secondary.map(item => {
            const active = isActive(item.path)
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-full text-left px-3 py-1.5 rounded-md text-[12px] transition-colors mb-0.5"
                style={{
                  background: active ? '#1A1C24' : 'transparent',
                  color: active ? '#E0E1E4' : '#4A4F5C',
                  fontWeight: active ? 500 : 400,
                }}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        {/* System */}
        <div className="px-2 mt-3 pt-3 border-t border-[#1A1C24]">
          <div className="px-3 mb-1.5">
            <span className="text-[10px] text-[#3D4452] font-medium uppercase tracking-wider">System</span>
          </div>
          {system.map(item => {
            const active = isActive(item.path)
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-full text-left px-3 py-1.5 rounded-md text-[12px] transition-colors mb-0.5"
                style={{
                  background: active ? '#1A1C24' : 'transparent',
                  color: active ? '#E0E1E4' : '#3D4452',
                }}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </nav>
    </aside>
  )
}

// ─── Top bar (minimal) ──────────────────────────────────────────────────────

function TopBar() {
  const { setRole, isAdmin, viewAs, setViewAs, effectiveRole } = useRole()
  const nonAdminRoles = ROLES.filter(r => r.id !== 'admin')

  return (
    <header className="h-10 flex-shrink-0 border-b border-[#1A1C24] flex items-center justify-between px-5 bg-[#0C0D12]">
      <div />
      <div className="flex items-center gap-3">
        {effectiveRole && (
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <select
                value={viewAs?.id ?? ''}
                onChange={e => {
                  const found = nonAdminRoles.find(r => r.id === e.target.value) ?? null
                  setViewAs(found)
                }}
                className="text-[11px] bg-[#0C0D12] border border-[#1A1C24] rounded px-2 py-1 text-[#6B7280] font-mono cursor-pointer focus:outline-none appearance-none"
              >
                <option value="">Admin</option>
                {nonAdminRoles.map(r => (
                  <option key={r.id} value={r.id}>{r.initials} {r.title}</option>
                ))}
              </select>
            ) : (
              <span className="text-[11px] text-[#6B7280] font-mono">{effectiveRole.initials} {effectiveRole.title}</span>
            )}
            <button
              onClick={() => { setRole(null); setViewAs(null) }}
              className="text-[10px] text-[#3D4452] hover:text-[#6B7280] transition-colors font-mono"
            >
              Exit
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

// ─── Shell ──────────────────────────────────────────────────────────────────

interface ShellProps {
  children: React.ReactNode
}

export function BusinessShell({ children }: ShellProps) {
  return (
    <div className="flex h-screen bg-[#0A0B10] overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
