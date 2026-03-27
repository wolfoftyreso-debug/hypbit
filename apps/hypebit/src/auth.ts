export interface WavultUser {
  id: string
  email: string
  name: string
  role: string
  initials: string
  isDemo: boolean
}

const TEAM_USERS: WavultUser[] = [
  { id: 'erik',    email: 'erik@hypbit.com',    name: 'Erik Svensson',             role: 'Chairman & Group CEO',       initials: 'ES', isDemo: false },
  { id: 'leon',    email: 'leon@hypbit.com',    name: 'Leon Russo De Cerame',      role: 'CEO Wavult Operations',      initials: 'LR', isDemo: false },
  { id: 'winston', email: 'winston@hypbit.com', name: 'Winston Bjarnemark',        role: 'CFO',                        initials: 'WB', isDemo: false },
  { id: 'dennis',  email: 'dennis@hypbit.com',  name: 'Dennis Bjarnemark',         role: 'Chief Legal & Operations',   initials: 'DB', isDemo: false },
  { id: 'johan',   email: 'johan@hypbit.com',   name: 'Johan Berglund',            role: 'Group CTO',                  initials: 'JB', isDemo: false },
]

const DEMO_USER: WavultUser = {
  id: 'demo',
  email: 'demo@wavult.com',
  name: 'Demo User',
  role: 'Viewer',
  initials: 'DU',
  isDemo: true,
}

// Session storage key
const SESSION_KEY = 'wavult_session'

export function login(email: string, _password: string): WavultUser | null {
  const user = TEAM_USERS.find(u => u.email.toLowerCase() === email.toLowerCase())
  if (user) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
    return user
  }
  return null
}

export function loginAsDemo(): WavultUser {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(DEMO_USER))
  return DEMO_USER
}

export function getSession(): WavultUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as WavultUser) : null
  } catch {
    return null
  }
}

export function logout(): void {
  sessionStorage.removeItem(SESSION_KEY)
}

export function getGreeting(name: string): string {
  const hour = new Date().getHours()
  const firstName = name.split(' ')[0]
  if (hour < 12) return `God morgon, ${firstName} 👋`
  if (hour < 17) return `God eftermiddag, ${firstName} 👋`
  return `God kväll, ${firstName} 👋`
}

export function getDaysToThailand(): number {
  const target = new Date('2026-04-11T00:00:00+07:00')
  const now = new Date()
  const diff = target.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export { TEAM_USERS }
