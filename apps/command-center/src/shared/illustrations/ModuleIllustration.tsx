import { useState } from 'react'
import { getModuleIllustration } from './IllustrationMap'

interface ModuleIllustrationProps {
  route: string
  alt?: string
  size?: 'sm' | 'md' | 'lg' | 'hero'
  float?: boolean
  className?: string
  style?: React.CSSProperties
}

const SIZES = {
  sm:   { width: 80,  height: 80 },
  md:   { width: 140, height: 140 },
  lg:   { width: 200, height: 200 },
  hero: { width: 280, height: 280 },
}

export function ModuleIllustration({ route, alt, size = 'md', float = false, className, style }: ModuleIllustrationProps) {
  const [loaded, setLoaded] = useState(false)
  const src = getModuleIllustration(route)
  const { width, height } = SIZES[size]
  return (
    <div className={className} style={{ width, height, flexShrink: 0, ...style }}>
      {!loaded && <div className="wv-skeleton" style={{ width, height, borderRadius: 12 }} />}
      <img
        src={src} alt={alt ?? `${route} illustration`}
        width={width} height={height}
        onLoad={() => setLoaded(true)}
        style={{
          display: loaded ? 'block' : 'none', width, height,
          objectFit: 'contain', borderRadius: 0,
          animation: loaded
            ? `wv-illustration-enter 0.45s cubic-bezier(0.22,1,0.36,1) both${float ? ', wv-float-slow 6s ease-in-out 0.5s infinite' : ''}`
            : 'none',
        }}
      />
    </div>
  )
}

/**
 * ModuleHeader — full-bleed illustration integration.
 * The illustration bleeds out from the right edge, partially cropped,
 * creating depth without being a "stamp" or framed image.
 */
interface ModuleHeaderProps {
  route: string
  label: string
  title: string
  description?: string
  badge?: React.ReactNode
  illustrationSize?: ModuleIllustrationProps['size']
  /** 'bleed' = illustration crops at right edge (default), 'corner' = bottom-right corner bleed */
  variant?: 'bleed' | 'corner' | 'full-bg'
}

export function ModuleHeader({
  route,
  label,
  title,
  description,
  badge,
  illustrationSize = 'lg',
  variant = 'bleed',
}: ModuleHeaderProps) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const src = getModuleIllustration(route)

  return (
    <div
      className="wv-header-enter"
      style={{
        background: 'var(--color-brand)',
        borderRadius: 12,
        padding: '28px 32px',
        marginBottom: 24,
        color: 'var(--color-text-inverse)',
        position: 'relative',
        overflow: 'hidden',
        minHeight: variant === 'full-bg' ? 180 : 120,
      }}
    >
      {/* Illustration — bleeds into the background, not a framed stamp */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        onLoad={() => setImgLoaded(true)}
        style={{
          position: 'absolute',
          right: variant === 'corner' ? -20 : -30,
          bottom: variant === 'corner' ? -20 : '50%',
          transform: variant === 'corner' ? 'none' : 'translateY(50%)',
          width: variant === 'hero' || illustrationSize === 'hero' ? 260 : illustrationSize === 'lg' ? 200 : 160,
          height: 'auto',
          objectFit: 'contain',
          opacity: imgLoaded ? 0.22 : 0,
          transition: 'opacity 0.5s ease',
          animation: imgLoaded ? 'wv-float-slow 7s ease-in-out 1s infinite' : 'none',
          pointerEvents: 'none',
          userSelect: 'none',
          // Mix with navy background — illustration tinted
          filter: 'brightness(1.4) saturate(0.6)',
        }}
      />

      {/* Content sits on top */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '65%' }}>
        <div style={{
          fontSize: 9, fontFamily: 'monospace',
          color: 'var(--color-accent)',
          letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 8,
        }}>
          {label}
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
          {title}
        </h2>
        {description && (
          <p style={{ fontSize: 13, color: 'rgba(245,240,232,.6)', margin: 0, lineHeight: 1.5 }}>
            {description}
          </p>
        )}
        {badge && <div style={{ marginTop: 10 }}>{badge}</div>}
      </div>
    </div>
  )
}

/**
 * SectionIllustration — inline illustration that flows with content.
 * Use for empty states, onboarding, and section breaks.
 * NOT a framed box — renders illustration as part of the layout.
 */
interface SectionIllustrationProps {
  route: string
  title: string
  description?: string
  action?: React.ReactNode
}

export function SectionIllustration({ route, title, description, action }: SectionIllustrationProps) {
  const [loaded, setLoaded] = useState(false)
  const src = getModuleIllustration(route)

  return (
    <div className="wv-card-enter" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '48px 32px', textAlign: 'center', gap: 0,
    }}>
      {/* Illustration floats above text, no border, no shadow */}
      <div style={{ marginBottom: 20, position: 'relative' }}>
        {!loaded && <div className="wv-skeleton" style={{ width: 160, height: 160, borderRadius: '50%' }} />}
        <img
          src={src} alt="" aria-hidden="true"
          onLoad={() => setLoaded(true)}
          style={{
            display: loaded ? 'block' : 'none',
            width: 160, height: 160, objectFit: 'contain',
            animation: loaded ? 'wv-illustration-enter 0.5s ease both, wv-float-slow 6s ease-in-out 0.6s infinite' : 'none',
          }}
        />
      </div>
      <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-text-primary)', marginBottom: 8 }}>
        {title}
      </div>
      {description && (
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', maxWidth: 320, lineHeight: 1.6 }}>
          {description}
        </div>
      )}
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  )
}
