import { useState, useMemo } from 'react'
import {
  LEGAL_DOCUMENTS,
  LEGAL_TRIGGERS,
  DOC_TYPE_LABELS,
  SIGNING_LEVEL_LABELS,
  SIGNING_LEVEL_DESCRIPTION,
  SIGN_METHOD_LABELS,
  getSignMethodsForJurisdiction,
  type LegalDocument,
  type LegalDocType,
  type DocStatus,
  type SigningLevel,
  type SignMethod,
} from './data'
import { ENTITIES } from '../org-graph/data'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEntity(id: string) {
  return ENTITIES.find(e => e.id === id)
}

const STATUS_CONFIG: Record<DocStatus, { label: string; color: string; bg: string }> = {
  proposed:          { label: 'Föreslagen',        color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  draft:             { label: 'Utkast',             color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
  pending_signature: { label: 'Inväntar signatur',  color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  signed:            { label: 'Signerat',           color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  expired:           { label: 'Utgånget',           color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  rejected:          { label: 'Avvisat',            color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
}

const LEVEL_CONFIG: Record<SigningLevel, { color: string; bg: string }> = {
  L1: { color: '#6B7280', bg: 'rgba(107,114,128,0.15)' },
  L2: { color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  L3: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' },
}

// ─── Inline SVG icons ─────────────────────────────────────────────────────────

function IconScale({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3v18M3 9h18M5 9l3-6 3 6M13 9l3-6 3 6M5 9c0 2.21 1.34 4 3 4s3-1.79 3-4M13 9c0 2.21 1.34 4 3 4s3-1.79 3-4M5 21h14" />
    </svg>
  )
}

function IconFileText({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10,9 9,9 8,9" />
    </svg>
  )
}

function IconShield({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function IconAlertTriangle({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function IconCheckCircle({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22,4 12,14.01 9,11.01" />
    </svg>
  )
}

function IconClock({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  )
}

function IconSend({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22,2 15,22 11,13 2,9" />
    </svg>
  )
}

function IconX({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconEye({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconXCircle({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  )
}

function IconChevronDown({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="6,9 12,15 18,9" />
    </svg>
  )
}

function IconChevronUp({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="18,15 12,9 6,15" />
    </svg>
  )
}

function DocTypeIcon({ type, size = 14 }: { type: LegalDocType; size?: number }) {
  switch (type) {
    case 'ip_license':              return <IconShield size={size} />
    case 'management_agreement':    return <IconFileText size={size} />
    case 'service_agreement':       return <IconFileText size={size} />
    case 'shareholder_agreement':   return <IconFileText size={size} />
    case 'intercompany_loan':       return <IconFileText size={size} />
    case 'employment_contract':     return <IconFileText size={size} />
    case 'nda':                     return <IconShield size={size} />
    case 'data_processing_agreement': return <IconShield size={size} />
  }
}

type FilterTab = 'all' | 'proposed' | 'pending' | 'signed' | 'by_type'

// ─── Send for Signing Modal ───────────────────────────────────────────────────

interface SigningModalProps {
  doc: LegalDocument
  onClose: () => void
  onSent: (id: string) => void
}

function SigningModal({ doc, onClose, onSent }: SigningModalProps) {
  const entityA = getEntity(doc.party_a)
  const entityB = getEntity(doc.party_b)

  const jurA = entityA?.jurisdiction ?? 'Global'
  const jurB = entityB?.jurisdiction ?? 'Global'

  const [level, setLevel] = useState<SigningLevel>(doc.signing_level)
  const methodsA = getSignMethodsForJurisdiction(jurA, level)
  const methodsB = getSignMethodsForJurisdiction(jurB, level)

  const [signerAMethod, setSignerAMethod] = useState<SignMethod>(methodsA[0])
  const [signerBMethod, setSignerBMethod] = useState<SignMethod>(methodsB[0])
  const [signerAContact, setSignerAContact] = useState('')
  const [signerBContact, setSignerBContact] = useState('')

  const needsContact = (method: SignMethod) => method !== 'click'

  const contactLabel = (method: SignMethod) => {
    if (method === 'bankid') return 'Personnummer (YYYYMMDD-XXXX)'
    if (method === 'eid_eidas') return 'E-postadress (eIDAS-länk)'
    return 'E-postadress'
  }

  function handleSend() {
    onSent(doc.id)
    onClose()
  }

  const hasBankID = signerAMethod === 'bankid' || signerBMethod === 'bankid'
  const hasNonBankID = signerAMethod !== 'bankid' || signerBMethod !== 'bankid'
  const nonBankIDMethod = signerAMethod !== 'bankid' ? signerAMethod : signerBMethod

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" style={{ backdropFilter: 'blur(4px)' }} onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg mx-4 bg-[#0D0F1A] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)' }}>
              <IconSend size={14} className="text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-mono mb-0.5">Skicka för signering</p>
              <p className="text-sm font-semibold text-white leading-tight">{doc.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300 transition-colors ml-4 flex-shrink-0">
            <IconX size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Summary */}
          <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-[10px] text-gray-600 font-mono uppercase tracking-wider mb-3">Dokumentöversikt</p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 w-20">Typ</span>
              <span className="text-xs text-gray-300">{DOC_TYPE_LABELS[doc.type]}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 w-20">Beskrivning</span>
              <span className="text-[10px] text-gray-500 flex-1">{doc.description}</span>
            </div>
            {doc.amount !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 w-20">Belopp</span>
                <span className="text-xs text-gray-300">{doc.amount.toLocaleString('sv-SE')} {doc.currency}</span>
              </div>
            )}
            {doc.royalty_rate !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 w-20">Royalty</span>
                <span className="text-xs text-gray-300">{doc.royalty_rate}% av nettointäkter</span>
              </div>
            )}
          </div>

          {/* Signing level */}
          <div>
            <p className="text-[10px] text-gray-600 font-mono uppercase tracking-wider mb-2">Signeringsnivå</p>
            <div className="flex gap-2">
              {(['L1', 'L2', 'L3'] as SigningLevel[]).map(l => (
                <button
                  key={l}
                  onClick={() => {
                    setLevel(l)
                    setSignerAMethod(getSignMethodsForJurisdiction(jurA, l)[0])
                    setSignerBMethod(getSignMethodsForJurisdiction(jurB, l)[0])
                  }}
                  className="flex-1 py-2 px-3 rounded-lg border text-xs font-mono transition-all"
                  style={level === l
                    ? { background: LEVEL_CONFIG[l].bg, borderColor: LEVEL_CONFIG[l].color, color: LEVEL_CONFIG[l].color }
                    : { background: 'transparent', borderColor: 'rgba(255,255,255,0.08)', color: '#6B7280' }
                  }
                >
                  {l}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-600 mt-1.5">{SIGNING_LEVEL_DESCRIPTION[level]}</p>
          </div>

          {/* Party A signer */}
          <div>
            <p className="text-[10px] text-gray-600 font-mono uppercase tracking-wider mb-2">
              Part A — {entityA?.shortName ?? doc.party_a}
              {' '}<span className="text-gray-700">{entityA?.flag} {jurA}</span>
            </p>
            <div className="space-y-2">
              <div className="flex gap-2 flex-wrap">
                {getSignMethodsForJurisdiction(jurA, level).map(m => (
                  <button
                    key={m}
                    onClick={() => setSignerAMethod(m)}
                    className="flex-1 py-1.5 px-2 rounded-lg border text-[10px] transition-all"
                    style={signerAMethod === m
                      ? { background: 'rgba(59,130,246,0.15)', borderColor: '#3B82F6', color: '#93C5FD' }
                      : { background: 'transparent', borderColor: 'rgba(255,255,255,0.06)', color: '#6B7280' }
                    }
                  >
                    {SIGN_METHOD_LABELS[m]}
                  </button>
                ))}
              </div>
              {needsContact(signerAMethod) && (
                <input
                  type="text"
                  value={signerAContact}
                  onChange={e => setSignerAContact(e.target.value)}
                  placeholder={contactLabel(signerAMethod)}
                  className="w-full rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              )}
            </div>
          </div>

          {/* Party B signer */}
          <div>
            <p className="text-[10px] text-gray-600 font-mono uppercase tracking-wider mb-2">
              Part B — {entityB?.shortName ?? doc.party_b}
              {' '}<span className="text-gray-700">{entityB?.flag} {jurB}</span>
            </p>
            <div className="space-y-2">
              <div className="flex gap-2 flex-wrap">
                {getSignMethodsForJurisdiction(jurB, level).map(m => (
                  <button
                    key={m}
                    onClick={() => setSignerBMethod(m)}
                    className="flex-1 py-1.5 px-2 rounded-lg border text-[10px] transition-all"
                    style={signerBMethod === m
                      ? { background: 'rgba(59,130,246,0.15)', borderColor: '#3B82F6', color: '#93C5FD' }
                      : { background: 'transparent', borderColor: 'rgba(255,255,255,0.06)', color: '#6B7280' }
                    }
                  >
                    {SIGN_METHOD_LABELS[m]}
                  </button>
                ))}
              </div>
              {needsContact(signerBMethod) && (
                <input
                  type="text"
                  value={signerBContact}
                  onChange={e => setSignerBContact(e.target.value)}
                  placeholder={contactLabel(signerBMethod)}
                  className="w-full rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              )}
            </div>
          </div>

          {/* Jurisdictional note */}
          {(hasBankID || hasNonBankID) && (
            <div className="rounded-lg p-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <p className="text-[10px] leading-relaxed" style={{ color: 'rgba(252,211,77,0.8)' }}>
                {hasBankID && <>BankID kräver svenskt personnummer.</>}
                {hasBankID && hasNonBankID && ' '}
                {hasNonBankID && nonBankIDMethod !== 'bankid' && (
                  <>Internationella parter signerar via {SIGN_METHOD_LABELS[nonBankIDMethod]}.</>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/[0.06]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Avbryt
          </button>
          <button
            onClick={handleSend}
            className="flex items-center gap-2 px-4 py-2 text-white text-xs font-medium rounded-lg transition-colors"
            style={{ background: '#2563EB' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#3B82F6' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#2563EB' }}
          >
            <IconSend size={12} />
            Skicka signeringsförfrågan
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast {
  id: number
  message: string
  type: 'success' | 'info'
}

// ─── Document Row ─────────────────────────────────────────────────────────────

interface DocRowProps {
  doc: LegalDocument
  onSend: (doc: LegalDocument) => void
  onDismiss: (id: string) => void
}

function DocRow({ doc, onSend, onDismiss }: DocRowProps) {
  const entityA = getEntity(doc.party_a)
  const entityB = getEntity(doc.party_b)
  const status = STATUS_CONFIG[doc.status]
  const level = LEVEL_CONFIG[doc.signing_level]

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
      {/* Type icon */}
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-gray-500" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <DocTypeIcon type={doc.type} size={13} />
      </div>

      {/* Title + parties */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-200 font-medium truncate">{doc.title}</p>
        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
          <span className="text-[10px] text-gray-600">
            {entityA?.shortName ?? doc.party_a}
          </span>
          <span className="text-[10px] text-gray-700">→</span>
          <span className="text-[10px] text-gray-600">
            {entityB?.shortName ?? doc.party_b}
          </span>
          {doc.amount !== undefined && (
            <>
              <span className="text-[10px] text-gray-700 mx-1">·</span>
              <span className="text-[10px] text-gray-600">
                {doc.amount.toLocaleString('sv-SE')} {doc.currency}
              </span>
            </>
          )}
          {doc.royalty_rate !== undefined && (
            <>
              <span className="text-[10px] text-gray-700 mx-1">·</span>
              <span className="text-[10px] text-gray-600">{doc.royalty_rate}% royalty</span>
            </>
          )}
        </div>
      </div>

      {/* Level badge */}
      <span
        className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded flex-shrink-0"
        style={{ color: level.color, background: level.bg }}
      >
        {doc.signing_level}
      </span>

      {/* Sign method */}
      <span className="text-[10px] text-gray-600 flex-shrink-0 hidden md:block w-32 truncate">
        {SIGN_METHOD_LABELS[doc.sign_method]}
      </span>

      {/* Status badge */}
      <span
        className="text-[9px] font-mono px-2 py-0.5 rounded-full flex-shrink-0"
        style={{ color: status.color, background: status.bg }}
      >
        {status.label}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {(doc.status === 'proposed' || doc.status === 'draft') && (
          <>
            <button
              onClick={() => onSend(doc)}
              className="flex items-center gap-1 px-2 py-1 text-blue-400 text-[10px] rounded transition-colors"
              style={{ background: 'rgba(59,130,246,0.15)' }}
            >
              <IconSend size={10} />
              Skicka
            </button>
            {doc.status === 'proposed' && (
              <button
                onClick={() => onDismiss(doc.id)}
                className="flex items-center gap-1 px-2 py-1 text-gray-500 text-[10px] rounded transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <IconXCircle size={10} />
                Avvisa
              </button>
            )}
          </>
        )}
        <button
          className="flex items-center gap-1 px-2 py-1 text-gray-500 text-[10px] rounded transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          <IconEye size={10} />
          Visa
        </button>
      </div>
    </div>
  )
}

// ─── StatPill ─────────────────────────────────────────────────────────────────

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-lg font-bold" style={{ color }}>{value}</span>
      <span className="text-[10px] text-gray-600">{label}</span>
    </div>
  )
}

// ─── LegalHub ─────────────────────────────────────────────────────────────────

export function LegalHub() {
  const [docs, setDocs] = useState<LegalDocument[]>(LEGAL_DOCUMENTS)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [activeTypeFilter, setActiveTypeFilter] = useState<LegalDocType | 'all'>('all')
  const [signingDoc, setSigningDoc] = useState<LegalDocument | null>(null)
  const [triggersOpen, setTriggersOpen] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (message: string, type: Toast['type'] = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }

  const proposedDocs = useMemo(() => docs.filter(d => d.status === 'proposed'), [docs])
  const signedCount = useMemo(() => docs.filter(d => d.status === 'signed').length, [docs])
  const pendingCount = useMemo(() => docs.filter(d => d.status === 'pending_signature').length, [docs])

  const filteredDocs = useMemo(() => {
    let result = docs
    if (activeFilter === 'proposed') result = result.filter(d => d.status === 'proposed')
    else if (activeFilter === 'pending') result = result.filter(d => d.status === 'pending_signature')
    else if (activeFilter === 'signed') result = result.filter(d => d.status === 'signed')
    else if (activeFilter === 'by_type' && activeTypeFilter !== 'all') {
      result = result.filter(d => d.type === activeTypeFilter)
    }
    return result
  }, [docs, activeFilter, activeTypeFilter])

  function handleSent(id: string) {
    setDocs(prev => prev.map(d => d.id === id ? { ...d, status: 'pending_signature' as DocStatus } : d))
    addToast('Signeringsförfrågan skickad ✓')
  }

  function handleDismiss(id: string) {
    setDocs(prev => prev.map(d => d.id === id ? { ...d, status: 'rejected' as DocStatus } : d))
    addToast('Dokument avvisat', 'info')
  }

  const docTypes = useMemo((): LegalDocType[] => {
    return [...new Set(docs.map(d => d.type))]
  }, [docs])

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: '#070709' }}>

      {/* Toast notifications */}
      <div className="fixed bottom-6 right-6 z-50 space-y-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className="flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium"
            style={{
              background: t.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)',
              border: `1px solid ${t.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(107,114,128,0.3)'}`,
              color: t.type === 'success' ? '#34D399' : '#9CA3AF',
            }}
          >
            {t.type === 'success'
              ? <IconCheckCircle size={14} />
              : <IconClock size={14} />
            }
            {t.message}
          </div>
        ))}
      </div>

      {/* Signing modal */}
      {signingDoc !== null && (
        <SigningModal
          doc={signingDoc}
          onClose={() => setSigningDoc(null)}
          onSent={handleSent}
        />
      )}

      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-purple-400" style={{ background: 'rgba(139,92,246,0.1)' }}>
            <IconScale size={18} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Legal Hub</h1>
            <p className="text-[11px] text-gray-600">Wavult Group — intercompany avtal &amp; signeringsflöden</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 flex-wrap">
          <StatPill label="Totalt" value={docs.length} color="#6B7280" />
          <StatPill label="Föreslagna" value={proposedDocs.length} color="#F59E0B" />
          <StatPill label="Inväntar signatur" value={pendingCount} color="#3B82F6" />
          <StatPill label="Signerade" value={signedCount} color="#10B981" />
        </div>
      </div>

      {/* Proposed alerts banner */}
      {proposedDocs.length > 0 && (
        <div className="flex-shrink-0 mx-6 mt-4 rounded-xl p-4" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="flex-shrink-0" style={{ color: '#FBBF24' }}>
              <IconAlertTriangle size={14} />
            </span>
            <p className="text-sm font-semibold" style={{ color: '#FCD34D' }}>
              {proposedDocs.length} dokument föreslagna av systemet — kräver din åtgärd
            </p>
          </div>
          <div className="space-y-2">
            {proposedDocs.map(doc => {
              const entityB = getEntity(doc.party_b)
              return (
                <div key={doc.id} className="flex items-center gap-3">
                  <span className="text-gray-600 flex-shrink-0">
                    <DocTypeIcon type={doc.type} size={11} />
                  </span>
                  <span className="text-[11px] flex-1 truncate" style={{ color: 'rgba(252,211,77,0.7)' }}>{doc.title}</span>
                  <span className="text-[10px] text-gray-600">{entityB?.flag}</span>
                  <button
                    onClick={() => setSigningDoc(doc)}
                    className="text-[10px] px-2.5 py-1 rounded-lg transition-colors flex-shrink-0"
                    style={{ background: 'rgba(245,158,11,0.2)', color: '#FCD34D' }}
                  >
                    Granska
                  </button>
                  <button
                    onClick={() => handleDismiss(doc.id)}
                    className="text-[10px] px-2.5 py-1 rounded-lg transition-colors flex-shrink-0 text-gray-500"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    Avvisa
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex-shrink-0 px-6 mt-4 flex items-center gap-1 flex-wrap">
        {(
          [
            { id: 'all' as FilterTab, label: 'Alla' },
            { id: 'proposed' as FilterTab, label: 'Föreslagna' },
            { id: 'pending' as FilterTab, label: 'Inväntar' },
            { id: 'signed' as FilterTab, label: 'Signerade' },
            { id: 'by_type' as FilterTab, label: 'Per typ' },
          ]
        ).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className="px-3 py-1.5 rounded-lg text-xs transition-colors"
            style={activeFilter === tab.id
              ? { background: 'rgba(139,92,246,0.15)', color: '#A78BFA' }
              : { background: 'transparent', color: '#6B7280' }
            }
          >
            {tab.label}
          </button>
        ))}
        {activeFilter === 'by_type' && (
          <div className="flex items-center gap-1 ml-2 flex-wrap">
            <button
              onClick={() => setActiveTypeFilter('all')}
              className="px-2 py-1 rounded text-[10px] transition-colors"
              style={activeTypeFilter === 'all'
                ? { background: 'rgba(255,255,255,0.08)', color: '#E5E7EB' }
                : { background: 'transparent', color: '#6B7280' }
              }
            >
              Alla typer
            </button>
            {docTypes.map(t => (
              <button
                key={t}
                onClick={() => setActiveTypeFilter(t)}
                className="px-2 py-1 rounded text-[10px] transition-colors"
                style={activeTypeFilter === t
                  ? { background: 'rgba(255,255,255,0.08)', color: '#E5E7EB' }
                  : { background: 'transparent', color: '#6B7280' }
                }
              >
                {DOC_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Documents list */}
      <div className="flex-1 overflow-y-auto mx-6 mt-3 mb-4 rounded-xl overflow-hidden" style={{ background: '#0D0F1A', border: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Table header */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="w-7 flex-shrink-0" />
          <span className="flex-1 text-[10px] text-gray-600 font-mono uppercase tracking-wider">Dokument</span>
          <span className="text-[10px] text-gray-600 font-mono uppercase tracking-wider w-8 flex-shrink-0">Nivå</span>
          <span className="text-[10px] text-gray-600 font-mono uppercase tracking-wider flex-shrink-0 hidden md:block w-32">Metod</span>
          <span className="text-[10px] text-gray-600 font-mono uppercase tracking-wider flex-shrink-0 w-32">Status</span>
          <span className="text-[10px] text-gray-600 font-mono uppercase tracking-wider flex-shrink-0 w-36 text-right">Åtgärder</span>
        </div>

        {filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-700">
            <IconFileText size={28} />
            <p className="text-sm mt-3">Inga dokument matchar filtret</p>
          </div>
        ) : (
          filteredDocs.map(doc => (
            <DocRow
              key={doc.id}
              doc={doc}
              onSend={setSigningDoc}
              onDismiss={handleDismiss}
            />
          ))
        )}
      </div>

      {/* Signing levels reference */}
      <div className="flex-shrink-0 mx-6 mb-4">
        <div className="rounded-xl overflow-hidden" style={{ background: '#0D0F1A', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.04]">
            <span className="text-gray-600"><IconShield size={13} /></span>
            <span className="text-[11px] text-gray-500 font-mono">Signeringsnivåer</span>
          </div>
          <div className="flex divide-x divide-white/[0.04]">
            {(['L1', 'L2', 'L3'] as SigningLevel[]).map(l => (
              <div key={l} className="flex-1 px-4 py-3">
                <span
                  className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded"
                  style={{ color: LEVEL_CONFIG[l].color, background: LEVEL_CONFIG[l].bg }}
                >
                  {l}
                </span>
                <p className="text-[10px] text-gray-400 mt-1.5 font-medium">{SIGNING_LEVEL_LABELS[l]}</p>
                <p className="text-[10px] text-gray-600 mt-0.5">{SIGNING_LEVEL_DESCRIPTION[l]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Triggers panel */}
      <div className="flex-shrink-0 mx-6 mb-6">
        <div className="rounded-xl overflow-hidden" style={{ background: '#0D0F1A', border: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => setTriggersOpen(o => !o)}
            className="w-full flex items-center gap-2 px-4 py-3 transition-colors hover:bg-white/[0.02]"
          >
            <span className="text-gray-600"><IconAlertTriangle size={13} /></span>
            <span className="text-[11px] text-gray-500 font-mono flex-1 text-left">
              Automatiska trigger-regler ({LEGAL_TRIGGERS.length})
            </span>
            <span className="text-gray-700">
              {triggersOpen ? <IconChevronUp size={13} /> : <IconChevronDown size={13} />}
            </span>
          </button>

          {triggersOpen && (
            <div className="border-t border-white/[0.04]">
              <p className="px-4 py-2 text-[10px] text-gray-700">
                Dessa regler föreslår automatiskt dokument när de utlöses.
              </p>
              <div className="divide-y divide-white/[0.04]">
                {LEGAL_TRIGGERS.map(trigger => (
                  <div key={trigger.id} className="px-4 py-3 flex items-start gap-3">
                    <span
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5"
                      style={{
                        color: trigger.priority === 'critical' ? '#EF4444' : trigger.priority === 'high' ? '#F59E0B' : '#6B7280',
                        background: trigger.priority === 'critical' ? 'rgba(239,68,68,0.12)' : trigger.priority === 'high' ? 'rgba(245,158,11,0.12)' : 'rgba(107,114,128,0.12)',
                      }}
                    >
                      {trigger.priority}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-300">{trigger.description}</p>
                      <p className="text-[10px] text-gray-600 mt-0.5">{trigger.condition}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {trigger.generates.map(t => (
                          <span key={t} className="text-[9px] px-1.5 py-0.5 rounded text-gray-600" style={{ background: 'rgba(255,255,255,0.04)' }}>
                            {DOC_TYPE_LABELS[t]}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
