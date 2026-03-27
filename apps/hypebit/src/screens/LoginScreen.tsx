import { useState } from 'react'
import { login, loginAsDemo, WavultUser } from '../auth'

interface Props {
  onLogin: (user: WavultUser) => void
}

export default function LoginScreen({ onLogin }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    setTimeout(() => {
      const user = login(email, password)
      if (user) {
        onLogin(user)
      } else {
        setError('Okänd e-postadress. Kontakta Johan om du behöver tillgång.')
      }
      setLoading(false)
    }, 400)
  }

  function handleDemo() {
    const user = loginAsDemo()
    onLogin(user)
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-5 py-12"
         style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(139,92,246,0.12) 0%, transparent 70%)' }}>
      <div className="w-full max-w-[390px]">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-accent-dim border border-accent/30 flex items-center justify-center">
              <span className="text-accent text-xl font-bold">W</span>
            </div>
            <div className="text-left">
              <div className="text-2xl font-bold tracking-tight text-text-primary">Wavult OS</div>
              <div className="text-xs text-text-secondary">Team Command Center</div>
            </div>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-card rounded-2xl border border-white/[0.07] p-6 mb-3">
          <h2 className="text-base font-semibold text-text-primary mb-5">Logga in på ditt konto</h2>

          {error && (
            <div className="bg-danger/10 border border-danger/25 rounded-xl px-4 py-3 mb-4 text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1.5">E-postadress</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="namn@hypbit.com"
                required
                autoComplete="email"
                className="w-full h-11 bg-card2 border border-white/[0.07] rounded-xl px-4 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent/60 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1.5">Lösenord</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full h-11 bg-card2 border border-white/[0.07] rounded-xl px-4 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent/60 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-accent hover:bg-accent/90 disabled:opacity-60 rounded-xl text-white text-sm font-semibold transition-all active:scale-[0.98]"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Logga in →'
              )}
            </button>
          </form>
        </div>

        {/* Demo button */}
        <button
          onClick={handleDemo}
          className="w-full h-11 bg-transparent border border-white/[0.1] hover:border-accent/40 rounded-xl text-text-secondary hover:text-text-primary text-sm font-medium transition-all active:scale-[0.98]"
        >
          Fortsätt som demo
        </button>

        <p className="text-center text-xs text-text-muted mt-6">
          Wavult Group — Intern app, ej för delning
        </p>
      </div>
    </div>
  )
}
