interface WavultLogoProps {
  size?: number           // Bredd i px (default 40)
  color?: string          // Primärfärg (default '#0A3D62')
  bgColor?: string        // Bakgrundsfärg för inre (default 'transparent')
  className?: string
  showWordmark?: boolean  // Visa "WAVULT OS" bredvid (default false)
}

export function WavultLogo({
  size = 40,
  color = '#0A3D62',
  bgColor = 'transparent',
  className = '',
  showWordmark = false,
}: WavultLogoProps) {
  const h = Math.round(size * 0.65)
  const id = Math.random().toString(36).slice(2)

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={h}
        viewBox="0 0 200 130"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Wavult"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <clipPath id={`clip-${id}`}>
            <rect x="0" y="0" width="200" height="121" />
          </clipPath>
          <mask id={`mask-${id}`}>
            <rect width="200" height="200" fill="white" />
            {/* Gap: ±6° kring 12-positionen — smal och precis */}
            <polygon points="100,121 89.5,0 110.5,0" fill="black" />
          </mask>
        </defs>

        {/* Donut-ring */}
        <g clipPath={`url(#clip-${id})`} mask={`url(#mask-${id})`}>
          <circle cx="100" cy="121" r="100" fill={color} />
          <circle
            cx="100"
            cy="121"
            r="63"
            fill={bgColor === 'transparent' ? 'rgba(0,0,0,0)' : bgColor}
          />
        </g>

        {/* Visare */}
        <line
          x1="100"
          y1="121"
          x2="100"
          y2="22"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Pivot */}
        <circle cx="100" cy="121" r="10" fill={color} />
      </svg>

      {showWordmark && (
        <span
          style={{
            color,
            fontSize: size * 0.35,
            fontWeight: 600,
            letterSpacing: '0.08em',
            lineHeight: 1,
            fontFamily: 'var(--font-mono, monospace)',
          }}
        >
          WAVULT OS
        </span>
      )}
    </div>
  )
}

export default WavultLogo
