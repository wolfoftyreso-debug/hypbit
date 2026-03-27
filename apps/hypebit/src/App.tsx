import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { getSession, logout, WavultUser } from './auth'
import LoginScreen from './screens/LoginScreen'
import DashboardScreen from './screens/DashboardScreen'
import TasksScreen from './screens/TasksScreen'
import CRMScreen from './screens/CRMScreen'
import FinanceScreen from './screens/FinanceScreen'
import TeamScreen from './screens/TeamScreen'
import ProfileScreen from './screens/ProfileScreen'

// ─── Bottom nav ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { path: '/dashboard', icon: '◈', label: 'Hem' },
  { path: '/tasks',     icon: '✓', label: 'Tasks' },
  { path: '/crm',       icon: '◉', label: 'CRM' },
  { path: '/finance',   icon: '$', label: 'Finans' },
  { path: '/team',      icon: '◎', label: 'Team' },
]

function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  if (location.pathname === '/login') return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-white/[0.07] flex justify-around items-stretch"
         style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)', maxWidth: 600, margin: '0 auto', left: '50%', transform: 'translateX(-50%)' }}>
      {NAV_ITEMS.map(item => {
        const active = location.pathname === item.path
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[52px] transition-colors ${
              active ? 'text-accent' : 'text-text-secondary'
            }`}
          >
            <span className={`text-lg font-mono leading-none ${active ? 'text-accent' : ''}`}>{item.icon}</span>
            <span className={`text-[10px] font-medium ${active ? 'text-accent' : 'text-text-secondary'}`}>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

// ─── Route guard ─────────────────────────────────────────────────────────────

function RequireAuth({ children, user }: { children: React.ReactNode; user: WavultUser | null }) {
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState<WavultUser | null>(() => getSession())

  function handleLogin(u: WavultUser) {
    setUser(u)
  }

  function handleLogout() {
    logout()
    setUser(null)
  }

  useEffect(() => {
    // Sync on storage events (other tabs)
    const onStorage = () => setUser(getSession())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-bg text-text-primary font-sans">
        <Routes>
          <Route path="/login" element={
            user ? <Navigate to="/dashboard" replace /> : <LoginScreen onLogin={handleLogin} />
          } />
          <Route path="/dashboard" element={
            <RequireAuth user={user}>
              <DashboardScreen user={user!} />
            </RequireAuth>
          } />
          <Route path="/tasks" element={
            <RequireAuth user={user}>
              <TasksScreen />
            </RequireAuth>
          } />
          <Route path="/crm" element={
            <RequireAuth user={user}>
              <CRMScreen />
            </RequireAuth>
          } />
          <Route path="/finance" element={
            <RequireAuth user={user}>
              <FinanceScreen />
            </RequireAuth>
          } />
          <Route path="/team" element={
            <RequireAuth user={user}>
              <TeamScreen />
            </RequireAuth>
          } />
          <Route path="/profile" element={
            <RequireAuth user={user}>
              <ProfileScreen user={user!} onLogout={handleLogout} />
            </RequireAuth>
          } />
          <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
        </Routes>

        {/* Bottom nav (shown on all screens except login) */}
        <BottomNav />
      </div>
    </BrowserRouter>
  )
}
