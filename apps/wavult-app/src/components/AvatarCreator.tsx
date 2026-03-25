// ─── Wavult App — Avatar Creator ────────────────────────────────────────────────
// Full-screen modal with Ready Player Me iframe. User creates their 3D avatar
// from a selfie or manually. When done, RPM posts the .glb URL via postMessage.

import { useEffect, useRef } from 'react'
import { useAvatar, RPM_IFRAME_URL } from '../lib/AvatarContext'

export function AvatarCreator() {
  const { isCreatorOpen, closeCreator, saveAvatar, saving } = useAvatar()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Listen for messages from RPM iframe
  useEffect(() => {
    if (!isCreatorOpen) return

    const handleMessage = (event: MessageEvent) => {
      // RPM sends JSON messages
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data

        // Avatar export complete — RPM sends the .glb URL
        if (data.source === 'readyplayerme' && data.eventName === 'v1.avatar.exported') {
          const glbUrl = data.data?.url
          if (glbUrl && typeof glbUrl === 'string') {
            saveAvatar(glbUrl)
          }
        }

        // User closed the RPM editor
        if (data.source === 'readyplayerme' && data.eventName === 'v1.frame.close') {
          closeCreator()
        }
      } catch {
        // Not a JSON message — ignore
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [isCreatorOpen, saveAvatar, closeCreator])

  if (!isCreatorOpen) return null

  return (
    <div className="fixed inset-0 z-[100] bg-w-bg flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-w-border bg-w-surface flex-shrink-0">
        <div>
          <h2 className="text-sm font-bold text-tx-primary">Create Your Avatar</h2>
          <p className="text-label text-tx-tertiary font-mono">READY PLAYER ME</p>
        </div>
        <button
          onClick={closeCreator}
          disabled={saving}
          className="text-tx-tertiary hover:text-tx-primary transition-colors text-lg px-2"
        >
          {saving ? (
            <span className="text-xs font-mono text-signal-amber animate-pulse">SAVING...</span>
          ) : (
            '✕'
          )}
        </button>
      </div>

      {/* RPM iframe */}
      <div className="flex-1 relative">
        <iframe
          ref={iframeRef}
          src={RPM_IFRAME_URL}
          className="absolute inset-0 w-full h-full border-0"
          allow="camera *; microphone *; clipboard-write"
          title="Ready Player Me Avatar Creator"
        />
      </div>
    </div>
  )
}
