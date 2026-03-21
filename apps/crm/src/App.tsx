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
const formatEur = (n: number) => `€${(n || 0).toLocaleString("sv-SE")}`;
const initials = (name: string) => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
const avatarColor = (name: string) => {
  const colors = [C.blue, C.green, C.purple, C.yellow, C.red];
  return colors[name.charCodeAt(0) % colors.length];
};
const stageColor = (s: string) =>
  s === "WON" ? C.green : s === "LOST" ? C.red : s === "PROPOSAL" ? C.purple : s === "QUALIFIED" ? C.blue : C.tert;

// ─── UI Primitives ─────────────────────────────────────────────────────────
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

const Avatar = ({ name, size = 36 }: { name: string; size?: number }) => {
  const color = avatarColor(name);
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color + "18", color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 700, flexShrink: 0 }}>
      {initials(name)}
    </div>
  );
};

const Spinner = () => (
  <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
    <div style={{ width: 28, height: 28, border: `2px solid ${C.fill}`, borderTop: `2px solid ${C.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const Empty = ({ msg }: { msg: string }) => (
  <div style={{ textAlign: "center", padding: "40px 0", color: C.tert, fontSize: 14 }}>{msg}</div>
);

// ─── Nav ─────────────────────────────────────────────────────────────────────
type NavItem = { id: string; label: string; icon: React.ReactNode };

const navItems: NavItem[] = [
  { id: "overview", label: "Översikt", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { id: "contacts", label: "Kontakter", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  { id: "companies", label: "Företag", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { id: "leads", label: "Leads", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/><line x1="20" y1="8" x2="20" y2="14"/></svg> },
  { id: "deals", label: "Deals", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  { id: "activities", label: "Aktiviteter", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
];

// ─── Fallback data ────────────────────────────────────────────────────────────
const FALLBACK_CONTACTS = [
  { id: "1", name: "Maria Svensson", email: "maria@fastighetsbolaget.se", phone: "+46701234567", company: "Fastighetsbolaget AB", role: "VD", status: "ACTIVE" },
  { id: "2", name: "Johan Karlsson", email: "jk@kommunx.se", phone: "+46702345678", company: "Kommun X", role: "Upphandlingschef", status: "ACTIVE" },
  { id: "3", name: "Anna Lindqvist", email: "anna@logistik.se", phone: "+46703456789", company: "Logistik AB", role: "IT-chef", status: "LEAD" },
  { id: "4", name: "Erik Persson", email: "ep@realestate.se", phone: "+46704567890", company: "RealEstate Group", role: "COO", status: "ACTIVE" },
  { id: "5", name: "Petra Nilsson", email: "petra@tech.se", phone: "+46705678901", company: "TechStart AB", role: "CTO", status: "PROSPECT" },
  { id: "6", name: "Marcus Holm", email: "marcus@bygg.se", phone: "+46706789012", company: "Bygg & Co", role: "Inköpschef", status: "LEAD" },
];

const FALLBACK_COMPANIES = [
  { id: "1", name: "Fastighetsbolaget AB", industry: "Fastigheter", contacts: 3, dealValue: 18500, status: "CUSTOMER" },
  { id: "2", name: "Kommun X", industry: "Offentlig sektor", contacts: 2, dealValue: 35000, status: "PROSPECT" },
  { id: "3", name: "Logistik AB", industry: "Transport", contacts: 1, dealValue: 8200, status: "LEAD" },
  { id: "4", name: "RealEstate Group", industry: "Fastigheter", contacts: 2, dealValue: 22000, status: "CUSTOMER" },
  { id: "5", name: "TechStart AB", industry: "Tech", contacts: 1, dealValue: 5500, status: "PROSPECT" },
];

const FALLBACK_LEADS = [
  { id: "1", name: "Systemlösning Kommun Y", company: "Kommun Y", value: 28000, stage: "NEW", assignee: "Leon Ritzén", created: "2026-03-18" },
  { id: "2", name: "Inspektionstjänst Malmö", company: "Fastighets AB", value: 15000, stage: "QUALIFIED", assignee: "Erik Svensson", created: "2026-03-15" },
  { id: "3", name: "OMS-licens Göteborg", company: "Bygg & Co", value: 42000, stage: "PROPOSAL", assignee: "Leon Ritzén", created: "2026-03-10" },
  { id: "4", name: "Drone-inspektion", company: "RealEstate Group", value: 12000, stage: "WON", assignee: "Dennis Lindqvist", created: "2026-03-05" },
  { id: "5", name: "Pilotprojekt Västerås", company: "Industri AB", value: 9500, stage: "LOST", assignee: "Leon Ritzén", created: "2026-02-28" },
  { id: "6", name: "Enterprise OMS", company: "Logistics Corp", value: 65000, stage: "NEW", assignee: "Erik Svensson", created: "2026-03-21" },
  { id: "7", name: "SaaS-avtal Q2", company: "TechStart AB", value: 18000, stage: "QUALIFIED", assignee: "Leon Ritzén", created: "2026-03-20" },
  { id: "8", name: "Stadsomfattande inspektion", company: "Stockholms Stad", value: 95000, stage: "PROPOSAL", assignee: "Erik Svensson", created: "2026-03-17" },
];

const FALLBACK_DEALS = [
  { id: "1", name: "Fastighetsbolaget – OMS", value: 18500, stage: "WON", probability: 100, company: "Fastighetsbolaget AB", owner: "Erik Svensson", close: "2026-03-15" },
  { id: "2", name: "Kommun X – Systemavtal", value: 35000, stage: "PROPOSAL", probability: 65, company: "Kommun X", owner: "Leon Ritzén", close: "2026-04-30" },
  { id: "3", name: "Bygg & Co – OMS-licens", value: 42000, stage: "QUALIFIED", probability: 40, company: "Bygg & Co", owner: "Leon Ritzén", close: "2026-05-15" },
  { id: "4", name: "RealEstate – Inspektionstjänst", value: 22000, stage: "WON", probability: 100, company: "RealEstate Group", owner: "Erik Svensson", close: "2026-03-01" },
  { id: "5", name: "TechStart – Pilot", value: 5500, stage: "NEW", probability: 20, company: "TechStart AB", owner: "Dennis Lindqvist", close: "2026-06-01" },
  { id: "6", name: "Enterprise – Sthlm Stad", value: 95000, stage: "PROPOSAL", probability: 55, company: "Stockholms Stad", owner: "Erik Svensson", close: "2026-06-30" },
];

const FALLBACK_ACTIVITIES = [
  { id: "1", type: "MEETING", title: "Demo för Kommun X", contact: "Johan Karlsson", date: "2026-03-22", time: "10:00", done: false },
  { id: "2", type: "TASK", title: "Skicka offert till Bygg & Co", contact: "Marcus Holm", date: "2026-03-21", time: "17:00", done: false },
  { id: "3", type: "CALL", title: "Uppföljning Fastighetsbolaget", contact: "Maria Svensson", date: "2026-03-21", time: "14:00", done: true },
  { id: "4", type: "EMAIL", title: "Välkomstmail TechStart", contact: "Petra Nilsson", date: "2026-03-20", time: "09:00", done: true },
  { id: "5", type: "MEETING", title: "Kickoff Enterprise OMS", contact: "Erik Persson", date: "2026-03-24", time: "13:00", done: false },
  { id: "6", type: "TASK", title: "Uppdatera CRM-data Logistik AB", contact: "Anna Lindqvist", date: "2026-03-23", time: "12:00", done: false },
];

const actColor = (t: string) =>
  t === "MEETING" ? C.blue : t === "TASK" ? C.purple : t === "CALL" ? C.green : C.yellow;

// ─── Views ────────────────────────────────────────────────────────────────────
function OverviewView() {
  const { data: leadsData } = useApi<typeof FALLBACK_LEADS>(`${API}/api/leads`);
  const { data: dealsData } = useApi<typeof FALLBACK_DEALS>(`${API}/api/deals`);
  const leads = (leadsData && leadsData.length > 0) ? leadsData : FALLBACK_LEADS;
  const deals = (dealsData && dealsData.length > 0) ? dealsData : FALLBACK_DEALS;

  const pipeline = deals.filter(d => d.stage !== "WON" && d.stage !== "LOST");
  const pipelineVal = pipeline.reduce((s, d) => s + (d.value ?? 0), 0);
  const wonVal = deals.filter(d => d.stage === "WON").reduce((s, d) => s + (d.value ?? 0), 0);
  const todayActivities = FALLBACK_ACTIVITIES.filter(a => a.date === "2026-03-21" && !a.done).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {[
          { label: "Pipeline-värde", value: formatEur(pipelineVal), sub: `${pipeline.length} aktiva deals`, color: C.blue },
          { label: "Leads totalt", value: leads.length, sub: `${leads.filter(l => l.stage === "NEW").length} nya`, color: C.purple },
          { label: "Vunnet (MTD)", value: formatEur(wonVal), sub: `${deals.filter(d => d.stage === "WON").length} avslutade`, color: C.green },
          { label: "Aktiviteter idag", value: todayActivities, sub: "Ej klara", color: C.yellow },
        ].map((kpi, i) => (
          <div key={i} style={{ background: C.card, borderRadius: 12, padding: "18px 20px", boxShadow: shadow }}>
            <div style={{ fontSize: 12, color: C.sec }}>{kpi.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: kpi.color, marginTop: 6 }}>{kpi.value}</div>
            <div style={{ fontSize: 12, color: C.tert, marginTop: 2 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Pipeline by stage */}
      <Card title="Pipeline per fas">
        <div style={{ display: "flex", gap: 10 }}>
          {["NEW", "QUALIFIED", "PROPOSAL"].map(stage => {
            const stDeals = leads.filter(l => l.stage === stage);
            const stVal = stDeals.reduce((s, d) => s + (d.value ?? 0), 0);
            return (
              <div key={stage} style={{ flex: 1, background: C.fill, borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.sec }}>{stage}</div>
                <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{formatEur(stVal)}</div>
                <div style={{ fontSize: 12, color: C.tert }}>{stDeals.length} leads</div>
              </div>
            );
          })}
          <div style={{ flex: 1, background: C.green + "08", borderRadius: 10, padding: "14px 16px", border: `0.5px solid ${C.green}30` }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.green }}>WON</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.green, marginTop: 4 }}>{formatEur(leads.filter(l => l.stage === "WON").reduce((s, d) => s + (d.value ?? 0), 0))}</div>
            <div style={{ fontSize: 12, color: C.tert }}>{leads.filter(l => l.stage === "WON").length} avslutade</div>
          </div>
          <div style={{ flex: 1, background: C.red + "08", borderRadius: 10, padding: "14px 16px", border: `0.5px solid ${C.red}30` }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.red }}>LOST</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.red, marginTop: 4 }}>{formatEur(leads.filter(l => l.stage === "LOST").reduce((s, d) => s + (d.value ?? 0), 0))}</div>
            <div style={{ fontSize: 12, color: C.tert }}>{leads.filter(l => l.stage === "LOST").length} förlorade</div>
          </div>
        </div>
      </Card>

      {/* Recent contacts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card title="Senaste kontakter">
          {FALLBACK_CONTACTS.slice(0, 4).map((c, i) => (
            <Row key={i} border={i < 3}>
              <Avatar name={c.name} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: C.sec }}>{c.role} · {c.company}</div>
              </div>
              <Badge color={c.status === "ACTIVE" ? C.green : c.status === "LEAD" ? C.blue : C.tert}>{c.status}</Badge>
            </Row>
          ))}
        </Card>
        <Card title="Kommande aktiviteter">
          {FALLBACK_ACTIVITIES.filter(a => !a.done).slice(0, 4).map((a, i) => (
            <Row key={i} border={i < 3}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: actColor(a.type) + "15", color: actColor(a.type), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{a.type[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{a.title}</div>
                <div style={{ fontSize: 12, color: C.sec }}>{a.contact}</div>
              </div>
              <div style={{ fontSize: 11, color: C.tert, textAlign: "right" }}>
                <div>{a.date}</div>
                <div>{a.time}</div>
              </div>
            </Row>
          ))}
        </Card>
      </div>
    </div>
  );
}

function ContactsView() {
  const { data, loading } = useApi<typeof FALLBACK_CONTACTS>(`${API}/api/contacts`);
  const allContacts = (data && data.length > 0) ? data : FALLBACK_CONTACTS;
  const [search, setSearch] = useState("");
  const contacts = allContacts.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 12 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Sök kontakter…"
          style={{ flex: 1, background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: "9px 14px", fontSize: 13, color: C.text, outline: "none", boxShadow: shadow }}
        />
        <button style={{ background: C.blue, color: "#FFF", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Lägg till</button>
      </div>

      {loading ? <Spinner /> : (
        <Card title={`${contacts.length} kontakter`}>
          {contacts.length === 0 ? <Empty msg="Inga kontakter hittades" /> : contacts.map((c, i) => (
            <Row key={i} border={i < contacts.length - 1}>
              <Avatar name={c.name ?? "?"} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: C.sec }}>{c.role} · {c.company}</div>
              </div>
              <div style={{ fontSize: 12, color: C.sec }}>{c.email}</div>
              <div style={{ fontSize: 12, color: C.tert }}>{c.phone}</div>
              <Badge color={c.status === "ACTIVE" ? C.green : c.status === "LEAD" ? C.blue : C.tert}>
                {c.status}
              </Badge>
            </Row>
          ))}
        </Card>
      )}
    </div>
  );
}

function CompaniesView() {
  const { data, loading } = useApi<typeof FALLBACK_COMPANIES>(`${API}/api/companies`);
  const companies = (data && data.length > 0) ? data : FALLBACK_COMPANIES;

  const totalVal = companies.reduce((s, c) => s + (c.dealValue ?? 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {[
          { label: "Antal företag", value: companies.length, color: C.blue },
          { label: "Total deal-värde", value: formatEur(totalVal), color: C.green },
          { label: "Kunder", value: companies.filter(c => c.status === "CUSTOMER").length, color: C.purple },
        ].map((s, i) => (
          <div key={i} style={{ background: C.card, borderRadius: 12, padding: "16px 20px", boxShadow: shadow }}>
            <div style={{ fontSize: 12, color: C.sec }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <Card title="Företag">
          {companies.map((c, i) => {
            const pct = (c.dealValue ?? 0) / (totalVal || 1) * 100;
            const statusCol = c.status === "CUSTOMER" ? C.green : c.status === "PROSPECT" ? C.blue : C.tert;
            return (
              <div key={i} style={{ padding: "14px 0", borderBottom: i < companies.length - 1 ? `0.5px solid ${C.border}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: C.fill, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: C.sec }}>{c.name[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: C.sec }}>{c.industry} · {c.contacts} kontakter</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{formatEur(c.dealValue)}</div>
                    <Badge color={statusCol}>{c.status}</Badge>
                  </div>
                </div>
                <div style={{ height: 4, background: C.fill, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: statusCol, borderRadius: 2 }} />
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}

const STAGES = ["NEW", "QUALIFIED", "PROPOSAL", "WON", "LOST"];

function LeadsView() {
  const { data, loading } = useApi<typeof FALLBACK_LEADS>(`${API}/api/leads`);
  const leads = (data && data.length > 0) ? data : FALLBACK_LEADS;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button style={{ background: C.blue, color: "#FFF", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Nytt lead</button>
      </div>

      {loading ? <Spinner /> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, overflowX: "auto" }}>
          {STAGES.map(stage => {
            const stageLeads = leads.filter(l => l.stage === stage);
            const stageVal = stageLeads.reduce((s, l) => s + (l.value ?? 0), 0);
            const color = stageColor(stage);
            return (
              <div key={stage} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Column header */}
                <div style={{ background: color + "12", borderRadius: 10, padding: "10px 12px", borderTop: `3px solid ${color}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase" }}>{stage}</div>
                  <div style={{ fontSize: 12, color: C.sec, marginTop: 2 }}>{formatEur(stageVal)} · {stageLeads.length}</div>
                </div>

                {/* Cards */}
                {stageLeads.map((lead, i) => (
                  <div key={i} style={{ background: C.card, borderRadius: 10, padding: "12px 14px", boxShadow: shadow, cursor: "pointer" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{lead.name}</div>
                    <div style={{ fontSize: 11, color: C.sec }}>{lead.company}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color }}>{formatEur(lead.value)}</div>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: avatarColor(lead.assignee ?? "") + "18", color: avatarColor(lead.assignee ?? ""), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700 }}>
                        {(lead.assignee ?? "?")[0]}
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: C.tert, marginTop: 4 }}>{lead.created}</div>
                  </div>
                ))}

                {stageLeads.length === 0 && (
                  <div style={{ background: C.fill, borderRadius: 10, padding: "20px 12px", textAlign: "center", fontSize: 12, color: C.tert }}>Tomt</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DealsView() {
  const { data, loading } = useApi<typeof FALLBACK_DEALS>(`${API}/api/deals`);
  const deals = (data && data.length > 0) ? data : FALLBACK_DEALS;
  const [sortBy, setSortBy] = useState<"value" | "probability">("value");
  const sorted = [...deals].sort((a, b) => (b[sortBy] ?? 0) - (a[sortBy] ?? 0));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {(["value", "probability"] as const).map(s => (
            <button key={s} onClick={() => setSortBy(s)} style={{
              background: sortBy === s ? C.blue : C.card,
              color: sortBy === s ? "#FFF" : C.sec,
              border: `0.5px solid ${sortBy === s ? C.blue : C.border}`,
              borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer"
            }}>Sortera: {s === "value" ? "Värde" : "Sannolikhet"}</button>
          ))}
        </div>
        <button style={{ background: C.blue, color: "#FFF", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Nytt deal</button>
      </div>

      {loading ? <Spinner /> : (
        <Card title={`${deals.length} deals`}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", fontSize: 12 }}>
            {["Deal", "Värde", "Fas", "Sannolikhet", "Stänger"].map(h => (
              <div key={h} style={{ padding: "8px 0", fontWeight: 600, color: C.sec, borderBottom: `0.5px solid ${C.border}` }}>{h}</div>
            ))}
            {sorted.map((d, i) => {
              const color = stageColor(d.stage);
              const prob = d.probability ?? 0;
              return [
                <div key={`n${i}`} style={{ padding: "12px 0", borderBottom: `0.5px solid ${C.fill}` }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{d.name}</div>
                  <div style={{ fontSize: 12, color: C.sec }}>{d.company} · {d.owner}</div>
                </div>,
                <div key={`v${i}`} style={{ padding: "12px 0", borderBottom: `0.5px solid ${C.fill}`, display: "flex", alignItems: "center", fontWeight: 700, fontSize: 14 }}>{formatEur(d.value)}</div>,
                <div key={`s${i}`} style={{ padding: "12px 0", borderBottom: `0.5px solid ${C.fill}`, display: "flex", alignItems: "center" }}><Badge color={color}>{d.stage}</Badge></div>,
                <div key={`p${i}`} style={{ padding: "12px 0", borderBottom: `0.5px solid ${C.fill}`, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, height: 4, background: C.fill, borderRadius: 2 }}>
                    <div style={{ height: "100%", width: `${prob}%`, background: color, borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 12, color: C.sec, minWidth: 30 }}>{prob}%</span>
                </div>,
                <div key={`c${i}`} style={{ padding: "12px 0", borderBottom: `0.5px solid ${C.fill}`, display: "flex", alignItems: "center", fontSize: 12, color: C.tert, fontFamily: "monospace" }}>{d.close}</div>,
              ];
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

function ActivitiesView() {
  const [filter, setFilter] = useState<"ALL" | "TASK" | "MEETING" | "CALL" | "EMAIL">("ALL");
  const activities = FALLBACK_ACTIVITIES.filter(a => filter === "ALL" || a.type === filter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Filters */}
      <div style={{ display: "flex", gap: 8 }}>
        {(["ALL", "TASK", "MEETING", "CALL", "EMAIL"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter === f ? C.blue : C.card,
            color: filter === f ? "#FFF" : C.sec,
            border: `0.5px solid ${filter === f ? C.blue : C.border}`,
            borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer"
          }}>{f === "ALL" ? "Alla" : f}</button>
        ))}
        <div style={{ marginLeft: "auto" }}>
          <button style={{ background: C.blue, color: "#FFF", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Ny aktivitet</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {[
          { label: "Idag (kvar)", value: FALLBACK_ACTIVITIES.filter(a => a.date === "2026-03-21" && !a.done).length, color: C.blue },
          { label: "Klara idag", value: FALLBACK_ACTIVITIES.filter(a => a.date === "2026-03-21" && a.done).length, color: C.green },
          { label: "Möten denna vecka", value: FALLBACK_ACTIVITIES.filter(a => a.type === "MEETING").length, color: C.purple },
          { label: "Uppgifter", value: FALLBACK_ACTIVITIES.filter(a => a.type === "TASK").length, color: C.yellow },
        ].map((s, i) => (
          <div key={i} style={{ background: C.card, borderRadius: 12, padding: "14px 18px", boxShadow: shadow }}>
            <div style={{ fontSize: 12, color: C.sec }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <Card title={`Aktiviteter (${activities.length})`}>
        {activities.length === 0 ? <Empty msg="Inga aktiviteter" /> : activities.map((a, i) => (
          <Row key={i} border={i < activities.length - 1}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: actColor(a.type) + "15", color: actColor(a.type), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{a.type[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: a.done ? C.tert : C.text, textDecoration: a.done ? "line-through" : "none" }}>{a.title}</div>
              <div style={{ fontSize: 12, color: C.sec }}>{a.contact}</div>
            </div>
            <Badge color={actColor(a.type)}>{a.type}</Badge>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: C.sec, fontFamily: "monospace" }}>{a.date}</div>
              <div style={{ fontSize: 11, color: C.tert }}>{a.time}</div>
            </div>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: a.done ? C.green + "18" : C.fill, border: `1.5px solid ${a.done ? C.green : C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {a.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
            </div>
          </Row>
        ))}
      </Card>
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("overview");

  const viewComponents: Record<string, React.ReactNode> = {
    overview: <OverviewView />,
    contacts: <ContactsView />,
    companies: <CompaniesView />,
    leads: <LeadsView />,
    deals: <DealsView />,
    activities: <ActivitiesView />,
  };

  const current = navItems.find(n => n.id === view)!;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif", color: C.text, WebkitFontSmoothing: "antialiased" }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: C.card, borderRight: `0.5px solid ${C.border}`, display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100 }}>
        {/* Logo */}
        <div style={{ padding: "20px 20px 16px", borderBottom: `0.5px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: C.purple, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.02em" }}>CRM</div>
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
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.purple + "18", color: C.purple, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>E</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Erik Svensson</div>
            <div style={{ fontSize: 11, color: C.tert }}>Säljchef</div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ marginLeft: 220, flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Top bar */}
        <div style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(20px)", borderBottom: `0.5px solid ${C.border}`, padding: "0 28px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em" }}>{current?.label}</div>
          <div style={{ fontSize: 12, color: C.tert, fontFamily: "monospace" }}>{new Date().toLocaleDateString("sv-SE")}</div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, padding: "24px 28px 60px" }}>
          {viewComponents[view] ?? <Empty msg="Vy saknas" />}
        </div>
      </div>
    </div>
  );
}
