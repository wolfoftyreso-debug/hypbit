/**
 * DevOpsHub.tsx — pixdrift Dev Infrastructure Hub
 * Apple HIG design — 4 tabs: Integrations, Secrets Vault, Costs, Add Service
 */

import React, { useState, useEffect, useCallback } from "react";

// ─── Design tokens (match Dashboard.tsx) ──────────────────────────────────────
const C = {
  bg: "#F2F2F7",
  surface: "#FFFFFF",
  border: "#D1D1D6",
  text: "#000000",
  secondary: "#8E8E93",
  tertiary: "#C7C7CC",
  blue: "#007AFF",
  green: "#34C759",
  red: "#FF3B30",
  orange: "#FF9500",
  yellow: "#FFCC00",
  purple: "#AF52DE",
  indigo: "#5856D6",
  teal: "#5AC8FA",
};

const shadow = "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)";
const shadowMd = "0 4px 12px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.06)";

// ─── Service catalog (emoji icons) ────────────────────────────────────────────
const SERVICE_ICONS: Record<string, string> = {
  // Source Control
  github: "🐙", gitlab: "🦊", bitbucket: "🪣",
  // Hosting
  vercel: "▲", netlify: "🌐", railway: "🚂", render: "🎯", flyio: "🪰", heroku: "💜", digitalocean: "🌊",
  // Cloud
  aws: "☁️", google_cloud: "🌤️", azure: "🔷",
  // Database
  supabase: "⚡", planetscale: "🪐", neon: "💚", mongodb_atlas: "🍃", redis_upstash: "🔴", firebase: "🔥",
  // CDN & DNS
  cloudflare: "🟠", bunnynet: "🐰", fastly: "⚡",
  // Payments
  stripe: "💳", klarna: "🩷", adyen: "💚", revolut: "🔵", wise: "💙", paypal: "🔵",
  // Email
  sendgrid: "📧", resend: "📨", mailchimp: "🐵", brevo: "📬", postmark: "📮",
  // SMS
  twilio: "📱", "46elks": "🦌", sinch: "📲",
  // Monitoring
  sentry: "🛡️", datadog: "🐕", new_relic: "🟢", grafana: "📊", logrocket: "🎥", posthog: "🦔", pagerduty: "🚨",
  // Analytics
  google_analytics: "📈", mixpanel: "🔮", amplitude: "📉", hotjar: "🔥",
  // Auth
  auth0: "🔐", clerk: "🔑", okta: "🟡",
  // AI
  openai: "🤖", anthropic: "🧠", google_gemini: "✨", cohere: "🌊", replicate: "🔄", hugging_face: "🤗",
  // Design
  figma: "🎨",
  // PM
  linear: "📋", jira: "🗂️", notion: "📝", confluence: "📄",
  // Communication
  slack: "💬", discord: "🎮", microsoft_teams: "🟣",
  // Storage
  aws_s3: "🗄️", cloudflare_r2: "📦", backblaze_b2: "💾",
  // CMS
  contentful: "📰", sanity: "🧱",
  // Domain
  namecheap: "🏷️", godaddy: "🐮",
  // CI/CD
  github_actions: "⚙️", circleci: "🔵",
  // Custom
  custom: "🔧",
};

const CATEGORY_LABELS: Record<string, string> = {
  source_control: "Source Control", hosting: "Hosting", cloud: "Cloud",
  database: "Database", cdn: "CDN & DNS", payments: "Payments",
  email: "Email", sms: "SMS", monitoring: "Monitoring", analytics: "Analytics",
  auth: "Auth", ai: "AI", design: "Design", pm: "Project Management",
  communication: "Communication", storage: "Storage", cms: "CMS",
  domain: "Domain", cicd: "CI/CD", custom: "Custom", other: "Other",
};

const CATEGORY_ORDER = [
  "ai", "hosting", "cloud", "database", "payments", "monitoring",
  "analytics", "email", "sms", "auth", "source_control", "cdn",
  "storage", "communication", "design", "pm", "cms", "domain", "cicd", "custom", "other"
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface CatalogService {
  id: string;
  name: string;
  logo: string;
  color: string;
  fields: string[];
  docs: string;
  cost_url?: string;
  category: string;
}

interface Integration {
  id: string;
  service: string;
  display_name: string;
  environment: string;
  status: string;
  monthly_cost_usd?: number;
  notes?: string;
  expires_at?: string;
  renewal_date?: string;
  last_verified_at?: string;
  credentials: Record<string, string>;
  metadata?: any;
}

interface Secret {
  id: string;
  secret_name: string;
  secret_type: string;
  environment: string;
  expires_at?: string;
  last_rotated_at?: string;
  is_active: boolean;
  notes?: string;
  tags?: string[];
}

// ─── API base ─────────────────────────────────────────────────────────────────
const API_BASE = typeof window !== "undefined"
  ? (localStorage.getItem("pixdrift_api_url") || "https://api.hypbit.com")
  : "https://api.hypbit.com";

const ORG_ID = typeof window !== "undefined"
  ? (localStorage.getItem("pixdrift_org_id") || "")
  : "";

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "x-org-id": ORG_ID,
      ...(opts?.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

// ─── Shared UI components ─────────────────────────────────────────────────────
const Pill = ({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      padding: "6px 14px",
      borderRadius: 20,
      border: active ? "none" : `1px solid ${C.border}`,
      background: active ? C.blue : C.surface,
      color: active ? "#fff" : C.text,
      fontSize: 13,
      fontWeight: active ? 600 : 400,
      cursor: "pointer",
      whiteSpace: "nowrap",
      transition: "all 0.15s",
    }}
  >
    {label}
  </button>
);

const StatusDot = ({ status, expiresAt }: { status: string; expiresAt?: string }) => {
  let color = C.green;
  if (status === "error" || status === "inactive") color = C.red;
  else if (status === "pending") color = C.orange;
  else if (expiresAt) {
    const daysLeft = (new Date(expiresAt).getTime() - Date.now()) / 86400000;
    if (daysLeft < 30) color = C.yellow;
  }
  return (
    <span style={{
      display: "inline-block", width: 8, height: 8, borderRadius: "50%",
      background: color, flexShrink: 0,
    }} />
  );
};

const Badge = ({ label, color }: { label: string; color: string }) => (
  <span style={{
    display: "inline-flex", alignItems: "center",
    padding: "2px 8px", borderRadius: 10,
    background: color + "20", color,
    fontSize: 11, fontWeight: 600, letterSpacing: 0.2,
  }}>
    {label}
  </span>
);

function fieldLabel(f: string): string {
  return f.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Tab: Integrations ────────────────────────────────────────────────────────
function IntegrationsTab({
  integrations, catalog, loading, onRefresh, onConfigure,
}: {
  integrations: Integration[];
  catalog: CatalogService[];
  loading: boolean;
  onRefresh: () => void;
  onConfigure: (i: Integration) => void;
}) {
  const [filter, setFilter] = useState("all");

  const categories = ["all", ...Array.from(new Set(integrations.map((i) => {
    const svc = catalog.find((c) => c.id === i.service);
    return svc?.category || "other";
  })))];

  const filtered = filter === "all"
    ? integrations
    : integrations.filter((i) => {
        const svc = catalog.find((c) => c.id === i.service);
        return (svc?.category || "other") === filter;
      });

  return (
    <div>
      {/* Category filter pills */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 20, scrollbarWidth: "none" }}>
        {categories.map((cat) => (
          <Pill
            key={cat}
            label={cat === "all" ? "Alla" : (CATEGORY_LABELS[cat] || cat)}
            active={filter === cat}
            onClick={() => setFilter(cat)}
          />
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: C.secondary }}>Laddar...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: C.secondary }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔌</div>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Inga integrationer</div>
          <div style={{ fontSize: 14 }}>Lägg till tjänster via "+ Lägg till"</div>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 12,
        }}>
          {filtered.map((int) => {
            const svc = catalog.find((c) => c.id === int.service);
            const icon = SERVICE_ICONS[int.service] || "🔧";
            const cost = int.monthly_cost_usd
              ? `$${int.monthly_cost_usd}/mo`
              : "Gratis";
            return (
              <div key={int.id} style={{
                background: C.surface, borderRadius: 12, padding: 16,
                border: `0.5px solid ${C.border}`, boxShadow: shadow,
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, fontSize: 22,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: (svc?.color || "#8E8E93") + "15",
                    flexShrink: 0,
                  }}>
                    {icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {int.display_name}
                    </div>
                    <div style={{ fontSize: 12, color: C.secondary }}>{svc?.name || int.service}</div>
                  </div>
                  <StatusDot status={int.status} expiresAt={int.expires_at} />
                </div>

                {/* Info row */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <Badge
                    label={int.environment}
                    color={int.environment === "production" ? C.red : C.blue}
                  />
                  <Badge
                    label={cost}
                    color={int.monthly_cost_usd ? C.orange : C.green}
                  />
                  {svc && (
                    <Badge
                      label={CATEGORY_LABELS[svc.category] || svc.category}
                      color={C.indigo}
                    />
                  )}
                </div>

                {int.notes && (
                  <div style={{ fontSize: 12, color: C.secondary, lineHeight: 1.4 }}>
                    {int.notes}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                  <button
                    onClick={() => onConfigure(int)}
                    style={{
                      flex: 1, padding: "7px 0", borderRadius: 8,
                      border: `1px solid ${C.border}`, background: C.surface,
                      fontSize: 13, fontWeight: 500, cursor: "pointer",
                      color: C.text,
                    }}
                  >
                    Konfigurera
                  </button>
                  {svc?.docs && (
                    <a
                      href={svc.docs}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "7px 12px", borderRadius: 8,
                        border: `1px solid ${C.border}`, background: C.surface,
                        fontSize: 13, cursor: "pointer", color: C.secondary,
                        textDecoration: "none",
                      }}
                    >
                      📄
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Secrets Vault ────────────────────────────────────────────────────────
function SecretsVaultTab({ orgId }: { orgId: string }) {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/dev-secrets?org_id=${orgId}`)
      .then((d) => setSecrets(d.secrets || []))
      .catch(() => setSecrets([]))
      .finally(() => setLoading(false));
  }, [orgId]);

  const revealSecret = async (id: string) => {
    if (revealed[id]) {
      setRevealed((r) => { const n = { ...r }; delete n[id]; return n; });
      return;
    }
    try {
      const d = await apiFetch(`/api/dev-secrets/${id}/reveal?org_id=${orgId}`);
      setRevealed((r) => ({ ...r, [id]: d.value }));
    } catch {
      alert("Kunde inte hämta secret");
    }
  };

  const copySecret = async (id: string) => {
    const val = revealed[id];
    if (!val) { await revealSecret(id); return; }
    await navigator.clipboard.writeText(val);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const typeColor: Record<string, string> = {
    api_key: C.blue, token: C.purple, password: C.red,
    certificate: C.orange, ssh_key: C.green, webhook_secret: C.indigo,
    oauth_token: C.teal, database_url: C.yellow,
  };

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: C.secondary }}>Laddar...</div>;

  if (secrets.length === 0) return (
    <div style={{ textAlign: "center", padding: 60, color: C.secondary }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Vault är tom</div>
      <div style={{ fontSize: 14 }}>Lägg till secrets via dina integrationer</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {secrets.map((s) => {
        const daysToExpiry = s.expires_at
          ? (new Date(s.expires_at).getTime() - Date.now()) / 86400000
          : null;
        const expiringSoon = daysToExpiry !== null && daysToExpiry < 30;

        return (
          <div key={s.id} style={{
            background: C.surface, borderRadius: 10, padding: "12px 16px",
            border: `0.5px solid ${expiringSoon ? C.yellow : C.border}`,
            boxShadow: shadow,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            {/* Name + badges */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 13, fontFamily: "monospace" }}>
                  {s.secret_name}
                </span>
                <Badge
                  label={s.secret_type}
                  color={typeColor[s.secret_type] || C.secondary}
                />
                <Badge
                  label={s.environment}
                  color={s.environment === "production" ? C.red : C.blue}
                />
                {expiringSoon && (
                  <Badge label={`⚠️ Löper ut om ${Math.round(daysToExpiry!)}d`} color={C.yellow} />
                )}
              </div>
              <div style={{
                fontFamily: "monospace", fontSize: 12,
                color: revealed[s.id] ? C.text : C.tertiary,
                background: "#F2F2F7", borderRadius: 6,
                padding: "4px 8px", marginTop: 4,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {revealed[s.id] || "••••••••••••••••••••"}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button
                onClick={() => revealSecret(s.id)}
                title={revealed[s.id] ? "Dölj" : "Visa"}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: `1px solid ${C.border}`, background: C.surface,
                  cursor: "pointer", fontSize: 14,
                }}
              >
                {revealed[s.id] ? "🙈" : "👁"}
              </button>
              <button
                onClick={() => copySecret(s.id)}
                title="Kopiera"
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: `1px solid ${copied === s.id ? C.green : C.border}`,
                  background: copied === s.id ? C.green + "15" : C.surface,
                  cursor: "pointer", fontSize: 14,
                }}
              >
                {copied === s.id ? "✅" : "📋"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab: Costs ────────────────────────────────────────────────────────────────
function CostsTab({ integrations, catalog }: { integrations: Integration[]; catalog: CatalogService[] }) {
  const total = integrations.reduce((sum, i) => sum + (i.monthly_cost_usd || 0), 0);

  const byCategory: Record<string, number> = {};
  const byService: { name: string; cost: number; icon: string; category: string }[] = [];

  integrations.forEach((int) => {
    if (!int.monthly_cost_usd) return;
    const svc = catalog.find((c) => c.id === int.service);
    const cat = svc?.category || "other";
    byCategory[cat] = (byCategory[cat] || 0) + int.monthly_cost_usd;
    byService.push({
      name: int.display_name,
      cost: int.monthly_cost_usd,
      icon: SERVICE_ICONS[int.service] || "🔧",
      category: cat,
    });
  });

  byService.sort((a, b) => b.cost - a.cost);
  const sortedCats = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const maxCost = sortedCats[0]?.[1] || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Total */}
      <div style={{
        background: "linear-gradient(135deg, #007AFF 0%, #5856D6 100%)",
        borderRadius: 16, padding: "24px 28px",
        color: "#fff",
      }}>
        <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>Total månadskostnad</div>
        <div style={{ fontSize: 42, fontWeight: 700, letterSpacing: -1 }}>
          ${total.toFixed(2)}
          <span style={{ fontSize: 16, fontWeight: 400, opacity: 0.8 }}>/mo</span>
        </div>
        <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
          {integrations.filter((i) => i.monthly_cost_usd).length} betalda tjänster ·{" "}
          {integrations.filter((i) => !i.monthly_cost_usd).length} gratistjänster
        </div>
      </div>

      {/* By category (bar chart) */}
      {sortedCats.length > 0 && (
        <div style={{ background: C.surface, borderRadius: 12, padding: "16px 20px", boxShadow: shadow }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>Kostnad per kategori</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {sortedCats.map(([cat, cost]) => (
              <div key={cat}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13 }}>{CATEGORY_LABELS[cat] || cat}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>${cost.toFixed(2)}</span>
                </div>
                <div style={{ height: 6, background: C.bg, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${(cost / maxCost) * 100}%`,
                    background: "linear-gradient(90deg, #007AFF, #5856D6)",
                    borderRadius: 3,
                    transition: "width 0.6s ease",
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per service */}
      {byService.length > 0 && (
        <div style={{ background: C.surface, borderRadius: 12, padding: "16px 20px", boxShadow: shadow }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>Per tjänst</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {byService.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: i < byService.length - 1 ? `0.5px solid ${C.border}` : "none" }}>
                <span style={{ fontSize: 20 }}>{s.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: C.secondary }}>{CATEGORY_LABELS[s.category] || s.category}</div>
                </div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>${s.cost.toFixed(2)}/mo</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {total === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: C.secondary }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💸</div>
          <div style={{ fontSize: 14 }}>Lägg till kostnad på dina integrationer</div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Add Integration ──────────────────────────────────────────────────────
function AddIntegrationTab({
  catalog, onAdded,
}: {
  catalog: CatalogService[];
  onAdded: () => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CatalogService | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [displayName, setDisplayName] = useState("");
  const [environment, setEnvironment] = useState("production");
  const [monthlyCost, setMonthlyCost] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const filtered = catalog.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.id.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase())
  );

  const grouped: Record<string, CatalogService[]> = {};
  filtered.forEach((s) => {
    const cat = s.category || "other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(s);
  });

  const orderedGroups = CATEGORY_ORDER
    .filter((cat) => grouped[cat])
    .map((cat) => [cat, grouped[cat]] as [string, CatalogService[]]);

  const selectService = (svc: CatalogService) => {
    setSelected(svc);
    setDisplayName(svc.name);
    setFormData({});
    setSaved(false);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiFetch("/api/dev-integrations", {
        method: "POST",
        body: JSON.stringify({
          service: selected.id,
          display_name: displayName,
          environment,
          credentials: formData,
          monthly_cost_usd: monthlyCost ? parseFloat(monthlyCost) : undefined,
          notes,
        }),
      });
      setSaved(true);
      setSelected(null);
      setFormData({});
      setDisplayName("");
      setNotes("");
      setMonthlyCost("");
      onAdded();
    } catch (e: any) {
      alert("Fel: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (selected) {
    return (
      <div>
        {/* Back button */}
        <button
          onClick={() => setSelected(null)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
            color: C.blue, fontSize: 14, fontWeight: 500, marginBottom: 20,
            padding: 0,
          }}
        >
          ← Tillbaka
        </button>

        <div style={{ background: C.surface, borderRadius: 16, padding: 24, boxShadow: shadow, maxWidth: 600 }}>
          {/* Service header */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 12,
              background: selected.color + "15",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28,
            }}>
              {SERVICE_ICONS[selected.id] || "🔧"}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{selected.name}</div>
              <div style={{ fontSize: 13, color: C.secondary }}>{CATEGORY_LABELS[selected.category] || selected.category}</div>
            </div>
          </div>

          {/* Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.secondary, display: "block", marginBottom: 6 }}>
                VISNINGSNAMN
              </label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                style={inputStyle}
                placeholder={selected.name}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.secondary, display: "block", marginBottom: 6 }}>
                  MILJÖ
                </label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="production">Production</option>
                  <option value="staging">Staging</option>
                  <option value="development">Development</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.secondary, display: "block", marginBottom: 6 }}>
                  KOSTNAD (USD/MO)
                </label>
                <input
                  type="number"
                  value={monthlyCost}
                  onChange={(e) => setMonthlyCost(e.target.value)}
                  style={inputStyle}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Credentials */}
            <div style={{ borderTop: `0.5px solid ${C.border}`, paddingTop: 16, marginTop: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.secondary, marginBottom: 12 }}>
                CREDENTIALS
              </div>
              {selected.fields.map((field) => (
                <div key={field} style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 4 }}>
                    {fieldLabel(field)}
                  </label>
                  <input
                    type={field.includes("secret") || field.includes("password") || field.includes("token") || field.includes("key") ? "password" : "text"}
                    value={formData[field] || ""}
                    onChange={(e) => setFormData((f) => ({ ...f, [field]: e.target.value }))}
                    style={inputStyle}
                    placeholder={fieldLabel(field)}
                  />
                </div>
              ))}
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.secondary, display: "block", marginBottom: 6 }}>
                ANTECKNINGAR (VALFRITT)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ ...inputStyle, height: 72, resize: "vertical", lineHeight: 1.5 }}
                placeholder="Vem äger detta konto? Vilken funktion?"
              />
            </div>

            {selected.docs && (
              <a
                href={selected.docs}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 13, color: C.blue, textDecoration: "none" }}
              >
                📄 Dokumentation →
              </a>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                onClick={() => setSelected(null)}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 10,
                  border: `1px solid ${C.border}`, background: C.surface,
                  fontSize: 15, cursor: "pointer", fontWeight: 500, color: C.text,
                }}
              >
                Avbryt
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !displayName}
                style={{
                  flex: 2, padding: "11px 0", borderRadius: 10,
                  border: "none",
                  background: saving || !displayName ? C.tertiary : C.blue,
                  color: "#fff", fontSize: 15, cursor: saving ? "wait" : "pointer",
                  fontWeight: 600,
                }}
              >
                {saving ? "Sparar..." : "Spara integration"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {saved && (
        <div style={{
          background: C.green + "15", border: `1px solid ${C.green}`,
          borderRadius: 10, padding: "10px 16px", marginBottom: 16,
          color: C.green, fontSize: 13, fontWeight: 500,
        }}>
          ✅ Integration sparad!
        </div>
      )}

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 20 }}>
        <span style={{
          position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
          color: C.secondary, fontSize: 16,
        }}>🔍</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Sök tjänst (ex. Stripe, OpenAI, Vercel...)"
          style={{ ...inputStyle, paddingLeft: 36 }}
        />
      </div>

      {/* Grouped service grid */}
      {orderedGroups.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: C.secondary }}>Inga tjänster hittades</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {orderedGroups.map(([cat, services]) => (
            <div key={cat}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.secondary, letterSpacing: 0.8, marginBottom: 10, textTransform: "uppercase" }}>
                {CATEGORY_LABELS[cat] || cat}
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: 8,
              }}>
                {services.map((svc) => (
                  <button
                    key={svc.id}
                    onClick={() => selectService(svc)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 12px", borderRadius: 10,
                      border: `0.5px solid ${C.border}`, background: C.surface,
                      cursor: "pointer", textAlign: "left",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = shadowMd;
                      (e.currentTarget as HTMLButtonElement).style.borderColor = svc.color;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = C.border;
                    }}
                  >
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{SERVICE_ICONS[svc.id] || "🔧"}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.2, color: C.text }}>
                      {svc.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  padding: "9px 12px", borderRadius: 8,
  border: `1px solid ${C.border}`, background: C.bg,
  fontSize: 14, color: C.text, outline: "none",
  fontFamily: "inherit",
};

// ─── Configure modal ───────────────────────────────────────────────────────────
function ConfigureModal({
  integration, catalog, onClose, onSaved,
}: {
  integration: Integration;
  catalog: CatalogService[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const svc = catalog.find((c) => c.id === integration.service);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [monthlyCost, setMonthlyCost] = useState(integration.monthly_cost_usd?.toString() || "");
  const [notes, setNotes] = useState(integration.notes || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch(`/api/dev-integrations/${integration.id}`, {
        method: "PUT",
        body: JSON.stringify({
          credentials: formData,
          monthly_cost_usd: monthlyCost ? parseFloat(monthlyCost) : undefined,
          notes,
        }),
      });
      onSaved();
      onClose();
    } catch (e: any) {
      alert("Fel: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Ta bort denna integration?")) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/dev-integrations/${integration.id}`, { method: "DELETE" });
      onSaved();
      onClose();
    } catch (e: any) {
      alert("Fel: " + e.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, padding: 20,
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.surface, borderRadius: 20, padding: 24,
          width: "100%", maxWidth: 520, maxHeight: "85vh",
          overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <span style={{ fontSize: 28 }}>{SERVICE_ICONS[integration.service] || "🔧"}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17 }}>{integration.display_name}</div>
            <div style={{ fontSize: 13, color: C.secondary }}>{svc?.name}</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.secondary, display: "block", marginBottom: 4 }}>KOSTNAD (USD/MO)</label>
            <input
              type="number"
              value={monthlyCost}
              onChange={(e) => setMonthlyCost(e.target.value)}
              style={inputStyle}
              placeholder="0"
            />
          </div>

          {svc?.fields.map((field) => (
            <div key={field}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.secondary, display: "block", marginBottom: 4 }}>
                {fieldLabel(field).toUpperCase()}
              </label>
              <input
                type="password"
                value={formData[field] || ""}
                onChange={(e) => setFormData((f) => ({ ...f, [field]: e.target.value }))}
                style={inputStyle}
                placeholder={`Befintligt värde dolt — fyll i för att uppdatera`}
              />
            </div>
          ))}

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.secondary, display: "block", marginBottom: 4 }}>ANTECKNINGAR</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ ...inputStyle, height: 60, resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                padding: "10px 16px", borderRadius: 10,
                border: `1px solid ${C.red}`, background: "transparent",
                color: C.red, fontSize: 14, cursor: "pointer", fontWeight: 500,
              }}
            >
              {deleting ? "..." : "Ta bort"}
            </button>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: "10px 0", borderRadius: 10,
                border: `1px solid ${C.border}`, background: C.surface,
                fontSize: 14, cursor: "pointer", fontWeight: 500, color: C.text,
              }}
            >
              Avbryt
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 2, padding: "10px 0", borderRadius: 10,
                border: "none", background: C.blue,
                color: "#fff", fontSize: 14, cursor: "pointer", fontWeight: 600,
              }}
            >
              {saving ? "Sparar..." : "Spara"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main DevOpsHub ────────────────────────────────────────────────────────────
export default function DevOpsHub() {
  const [tab, setTab] = useState<"integrations" | "secrets" | "costs" | "add">("integrations");
  const [catalog, setCatalog] = useState<CatalogService[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [configuring, setConfiguring] = useState<Integration | null>(null);

  const orgId = ORG_ID;

  const loadCatalog = useCallback(async () => {
    try {
      const d = await apiFetch("/api/dev-catalog");
      setCatalog(d.services || []);
    } catch {
      // fallback: empty
    }
  }, []);

  const loadIntegrations = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiFetch("/api/dev-integrations");
      setIntegrations(d.integrations || []);
    } catch {
      setIntegrations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
    loadIntegrations();
  }, [loadCatalog, loadIntegrations]);

  const tabs = [
    { id: "integrations" as const, label: "🔌 Integrationer" },
    { id: "secrets" as const, label: "🔐 Secrets" },
    { id: "costs" as const, label: "💸 Kostnader" },
    { id: "add" as const, label: "+ Lägg till" },
  ];

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', Helvetica Neue, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>
          Dev Infrastructure
        </h1>
        <p style={{ fontSize: 14, color: C.secondary, margin: "6px 0 0" }}>
          {catalog.length} tjänster i katalogen · {integrations.length} aktiva integrationer
        </p>
      </div>

      {/* Tab bar */}
      <div style={{
        display: "flex", gap: 2,
        background: C.border + "40", borderRadius: 10, padding: 3,
        marginBottom: 24, overflowX: "auto", scrollbarWidth: "none",
      }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: "1 0 auto", padding: "8px 16px", borderRadius: 8,
              border: "none",
              background: tab === t.id ? C.surface : "transparent",
              color: tab === t.id ? C.text : C.secondary,
              fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
              cursor: "pointer",
              boxShadow: tab === t.id ? shadow : "none",
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "integrations" && (
        <IntegrationsTab
          integrations={integrations}
          catalog={catalog}
          loading={loading}
          onRefresh={loadIntegrations}
          onConfigure={setConfiguring}
        />
      )}
      {tab === "secrets" && <SecretsVaultTab orgId={orgId} />}
      {tab === "costs" && <CostsTab integrations={integrations} catalog={catalog} />}
      {tab === "add" && (
        <AddIntegrationTab
          catalog={catalog}
          onAdded={() => {
            loadIntegrations();
            setTab("integrations");
          }}
        />
      )}

      {/* Configure modal */}
      {configuring && (
        <ConfigureModal
          integration={configuring}
          catalog={catalog}
          onClose={() => setConfiguring(null)}
          onSaved={loadIntegrations}
        />
      )}
    </div>
  );
}
