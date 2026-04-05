interface WavultLogoProps {
  size?: number
  className?: string
  showWordmark?: boolean
  light?: boolean  // true = vit wordmark (för mörk bakgrund)
}

export function WavultLogo({
  size = 40,
  className = '',
  showWordmark = false,
  light = true,
}: WavultLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`} style={{ flexShrink: 0 }}>
      <img
        src="/wavult-logo.svg"
        alt="Wavult"
        width={size}
        height={Math.round(size * 0.67)}
        style={{ flexShrink: 0, display: 'block' }}
      />
      {showWordmark && (
        <span
          style={{
            color: light ? '#F5F0E8' : '#0A0A0A',
            fontSize: Math.round(size * 0.38),
            fontWeight: 700,
            letterSpacing: '0.10em',
            lineHeight: 1,
            fontFamily: 'var(--font-mono, monospace)',
            textTransform: 'uppercase',
          }}
        >
          WAVULT OS
        </span>
      )}
    </div>
  )
}

export default WavultLogo
