import { useState } from 'react'
import {
  FileText, Upload, ChevronDown, ChevronUp, CheckCircle2,
  Clock, XCircle, Copy, Mail, Globe, Users,
  AlertTriangle, Plus, Loader2, RefreshCw,
} from 'lucide-react'
import { useVisaData } from './useVisaData'
import { useApi } from '../../shared/auth/useApi'
import type { VisaApplication, VisaStep, VisaDocument, VisaStatus } from './visaTypes'

// ─── Constants ────────────────────────────────────────────────────────────────
type FilterKey = 'all' | 'UAE' | 'TH' | 'active' | 'approved'

const COUNTRY_FLAG: Record<string, string> = {
  UAE: '🇦🇪',
  TH:  '🇹🇭',
  SE:  '🇸🇪',
  US:  '🇺🇸',
}

const VISA_TYPE_LABEL: Record<string, string> = {
  investor_visa:       'Investor Visa',
  golden_visa:         'Golden Visa',
  tourist:             'Tourist',
  entry_permit:        'Entry Permit',
  residency_renewal:   'Residency Renewal',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

function stepsDone(app: VisaApplication): number {
  return app.steps.filter(s => s.status === 'done').length
}

function missingDocsCount(app: VisaApplication): number {
  return app.steps.flatMap(s => s.documents).filter(d => d.required && d.status === 'needed').length
}

function nextTodo(app: VisaApplication): VisaStep | undefined {
  return app.steps.find(s => s.status === 'todo' || s.status === 'in_progress')
}

function statusConfig(status: VisaStatus) {
  const map: Record<VisaStatus, { label: string; bg: string; text: string }> = {
    not_started: { label: 'Ej påbörjad',  bg: 'bg-stone-100',    text: 'text-stone-600' },
    in_progress: { label: 'Pågår',        bg: 'bg-amber-100',    text: 'text-amber-700' },
    submitted:   { label: 'Inlämnad',     bg: 'bg-blue-100',     text: 'text-[#0A3D62]' },
    approved:    { label: 'Godkänd',      bg: 'bg-emerald-100',  text: 'text-emerald-700' },
    rejected:    { label: 'Nekad',        bg: 'bg-red-100',      text: 'text-red-700' },
    expired:     { label: 'Utgången',     bg: 'bg-orange-100',   text: 'text-orange-700' },
  }
  return map[status]
}

function stepStatusIcon(s: VisaStep['status']) {
  if (s === 'done')        return <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
  if (s === 'in_progress') return <Clock        size={16} className="text-yellow-400 shrink-0" />
  if (s === 'blocked')     return <XCircle      size={16} className="text-red-400    shrink-0" />
  return <div className="w-4 h-4 rounded border border-stone-300 shrink-0" />
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

const AVATAR_COLORS = [
  'bg-blue-200', 'bg-purple-200', 'bg-amber-200',
  'bg-emerald-200', 'bg-rose-200', 'bg-teal-200', 'bg-indigo-200',
]

function avatarColor(personId: string): string {
  let hash = 0
  for (let i = 0; i < personId.length; i++) hash = personId.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

// ─── Stats Row ────────────────────────────────────────────────────────────────
function StatsRow({ apps }: { apps: VisaApplication[] }) {
  const active   = apps.filter(a => a.status !== 'approved' && a.status !== 'rejected').length
  const missing  = apps.reduce((sum, a) => sum + missingDocsCount(a), 0)
  const complete = [...new Set(apps.filter(a => a.status === 'approved').map(a => a.person_id))].length
  const totalMembers = [...new Set(apps.map(a => a.person_id))].length

  const nearest = apps
    .filter(a => a.target_date && a.status !== 'approved')
    .map(a => ({ days: daysUntil(a.target_date), label: a.target_date }))
    .sort((a, b) => a.days - b.days)[0]

  const stats = [
    {
      label: 'Aktiva ansökningar',
      value: String(active),
      sub:   `${apps.length} totalt`,
      accent: 'text-[#0A3D62]',
    },
    {
      label: 'Närmaste deadline',
      value: nearest ? `${nearest.days}d` : '—',
      sub:   nearest ? nearest.label : 'Inga deadlines',
      accent: nearest && nearest.days < 14 ? 'text-red-400' : 'text-yellow-400',
    },
    {
      label: 'Dokument saknas',
      value: String(missing),
      sub:   missing === 0 ? 'Allt klart' : 'krävs åtgärd',
      accent: missing > 0 ? 'text-orange-400' : 'text-emerald-400',
    },
    {
      label: 'Komplett status',
      value: `${complete}/${totalMembers}`,
      sub:   'teammedlemmar klara',
      accent: 'text-emerald-400',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(s => (
        <div key={s.label} className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-xs text-stone-400 uppercase tracking-widest mb-2">{s.label}</div>
          <div className={`text-3xl font-bold ${s.accent}`}>{s.value}</div>
          <div className="text-xs text-stone-500 mt-1">{s.sub}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Document Row ─────────────────────────────────────────────────────────────
function DocRow({ doc }: { doc: VisaDocument }) {
  const statusColor: Record<string, string> = {
    needed:    'text-red-400',
    gathering: 'text-yellow-400',
    ready:     'text-[#0A3D62]',
    submitted: 'text-purple-400',
    approved:  'text-emerald-400',
  }
  const statusLabel: Record<string, string> = {
    needed:    'Saknas',
    gathering: 'Samlas',
    ready:     'Klar',
    submitted: 'Inlämnad',
    approved:  'Godkänd',
  }

  return (
    <div className="flex items-center justify-between py-1.5 pl-6 border-b border-stone-200/50 last:border-0">
      <div className="flex items-center gap-2">
        <FileText size={12} className="text-stone-400 shrink-0" />
        <span className="text-xs text-stone-600">{doc.name}</span>
        {doc.required && <span className="text-[10px] text-stone-400">*</span>}
        {doc.notes && <span className="text-[10px] text-stone-400 italic">— {doc.notes}</span>}
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-medium ${statusColor[doc.status]}`}>
          {statusLabel[doc.status]}
        </span>
        {doc.status === 'needed' && (
          <button
            className="text-[10px] px-2 py-0.5 rounded bg-[#0A3D62]/10 text-[#0A3D62] hover:bg-[#0A3D62]/20 transition-colors flex items-center gap-1"
            onClick={() => {/* file picker */}}
          >
            <Upload size={10} />
            Ladda upp
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Step Row ─────────────────────────────────────────────────────────────────
function StepRow({ step }: { step: VisaStep }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-stone-200/50 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 py-3 text-left hover:bg-stone-50 transition-colors px-1 rounded"
      >
        {stepStatusIcon(step.status)}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-medium ${step.status === 'done' ? 'text-stone-400 line-through' : 'text-[#0A3D62]'}`}>
              {step.title}
            </span>
            <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">{step.phase}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-stone-500">@{step.owner}</span>
            <span className="text-xs text-stone-400">~{step.est_days}d</span>
            {step.cost_usd ? <span className="text-xs text-stone-400">${step.cost_usd}</span> : null}
            {step.blocker && <span className="text-xs text-red-400">Blockad: {step.blocker}</span>}
          </div>
        </div>
        {step.documents.length > 0 && (
          open
            ? <ChevronUp size={14} className="text-stone-400 shrink-0" />
            : <ChevronDown size={14} className="text-stone-400 shrink-0" />
        )}
      </button>

      {open && step.documents.length > 0 && (
        <div className="mb-2">
          {step.documents.map(d => <DocRow key={d.id} doc={d} />)}
          {step.notes && (
            <p className="pl-6 text-xs text-stone-400 italic py-1">{step.notes}</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── PRO Agent Brief Modal ────────────────────────────────────────────────────
function ProBriefModal({ app, onClose }: { app: VisaApplication; onClose: () => void }) {
  const readyDocs   = app.steps.flatMap(s => s.documents).filter(d => d.status === 'ready' || d.status === 'approved')
  const missingDocs = app.steps.flatMap(s => s.documents).filter(d => d.required && d.status === 'needed')

  const brief = `# PRO-agent Brief — ${app.person_name}
Genererad: ${new Date().toISOString().slice(0, 10)}

## Personuppgifter
- **Namn:** ${app.person_name}
- **Visum-typ:** ${VISA_TYPE_LABEL[app.visa_type] ?? app.visa_type}
- **Land:** ${app.country}
- **Måldag:** ${app.target_date}

## Ansökan status
- **Status:** ${app.status}
- **Steg klara:** ${stepsDone(app)}/${app.steps.length}
${app.pro_agent ? `- **PRO-agent:** ${app.pro_agent}` : ''}

## Klara dokument (${readyDocs.length})
${readyDocs.map(d => `- ✅ ${d.name}`).join('\n') || '- Inga dokument klara ännu'}

## Dokument som saknas (${missingDocs.length})
${missingDocs.map(d => `- ❌ ${d.name}${d.notes ? ` (${d.notes})` : ''}`).join('\n') || '- Alla dokument klara'}

## Process-steg
${app.steps.map((s, i) => `${i + 1}. [${s.status === 'done' ? 'x' : ' '}] **${s.title}** — ${s.est_days}d${s.cost_usd ? ` · $${s.cost_usd}` : ''}`).join('\n')}

## Noteringar
${app.notes}

---
*Genererad av Wavult OS · ${new Date().toLocaleDateString('sv-SE')}*
`

  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(brief)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white border border-stone-200 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-stone-200">
          <h2 className="text-[#0A3D62] font-semibold text-sm">PRO-agent Brief — {app.person_name}</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-[#0A3D62] transition-colors text-xl leading-none">×</button>
        </div>
        <pre className="flex-1 overflow-y-auto p-5 text-xs text-stone-600 font-mono whitespace-pre-wrap leading-relaxed bg-stone-50">
          {brief}
        </pre>
        <div className="flex items-center gap-3 p-5 border-t border-stone-200">
          <button
            onClick={copy}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              copied ? 'bg-emerald-100 text-emerald-700' : 'bg-[#0A3D62] hover:bg-[#0A3D62]/90 text-white'
            }`}
          >
            <Copy size={14} />
            {copied ? 'Kopierad!' : 'Kopiera'}
          </button>
          <a
            href={`mailto:${app.pro_agent?.match(/[\w.]+@[\w.]+/)?.[0] ?? ''}?subject=Visa Brief — ${app.person_name}&body=${encodeURIComponent(brief)}`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium transition-colors"
          >
            <Mail size={14} />
            Skicka via mail
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── Application Card ─────────────────────────────────────────────────────────
function AppCard({ app }: { app: VisaApplication }) {
  const [expanded, setExpanded] = useState(false)
  const [briefApp, setBriefApp] = useState<VisaApplication | null>(null)

  const done  = stepsDone(app)
  const total = app.steps.length
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0
  const next  = nextTodo(app)
  const days  = app.target_date ? daysUntil(app.target_date) : null
  const sc    = statusConfig(app.status)
  const missing = missingDocsCount(app)
  const color   = avatarColor(app.person_id)
  const initials = getInitials(app.person_name)

  return (
    <>
      {briefApp && <ProBriefModal app={briefApp} onClose={() => setBriefApp(null)} />}

      <div className={`bg-white border rounded-xl transition-all ${expanded ? 'border-[#0A3D62]/30' : 'border-stone-200'}`}>
        {/* Card header */}
        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-xs font-bold text-[#0A3D62] shrink-0`}>
              {initials}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[#0A3D62] font-semibold text-sm">{app.person_name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium">
                  {VISA_TYPE_LABEL[app.visa_type] ?? app.visa_type}
                </span>
                <span className="text-base" title={app.country}>{COUNTRY_FLAG[app.country] ?? '🌐'}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.bg} ${sc.text}`}>
                  {sc.label}
                </span>
              </div>

              {/* Progress */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
                  <span>{done}/{total} steg klara</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0A3D62] rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Next step + deadline */}
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                {next && (
                  <span className="text-xs text-stone-500">
                    Nästa: <span className="text-[#0A3D62]">{next.title}</span>
                  </span>
                )}
                {days !== null && (
                  <span className={`text-xs flex items-center gap-1 ${days < 14 ? 'text-red-400' : 'text-stone-400'}`}>
                    <Clock size={11} />
                    {days < 0 ? `${Math.abs(days)}d sedan` : `om ${days}d`}
                  </span>
                )}
                {missing > 0 && (
                  <span className="text-xs text-orange-400 flex items-center gap-1">
                    <AlertTriangle size={11} />
                    {missing} dok saknas
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              <button
                onClick={() => setBriefApp(app)}
                className="text-xs px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors flex items-center gap-1.5"
              >
                <FileText size={12} />
                PRO-brief
              </button>
              <button
                onClick={() => setExpanded(e => !e)}
                className="text-xs px-3 py-1.5 rounded-lg bg-[#0A3D62]/10 hover:bg-[#0A3D62]/20 text-[#0A3D62] transition-colors flex items-center gap-1.5"
              >
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {expanded ? 'Dölj' : 'Visa detaljer'}
              </button>
            </div>
          </div>
        </div>

        {/* Expanded step tracker */}
        {expanded && (
          <div className="border-t border-stone-200 px-5 py-4">
            {app.pro_agent && (
              <div className="mb-4 flex items-center gap-2 text-xs text-stone-500 bg-stone-50 rounded-lg px-3 py-2">
                <Users size={12} className="text-[#0A3D62]" />
                PRO-agent: <span className="text-[#0A3D62]">{app.pro_agent}</span>
              </div>
            )}
            {app.notes && (
              <p className="text-xs text-stone-400 italic mb-4">{app.notes}</p>
            )}
            <div className="space-y-0.5">
              {app.steps.map(step => (
                <StepRow key={step.id} step={step} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ─── Add Application Modal ─────────────────────────────────────────────────────
interface AddApplicationModalProps {
  members: { id: string; name: string }[]
  onClose: () => void
  onSuccess: () => void
}

function AddApplicationModal({ members, onClose, onSuccess }: AddApplicationModalProps) {
  const { apiFetch } = useApi()

  const [form, setForm] = useState({
    person_id:   '',
    visa_type:   'tourist' as VisaApplication['visa_type'],
    country:     'TH' as VisaApplication['country'],
    target_date: '',
  })
  const [saving,  setSaving]  = useState(false)
  const [saveErr, setSaveErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.person_id || !form.target_date) {
      setSaveErr('Fyll i alla obligatoriska fält.')
      return
    }
    setSaving(true)
    setSaveErr(null)
    try {
      const res = await apiFetch('/v1/visa/applications', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.message ?? `API svarade ${res.status}`)
      }
      onSuccess()
    } catch (err) {
      setSaveErr(err instanceof Error ? err.message : 'Okänt fel')
    } finally {
      setSaving(false)
    }
  }

  const memberOptions = members.length > 0
    ? members
    : [] // Ingen fallback med hårdkodade namn

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white border border-stone-200 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-stone-200">
          <h2 className="text-[#0A3D62] font-semibold text-sm">Lägg till ansökan</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-[#0A3D62] transition-colors text-xl leading-none">×</button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {/* Teammedlem */}
          <div>
            <label className="block text-xs text-stone-500 mb-1.5">Teammedlem *</label>
            {memberOptions.length === 0 ? (
              <p className="text-xs text-stone-400 italic">Inga teammedlemmar hittades i API:et.</p>
            ) : (
              <select
                value={form.person_id}
                onChange={e => setForm(f => ({ ...f, person_id: e.target.value }))}
                required
                className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm text-[#0A3D62] focus:outline-none focus:border-[#0A3D62]"
              >
                <option value="">Välj teammedlem</option>
                {memberOptions.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Visumtyp */}
          <div>
            <label className="block text-xs text-stone-500 mb-1.5">Visumtyp *</label>
            <select
              value={form.visa_type}
              onChange={e => setForm(f => ({ ...f, visa_type: e.target.value as VisaApplication['visa_type'] }))}
              className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm text-[#0A3D62] focus:outline-none focus:border-[#0A3D62]"
            >
              <option value="tourist">Tourist</option>
              <option value="investor_visa">Investor Visa</option>
              <option value="golden_visa">Golden Visa</option>
              <option value="entry_permit">Entry Permit</option>
              <option value="residency_renewal">Residency Renewal</option>
            </select>
          </div>

          {/* Land */}
          <div>
            <label className="block text-xs text-stone-500 mb-1.5">Land *</label>
            <select
              value={form.country}
              onChange={e => setForm(f => ({ ...f, country: e.target.value as VisaApplication['country'] }))}
              className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm text-[#0A3D62] focus:outline-none focus:border-[#0A3D62]"
            >
              <option value="TH">🇹🇭 Thailand</option>
              <option value="UAE">🇦🇪 UAE</option>
              <option value="SE">🇸🇪 Sverige</option>
              <option value="US">🇺🇸 USA</option>
              <option value="other">Annat</option>
            </select>
          </div>

          {/* Startdatum */}
          <div>
            <label className="block text-xs text-stone-500 mb-1.5">Måldatum *</label>
            <input
              type="date"
              value={form.target_date}
              onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))}
              required
              className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm text-[#0A3D62] focus:outline-none focus:border-[#0A3D62]"
            />
          </div>

          {saveErr && (
            <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 rounded-lg px-3 py-2">
              <AlertTriangle size={12} />
              {saveErr}
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={saving || memberOptions.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0A3D62] hover:bg-[#0A3D62]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {saving ? 'Sparar…' : 'Lägg till'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 text-sm transition-colors"
            >
              Avbryt
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4">🛂</div>
      <h2 className="text-[#0A3D62] font-semibold text-lg mb-2">Inga visumansökningar</h2>
      <p className="text-stone-500 text-sm max-w-sm mb-6">
        Lägg till ansökan för att börja spåra visumstatus för ditt team.
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0A3D62] hover:bg-[#0A3D62]/90 text-white text-sm font-medium transition-colors"
      >
        <Plus size={15} />
        Lägg till ansökan
      </button>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function VisaHub() {
  const { applications, members, loading, error, refetch } = useVisaData()
  const [filter,   setFilter]   = useState<FilterKey>('all')
  const [showAdd,  setShowAdd]  = useState(false)

  const filtered = applications.filter(app => {
    if (filter === 'UAE')      return app.country === 'UAE'
    if (filter === 'TH')       return app.country === 'TH'
    if (filter === 'active')   return app.status !== 'approved' && app.status !== 'rejected'
    if (filter === 'approved') return app.status === 'approved'
    return true
  })

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'all',      label: `Alla (${applications.length})` },
    { key: 'UAE',      label: '🇦🇪 UAE' },
    { key: 'TH',       label: '🇹🇭 Thailand' },
    { key: 'active',   label: 'Aktiva' },
    { key: 'approved', label: 'Godkända' },
  ]

  // Thailand deadline banner (baserat på live-data, inte hårdkodat)
  const thApps = applications.filter(a => a.country === 'TH' && a.status !== 'approved')
  const thDays = thApps.length > 0
    ? Math.min(...thApps.map(a => daysUntil(a.target_date)))
    : null

  function handleAddSuccess() {
    setShowAdd(false)
    refetch()
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-stone-800 p-6">
      {showAdd && (
        <AddApplicationModal
          members={members}
          onClose={() => setShowAdd(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      <div className="max-w-5xl mx-auto space-y-6">

        {/* [A] Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0A3D62] flex items-center gap-2">
              <Globe size={22} className="text-[#0A3D62]" />
              Visa & Resedokument
            </h1>
            <p className="text-stone-500 text-sm mt-1">
              Spåra ansökningar, dokument och deadlines för hela teamet
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refetch}
              disabled={loading}
              className="text-stone-400 hover:text-stone-600 transition-colors disabled:opacity-40"
              title="Uppdatera"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            {applications.length > 0 && (
              <div className="text-xs text-stone-400 flex items-center gap-1.5">
                <Users size={13} />
                {[...new Set(applications.map(a => a.person_id))].length} teammedlemmar
              </div>
            )}
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#0A3D62] hover:bg-[#0A3D62]/90 text-white font-medium transition-colors"
            >
              <Plus size={13} />
              Lägg till ansökan
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12 gap-3 text-stone-400">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Hämtar visumdata…</span>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 flex items-start gap-3">
            <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 font-medium text-sm">Kunde inte hämta visumdata</p>
              <p className="text-red-500 text-xs mt-1">{error}</p>
              <button
                onClick={refetch}
                className="mt-2 text-xs text-red-500 hover:text-red-700 underline transition-colors"
              >
                Försök igen
              </button>
            </div>
          </div>
        )}

        {/* Content — only when not loading */}
        {!loading && !error && (
          <>
            {/* Thailand alert banners — baserat på live-data */}
            {thDays !== null && thDays >= 0 && thDays < 30 && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 flex items-center gap-3">
                <AlertTriangle size={18} className="text-yellow-400 shrink-0" />
                <div>
                  <p className="text-amber-700 font-semibold text-sm">
                    🇹🇭 Thailand-ansökan — {thDays} dagar kvar
                  </p>
                  <p className="text-amber-600 text-xs mt-0.5">
                    Svenska medborgare: visumfritt 30 dagar. Kontrollera pass + boka returresa.
                  </p>
                </div>
              </div>
            )}

            {thDays !== null && thDays >= 0 && thDays <= 10 && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-red-700 font-semibold text-sm">
                      ⚠️ TDAC krävs — Thailand Digital Arrival Card
                    </p>
                    <p className="text-red-600 text-xs mt-1 leading-relaxed">
                      Obligatorisk sedan 1 maj 2025. Ersätter TM6-pappersblanketten.{' '}
                      <strong>Måste fyllas i max 72h före ankomst.</strong>
                    </p>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="bg-white rounded-lg p-2.5 space-y-1 border border-red-100">
                        <p className="text-stone-400 font-medium uppercase tracking-wide text-[10px]">Officiell sajt (gratis)</p>
                        <a
                          href="https://tdac.immigration.go.th"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0A3D62] hover:text-[#0A3D62]/80 transition-colors font-mono"
                        >
                          tdac.immigration.go.th →
                        </a>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 space-y-1 border border-red-100">
                        <p className="text-stone-400 font-medium uppercase tracking-wide text-[10px]">Krävs i formuläret</p>
                        <p className="text-stone-600 text-[11px]">Pass · Personuppgifter · Ekonomisk info · Resplan · Boende · Hälsostatus</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-1.5 border border-amber-200">
                      <AlertTriangle size={11} className="text-amber-400 shrink-0" />
                      <p className="text-amber-700 text-[11px]">
                        Bluffesidor tar betalt och stjäl passdata. Använd <span className="font-semibold">BARA</span> den officiella URL:en ovan.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {thDays !== null && thDays > 10 && thDays < 30 && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 flex items-start gap-3">
                <Globe size={15} className="text-[#0A3D62] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[#0A3D62] text-xs font-medium">
                    TDAC — Thailand Digital Arrival Card krävs (sedan maj 2025)
                  </p>
                  <p className="text-[#0A3D62]/60 text-[11px] mt-0.5">
                    Fyll i max 72h före ankomst på{' '}
                    <span className="font-mono">tdac.immigration.go.th</span> (gratis, officiell sajt).
                  </p>
                </div>
              </div>
            )}

            {/* Empty state */}
            {applications.length === 0 && (
              <EmptyState onAdd={() => setShowAdd(true)} />
            )}

            {/* Stats + filters + cards — bara om det finns data */}
            {applications.length > 0 && (
              <>
                <StatsRow apps={applications} />

                <div className="flex items-center gap-2 flex-wrap">
                  {filters.map(f => (
                    <button
                      key={f.key}
                      onClick={() => setFilter(f.key)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                        filter === f.key
                          ? 'bg-[#0A3D62] text-white'
                          : 'bg-white text-stone-500 hover:bg-stone-100 hover:text-stone-700 border border-stone-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {filtered.length === 0 ? (
                    <div className="text-center py-12 text-stone-400 text-sm">Inga ansökningar matchar filtret</div>
                  ) : (
                    filtered.map(app => <AppCard key={app.id} app={app} />)
                  )}
                </div>

                <div className="rounded-xl border border-stone-200 bg-white p-4">
                  <p className="text-xs text-stone-400 flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-[#0A3D62]" />
                    UAE: DIFC/GDRFA har inga publika API:er — all inlämning via PRO-agent (Virtuzone). Thailand: TDAC fylls i manuellt på tdac.immigration.go.th (gratis, obligatorisk sedan maj 2025).
                  </p>
                </div>
              </>
            )}
          </>
        )}

      </div>
    </div>
  )
}
