import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WavultUser } from '../auth'

interface Props {
  user: WavultUser
  onLogout: () => void
}

export default function ProfileScreen({ user, onLogout }: Props) {
  const navigate = useNavigate()
  const [theme, setTheme] = useState<'mörkt' | 'ljust'>('mörkt')
  const [showConfirm, setShowConfirm] = useState(false)

  function handleLogout() {
    onLogout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <p className="text-xs text-text-secondary uppercase tracking-widest mb-1">Profil</p>
        <h1 className="text-2xl font-bold text-text-primary">Mitt konto</h1>
      </div>

      {/* Avatar & info */}
      <div className="px-5 mb-5">
        <div className="bg-card border border-white/[0.07] rounded-2xl p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-accent-dim border border-accent/30 flex items-center justify-center text-accent text-2xl font-bold flex-shrink-0">
            {user.initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-text-primary">{user.name}</p>
            <p className="text-sm text-accent">{user.role}</p>
            <p className="text-xs text-text-muted mt-0.5">{user.email}</p>
          </div>
          {user.isDemo && (
            <span className="text-[10px] bg-warning/10 text-yellow-300 border border-warning/20 px-2 py-1 rounded-full font-semibold">
              DEMO
            </span>
          )}
        </div>
      </div>

      {/* Settings sections */}
      <div className="px-5 flex flex-col gap-3">
        {/* Theme toggle */}
        <div className="bg-card border border-white/[0.07] rounded-2xl p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-3 font-medium">Utseende</p>
          <div className="flex gap-2">
            {(['mörkt', 'ljust'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`flex-1 h-10 rounded-xl text-sm font-medium transition-colors capitalize ${
                  theme === t
                    ? 'bg-accent text-white'
                    : 'bg-bg border border-white/[0.07] text-text-secondary'
                }`}
              >
                {t === 'mörkt' ? '🌙 Mörkt' : '☀️ Ljust'}
              </button>
            ))}
          </div>
          {theme === 'ljust' && (
            <p className="text-xs text-text-muted mt-2 text-center">Ljust tema aktiveras i nästa version</p>
          )}
        </div>

        {/* Account info */}
        <div className="bg-card border border-white/[0.07] rounded-2xl overflow-hidden">
          <p className="text-xs text-text-muted uppercase tracking-wider px-4 pt-4 pb-2 font-medium">Kontoinformation</p>
          {[
            { label: 'Namn',   value: user.name },
            { label: 'Roll',   value: user.role },
            { label: 'E-post', value: user.email },
            { label: 'Team',   value: 'Wavult Group' },
          ].map((row, i) => (
            <div key={i} className="flex justify-between items-center px-4 py-3 border-t border-white/[0.05]">
              <span className="text-sm text-text-muted">{row.label}</span>
              <span className="text-sm text-text-primary text-right max-w-[60%] truncate">{row.value}</span>
            </div>
          ))}
        </div>

        {/* About */}
        <div className="bg-card border border-white/[0.07] rounded-2xl p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-3 font-medium">Om appen</p>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-text-muted">Version</span>
            <span className="text-text-secondary font-mono">0.2.0-alpha</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-text-muted">Miljö</span>
            <span className="text-text-secondary font-mono">Demo</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Byggd med</span>
            <span className="text-text-secondary">React + Tailwind</span>
          </div>
        </div>

        {/* Logout */}
        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full h-11 bg-danger/10 border border-danger/20 rounded-2xl text-sm font-semibold text-red-400 transition-all active:scale-[0.98]"
          >
            Logga ut
          </button>
        ) : (
          <div className="bg-danger/10 border border-danger/25 rounded-2xl p-4">
            <p className="text-sm text-text-primary text-center mb-3">Är du säker på att du vill logga ut?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 h-10 bg-white/5 border border-white/10 rounded-xl text-sm text-text-secondary transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 h-10 bg-danger rounded-xl text-sm font-semibold text-white transition-all active:opacity-80"
              >
                Logga ut
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
