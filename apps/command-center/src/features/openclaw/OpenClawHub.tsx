// ─── OpenClaw Hub — Utbildningsmodul ─────────────────────────────────────────
// Full dokumentation och utbildning för OpenClaw & Bernt-infrastrukturen.

import { useState } from 'react'
import {
  Terminal, Cpu, Brain, MessageSquare, Clock, Database,
  Mic, Shield, ChevronDown, ChevronRight, CheckCircle2,
  Zap, Server, ArrowRight,
} from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Chapter {
  id: string
  title: string
  icon: React.ElementType
  content: React.ReactNode
}

interface StatusItem {
  label: string
  status: 'online' | 'offline' | 'degraded'
}

// ─── Data ──────────────────────────────────────────────────────────────────────

const STATUS_ITEMS: StatusItem[] = [
  { label: 'OpenClaw Gateway', status: 'online' },
  { label: 'Bernt AI (Claude Sonnet)', status: 'online' },
  { label: 'Telegram Channel', status: 'online' },
  { label: 'Memory System', status: 'online' },
  { label: 'Cron Scheduler', status: 'online' },
  { label: 'Whisper Voice', status: 'online' },
]

const QUICK_REF: { phrase: string; action: string }[] = [
  { phrase: '"Kolla systemstatus"', action: 'Kontrollerar alla services och levererar rapport' },
  { phrase: '"Skicka Morning Brief"', action: 'Triggar nyhetsbrevet manuellt utanför schema' },
  { phrase: '"Sätt en påminnelse om 30 min"', action: 'Skapar cron-jobb med kontext från samtalet' },
  { phrase: '"Vad är Wavult OS?"', action: 'Söker i långtidsminnet och förklarar' },
  { phrase: '"Bygg feature X i Wavult OS"', action: 'Spawnar coding agent (Claude Code/Codex)' },
  { phrase: '"Vad hände igår?"', action: 'Läser daglig loggfil och sammanfattar' },
  { phrase: '"Kolla e-posten"', action: 'Ansluter till mailservern och rapporterar olästa' },
  { phrase: '"Uppdatera MEMORY.md"', action: 'Destillerar dagsloggar till långtidsminne' },
]

// ─── Arch Diagram ──────────────────────────────────────────────────────────────

function ArchDiagram() {
  return (
    <div className="my-6 overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Top row */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <ArchNode label="Telegram" sub="Inkommande meddelanden" icon={MessageSquare} />
          <ArrowRight size={16} className="text-zinc-500 flex-shrink-0" />
          <ArchNode label="OpenClaw Gateway" sub="Runtime & routing" icon={Terminal} highlight />
          <ArrowRight size={16} className="text-zinc-500 flex-shrink-0" />
          <ArchNode label="Bernt AI" sub="Claude Sonnet 4.6" icon={Brain} />
          <ArrowRight size={16} className="text-zinc-500 flex-shrink-0" />
          <ArchNode label="Wavult OS API" sub="Backend & data" icon={Server} />
        </div>

        {/* Vertical connector from Gateway */}
        <div className="flex justify-center mb-2">
          <div className="w-px h-6 bg-zinc-700 ml-[-2px]" style={{ marginLeft: 'calc(25% - 1px)' }} />
        </div>

        {/* Bottom row — connected to Gateway */}
        <div className="flex items-start justify-center gap-4">
          <div className="w-1/4" /> {/* Telegram spacer */}
          <div className="flex gap-3 w-1/4 justify-center">
            <ArchNodeSmall label="Memory System" icon={Database} />
            <ArchNodeSmall label="Cron Scheduler" icon={Clock} />
            <ArchNodeSmall label="Whisper Voice" icon={Mic} />
          </div>
        </div>
      </div>
    </div>
  )
}

function ArchNode({ label, sub, icon: Icon, highlight }: {
  label: string
  sub: string
  icon: React.ElementType
  highlight?: boolean
}) {
  return (
    <div className={`flex flex-col items-center gap-1 px-4 py-3 rounded border text-center min-w-[130px] ${
      highlight
        ? 'border-zinc-400 bg-zinc-800'
        : 'border-zinc-700 bg-zinc-900'
    }`}>
      <Icon size={18} className={highlight ? 'text-zinc-200' : 'text-zinc-400'} />
      <span className={`text-xs font-semibold tracking-wide ${highlight ? 'text-zinc-100' : 'text-zinc-300'}`}>
        {label}
      </span>
      <span className="text-[10px] text-zinc-500 leading-tight">{sub}</span>
    </div>
  )
}

function ArchNodeSmall({ label, icon: Icon }: { label: string; icon: React.ElementType }) {
  return (
    <div className="flex flex-col items-center gap-1 px-3 py-2 rounded border border-zinc-800 bg-zinc-900/50 text-center min-w-[100px]">
      <Icon size={14} className="text-zinc-500" />
      <span className="text-[10px] text-zinc-400 leading-tight">{label}</span>
    </div>
  )
}

// ─── Chapter Accordion ─────────────────────────────────────────────────────────

function ChapterAccordion({ chapters }: { chapters: Chapter[] }) {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div className="divide-y divide-zinc-800 border border-zinc-800 rounded">
      {chapters.map((ch) => {
        const Icon = ch.icon
        const isOpen = open === ch.id
        return (
          <div key={ch.id}>
            <button
              onClick={() => setOpen(isOpen ? null : ch.id)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-800/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Icon size={16} className="text-zinc-400 flex-shrink-0" />
                <span className="text-sm font-medium text-zinc-200">{ch.title}</span>
              </div>
              {isOpen
                ? <ChevronDown size={14} className="text-zinc-500" />
                : <ChevronRight size={14} className="text-zinc-500" />
              }
            </button>
            {isOpen && (
              <div className="px-5 pb-5 pt-1 text-sm text-zinc-400 leading-relaxed space-y-3 border-t border-zinc-800">
                {ch.content}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Status Dot ────────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: StatusItem['status'] }) {
  const color = status === 'online'
    ? 'bg-emerald-500'
    : status === 'degraded'
    ? 'bg-yellow-500'
    : 'bg-red-500'
  return (
    <span className="relative flex h-2 w-2 flex-shrink-0">
      {status === 'online' && (
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-50`} />
      )}
      <span className={`relative inline-flex rounded-full h-2 w-2 ${color}`} />
    </span>
  )
}

// ─── Chapter Content ───────────────────────────────────────────────────────────

const CHAPTERS: Chapter[] = [
  {
    id: 'what',
    title: 'Kapitel 1 — Vad är OpenClaw?',
    icon: Terminal,
    content: (
      <div className="space-y-3">
        <p>OpenClaw är <strong className="text-zinc-300">runtime-miljön som kör Bernt</strong> — tänk på det som ett operativsystem för AI-agenten. Det är installerat på Eriks server (WSL2/Linux) och kör dygnet runt.</p>
        <p>OpenClaw hanterar:</p>
        <ul className="space-y-1.5 ml-2">
          {[
            'Inkommande meddelanden från Telegram och andra kanaler',
            'Schemalagda jobb — Morning Brief, heartbeats, påminnelser',
            'Minnessystemet — långtidsminne och dagliga loggar',
            'Rösttranskribering via OpenAI Whisper',
            'Integration mot Wavult OS API och externa tjänster',
            'Subagenter — spawnar coding agents (Codex, Claude Code) för större uppgifter',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle2 size={13} className="text-zinc-500 mt-0.5 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="text-zinc-500 text-xs pt-1">
          OpenClaw är open source. Källkod: github.com/openclaw/openclaw
        </p>
      </div>
    ),
  },
  {
    id: 'messaging',
    title: 'Kapitel 2 — Hur Bernt tar emot meddelanden',
    icon: MessageSquare,
    content: (
      <div className="space-y-3">
        <p>Flödet från avsändare till svar:</p>
        <ol className="space-y-2 ml-2 list-none">
          {[
            ['Erik skickar text eller röstmeddelande via Telegram', 'OpenClaw tar emot via Telegram-boten'],
            ['Är det ett röstmeddelande?', 'Whisper (OpenAI) transkriberar till text automatiskt'],
            ['OpenClaw bygger kontexten', 'Läser MEMORY.md, dagsloggar, workspace-filer'],
            ['Bernt (Claude Sonnet) genererar svar', 'Med full organisations- och projektkontext'],
            ['Svaret skickas tillbaka', 'Till Telegram, formaterat för kanalen'],
          ].map(([step, detail], i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="text-zinc-600 text-xs font-mono mt-0.5 w-4 flex-shrink-0">{i + 1}.</span>
              <div>
                <span className="text-zinc-300 font-medium">{step}</span>
                <span className="text-zinc-500"> — {detail}</span>
              </div>
            </li>
          ))}
        </ol>
        <p className="text-zinc-500 text-xs border-t border-zinc-800 pt-3">
          Authorized senders: Erik är primär. Andra kan läggas till via OpenClaw-konfigurationen.
        </p>
      </div>
    ),
  },
  {
    id: 'memory',
    title: 'Kapitel 3 — Minnessystemet',
    icon: Database,
    content: (
      <div className="space-y-3">
        <p>Bernt vaknar med tomt arbetsminne varje session. Kontinuitet skapas via filbaserat minne:</p>
        <div className="space-y-3">
          <div className="p-3 rounded border border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center gap-2 mb-1">
              <Database size={13} className="text-zinc-400" />
              <span className="text-zinc-300 font-medium text-xs">MEMORY.md — Långtidsminne</span>
            </div>
            <p className="text-xs">Kurerade fakta om Erik, teamet, projekten, beslut och regler. Uppdateras av Bernt under heartbeats. Laddas ALDRIG i delade kontexter (säkerhet).</p>
          </div>
          <div className="p-3 rounded border border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center gap-2 mb-1">
              <Database size={13} className="text-zinc-400" />
              <span className="text-zinc-300 font-medium text-xs">memory/YYYY-MM-DD.md — Dagliga loggar</span>
            </div>
            <p className="text-xs">Rådata från varje dag — vad hände, vad beslutades, vad byggdes. Bernt destillerar dessa till MEMORY.md periodiskt.</p>
          </div>
          <div className="p-3 rounded border border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center gap-2 mb-1">
              <Database size={13} className="text-zinc-400" />
              <span className="text-zinc-300 font-medium text-xs">SOUL.md, USER.md, TOOLS.md</span>
            </div>
            <p className="text-xs">Identitet, personlighet och tekniska konfigurationer. Bernt läser dessa vid sessionstart för att veta vem han är och hur miljön ser ut.</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'cron',
    title: 'Kapitel 4 — Schemalagda jobb (Cron)',
    icon: Clock,
    content: (
      <div className="space-y-3">
        <p>OpenClaw har ett inbyggt cron-system för tidsstyrda och återkommande uppgifter.</p>
        <div className="overflow-hidden rounded border border-zinc-800">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="text-left px-3 py-2 text-zinc-500 font-medium">Jobb</th>
                <th className="text-left px-3 py-2 text-zinc-500 font-medium">Schema</th>
                <th className="text-left px-3 py-2 text-zinc-500 font-medium">Vad det gör</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {[
                ['Morning Brief', 'Varje dag 08:00', 'Bygger och skickar nyhetsbrev till teamet'],
                ['Heartbeat', 'Var 30:e minut', 'Kontrollerar e-post, kalender, systemstatus'],
                ['Memory Review', 'Periodiskt', 'Destillerar dagsloggar → MEMORY.md'],
                ['Påminnelser', 'Ad hoc', 'Satta av Bernt på Eriks begäran'],
              ].map(([job, schedule, desc], i) => (
                <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-3 py-2 text-zinc-300 font-medium">{job}</td>
                  <td className="px-3 py-2 text-zinc-400 font-mono">{schedule}</td>
                  <td className="px-3 py-2 text-zinc-500">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-zinc-500">
          Alla cron-jobb körs i isolerade sessioner — de påverkar inte huvudsessionen och levererar direkt till rätt kanal.
        </p>
      </div>
    ),
  },
  {
    id: 'voice',
    title: 'Kapitel 5 — Röstintegration',
    icon: Mic,
    content: (
      <div className="space-y-3">
        <p>Bernt kan ta emot röstmeddelanden via Telegram eller Wavult Mobile.</p>
        <div className="space-y-2">
          <div className="flex items-start gap-3 p-3 rounded border border-zinc-800">
            <MessageSquare size={14} className="text-zinc-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-zinc-300 text-xs font-medium mb-1">Via Telegram</p>
              <p className="text-xs text-zinc-500">Håll inne mikrofon-ikonen i Telegram → skicka → OpenClaw tar emot och skickar till Whisper för transkribering → Bernt svarar.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded border border-zinc-800">
            <Mic size={14} className="text-zinc-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-zinc-300 text-xs font-medium mb-1">Via Wavult Mobile (VoiceButton)</p>
              <p className="text-xs text-zinc-500">Öppna Wavult-appen → håll inne röstknappen → pulsanimation visar inspelning → auto-skicka vid release → Bernt svarar i appen.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded border border-zinc-800">
            <Zap size={14} className="text-zinc-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-zinc-300 text-xs font-medium mb-1">Siri-genväg (iPhone)</p>
              <p className="text-xs text-zinc-500">"Hey Siri, Bernt" → öppnar Wavult Mobile direkt på röstläget via deep link <code className="text-zinc-400">wavult://voice</code>.</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'team',
    title: 'Kapitel 6 — Vad teamet kan göra',
    icon: Brain,
    content: (
      <div className="space-y-3">
        <p>Bernt är primärt Eriks assistent men kan utökas till hela teamet.</p>
        <div className="space-y-2">
          <p className="text-zinc-300 text-xs font-medium">Bernt kan:</p>
          <ul className="space-y-1.5 ml-2">
            {[
              'Söka information i Wavult OS och externt (web search)',
              'Skapa dokument, rapporter, kod',
              'Kontrollera systemstatus för alla services',
              'Skicka mail via Wavult OS kommunikationsmodul',
              'Spawna coding agents för större bygguppgifter',
              'Sätta påminnelser och schemalagda jobb',
              'Sammanfatta möten och beslut',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <CheckCircle2 size={12} className="text-zinc-500 mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-zinc-300 text-xs font-medium pt-2">Bernt kan INTE utan godkännande:</p>
          <ul className="space-y-1.5 ml-2">
            {[
              'Skicka mail eller offentliga poster',
              'Göra ekonomiska transaktioner',
              'Ändra infrastrukturkonfiguration i produktion',
              'Dela privat information i gruppchattar',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-zinc-500">
                <span className="text-zinc-700 mt-0.5 flex-shrink-0">—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'security',
    title: 'Kapitel 7 — Säkerhet & integritet',
    icon: Shield,
    content: (
      <div className="space-y-3">
        <div className="space-y-2">
          {[
            {
              title: 'MEMORY.md isoleras',
              desc: 'Långtidsminnet laddas ALDRIG i delade kontexter — inte i Discord, gruppchattar eller subagenter. Skyddar Eriks privata kontext.',
            },
            {
              title: 'Authorized senders',
              desc: 'Bernt svarar bara på meddelanden från godkända Telegram-ID:n. Obehöriga sändare ignoreras.',
            },
            {
              title: 'Extern åtgärd = explicit godkännande',
              desc: 'Mail, tweets, publika poster — Bernt frågar alltid innan. Interna åtgärder (läsa, organisera, söka) görs fritt.',
            },
            {
              title: 'Credentials isolerade',
              desc: 'Alla tokens och API-nycklar ligger i /secrets/credentials.env (chmod 600). Aldrig i kod, commits eller chattlogg.',
            },
            {
              title: 'Ingen självreplikering',
              desc: 'Bernt/OpenClaw söker inte aktivt utökad åtkomst eller resurser. Följer Anthropics konstitution.',
            },
          ].map((item, i) => (
            <div key={i} className="p-3 rounded border border-zinc-800">
              <p className="text-zinc-300 text-xs font-medium mb-1 flex items-center gap-2">
                <Shield size={11} className="text-zinc-500" />
                {item.title}
              </p>
              <p className="text-xs text-zinc-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
]

// ─── Main Component ────────────────────────────────────────────────────────────

export function OpenClawHub() {
  return (
    <div className="min-h-full bg-zinc-950 text-zinc-300">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-12">

        {/* ── Hero ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-mono tracking-widest text-zinc-500 border border-zinc-700 rounded px-2 py-0.5 uppercase">
              Infrastructure
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
            OpenClaw
          </h1>
          <p className="text-lg text-zinc-400 font-light">
            The intelligence layer that powers Bernt.
          </p>
          <p className="text-sm text-zinc-500 max-w-2xl leading-relaxed">
            OpenClaw is the runtime that connects Bernt to your organization.
            It handles messaging, scheduling, memory, and integrations —
            so Bernt is always context-aware and always available.
          </p>
        </div>

        {/* ── Status ── */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
            System Status
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {STATUS_ITEMS.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded border border-zinc-800 bg-zinc-900/50"
              >
                <StatusDot status={item.status} />
                <span className="text-xs text-zinc-400">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Architecture ── */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
            Architecture
          </h2>
          <div className="rounded border border-zinc-800 bg-zinc-900/30 px-4 py-6">
            <ArchDiagram />
          </div>
        </div>

        {/* ── Chapters ── */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
            Utbildning
          </h2>
          <ChapterAccordion chapters={CHAPTERS} />
        </div>

        {/* ── Quick Reference ── */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
            Quick Reference
          </h2>
          <div className="rounded border border-zinc-800 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Fras till Bernt</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Vad som händer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {QUICK_REF.map((row, i) => (
                  <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-zinc-300">{row.phrase}</td>
                    <td className="px-4 py-3 text-zinc-500">{row.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-zinc-800 pt-6 flex items-center justify-between">
          <span className="text-xs text-zinc-600">
            OpenClaw · github.com/openclaw/openclaw
          </span>
          <div className="flex items-center gap-2">
            <Cpu size={12} className="text-zinc-700" />
            <span className="text-xs text-zinc-600">Powered by Bernt</span>
          </div>
        </div>

      </div>
    </div>
  )
}
