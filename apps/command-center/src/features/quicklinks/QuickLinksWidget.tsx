import { useState } from 'react'

const LINKS = [
  { label: 'quiXzoom App', url: 'https://dewrtqzc20flx.cloudfront.net', icon: '📍', sub: 'CloudFront · quiXzoom' },
  { label: 'AWS Console', url: 'https://eu-north-1.console.aws.amazon.com/ecs/v2/clusters/wavult', icon: '☁️', sub: 'eu-north-1 · ECS' },
  { label: 'GitHub', url: 'https://github.com/wolfoftyreso-debug', icon: '🐙', sub: 'wolfoftyreso-debug' },
  { label: 'Cloudflare', url: 'https://dash.cloudflare.com', icon: '🔥', sub: 'Pages · DNS' },
  { label: 'Wavult OS', url: 'https://os.wavult.com', icon: '🖥️', sub: 'os.wavult.com' },
  { label: 'n8n', url: 'https://n8n.wavult.com', icon: '⚙️', sub: 'Automation' },
  { label: 'brief.wavult.com', url: 'https://d14gf6x22fx96q.cloudfront.net/brief/archive.html', icon: '🎬', sub: 'Morning Brief' },
  { label: 'Gitea', url: 'https://git.wavult.com', icon: '🦊', sub: 'git.wavult.com' },
]

export function QuickLinksWidget() {
  const [filter, setFilter] = useState('')

  const filtered = LINKS.filter(l =>
    !filter || l.label.toLowerCase().includes(filter.toLowerCase()) || l.sub.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div>
      <div style={{ background: 'var(--color-brand)', borderRadius: 12, padding: '20px 24px', marginBottom: 16, color: 'var(--color-text-inverse)' }}>
        <div style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--color-accent)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 6 }}>Wavult OS</div>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px' }}>Snabblänkar</h2>
      </div>

      <input
        value={filter}
        onChange={e => setFilter(e.target.value)}
        placeholder="Sök..."
        style={{ width: '100%', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--color-text-primary)', outline: 'none', marginBottom: 14, boxSizing: 'border-box' }}
      />

      {filtered.length === 0 ? (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '32px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Ingen länk matchar "{filter}"</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px,1fr))', gap: 10 }}>
          {filtered.map(link => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '14px 12px', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'border-color 0.15s', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
            >
              <span style={{ fontSize: 22 }}>{link.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', textAlign: 'center' }}>{link.label}</span>
              <span style={{ fontSize: 10, color: 'var(--color-text-muted)', textAlign: 'center' }}>{link.sub}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
