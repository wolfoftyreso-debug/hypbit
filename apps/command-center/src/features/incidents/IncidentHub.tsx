// ─── IncidentHub — NIS2 Art. 21.2b Incidenthantering ─────────────────────────
// Route: /incidents
// Levande incidenthanteringssystem med MSB-klocka, 5-stegs rutin och rapportering.

import { useState, useEffect, useCallback } from 'react'
import { useEntityScope } from '../../shared/scope/EntityScopeContext'
import { TEAM_MEMBERS } from '../../shared/data/systemData'

const API = import.meta.env.VITE_API_URL ?? 'https://api.wavult.com'

const SEVERITY_CONFIG = {
  critical: { label: 'Kritisk', color: '#C0392B', bg: '#FDECEA', icon: '🔴' },
  high:     { label: 'Hög',     color: '#E67E22', bg: '#FDF3E0', icon: '🟠' },
  medium:   { label: 'Medel',   color: '#B8760A', bg: '#FEF9E7', icon: '🟡' },
  low:      { label: 'Låg',     color: '#2D7A4F', bg: '#E8F5ED', icon: '🟢' },
}

const STATUS_CONFIG = {
  open:          { label: 'Öppen',       color: '#C0392B' },
  investigating: { label: 'Utreds',      color: '#E67E22' },
  contained:     { label: 'Begränsad',   color: '#B8760A' },
  resolved:      { label: 'Åtgärdad',    color: '#2D7A4F' },
  closed:        { label: 'Stängd',      color: '#8A8278' },
  msb_reported:  { label: 'MSB-rapport', color: '#0A3D62' },
}

const CATEGORY_LABELS: Record<string, string> = {
  data_breach:         'Dataintrång',
  system_outage:       'Systemavbrott',
  unauthorized_access: 'Obehörig åtkomst',
  malware:             'Skadlig kod',
  ddos:                'DDoS-attack',
  supply_chain:        'Leverantörskedja',
  human_error:         'Mänskligt fel',
  natural_disaster:    'Naturhändelse',
  other:               'Övrigt',
}

interface Incident {
  id: string
  entity_id: string
  title: string
  description: string
  severity: keyof typeof SEVERITY_CONFIG
  category: string
  status: keyof typeof STATUS_CONFIG
  detected_at: string
  msb_deadline?: string
  msb_reported_at?: string
  msb_hours_remaining?: number
  personal_data_involved: boolean
  reporter_id: string
  assignee_id?: string
  hours_open?: number
}

interface Stats {
  open_count: string
  critical_open: string
  msb_overdue: string
  msb_urgent: string
  avg_mttr_hours: string
  last_30_days: string
}

// ─── MSB-klocka ───────────────────────────────────────────────────────────────
function MSBCountdown({ deadline }: { deadline: string }) {
  const hours = (new Date(deadline).getTime() - Date.now()) / 3600000
  const isOverdue = hours < 0
  const isUrgent = hours < 6 && hours > 0

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
      isOverdue ? 'bg-[#FDECEA] text-[#C0392B] animate-pulse' :
      isUrgent  ? 'bg-[#FDF3E0] text-[#E67E22]' : 'bg-[#F5F0E8] text-[#8A8278]'
    }`}>
      ⏱️ MSB: {isOverdue ? 'FÖRFALLEN' : `${Math.round(hours)}h kvar`}
    </div>
  )
}

// ─── Modal: Ny incident ───────────────────────────────────────────────────────
function NewIncidentModal({ entityId, onClose, onCreated }: {
  entityId: string; onClose: () => void; onCreated: () => void
}) {
  const [form, setForm] = useState({
    title: '', description: '', severity: 'high', category: 'system_outage',
    personal_data_involved: false, affected_systems: '', affected_users_count: '',
  })
  const [saving, setSaving] = useState(false)
  const reporter = TEAM_MEMBERS.find(m => m.roleId === 'group-ceo') ?? TEAM_MEMBERS[0]
  const cto = TEAM_MEMBERS.find(m => m.roleId === 'cto')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch(`${API}/api/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer bypass' },
        body: JSON.stringify({
          entity_id: entityId,
          title: form.title,
          description: form.description,
          severity: form.severity,
          category: form.category,
          personal_data_involved: form.personal_data_involved,
          affected_systems: form.affected_systems
            ? form.affected_systems.split(',').map(s => s.trim())
            : [],
          affected_users_count: form.affected_users_count
            ? parseInt(form.affected_users_count)
            : null,
          reporter_id: reporter.email,
        }),
      })
      onCreated()
      onClose()
    } catch { /* non-blocking */ } finally { setSaving(false) }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        className="bg-[#FDFAF5] rounded-2xl p-6 w-full max-w-lg shadow-floating"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-[#0A3D62]">🚨 Rapportera incident</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-[#8A8278] uppercase tracking-wider block mb-1">Titel</label>
            <input
              required
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-[#DDD5C5] bg-white text-sm"
              placeholder="Kort beskrivning av incidenten"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[#8A8278] uppercase tracking-wider block mb-1">Allvarlighetsgrad</label>
              <select
                value={form.severity}
                onChange={e => setForm(p => ({ ...p, severity: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-[#DDD5C5] bg-white text-sm"
              >
                {Object.entries(SEVERITY_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#8A8278] uppercase tracking-wider block mb-1">Kategori</label>
              <select
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-[#DDD5C5] bg-white text-sm"
              >
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#8A8278] uppercase tracking-wider block mb-1">Beskrivning</label>
            <textarea
              required
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-[#DDD5C5] bg-white text-sm resize-none"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.personal_data_involved}
                onChange={e => setForm(p => ({ ...p, personal_data_involved: e.target.checked }))}
                className="w-4 h-4 accent-[#C0392B]"
              />
              <span className="text-xs text-[#C0392B] font-semibold">
                ⚠️ Personuppgifter involverade → 24h MSB-frist (GDPR Art. 33)
              </span>
            </label>
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#8A8278] uppercase tracking-wider block mb-1">
              Berörda system (kommaseparerat)
            </label>
            <input
              value={form.affected_systems}
              onChange={e => setForm(p => ({ ...p, affected_systems: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-[#DDD5C5] bg-white text-sm"
              placeholder="Wavult DS, API Core, Gitea..."
            />
          </div>

          <div className="bg-[#FDF3E0] rounded-xl p-3 text-[11px] text-[#8B6914]">
            <strong>Rapporteras av:</strong> {reporter.name} ({reporter.email})<br />
            <strong>Ansvarig teknisk:</strong> {cto?.name ?? 'Johan Berglund'} (johan@hypbit.com)
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#DDD5C5] text-sm text-gray-600 hover:bg-[#F5F0E8]"
          >
            Avbryt
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 px-6 rounded-xl bg-[#C0392B] text-white text-sm font-bold hover:bg-[#A93226] disabled:opacity-50"
          >
            {saving ? 'Sparar...' : '🚨 Rapportera incident'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Incidentrutin-dokument (NIS2 Art. 21.2b) ─────────────────────────────────
function IncidentRoutine() {
  const cto = TEAM_MEMBERS.find(m => m.roleId === 'cto')
  const ceo = TEAM_MEMBERS.find(m => m.roleId === 'group-ceo')
  const clo = TEAM_MEMBERS.find(m => m.roleId === 'clo')

  const steps = [
    {
      step: '1', time: '0–15 min', title: 'Identifiering och initial bedömning',
      who: cto?.name ?? 'Johan Berglund', whoRole: 'Group CTO',
      actions: [
        'Bekräfta att en incident faktiskt har inträffat (inte ett falskt alarm)',
        'Klassificera allvarlighetsgrad: Kritisk / Hög / Medel / Låg',
        'Dokumentera i Wavult DS: /incidents → "Rapportera incident"',
        `Om Kritisk: Ring omedelbart ${ceo?.name ?? 'Erik'} (+46709123223)`,
      ],
      color: '#C0392B',
    },
    {
      step: '2', time: '0–2 tim', title: 'Begränsning (Containment)',
      who: cto?.name ?? 'Johan Berglund', whoRole: 'Group CTO',
      actions: [
        'Isolera berörda system (stäng ned tjänst om nödvändigt)',
        'Ändra komprometterade credentials omedelbart',
        'Dokumentera alla åtgärder i incidentloggen',
        'Bevara loggfiler och bevis — rör inget utan godkännande',
      ],
      color: '#E67E22',
    },
    {
      step: '3', time: 'Inom 24h', title: 'MSB-rapportering (om tillämplig)',
      who: clo?.name ?? 'Dennis Bjarnemark', whoRole: 'Chief Legal',
      actions: [
        'GDPR Art. 33: Anmäl till MSB om personuppgifter berörs (24h)',
        'NIS2: Anmäl kritiska incidenter till MSB (72h)',
        'MSB-portal: https://www.msb.se/nis2 | Tel: 020-120 13 13',
        'Generera MSB-rapport via Wavult DS: Incident → "Generera MSB-rapport"',
      ],
      color: '#0A3D62',
    },
    {
      step: '4', time: '2–72 tim', title: 'Utredning och åtgärd',
      who: cto?.name ?? 'Johan Berglund', whoRole: 'Group CTO',
      actions: [
        'Identifiera grundorsak (root cause analysis)',
        'Implementera permanent åtgärd',
        'Verifiera att incidenten är åtgärdad',
        'Uppdatera status i Wavult DS',
      ],
      color: '#B8760A',
    },
    {
      step: '5', time: 'Efter stängning', title: 'Lärdom och förbättring',
      who: ceo?.name ?? 'Erik Svensson', whoRole: 'Group CEO',
      actions: [
        'Post-mortem inom 5 dagar efter stängning',
        'Dokumentera lärdomar i incidentloggen',
        'Uppdatera rutiner om brister identifierades',
        'Godkänn och stäng incidenten i Wavult DS',
      ],
      color: '#2D7A4F',
    },
  ]

  return (
    <div className="space-y-4 max-w-3xl">
      <div
        className="rounded-2xl p-6"
        style={{ background: 'linear-gradient(135deg, #C0392B 0%, #A93226 100%)' }}
      >
        <div className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-2">
          NIS2 Art. 21.2b — Formaliserad rutin
        </div>
        <h2 className="text-lg font-bold text-white">Incidenthanteringsrutin — Wavult Group</h2>
        <p className="text-white/70 text-xs mt-1">
          Version 1.0 · Ansvarig: {cto?.name ?? 'Johan Berglund'} · Godkänd av: {ceo?.name ?? 'Erik Svensson'}
        </p>
      </div>

      {steps.map(step => (
        <div key={step.step} className="rounded-2xl border border-[#DDD5C5] bg-white p-5">
          <div className="flex items-start gap-4">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: step.color }}
            >
              {step.step}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h3 className="text-sm font-bold text-[#0A3D62]">{step.title}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5F0E8] text-[#8A8278] font-mono">
                  {step.time}
                </span>
              </div>
              <div className="text-xs text-[#E8B84B] font-semibold mb-3">
                Ansvarig: {step.who} — {step.whoRole}
              </div>
              <ul className="space-y-1">
                {step.actions.map((a, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                    <span className="text-gray-300 flex-shrink-0 mt-0.5">→</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Huvud-komponent ──────────────────────────────────────────────────────────
export function IncidentHub() {
  const { activeEntity } = useEntityScope()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [activeTab, setActiveTab] = useState<'incidents' | 'routine'>('incidents')

  const load = useCallback(async () => {
    setLoading(true)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    try {
      const [incRes, statsRes] = await Promise.all([
        fetch(`${API}/api/incidents?entityId=${activeEntity.id}&limit=20`, {
          headers: { Authorization: 'Bearer bypass' },
          signal: controller.signal,
        }),
        fetch(`${API}/api/incidents/dashboard/stats?entityId=${activeEntity.id}`, {
          headers: { Authorization: 'Bearer bypass' },
          signal: controller.signal,
        }),
      ])
      if (incRes.ok) setIncidents(await incRes.json())
      if (statsRes.ok) setStats(await statsRes.json())
    } catch { /* empty state */ } finally {
      clearTimeout(timeout)
      setLoading(false)
    }
  }, [activeEntity.id])

  useEffect(() => { load() }, [load])

  const msbUrgent = incidents.filter(
    i => i.msb_deadline && !i.msb_reported_at && new Date(i.msb_deadline) > new Date()
  )

  return (
    <div className="flex flex-col h-full bg-[#F5F0E8]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#DDD5C5] bg-[#FDFAF5] flex-shrink-0">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-base font-bold text-[#0A3D62]">🚨 Incidenthantering</h1>
            <p className="text-xs text-gray-500 mt-0.5">{activeEntity.name} · NIS2 Art. 21.2b</p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="px-4 py-2 bg-[#C0392B] text-white text-xs font-bold rounded-xl hover:bg-[#A93226] flex items-center gap-2"
          >
            🚨 Rapportera incident
          </button>
        </div>

        {/* MSB-varning */}
        {msbUrgent.length > 0 && (
          <div className="mt-3 px-4 py-3 rounded-xl bg-[#FDECEA] border border-[#C0392B]/30 flex items-center gap-3">
            <span className="text-lg animate-pulse">⏰</span>
            <div className="text-xs text-[#C0392B] font-semibold">
              {msbUrgent.length} incident(er) med aktiv MSB-rapporteringsfrist. Rapportera omgående.
            </div>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="flex gap-3 mt-3 flex-wrap text-xs">
            {[
              { label: 'Öppna', value: stats.open_count, color: parseInt(stats.open_count) > 0 ? '#C0392B' : '#2D7A4F' },
              { label: 'Kritiska', value: stats.critical_open, color: parseInt(stats.critical_open) > 0 ? '#C0392B' : '#2D7A4F' },
              { label: 'MSB-förfallna', value: stats.msb_overdue, color: parseInt(stats.msb_overdue) > 0 ? '#C0392B' : '#2D7A4F' },
              { label: 'Medel MTTR', value: stats.avg_mttr_hours ? `${Math.round(parseFloat(stats.avg_mttr_hours))}h` : '—', color: '#0A3D62' },
              { label: 'Senaste 30 dagar', value: stats.last_30_days, color: '#8A8278' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#DDD5C5]">
                <span className="font-bold" style={{ color: s.color }}>{s.value}</span>
                <span className="text-gray-500">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-0 mt-4 -mb-px">
          {[
            { id: 'incidents' as const, label: '📋 Incidenter' },
            { id: 'routine' as const, label: '📖 Incidentrutin (NIS2)' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#E8B84B] text-[#0A3D62] font-semibold'
                  : 'border-transparent text-gray-500 hover:text-[#0A3D62]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'routine' && <IncidentRoutine />}

        {activeTab === 'incidents' && (
          loading ? (
            <div className="text-center py-16 text-xs text-gray-400">Laddar incidenter...</div>
          ) : incidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="text-sm font-bold text-[#2D7A4F] mb-2">Inga aktiva incidenter</h3>
              <p className="text-xs text-gray-500">
                Systemet fungerar normalt. Rapportera omedelbart om något avviker.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {incidents.map(inc => {
                const sev = SEVERITY_CONFIG[inc.severity]
                const st  = STATUS_CONFIG[inc.status]
                return (
                  <div
                    key={inc.id}
                    className="rounded-2xl border bg-white p-4 shadow-sm"
                    style={{ borderColor: sev.color + '30' }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-base">{sev.icon}</span>
                          <h3 className="text-sm font-bold text-[#0A3D62]">{inc.title}</h3>
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                            style={{ background: sev.bg, color: sev.color }}
                          >
                            {sev.label}
                          </span>
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5F0E8]"
                            style={{ color: st.color }}
                          >
                            {st.label}
                          </span>
                          <span className="text-[10px] text-gray-400">{CATEGORY_LABELS[inc.category]}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{inc.description}</p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="text-[10px] text-gray-400">
                            Upptäckt: {new Date(inc.detected_at).toLocaleString('sv-SE')}
                          </span>
                          {inc.hours_open !== undefined && (
                            <span className="text-[10px] text-gray-400">
                              {Math.round(inc.hours_open)}h öppen
                            </span>
                          )}
                          {inc.personal_data_involved && (
                            <span className="text-[10px] text-[#C0392B] font-bold">⚠️ Personuppgifter</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        {inc.msb_deadline && !inc.msb_reported_at && (
                          <MSBCountdown deadline={inc.msb_deadline} />
                        )}
                        {inc.msb_reported_at && (
                          <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#E8F5ED] text-[#2D7A4F] font-bold">
                            ✓ MSB-rapport skickad
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>

      {showNew && (
        <NewIncidentModal
          entityId={activeEntity.id}
          onClose={() => setShowNew(false)}
          onCreated={load}
        />
      )}
    </div>
  )
}
