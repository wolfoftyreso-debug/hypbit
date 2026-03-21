import { useState } from "react";
import { useApi } from "./useApi";

// ─── Colour palette ──────────────────────────────────────────────────────────
const C = {
  bg: "#F5F5F7", card: "#FFFFFF", border: "#E5E5EA", text: "#1D1D1F",
  sec: "#86868B", tert: "#AEAEB2", blue: "#007AFF", green: "#34C759",
  yellow: "#FF9500", red: "#FF3B30", fill: "#F2F2F7", purple: "#AF52DE",
};
const shadow = "0 1px 3px rgba(0,0,0,0.06)";
const API = "https://api.bc.pixdrift.com";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (d: string) => new Date(d).toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" });

// ─── UI Primitives ────────────────────────────────────────────────────────────
const Card = ({ title, children, style: st }: { title?: string; children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: C.card, borderRadius: 12, padding: "20px 24px", boxShadow: shadow, ...st }}>
    {title && <div style={{ fontSize: 13, fontWeight: 600, color: C.sec, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.04em" }}>{title}</div>}
    {children}
  </div>
);

const Badge = ({ color, children }: { color: string; children: React.ReactNode }) => (
  <span style={{ background: color + "18", color, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>{children}</span>
);

const Row = ({ children, border = true }: { children: React.ReactNode; border?: boolean }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: border ? `0.5px solid ${C.border}` : "none" }}>{children}</div>
);

const Spinner = () => (
  <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
    <div style={{ width: 28, height: 28, border: `2px solid ${C.fill}`, borderTop: `2px solid ${C.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const Empty = ({ msg }: { msg: string }) => (
  <div style={{ textAlign: "center", padding: "40px 0", color: C.tert, fontSize: 14 }}>{msg}</div>
);

// ─── Sidebar ─────────────────────────────────────────────────────────────────
type NavItem = { id: string; label: string; icon: React.ReactNode };

const navItems: NavItem[] = [
  { id: "overview", label: "Översikt", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { id: "users", label: "Användare", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { id: "roles", label: "Roller & Behörigheter", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  { id: "compliance", label: "Compliance", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
  { id: "audit", label: "Audit Log", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
  { id: "settings", label: "Inställningar", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M20 12h2M2 12h2M17.66 17.66l-1.41-1.41M6.34 17.66l1.41-1.41"/></svg> },
];

// ─── Fallback data ────────────────────────────────────────────────────────────
const FALLBACK_AUDIT = [
  { id: "1", event: "USER_LOGIN", user: "erik@pixdrift.com", timestamp: "2026-03-21T07:12:00Z", ip: "192.168.1.1", status: "SUCCESS" },
  { id: "2", event: "SETTINGS_CHANGED", user: "admin@pixdrift.com", timestamp: "2026-03-21T06:45:00Z", ip: "10.0.0.5", status: "SUCCESS" },
  { id: "3", event: "USER_INVITE", user: "erik@pixdrift.com", timestamp: "2026-03-20T16:30:00Z", ip: "192.168.1.1", status: "SUCCESS" },
  { id: "4", event: "LOGIN_FAILED", user: "unknown@test.com", timestamp: "2026-03-20T14:11:00Z", ip: "8.8.8.8", status: "FAILED" },
  { id: "5", event: "EXPORT_DATA", user: "winston@pixdrift.com", timestamp: "2026-03-20T11:22:00Z", ip: "10.0.0.8", status: "SUCCESS" },
  { id: "6", event: "ROLE_ASSIGNED", user: "admin@pixdrift.com", timestamp: "2026-03-19T09:00:00Z", ip: "10.0.0.5", status: "SUCCESS" },
];

const FALLBACK_COMPLIANCE = [
  { id: "1", name: "ISO 9001:2015", completion_pct: 72, total_requirements: 52, met_requirements: 37 },
  { id: "2", name: "ISO 27001", completion_pct: 45, total_requirements: 40, met_requirements: 18 },
  { id: "3", name: "GDPR", completion_pct: 88, total_requirements: 25, met_requirements: 22 },
];

const FALLBACK_RISKS = [
  { id: "1", title: "Nyckelperson lämnar", category: "OPERATIONAL", level: "HIGH", score: 15, probability: 3, impact: 5, mitigation_plan: "Cross-training + dokumentation" },
  { id: "2", title: "Supabase driftstopp", category: "TECHNICAL", level: "MEDIUM", score: 8, probability: 2, impact: 4, mitigation_plan: "Daglig backup + migration plan" },
  { id: "3", title: "GDPR-överträdelse", category: "LEGAL", level: "MEDIUM", score: 10, probability: 2, impact: 5, mitigation_plan: "DPA + Privacy by Design" },
];

const FALLBACK_USERS = [
  { id: "1", name: "Erik Svensson", email: "erik@pixdrift.com", role: "ADMIN", status: "ACTIVE", lastLogin: "2026-03-21T07:12:00Z" },
  { id: "2", name: "Leon Ritzén", email: "leon@pixdrift.com", role: "CEO", status: "ACTIVE", lastLogin: "2026-03-21T08:00:00Z" },
  { id: "3", name: "Johan Eriksson", email: "johan@pixdrift.com", role: "DEVELOPER", status: "ACTIVE", lastLogin: "2026-03-20T17:45:00Z" },
  { id: "4", name: "Dennis Lindqvist", email: "dennis@pixdrift.com", role: "OPERATIONS", status: "ACTIVE", lastLogin: "2026-03-20T15:20:00Z" },
  { id: "5", name: "Winston Adeyemi", email: "winston@pixdrift.com", role: "CFO", status: "ACTIVE", lastLogin: "2026-03-19T12:00:00Z" },
];

const ROLES = [
  { name: "ADMIN", color: C.red, perms: ["users.manage", "roles.manage", "settings.write", "audit.read", "compliance.manage", "data.export"] },
  { name: "CEO", color: C.purple, perms: ["users.read", "settings.read", "audit.read", "compliance.read", "data.export"] },
  { name: "DEVELOPER", color: C.blue, perms: ["settings.read", "audit.read"] },
  { name: "OPERATIONS", color: C.green, perms: ["users.read", "compliance.read"] },
  { name: "CFO", color: C.yellow, perms: ["users.read", "audit.read", "data.export"] },
];

const ALL_PERMS = ["users.manage", "users.read", "roles.manage", "settings.write", "settings.read", "audit.read", "compliance.manage", "compliance.read", "data.export"];

const SYSTEM_HEALTH = [
  { name: "API Gateway", status: "GREEN", uptime: "99.9%", latency: "42ms" },
  { name: "Database", status: "GREEN", uptime: "100%", latency: "8ms" },
  { name: "Auth Service", status: "GREEN", uptime: "99.8%", latency: "22ms" },
  { name: "Storage", status: "YELLOW", uptime: "97.2%", latency: "180ms" },
  { name: "Email Service", status: "GREEN", uptime: "99.5%", latency: "340ms" },
];

const statusColor = (s: string) =>
  s === "GREEN" || s === "ACTIVE" || s === "SUCCESS" ? C.green
  : s === "YELLOW" ? C.yellow
  : s === "RED" || s === "FAILED" ? C.red : C.tert;

// ─── Views ────────────────────────────────────────────────────────────────────
function OverviewView() {
  const { data: auditData, loading: auditLoading } = useApi<typeof FALLBACK_AUDIT>(`${API}/api/audit`);
  const audit = (auditData && auditData.length > 0) ? auditData : FALLBACK_AUDIT;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* System Health */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
        {SYSTEM_HEALTH.map((s, i) => (
          <div key={i} style={{ background: C.card, borderRadius: 12, padding: "16px 18px", boxShadow: shadow, borderTop: `3px solid ${statusColor(s.status)}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: C.sec }}>{s.name}</div>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor(s.status) }} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{s.uptime}</div>
            <div style={{ fontSize: 11, color: C.tert, marginTop: 2 }}>Latens: {s.latency}</div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {[
          { label: "Aktiva användare", value: FALLBACK_USERS.length, color: C.blue },
          { label: "Aktiva sessioner", value: 3, color: C.green },
          { label: "Audit-events idag", value: audit.filter(a => a.timestamp.startsWith("2026-03-21")).length, color: C.purple },
          { label: "Misslyckade inlogg.", value: audit.filter(a => a.status === "FAILED").length, color: C.red },
        ].map((s, i) => (
          <div key={i} style={{ background: C.card, borderRadius: 12, padding: "16px 20px", boxShadow: shadow }}>
            <div style={{ fontSize: 12, color: C.sec }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Recent Audit Events */}
      <Card title="Senaste audit-händelser">
        {auditLoading ? <Spinner /> : audit.length === 0 ? <Empty msg="Inga händelser" /> : audit.slice(0, 6).map((a, i) => (
          <Row key={i} border={i < 5}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: (a.status === "FAILED" ? C.red : C.blue) + "12", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={a.status === "FAILED" ? C.red : C.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {a.status === "FAILED" ? <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></> : <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{a.event.replace(/_/g, " ")}</div>
              <div style={{ fontSize: 12, color: C.sec }}>{a.user} · {a.ip}</div>
            </div>
            <Badge color={statusColor(a.status)}>{a.status}</Badge>
            <div style={{ fontSize: 11, color: C.tert, fontFamily: "monospace" }}>{fmt(a.timestamp)}</div>
          </Row>
        ))}
      </Card>
    </div>
  );
}

function UsersView() {
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const users = FALLBACK_USERS.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Sök användare…"
          style={{ flex: 1, background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: "9px 14px", fontSize: 13, color: C.text, outline: "none", boxShadow: shadow }}
        />
        <button
          onClick={() => setShowInvite(!showInvite)}
          style={{ background: C.blue, color: "#FFF", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          + Bjud in
        </button>
      </div>

      {showInvite && (
        <Card title="Bjud in användare">
          <div style={{ display: "flex", gap: 12 }}>
            <input placeholder="namn@företag.se" style={{ flex: 1, background: C.fill, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }} />
            <select style={{ background: C.fill, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }}>
              {ROLES.map(r => <option key={r.name}>{r.name}</option>)}
            </select>
            <button onClick={() => setShowInvite(false)} style={{ background: C.blue, color: "#FFF", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Skicka</button>
          </div>
        </Card>
      )}

      <Card title={`Användare (${users.length})`}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr", gap: 0, fontSize: 12 }}>
          {["Namn", "E-post", "Roll", "Status", "Senast inloggad"].map(h => (
            <div key={h} style={{ padding: "8px 0", fontWeight: 600, color: C.sec, borderBottom: `0.5px solid ${C.border}` }}>{h}</div>
          ))}
          {users.map((u, i) => {
            const role = ROLES.find(r => r.name === u.role);
            return [
              <div key={`n${i}`} style={{ padding: "12px 0", display: "flex", alignItems: "center", gap: 10, borderBottom: `0.5px solid ${C.fill}` }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: (role?.color ?? C.blue) + "18", color: role?.color ?? C.blue, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{u.name[0]}</div>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</span>
              </div>,
              <div key={`e${i}`} style={{ padding: "12px 0", color: C.sec, display: "flex", alignItems: "center", borderBottom: `0.5px solid ${C.fill}` }}>{u.email}</div>,
              <div key={`r${i}`} style={{ padding: "12px 0", display: "flex", alignItems: "center", borderBottom: `0.5px solid ${C.fill}` }}><Badge color={role?.color ?? C.blue}>{u.role}</Badge></div>,
              <div key={`s${i}`} style={{ padding: "12px 0", display: "flex", alignItems: "center", borderBottom: `0.5px solid ${C.fill}` }}><Badge color={statusColor(u.status)}>{u.status}</Badge></div>,
              <div key={`l${i}`} style={{ padding: "12px 0", color: C.tert, fontFamily: "monospace", fontSize: 11, display: "flex", alignItems: "center", borderBottom: `0.5px solid ${C.fill}` }}>{fmt(u.lastLogin)}</div>,
            ];
          })}
        </div>
      </Card>
    </div>
  );
}

function RolesView() {
  const [selected, setSelected] = useState("ADMIN");
  const role = ROLES.find(r => r.name === selected)!;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Role tabs */}
      <div style={{ display: "flex", gap: 8 }}>
        {ROLES.map(r => (
          <button key={r.name} onClick={() => setSelected(r.name)} style={{
            background: selected === r.name ? r.color + "18" : C.card,
            color: selected === r.name ? r.color : C.sec,
            border: `0.5px solid ${selected === r.name ? r.color + "40" : C.border}`,
            borderRadius: 10, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer"
          }}>{r.name}</button>
        ))}
      </div>

      {/* Permissions matrix */}
      <Card title={`${selected} — Behörigheter`}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {ALL_PERMS.map(perm => {
            const hasIt = role.perms.includes(perm);
            return (
              <div key={perm} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, background: hasIt ? C.green + "08" : "transparent" }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: hasIt ? C.green + "20" : C.fill, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {hasIt ? (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.tert} strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  )}
                </div>
                <span style={{ fontSize: 14, fontFamily: "monospace", color: hasIt ? C.text : C.tert }}>{perm}</span>
                {hasIt && <Badge color={C.green}>Tillåten</Badge>}
              </div>
            );
          })}
        </div>
      </Card>

      {/* All roles overview */}
      <Card title="Rollmatris — Översikt">
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: `160px repeat(${ROLES.length}, 1fr)`, fontSize: 12, minWidth: 600 }}>
            <div style={{ padding: "8px 0", fontWeight: 600, color: C.sec, borderBottom: `0.5px solid ${C.border}` }}>Behörighet</div>
            {ROLES.map(r => (
              <div key={r.name} style={{ padding: "8px 0", fontWeight: 600, color: r.color, borderBottom: `0.5px solid ${C.border}`, textAlign: "center" }}>{r.name}</div>
            ))}
            {ALL_PERMS.map((perm, pi) => [
              <div key={`p${pi}`} style={{ padding: "10px 0", fontFamily: "monospace", color: C.sec, borderBottom: `0.5px solid ${C.fill}`, fontSize: 11 }}>{perm}</div>,
              ...ROLES.map(r => (
                <div key={`${pi}${r.name}`} style={{ padding: "10px 0", textAlign: "center", borderBottom: `0.5px solid ${C.fill}` }}>
                  {r.perms.includes(perm)
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.fill} strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  }
                </div>
              ))
            ])}
          </div>
        </div>
      </Card>
    </div>
  );
}

function ComplianceView() {
  const { data, loading } = useApi<typeof FALLBACK_COMPLIANCE>(`${API}/api/compliance`);
  const items = (data && data.length > 0) ? data : FALLBACK_COMPLIANCE;
  const riskData = ([] as typeof FALLBACK_RISKS);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {loading ? <Spinner /> : items.map((c, i) => {
        const pct = c.completion_pct;
        const color = pct >= 85 ? C.green : pct >= 60 ? C.yellow : C.red;
        return (
          <Card key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{c.name}</div>
              <Badge color={color}>{pct}% uppfyllt</Badge>
            </div>
            <div style={{ height: 8, background: C.fill, borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
              <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.3s" }} />
            </div>
            <div style={{ display: "flex", gap: 20, fontSize: 12, color: C.sec }}>
              <span>✓ <span style={{ color: C.green, fontWeight: 600 }}>{c.met_requirements}</span> uppfyllda</span>
              <span>◐ <span style={{ color: C.yellow, fontWeight: 600 }}>{Math.round((c.total_requirements - c.met_requirements) * 0.5)}</span> partiella</span>
              <span>✕ <span style={{ color: C.red, fontWeight: 600 }}>{c.total_requirements - c.met_requirements}</span> ej uppfyllda</span>
              <span style={{ marginLeft: "auto" }}>Totalt: {c.total_requirements} krav</span>
            </div>
          </Card>
        );
      })}

      <Card title="Riskmatris">
        {riskData.length === 0 ? FALLBACK_RISKS.map((r, i) => (
          <Row key={i} border={i < FALLBACK_RISKS.length - 1}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{r.title}</div>
              <div style={{ fontSize: 12, color: C.sec }}>{r.mitigation_plan}</div>
            </div>
            <Badge color={C.tert}>{r.category}</Badge>
            <div style={{ fontWeight: 700, color: r.level === "HIGH" ? C.red : r.level === "MEDIUM" ? C.yellow : C.green, minWidth: 30, textAlign: "center" }}>{r.score}</div>
            <Badge color={r.level === "HIGH" ? C.red : r.level === "MEDIUM" ? C.yellow : C.green}>{r.level}</Badge>
          </Row>
        )) : <Empty msg="Inga risker" />}
      </Card>
    </div>
  );
}

function AuditView() {
  const { data, loading } = useApi<typeof FALLBACK_AUDIT>(`${API}/api/audit`);
  const audit = (data && data.length > 0) ? data : FALLBACK_AUDIT;

  const eventColor = (e: string) =>
    e.includes("FAILED") || e.includes("ERROR") ? C.red
    : e.includes("DELETE") ? C.yellow
    : e.includes("LOGIN") ? C.green
    : C.blue;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {[
          { label: "Totalt idag", value: audit.filter(a => a.timestamp?.startsWith("2026-03-21")).length, color: C.blue },
          { label: "Lyckade", value: audit.filter(a => a.status === "SUCCESS").length, color: C.green },
          { label: "Misslyckade", value: audit.filter(a => a.status === "FAILED").length, color: C.red },
          { label: "Unika användare", value: new Set(audit.map(a => a.user)).size, color: C.purple },
        ].map((s, i) => (
          <div key={i} style={{ background: C.card, borderRadius: 12, padding: "16px 20px", boxShadow: shadow }}>
            <div style={{ fontSize: 12, color: C.sec }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <Card title="Tidslinje">
        {loading ? <Spinner /> : audit.length === 0 ? <Empty msg="Inga händelser" /> : (
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 18, top: 0, bottom: 0, width: 1, background: C.border }} />
            {audit.map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 20, marginBottom: 20, position: "relative" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: eventColor(a.event) + "18", color: eventColor(a.event), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 1, border: `2px solid ${C.card}` }}>
                  <span style={{ fontSize: 10, fontWeight: 700 }}>{a.event[0]}</span>
                </div>
                <div style={{ flex: 1, background: C.fill, borderRadius: 10, padding: "10px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{a.event.replace(/_/g, " ")}</div>
                    <Badge color={statusColor(a.status)}>{a.status}</Badge>
                  </div>
                  <div style={{ fontSize: 12, color: C.sec, marginTop: 4 }}>{a.user} · {a.ip}</div>
                  <div style={{ fontSize: 11, color: C.tert, marginTop: 2, fontFamily: "monospace" }}>{fmt(a.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function SettingsView() {
  const [saved, setSaved] = useState(false);

  const sections = [
    {
      title: "System",
      settings: [
        { label: "Systemnamn", value: "Pixdrift OMS", type: "text" },
        { label: "API-bas-URL", value: "https://api.bc.pixdrift.com", type: "text" },
        { label: "Tidzon", value: "Europe/Stockholm", type: "text" },
      ]
    },
    {
      title: "Säkerhet",
      settings: [
        { label: "Session-timeout (min)", value: "60", type: "number" },
        { label: "Max inloggningsförsök", value: "5", type: "number" },
        { label: "2FA obligatorisk", value: "true", type: "text" },
      ]
    },
    {
      title: "Notifieringar",
      settings: [
        { label: "E-post för systemfel", value: "admin@pixdrift.com", type: "text" },
        { label: "Slack Webhook", value: "https://hooks.slack.com/...", type: "text" },
      ]
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {sections.map((section, si) => (
        <Card key={si} title={section.title}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {section.settings.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ width: 200, fontSize: 14, color: C.sec, flexShrink: 0 }}>{s.label}</div>
                <input
                  defaultValue={s.value}
                  type={s.type}
                  style={{ flex: 1, background: C.fill, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 14, color: C.text, outline: "none" }}
                />
              </div>
            ))}
          </div>
        </Card>
      ))}

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
          style={{ background: C.blue, color: "#FFF", border: "none", borderRadius: 10, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
        >
          {saved ? "✓ Sparad" : "Spara ändringar"}
        </button>
        <button style={{ background: C.card, color: C.sec, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Återställ
        </button>
      </div>
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("overview");

  const viewComponents: Record<string, React.ReactNode> = {
    overview: <OverviewView />,
    users: <UsersView />,
    roles: <RolesView />,
    compliance: <ComplianceView />,
    audit: <AuditView />,
    settings: <SettingsView />,
  };

  const current = navItems.find(n => n.id === view)!;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif", color: C.text, WebkitFontSmoothing: "antialiased" }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: C.card, borderRight: `0.5px solid ${C.border}`, display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100 }}>
        {/* Logo */}
        <div style={{ padding: "20px 20px 16px", borderBottom: `0.5px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: C.blue, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.02em" }}>Admin</div>
              <div style={{ fontSize: 11, color: C.tert }}>Pixdrift OMS</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
          {navItems.map(item => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 8, border: "none",
                  background: active ? "#007AFF15" : "transparent",
                  color: active ? C.blue : C.sec,
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  cursor: "pointer", textAlign: "left", width: "100%",
                  transition: "all 0.15s",
                }}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ padding: "14px 16px", borderTop: `0.5px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.blue + "18", color: C.blue, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>E</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Erik Svensson</div>
            <div style={{ fontSize: 11, color: C.tert }}>ADMIN</div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ marginLeft: 220, flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Top bar */}
        <div style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(20px)", borderBottom: `0.5px solid ${C.border}`, padding: "0 28px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em" }}>{current?.label}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 12, color: C.tert, fontFamily: "monospace" }}>{new Date().toLocaleDateString("sv-SE")}</div>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green }} />
            <div style={{ fontSize: 12, color: C.sec }}>System OK</div>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, padding: "24px 28px 60px" }}>
          {viewComponents[view] ?? <Empty msg="Vy saknas" />}
        </div>
      </div>
    </div>
  );
}
