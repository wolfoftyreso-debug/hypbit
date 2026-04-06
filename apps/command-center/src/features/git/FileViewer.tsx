/**
 * FileViewer — browse and read files from any Gitea repo
 * Supports: TS/JS/TSX/JSX, JSON, Markdown, images, text/config files
 */

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'

const GITEA_URL = import.meta.env.VITE_GITEA_URL ?? 'https://git.wavult.com'
const GITEA_TOKEN = import.meta.env.VITE_GITEA_TOKEN ?? ''

export interface FileViewerProps {
  repoFullName: string  // "wavult/wavult-os"
  path?: string         // default: ""
  onClose: () => void
}

interface GiteaEntry {
  name: string
  path: string
  type: 'file' | 'dir' | 'symlink'
  size: number
  encoding?: string
  content?: string
  download_url?: string
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

async function fetchContents(repo: string, path: string): Promise<GiteaEntry | GiteaEntry[]> {
  const url = `${GITEA_URL}/api/v1/repos/${repo}/contents/${encodeURIPath(path)}`
  const res = await fetch(url, {
    headers: { 'Authorization': `token ${GITEA_TOKEN}` }
  })
  if (!res.ok) throw new Error(`Gitea API ${res.status}`)
  return res.json()
}

function encodeURIPath(path: string) {
  return path.split('/').map(encodeURIComponent).join('/')
}

// ── Extension helpers ─────────────────────────────────────────────────────────

const IMG_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'bmp'])
const CODE_EXT: Record<string, string> = {
  ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx',
  json: 'json', css: 'css', scss: 'scss', html: 'html', xml: 'xml',
  sh: 'bash', bash: 'bash', yml: 'yaml', yaml: 'yaml',
  md: 'markdown', py: 'python', rs: 'rust', go: 'go',
  sql: 'sql', prisma: 'prisma', env: 'bash', txt: 'text',
  toml: 'toml', dockerfile: 'dockerfile',
}

function getExt(name: string): string {
  const base = name.toLowerCase()
  if (base === 'dockerfile') return 'dockerfile'
  const parts = base.split('.')
  return parts.length > 1 ? parts[parts.length - 1] : 'text'
}

function isImage(name: string) { return IMG_EXT.has(getExt(name)) }
function isMarkdown(name: string) { return getExt(name) === 'md' }

// ── File icon ─────────────────────────────────────────────────────────────────

function fileIcon(entry: GiteaEntry): string {
  if (entry.type === 'dir') return '📁'
  const ext = getExt(entry.name)
  if (IMG_EXT.has(ext)) return '🖼'
  if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) return '⚡'
  if (ext === 'json') return '{ }'
  if (ext === 'md') return '📝'
  if (['yml', 'yaml', 'toml'].includes(ext)) return '⚙'
  if (['sh', 'bash'].includes(ext)) return '💻'
  if (ext === 'css' || ext === 'scss') return '🎨'
  if (['html', 'xml'].includes(ext)) return '🌐'
  return '📄'
}

// ── Basic syntax tokenizer (no external deps) ─────────────────────────────────

interface Token { type: 'kw' | 'str' | 'num' | 'cmt' | 'punc' | 'plain'; value: string }

const KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'class', 'interface', 'type', 'enum',
  'import', 'export', 'from', 'return', 'if', 'else', 'for', 'while', 'do',
  'switch', 'case', 'break', 'continue', 'new', 'delete', 'typeof', 'instanceof',
  'async', 'await', 'try', 'catch', 'finally', 'throw', 'extends', 'implements',
  'public', 'private', 'protected', 'static', 'readonly', 'abstract', 'override',
  'default', 'null', 'undefined', 'true', 'false', 'void', 'never', 'any',
  'string', 'number', 'boolean', 'object', 'symbol', 'bigint',
  'def', 'lambda', 'in', 'not', 'and', 'or', 'pass', 'with', 'as', 'yield',
  'fn', 'mut', 'use', 'mod', 'impl', 'struct', 'pub', 'self',
  'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'TABLE',
  'func', 'package', 'go', 'defer', 'chan', 'make', 'range', 'map'])

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < line.length) {
    // Single-line comment
    if (line[i] === '/' && line[i + 1] === '/') {
      tokens.push({ type: 'cmt', value: line.slice(i) })
      break
    }
    // Hash comment (yaml, bash, python)
    if (line[i] === '#') {
      tokens.push({ type: 'cmt', value: line.slice(i) })
      break
    }
    // String (double or single quote or template)
    if (line[i] === '"' || line[i] === "'" || line[i] === '`') {
      const q = line[i]
      let j = i + 1
      while (j < line.length && (line[j] !== q || line[j - 1] === '\\')) j++
      tokens.push({ type: 'str', value: line.slice(i, j + 1) })
      i = j + 1
      continue
    }
    // Number
    if (/[0-9]/.test(line[i]) || (line[i] === '-' && /[0-9]/.test(line[i + 1] ?? ''))) {
      let j = i
      if (line[j] === '-') j++
      while (j < line.length && /[0-9._xXabcdefABCDEF]/.test(line[j])) j++
      tokens.push({ type: 'num', value: line.slice(i, j) })
      i = j
      continue
    }
    // Keyword / identifier
    if (/[a-zA-Z_$]/.test(line[i])) {
      let j = i
      while (j < line.length && /[\w$]/.test(line[j])) j++
      const word = line.slice(i, j)
      tokens.push({ type: KEYWORDS.has(word) ? 'kw' : 'plain', value: word })
      i = j
      continue
    }
    // Punctuation
    if (/[{}()\[\],;:<>=!&|+\-*/^%~?.@]/.test(line[i])) {
      tokens.push({ type: 'punc', value: line[i] })
      i++
      continue
    }
    // Fallback
    tokens.push({ type: 'plain', value: line[i] })
    i++
  }
  return tokens
}

const TOKEN_COLORS: Record<Token['type'], string> = {
  kw: '#C792EA',
  str: '#C3E88D',
  num: '#F78C6C',
  cmt: '#546E7A',
  punc: '#89DDFF',
  plain: '#EEFFFF',
}

function renderCodeLine(line: string, idx: number) {
  const tokens = tokenizeLine(line)
  return (
    <div key={idx} style={{ display: 'flex', minHeight: 20 }}>
      <span style={{ minWidth: 44, color: '#37474F', fontSize: 11, userSelect: 'none', paddingRight: 16, textAlign: 'right', flexShrink: 0 }}>
        {idx + 1}
      </span>
      <span style={{ flex: 1, whiteSpace: 'pre' }}>
        {tokens.map((t, ti) => (
          <span key={ti} style={{ color: TOKEN_COLORS[t.type] }}>{t.value}</span>
        ))}
      </span>
    </div>
  )
}

// ── Markdown renderer (basic, no external deps) ───────────────────────────────

function renderMarkdown(text: string): JSX.Element {
  const lines = text.split('\n')
  const elements: JSX.Element[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Heading
    const hm = line.match(/^(#{1,6})\s+(.*)$/)
    if (hm) {
      const level = hm[1].length
      const sizes = [28, 22, 18, 16, 14, 13]
      elements.push(
        <div key={i} style={{ fontSize: sizes[level - 1], fontWeight: 700, color: '#E8B84B', marginTop: 16, marginBottom: 8, borderBottom: level <= 2 ? '1px solid rgba(232,184,75,.2)' : 'none', paddingBottom: level <= 2 ? 4 : 0 }}>
          {hm[2]}
        </div>
      )
      i++; continue
    }

    // Code block
    if (line.startsWith('```')) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]); i++
      }
      elements.push(
        <div key={i} style={{ background: '#1A1A2E', borderRadius: 6, padding: '12px 16px', margin: '8px 0', fontFamily: 'monospace', fontSize: 12, overflowX: 'auto' }}>
          {codeLines.map((cl, ci) => renderCodeLine(cl, ci))}
        </div>
      )
      i++; continue
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,.1)', margin: '12px 0' }} />)
      i++; continue
    }

    // Bullet list
    if (/^[-*+]\s/.test(line)) {
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
          <span style={{ color: '#E8B84B', flexShrink: 0 }}>•</span>
          <span style={{ color: 'rgba(255,255,255,.8)', fontSize: 13 }}>{inlineMarkdown(line.slice(2))}</span>
        </div>
      )
      i++; continue
    }

    // Numbered list
    const nm = line.match(/^(\d+)\.\s(.*)$/)
    if (nm) {
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
          <span style={{ color: '#E8B84B', flexShrink: 0, minWidth: 20, textAlign: 'right' }}>{nm[1]}.</span>
          <span style={{ color: 'rgba(255,255,255,.8)', fontSize: 13 }}>{inlineMarkdown(nm[2])}</span>
        </div>
      )
      i++; continue
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <div key={i} style={{ borderLeft: '3px solid #E8B84B', paddingLeft: 12, margin: '4px 0', color: 'rgba(255,255,255,.55)', fontStyle: 'italic', fontSize: 13 }}>
          {inlineMarkdown(line.slice(2))}
        </div>
      )
      i++; continue
    }

    // Empty line
    if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: 8 }} />)
      i++; continue
    }

    // Paragraph
    elements.push(
      <p key={i} style={{ color: 'rgba(255,255,255,.8)', fontSize: 13, margin: '0 0 6px', lineHeight: 1.6 }}>
        {inlineMarkdown(line)}
      </p>
    )
    i++
  }

  return <div style={{ padding: 4 }}>{elements}</div>
}

function inlineMarkdown(text: string): React.ReactNode {
  // bold, italic, code, links
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g)
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} style={{ background: 'rgba(255,255,255,.1)', padding: '1px 5px', borderRadius: 3, fontFamily: 'monospace', fontSize: '0.9em', color: '#C3E88D' }}>{part.slice(1, -1)}</code>
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} style={{ color: '#F5F0E8' }}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i}>{part.slice(1, -1)}</em>
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (linkMatch)
      return <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" style={{ color: '#E8B84B', textDecoration: 'underline' }}>{linkMatch[1]}</a>
    return part
  })
}

// ── JSON formatter ────────────────────────────────────────────────────────────

function renderJSON(text: string): JSX.Element {
  try {
    const parsed = JSON.parse(text)
    const pretty = JSON.stringify(parsed, null, 2)
    return (
      <div style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6 }}>
        {pretty.split('\n').map((line, i) => renderCodeLine(line, i))}
      </div>
    )
  } catch {
    // Not valid JSON — render as plain
    return (
      <div style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6 }}>
        {text.split('\n').map((line, i) => renderCodeLine(line, i))}
      </div>
    )
  }
}

// ── File content renderer ─────────────────────────────────────────────────────

function FileContent({ entry }: { entry: GiteaEntry }) {
  const ext = getExt(entry.name)

  if (isImage(entry.name)) {
    const src = entry.download_url ??
      `${GITEA_URL}/api/v1/repos/${entry.path}?token=${GITEA_TOKEN}`
    return (
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <img
          src={src}
          alt={entry.name}
          style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8, border: '1px solid rgba(255,255,255,.1)' }}
        />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', fontFamily: 'monospace' }}>
          {entry.name} — {(entry.size / 1024).toFixed(1)} KB
        </span>
      </div>
    )
  }

  if (!entry.content) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,.3)', fontFamily: 'monospace', fontSize: 12 }}>
        No content available
      </div>
    )
  }

  const decoded = atob(entry.content.replace(/\n/g, ''))

  if (isMarkdown(entry.name)) {
    return (
      <div style={{ padding: '20px 24px', maxWidth: 780 }}>
        {renderMarkdown(decoded)}
      </div>
    )
  }

  if (ext === 'json') {
    return (
      <div style={{ padding: '12px 0' }}>
        {renderJSON(decoded)}
      </div>
    )
  }

  // Code view
  const lines = decoded.split('\n')
  const langLabel = CODE_EXT[ext] ?? 'text'

  return (
    <div>
      <div style={{ padding: '4px 16px 4px 60px', background: 'rgba(255,255,255,.04)', borderBottom: '1px solid rgba(255,255,255,.06)', fontSize: 10, color: 'rgba(255,255,255,.3)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '.1em' }}>
        {langLabel} · {lines.length} lines · {(entry.size / 1024).toFixed(1)} KB
      </div>
      <div style={{ padding: '12px 0' }}>
        {lines.map((line, i) => renderCodeLine(line, i))}
      </div>
    </div>
  )
}

// ── Directory listing ─────────────────────────────────────────────────────────

function DirListing({ entries, onNavigate }: { entries: GiteaEntry[]; onNavigate: (path: string) => void }) {
  const sorted = [...entries].sort((a, b) => {
    if (a.type === 'dir' && b.type !== 'dir') return -1
    if (a.type !== 'dir' && b.type === 'dir') return 1
    return a.name.localeCompare(b.name)
  })

  return (
    <div>
      {sorted.map(entry => (
        <div
          key={entry.path}
          onClick={() => onNavigate(entry.path)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px',
            cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,.04)',
            transition: 'background .1s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.06)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
        >
          <span style={{ fontSize: 13, flexShrink: 0, minWidth: 20, textAlign: 'center' }}>{fileIcon(entry)}</span>
          <span style={{
            flex: 1, fontSize: 13, fontFamily: 'monospace',
            color: entry.type === 'dir' ? '#E8B84B' : 'rgba(255,255,255,.85)',
            fontWeight: entry.type === 'dir' ? 600 : 400,
          }}>
            {entry.name}{entry.type === 'dir' ? '/' : ''}
          </span>
          {entry.type === 'file' && (
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,.25)', fontFamily: 'monospace' }}>
              {entry.size > 0 ? `${(entry.size / 1024).toFixed(1)} KB` : ''}
            </span>
          )}
        </div>
      ))}
      {sorted.length === 0 && (
        <div style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,.2)', fontSize: 13 }}>
          Empty directory
        </div>
      )}
    </div>
  )
}

// ── Breadcrumb ────────────────────────────────────────────────────────────────

function Breadcrumb({ repoFullName, path, onNavigate }: {
  repoFullName: string; path: string; onNavigate: (p: string) => void
}) {
  const [owner, repo] = repoFullName.split('/')
  const parts = path ? path.split('/') : []

  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, fontSize: 13, fontFamily: 'monospace', padding: '0 4px' }}>
      <span style={{ color: 'rgba(255,255,255,.4)' }}>{owner}</span>
      <span style={{ color: 'rgba(255,255,255,.2)', margin: '0 2px' }}>/</span>
      <button onClick={() => onNavigate('')}
        style={{ background: 'none', border: 'none', color: '#E8B84B', cursor: 'pointer', fontSize: 13, fontFamily: 'monospace', fontWeight: 700, padding: 0 }}>
        {repo}
      </button>
      {parts.map((part, i) => {
        const partPath = parts.slice(0, i + 1).join('/')
        const isLast = i === parts.length - 1
        return (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <span style={{ color: 'rgba(255,255,255,.2)', margin: '0 2px' }}>/</span>
            {isLast ? (
              <span style={{ color: '#F5F0E8' }}>{part}</span>
            ) : (
              <button onClick={() => onNavigate(partPath)}
                style={{ background: 'none', border: 'none', color: '#E8B84B', cursor: 'pointer', fontSize: 13, fontFamily: 'monospace', padding: 0, textDecoration: 'underline' }}>
                {part}
              </button>
            )}
          </span>
        )
      })}
    </div>
  )
}

// ── Main FileViewer component ─────────────────────────────────────────────────

export function FileViewer({ repoFullName, path: initialPath = '', onClose }: FileViewerProps) {
  const [currentPath, setCurrentPath] = useState(initialPath)
  const [viewingFile, setViewingFile] = useState<GiteaEntry | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['gitea-contents', repoFullName, currentPath],
    queryFn: () => fetchContents(repoFullName, currentPath),
    staleTime: 1000 * 60 * 5,
  })

  const handleNavigate = useCallback((path: string) => {
    // Determine if it's a file or dir from existing data
    if (Array.isArray(data)) {
      const entry = data.find(e => e.path === path)
      if (entry?.type === 'file') {
        // Need to fetch file content
        setViewingFile(null)
        setCurrentPath(path)
        return
      }
    }
    setViewingFile(null)
    setCurrentPath(path)
  }, [data])

  const handleBreadcrumb = useCallback((path: string) => {
    setViewingFile(null)
    setCurrentPath(path)
  }, [])

  // If single file data
  const isFileData = data && !Array.isArray(data) && (data as GiteaEntry).type === 'file'
  const isDirData = data && Array.isArray(data)

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', boxSizing: 'border-box',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#0D0D1E', border: '1px solid rgba(232,184,75,.25)', borderRadius: 12,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        width: '100%', maxWidth: 1100, height: '90vh', maxHeight: 860,
        boxShadow: '0 24px 80px rgba(0,0,0,.7)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px', borderBottom: '1px solid rgba(232,184,75,.15)',
          background: '#09091A', flexShrink: 0,
        }}>
          {/* Back button */}
          {currentPath && (
            <button
              onClick={() => {
                const parent = currentPath.includes('/') ? currentPath.split('/').slice(0, -1).join('/') : ''
                handleBreadcrumb(parent)
              }}
              style={{
                background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
                color: 'rgba(255,255,255,.7)', borderRadius: 5, padding: '4px 10px',
                cursor: 'pointer', fontSize: 12, fontFamily: 'monospace', flexShrink: 0,
              }}>
              ← Back
            </button>
          )}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Breadcrumb
              repoFullName={repoFullName}
              path={currentPath}
              onNavigate={handleBreadcrumb}
            />
          </div>
          {/* File count / info */}
          {isDirData && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.25)', fontFamily: 'monospace', flexShrink: 0 }}>
              {(data as GiteaEntry[]).length} items
            </span>
          )}
          <button
            onClick={onClose}
            style={{
              background: '#E8B84B', border: 'none', color: '#050510',
              padding: '5px 12px', borderRadius: 5, cursor: 'pointer',
              fontSize: 12, fontWeight: 700, flexShrink: 0,
            }}>
            ✕ Stäng
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', background: '#0D0D1E', color: '#EEFFFF', fontFamily: 'monospace', fontSize: 13 }}>
          {isLoading && (
            <div style={{ padding: 48, textAlign: 'center', color: 'rgba(255,255,255,.3)', fontFamily: 'monospace', fontSize: 12 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⟳</div>
              Loading...
            </div>
          )}
          {error && (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
              <div style={{ color: '#FF6B6B', fontFamily: 'monospace', fontSize: 13 }}>
                {error instanceof Error ? error.message : 'Failed to load'}
              </div>
            </div>
          )}
          {!isLoading && !error && isDirData && (
            <DirListing entries={data as GiteaEntry[]} onNavigate={handleNavigate} />
          )}
          {!isLoading && !error && isFileData && (
            <FileContent entry={data as GiteaEntry} />
          )}
        </div>
      </div>
    </div>
  )
}
