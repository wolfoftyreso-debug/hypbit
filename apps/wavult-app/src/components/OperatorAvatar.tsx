// ─── Wavult App — Operator Avatar ───────────────────────────────────────────────
// Reusable avatar component. Shows RPM 2D portrait if available, falls back
// to styled initials. Supports multiple sizes and optional accent ring.

import { useState } from 'react'
import { useAvatar, getAvatarRenderUrl } from '../lib/AvatarContext'
import type { AvatarSize } from '../lib/AvatarContext'

interface OperatorAvatarProps {
  /** Override avatar URL (for showing other users' avatars) */
  avatarUrl?: string | null
  /** Fallback initials when no avatar */
  initials: string
  /** Accent color for the ring and fallback background */
  color?: string
  /** Pixel size */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Show colored ring around avatar */
  ring?: boolean
  /** Click handler (e.g., open avatar creator) */
  onClick?: () => void
}

const SIZE_MAP: Record<string, { px: number; text: string; rounded: string; render: AvatarSize }> = {
  sm: { px: 28, text: 'text-[9px]', rounded: 'rounded-lg', render: 128 },
  md: { px: 40, text: 'text-xs', rounded: 'rounded-xl', render: 256 },
  lg: { px: 56, text: 'text-base', rounded: 'rounded-2xl', render: 256 },
  xl: { px: 80, text: 'text-xl', rounded: 'rounded-2xl', render: 512 },
}

export function OperatorAvatar({
  avatarUrl: overrideUrl,
  initials,
  color = '#C4961A',
  size = 'md',
  ring = false,
  onClick,
}: OperatorAvatarProps) {
  const { portraitUrl: contextPortrait } = useAvatar()
  const [imgError, setImgError] = useState(false)
  const config = SIZE_MAP[size]

  // Determine which avatar to show
  const effectiveUrl = overrideUrl !== undefined
    ? (overrideUrl ? getAvatarRenderUrl(overrideUrl, { size: config.render }) : null)
    : contextPortrait

  const showImage = effectiveUrl && !imgError

  const containerStyle: React.CSSProperties = {
    width: config.px,
    height: config.px,
    ...(ring ? {
      boxShadow: `0 0 0 2px ${color}40, 0 0 0 4px #0F1218`,
    } : {}),
  }

  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      onClick={onClick}
      className={`
        ${config.rounded} overflow-hidden flex-shrink-0
        flex items-center justify-center font-bold
        ${config.text}
        ${onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''}
      `}
      style={{
        ...containerStyle,
        background: showImage ? '#14181E' : color + '20',
        color: showImage ? 'transparent' : color,
      }}
    >
      {showImage ? (
        <img
          src={effectiveUrl}
          alt={initials}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : (
        initials
      )}
    </Component>
  )
}
