// ServiceAdvisorView.tsx — Exception management + reality control
// Designed for: service advisors, front-desk managers
// NOT for: mechanics (WorkerView), CEOs (OverviewView)
//
// Core principle: "Service advisors shouldn't manage bookings. They should manage reality."
//
// Role hierarchy:
// 1. Handle exceptions       ← DOMINANT — if something's wrong, fix it NOW
// 2. Customer relationship   ← complex cases, upsell opportunities
// 3. Flow control            ← balance load, prioritize jobs
// 4. Quality & experience    ← awareness only

import { useState, useEffect } from 'react';

// ─── Color system — same as Dashboard ──────────────────────────────────────────
const C = {
  bg:        "#F2F2F7",
  surface:   "#FFFFFF",
  border:    "#D1D1D6",
  text:      "#000000",
  secondary: "#8E8E93",
  tertiary:  "#C7C7CC",
  blue:      "#007AFF",
  green:     "#34C759",
  orange:    "#FF9500",
  red:       "#FF3B30",
  purple:    "#AF52DE",
  fill:      "#F2F2F7",
  separator: "rgba(60,60,67,0.29)",
};

const shadow = "0 1px 3px rgba(0,0,0,0.06)";

// ─── Exception type definitions ────────────────────────────────────────────────
const EXCEPTION_TYPES = {
  OVERDUE:          { icon: '⚠️', color: '#FF9500', label: 'Försenad' },
  MISSING_PARTS:    { icon: '❌', color: '#FF3B30', label: 'Del saknas' },
  CUSTOMER_WAITING: { icon: '👤', color: '#007AFF', label: 'Kund väntar' },
  WARRANTY_ISSUE:   { icon: '📋', color: '#AF52DE', label: 'Garantiärende' },
  ADDITIONAL_WORK:  { icon: '🔧', color: '#FF6B35', label: 'Tilläggsarbete' },
  LONG_WAIT:        { icon: '⏱',  color: '#FF9500', label: 'Lång väntan' },
} as const;

type ExceptionType = keyof typeof EXCEPTION_TYPES;

// ─── Data types ────────────────────────────────────────────────────────────────
interface Exception {
  id: string;
  type: ExceptionType;
  vehicle: string;
  reg?: string;
  description: string;
  since?: string;          // "45 min", "kl 14", etc.
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  resolved?: boolean;
}

interface WorkshopJob {
  id: string;
  time: string;
  vehicle: string;
  reg?: string;
  status: 'DONE' | 'IN_PROGRESS' | 'WAITING' | 'EXCEPTION';
  statusLabel: string;
  overdueMin?: number;
  exceptionType?: ExceptionType;
}

interface FlowStats {
  activeJobs: number;
  totalJobs: number;
  loadPct: number;
  freeSlot?: string;        // "13:30–15:00"
}

// ─── Demo data — shown when API unavailable ────────────────────────────────────
const DEMO_EXCEPTIONS: Exception[] = [
  {
    id: 'exc-1',
    type: 'OVERDUE',
    vehicle: 'Audi A6',
    reg: 'ABC 123',
    description: 'Försenad 45 min — kunden förväntar sig bilen kl 14:00',
    since: '45 min',
    severity: 'HIGH',
  },
  {
    id: 'exc-2',
    type: 'MISSING_PARTS',
    vehicle: 'VW Golf',
    reg: 'DEF 456',
    description: 'Bromsskiva saknas — jobb inbokat kl 14:00',
    since: 'kl 14',
    severity: 'HIGH',
  },
  {
    id: 'exc-3',
    type: 'CUSTOMER_WAITING',
    vehicle: 'Volvo XC60',
    reg: 'GHI 789',
    description: 'Kunden väntar i väntrummet — ingen uppdatering på 40 min',
    since: '40 min',
    severity: 'MEDIUM',
  },
];

const DEMO_FLOW: FlowStats = {
  activeJobs: 8,
  totalJobs: 12,
  loadPct: 78,
  freeSlot: '13:30–15:00',
};

const DEMO_TIMELINE: WorkshopJob[] = [
  {
    id: 'j-1',
    time: '08:00',
    vehicle: 'BMW 318',
    reg: 'JKL 012',
    status: 'DONE',
    statusLabel: 'Klar',
  },
  {
    id: 'j-2',
    time: '09:30',
    vehicle: 'Audi A6',
    reg: 'ABC 123',
    status: 'EXCEPTION',
    statusLabel: 'Pågående',
    overdueMin: 45,
    exceptionType: 'OVERDUE',
  },
  {
    id: 'j-3',
    time: '11:00',
    vehicle: 'Volvo XC60',
    reg: 'GHI 789',
    status: 'WAITING',
    statusLabel: 'Väntar kund',
    exceptionType: 'CUSTOMER_WAITING',
  },
  {
    id: 'j-4',
    time: '13:00',
    vehicle: 'VW Golf',
    reg: 'DEF 456',
    status: 'EXCEPTION',
    statusLabel: 'Del saknas',
    exceptionType: 'MISSING_PARTS',
  },
];

// ─── Action button helpers ─────────────────────────────────────────────────────
function getActions(type: ExceptionType): { primary: string; secondary?: string } {
  switch (type) {
    case 'OVERDUE':
      return { primary: 'Kontakta kund', secondary: 'Prioritera till mekaniker' };
    case 'MISSING_PARTS':
      return { primary: 'Beställ del', secondary: 'Boka om' };
    case 'CUSTOMER_WAITING':
      return { primary: 'Skicka statusuppdatering', secondary: 'Ring kund' };
    case 'ADDITIONAL_WORK':
      return { primary: 'Godkänn', secondary: 'Avböj' };
    case 'WARRANTY_ISSUE':
      return { primary: 'Skicka till OEM', secondary: 'Eskalera' };
    case 'LONG_WAIT':
      return { primary: 'Kontakta kund', secondary: 'Erbjud kompensation' };
    default:
      return { primary: 'Hantera' };
  }
}

// ─── Job status → icon ─────────────────────────────────────────────────────────
function jobStatusIcon(job: WorkshopJob): string {
  if (job.status === 'DONE') return '✅';
  if (job.status === 'IN_PROGRESS') return '🔄';
  if (job.status === 'WAITING') return '⏳';
  if (job.status === 'EXCEPTION' && job.exceptionType) {
    return EXCEPTION_TYPES[job.exceptionType].icon;
  }
  return '○';
}

function jobStatusColor(job: WorkshopJob): string {
  if (job.status === 'DONE') return C.green;
  if (job.status === 'IN_PROGRESS') return C.blue;
  if (job.status === 'WAITING') return C.secondary;
  if (job.status === 'EXCEPTION' && job.exceptionType) {
    return EXCEPTION_TYPES[job.exceptionType].color;
  }
  return C.tertiary;
}

// ─── Load bar component ────────────────────────────────────────────────────────
function LoadBar({ pct }: { pct: number }) {
  const filled = Math.round(pct / 10);
  const empty = 10 - filled;
  const color = pct >= 90 ? C.red : pct >= 75 ? C.orange : C.green;
  return (
    <span style={{ letterSpacing: 1, color, fontFamily: 'monospace', fontSize: 14 }}>
      {'█'.repeat(filled)}
      <span style={{ color: C.tertiary }}>{'░'.repeat(empty)}</span>
    </span>
  );
}

// ─── Exception card ────────────────────────────────────────────────────────────
function ExceptionCard({
  exc,
  onAction,
}: {
  exc: Exception;
  onAction: (excId: string, action: string) => void;
}) {
  const def = EXCEPTION_TYPES[exc.type];
  const actions = getActions(exc.type);
  const isHighSeverity = exc.severity === 'HIGH';

  return (
    <div style={{
      background: C.surface,
      borderRadius: 12,
      padding: '14px 16px',
      marginBottom: 10,
      boxShadow: shadow,
      borderLeft: `4px solid ${def.color}`,
      position: 'relative',
      opacity: exc.resolved ? 0.5 : 1,
      transition: 'opacity 0.2s',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>{def.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 15,
              fontWeight: 600,
              color: C.text,
              letterSpacing: '-0.2px',
            }}>
              {exc.vehicle}
            </span>
            {exc.reg && (
              <span style={{
                fontSize: 11,
                fontWeight: 500,
                color: C.secondary,
                background: C.fill,
                borderRadius: 5,
                padding: '1px 6px',
              }}>
                {exc.reg}
              </span>
            )}
            {isHighSeverity && (
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                color: '#FFFFFF',
                background: def.color,
                borderRadius: 4,
                padding: '1px 6px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}>
                Brådskande
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, color: C.secondary, marginTop: 2, lineHeight: 1.4 }}>
            {exc.description}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {!exc.resolved && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => onAction(exc.id, actions.primary)}
            style={{
              background: def.color,
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '-0.1px',
              flexShrink: 0,
            }}
          >
            {actions.primary}
          </button>
          {actions.secondary && (
            <button
              onClick={() => onAction(exc.id, actions.secondary!)}
              style={{
                background: 'transparent',
                color: def.color,
                border: `1.5px solid ${def.color}`,
                borderRadius: 8,
                padding: '7px 14px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                letterSpacing: '-0.1px',
                flexShrink: 0,
              }}
            >
              {actions.secondary}
            </button>
          )}
        </div>
      )}

      {exc.resolved && (
        <div style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>✅ Hanterad</div>
      )}
    </div>
  );
}

// ─── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ label, meta }: { label: string; meta?: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    }}>
      <span style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        color: C.secondary,
      }}>
        {label}
      </span>
      {meta && (
        <span style={{ fontSize: 12, color: C.tertiary, fontWeight: 500 }}>{meta}</span>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
interface ServiceAdvisorViewProps {
  user?: {
    id?: string;
    full_name?: string;
    email?: string;
    role?: string;
    user_metadata?: { role?: string };
  } | null;
}

export default function ServiceAdvisorView({ user }: ServiceAdvisorViewProps) {
  const [exceptions, setExceptions] = useState<Exception[]>(DEMO_EXCEPTIONS);
  const [flow] = useState<FlowStats>(DEMO_FLOW);
  const [timeline] = useState<WorkshopJob[]>(DEMO_TIMELINE);
  const [toast, setToast] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // In a real implementation, this would call the API:
  // const { data: apiExceptions } = useApi<Exception[]>('/api/workshop/exceptions');
  // useEffect(() => { if (apiExceptions) setExceptions(apiExceptions); }, [apiExceptions]);

  // Auto-refresh every 60s
  useEffect(() => {
    const id = setInterval(() => setLastUpdated(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const unresolved = exceptions.filter(e => !e.resolved);
  const highCount = unresolved.filter(e => e.severity === 'HIGH').length;

  function handleAction(excId: string, action: string) {
    // Mark as resolved optimistically
    setExceptions(prev =>
      prev.map(e => e.id === excId ? { ...e, resolved: true } : e)
    );

    // Show feedback toast
    setToast(`${action} — utfört`);
    setTimeout(() => setToast(null), 3000);
  }

  const timeStr = lastUpdated.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 0 40px' }}>

      {/* ── Toast notification ────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.82)',
          color: '#FFFFFF',
          borderRadius: 20,
          padding: '10px 20px',
          fontSize: 14,
          fontWeight: 500,
          zIndex: 9999,
          backdropFilter: 'blur(10px)',
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}>
          ✅ {toast}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — EXCEPTIONS (DOMINANT)
          If anything is wrong here, it needs to be fixed before anything else.
         ══════════════════════════════════════════════════════════════════════ */}
      <div style={{
        background: unresolved.length > 0 ? '#FFFBF0' : C.surface,
        borderRadius: 16,
        padding: '18px 16px 14px',
        marginBottom: 16,
        boxShadow: shadow,
        border: unresolved.length > 0
          ? `1.5px solid ${highCount > 0 ? C.orange : C.border}`
          : `1.5px solid ${C.green}`,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {unresolved.length > 0 ? (
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: highCount > 0 ? C.orange : '#FFD60A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>
                {highCount > 0 ? '🚨' : '🟡'}
              </div>
            ) : (
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: '#D1FAE5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>
                ✅
              </div>
            )}
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: '-0.3px' }}>
                {unresolved.length > 0
                  ? `${unresolved.length} situation${unresolved.length > 1 ? 'er' : ''} att hantera`
                  : 'Allt flödar normalt'
                }
              </div>
              <div style={{ fontSize: 12, color: C.secondary, marginTop: 1 }}>
                Uppdaterat {timeStr}
              </div>
            </div>
          </div>

          {unresolved.length > 0 && (
            <div style={{
              fontSize: 12,
              fontWeight: 600,
              color: highCount > 0 ? C.orange : C.secondary,
              background: highCount > 0 ? '#FFF3E0' : C.fill,
              borderRadius: 8,
              padding: '4px 10px',
            }}>
              {highCount > 0 ? `${highCount} brådskande` : 'Inga kritiska'}
            </div>
          )}
        </div>

        {/* Exception cards */}
        {unresolved.length > 0 ? (
          <div>
            {unresolved.map(exc => (
              <ExceptionCard key={exc.id} exc={exc} onAction={handleAction} />
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '20px 0 8px',
            color: C.green,
            fontSize: 15,
            fontWeight: 500,
          }}>
            Inga undantag just nu — bra jobbat! 🎉
          </div>
        )}

        {/* Resolved exceptions (collapsed) */}
        {exceptions.filter(e => e.resolved).length > 0 && (
          <div style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: `0.5px solid ${C.border}`,
            fontSize: 12,
            color: C.secondary,
          }}>
            ✅ {exceptions.filter(e => e.resolved).length} situation{exceptions.filter(e => e.resolved).length > 1 ? 'er' : ''} hanterade idag
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — WORKSHOP FLOW (SECONDARY)
          Context — not primary task. Helps advisors understand capacity.
         ══════════════════════════════════════════════════════════════════════ */}
      <div style={{
        background: C.surface,
        borderRadius: 16,
        padding: '16px 16px 14px',
        marginBottom: 16,
        boxShadow: shadow,
        border: `0.5px solid ${C.border}`,
      }}>
        <SectionHeader
          label="Verkstadsflöde"
          meta={`${flow.activeJobs}/${flow.totalJobs} jobb`}
        />

        {/* Load bar */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: C.secondary }}>Beläggning</span>
            <span style={{
              fontSize: 13,
              fontWeight: 700,
              color: flow.loadPct >= 90 ? C.red : flow.loadPct >= 75 ? C.orange : C.green,
            }}>
              {flow.loadPct}%
            </span>
          </div>
          <LoadBar pct={flow.loadPct} />
        </div>

        {/* Free capacity */}
        {flow.freeSlot && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#F0FFF4',
            borderRadius: 8,
            padding: '8px 12px',
          }}>
            <span style={{ fontSize: 14 }}>🟢</span>
            <span style={{ fontSize: 13, color: C.green, fontWeight: 500 }}>
              Frigjord kapacitet: {flow.freeSlot}
            </span>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 — TODAY'S TIMELINE (TERTIARY / AWARENESS ONLY)
          Advisors need situational awareness, not active management here.
         ══════════════════════════════════════════════════════════════════════ */}
      <div style={{
        background: C.surface,
        borderRadius: 16,
        padding: '16px 16px 10px',
        boxShadow: shadow,
        border: `0.5px solid ${C.border}`,
      }}>
        <SectionHeader label="Idag" />

        <div>
          {timeline.map((job, i) => {
            const statusColor = jobStatusColor(job);
            const statusIcon = jobStatusIcon(job);
            const isLast = i === timeline.length - 1;

            return (
              <div
                key={job.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '9px 0',
                  borderBottom: isLast ? 'none' : `0.5px solid ${C.separator}`,
                }}
              >
                {/* Time */}
                <span style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.secondary,
                  width: 38,
                  flexShrink: 0,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {job.time}
                </span>

                {/* Status icon */}
                <span style={{ fontSize: 15, width: 20, textAlign: 'center', flexShrink: 0 }}>
                  {statusIcon}
                </span>

                {/* Vehicle & status */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: C.text }}>
                    {job.vehicle}
                  </span>
                  {job.reg && (
                    <span style={{ fontSize: 11, color: C.tertiary, marginLeft: 6 }}>
                      {job.reg}
                    </span>
                  )}
                </div>

                {/* Status label */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: statusColor,
                  }}>
                    {job.statusLabel}
                    {job.overdueMin && (
                      <span style={{ fontWeight: 700 }}> (+{job.overdueMin}min)</span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Debug info in dev */}
      {import.meta.env.DEV && (
        <div style={{
          marginTop: 16,
          padding: '8px 12px',
          background: '#F2F2F7',
          borderRadius: 8,
          fontSize: 11,
          color: C.secondary,
          fontFamily: 'monospace',
        }}>
          🔧 DEV: role={user?.user_metadata?.role ?? user?.role ?? 'unknown'} | exceptions={exceptions.length} | unresolved={unresolved.length}
        </div>
      )}
    </div>
  );
}
