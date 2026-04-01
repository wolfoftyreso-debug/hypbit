import { useRef, useState } from 'react'

const COMPENDIUM_URL = '/docs/wavult-group-compendium.html'

const CHAPTERS = [
  { id: 's1', label: '1. Executive Summary' },
  { id: 's2', label: '2. Structure' },
  { id: 's3', label: '3. Activities' },
  { id: 's4', label: '4. Governance' },
  { id: 's5', label: '5. IP & Licensing' },
  { id: 's6', label: '6. Regulatory' },
  { id: 's7', label: '7. Financial' },
  { id: 's8', label: '8. Contact' },
]

export function CompendiumView() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [activeChapter, setActiveChapter] = useState<string | null>(null)

  function handleDownload() {
    window.open(COMPENDIUM_URL, '_blank')
    setTimeout(() => {
      const w = window.open(COMPENDIUM_URL, '_blank')
      w?.addEventListener('load', () => w.print())
    }, 100)
  }

  function handlePrint() {
    iframeRef.current?.contentWindow?.print()
  }

  function scrollToChapter(id: string) {
    setActiveChapter(id)
    const iframeDoc = iframeRef.current?.contentDocument
    if (!iframeDoc) return
    const el = iframeDoc.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="flex flex-col h-full bg-muted/30 text-text-primary">

      {/* ── Top bar ─────────────────────────────── */}
      <div className="px-4 md:px-6 py-3 border-b border-surface-border flex-shrink-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-xl">📋</span>
            <div>
              <h1 className="text-[15px] font-bold text-text-primary">Corporate Compendium</h1>
              <p className="text-xs text-gray-500 font-mono">
                Wavult Group DMCC · Version 1.0 · April 2026 · Confidential
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1A1A2E] text-white hover:bg-[#252545] transition-colors"
            >
              <span>⬇</span>
              Download PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-surface-border text-text-primary hover:bg-muted/50 transition-colors"
            >
              <span>🖨️</span>
              Print
            </button>
          </div>
        </div>
      </div>

      {/* ── Chapter navigation ───────────────────── */}
      <div className="flex gap-1 px-4 md:px-6 py-2 border-b border-surface-border flex-shrink-0 overflow-x-auto">
        {CHAPTERS.map(ch => (
          <button
            key={ch.id}
            onClick={() => scrollToChapter(ch.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              activeChapter === ch.id
                ? 'bg-[#1A1A2E] text-white'
                : 'text-gray-500 hover:text-text-primary hover:bg-muted/40'
            }`}
          >
            {ch.label}
          </button>
        ))}
      </div>

      {/* ── Iframe ──────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        <iframe
          ref={iframeRef}
          src={COMPENDIUM_URL}
          title="Wavult Group Corporate Compendium"
          className="w-full h-full border-0 bg-white"
          onLoad={() => {
            // Inject screen-friendly overrides to remove the grey background
            // inside the iframe so it blends with the OS dark chrome
            const doc = iframeRef.current?.contentDocument
            if (!doc) return
            const style = doc.createElement('style')
            style.textContent = `
              body { background: #F5F5F5 !important; }
              .page { box-shadow: none !important; margin-bottom: 0 !important; }
            `
            doc.head.appendChild(style)
          }}
        />
      </div>
    </div>
  )
}
