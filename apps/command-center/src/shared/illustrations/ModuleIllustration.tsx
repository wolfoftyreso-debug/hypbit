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

/**
 * ModuleIllustration — renders the dedicated illustration for any Wavult OS module.
 * Automatically picks the right image from the brief-characters library.
 * Adds float animation and fade-in on load.
 *
 * Usage:
 *   <ModuleIllustration route="/thailand" size="hero" float />
 *   <ModuleIllustration route="/deployments" size="md" />
 */
export function ModuleIllustration({
  route,
  alt,
  size = 'md',
  float = false,
  className,
  style,
}: ModuleIllustrationProps) {
  const [loaded, setLoaded] = useState(false)
  const src = getModuleIllustration(route)
  const { width, height } = SIZES[size]

  return (
    <div
      className={className}
      style={{
        width,
        height,
        flexShrink: 0,
        ...style,
      }}
    >
      {/* Skeleton while loading */}
      {!loaded && (
        <div
          className="wv-skeleton"
          style={{ width, height, borderRadius: 12 }}
        />
      )}
      <img
        src={src}
        alt={alt ?? `${route} illustration`}
        width={width}
        height={height}
        onLoad={() => setLoaded(true)}
        style={{
          display: loaded ? 'block' : 'none',
          width,
          height,
          objectFit: 'contain',
          borderRadius: 12,
          animation: loaded
            ? `wv-illustration-enter 0.45s cubic-bezier(0.22, 1, 0.36, 1) both${float ? ', wv-float-slow 6s ease-in-out 0.5s infinite' : ''}`
            : 'none',
        }}
      />
    </div>
  )
}

/**
 * ModuleHeader — standard header block for every Wavult OS module.
 * Navy background, gold label, title, description, illustration on the right.
 *
 * Usage:
 *   <ModuleHeader
 *     route="/thailand"
 *     label="Thailand Workcamp"
 *     title="Bangkok · 11 april 2026"
 *     description="Nysa Hotel · Hela teamet"
 *   />
 */
interface ModuleHeaderProps {
  route: string
  label: string
  title: string
  description?: string
  badge?: React.ReactNode
  illustrationSize?: ModuleIllustrationProps['size']
}

export function ModuleHeader({
  route,
  label,
  title,
  description,
  badge,
  illustrationSize = 'md',
}: ModuleHeaderProps) {
  return (
    <div
      className="wv-header-enter"
      style={{
        background: 'var(--color-brand)',
        borderRadius: 12,
        padding: '24px 28px',
        marginBottom: 24,
        color: 'var(--color-text-inverse)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        overflow: 'hidden',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 9,
          fontFamily: 'monospace',
          color: 'var(--color-accent)',
          letterSpacing: '.15em',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}>
          {label}
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px', lineHeight: 1.2 }}>
          {title}
        </h2>
        {description && (
          <p style={{ fontSize: 13, color: 'rgba(245,240,232,.6)', margin: 0 }}>
            {description}
          </p>
        )}
        {badge && <div style={{ marginTop: 10 }}>{badge}</div>}
      </div>

      <ModuleIllustration
        route={route}
        size={illustrationSize}
        float
        style={{ opacity: 0.9, flexShrink: 0 }}
      />
    </div>
  )
}
