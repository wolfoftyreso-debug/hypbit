import React from 'react'

interface State {
  hasError: boolean
  error?: Error
}

export class ChunkErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    if (
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('Importing a module script failed')
    ) {
      return { hasError: true, error }
    }
    return { hasError: false }
  }

  componentDidCatch(error: Error) {
    if (
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('Importing a module script failed')
    ) {
      // Auto-reload efter kort delay
      setTimeout(() => window.location.reload(), 500)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: '#F7F2E8',
            flexDirection: 'column',
            gap: 16,
            fontFamily: 'system-ui',
          }}
        >
          <div style={{ fontSize: '1.1rem', color: '#1A1A1A' }}>
            Ny version tillgänglig — laddar om...
          </div>
          <div
            style={{
              width: 32,
              height: 32,
              border: '3px solid #DED9CC',
              borderTopColor: '#242321',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )
    }
    return this.props.children
  }
}
