import { useState, useEffect, useCallback } from "react";
import { apiClient } from "./useApi";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Audit {
  id: string;
  org_id: string;
  audit_type: string;
  certification_body: string | null;
  certification_standard: string | null;
  auditor_name: string | null;
  auditor_company: string | null;
  scheduled_date: string | null;
  actual_date: string | null;
  scope: string | null;
  location: string | null;
  status: string;
  result: string | null;
  certificate_number: string | null;
  certificate_valid_until: string | null;
  findings: any[];
  corrective_actions: any[];
  report_url: string | null;
  next_audit_date: string | null;
  is_spot_check: boolean;
  spot_check_trigger: string | null;
  created_at: string;
}

interface Certification {
  id: string;
  org_id: string;
  standard: string;
  certification_body: string | null;
  certificate_number: string | null;
  scope: string | null;
  issued_date: string | null;
  valid_until: string;
  status: string;
  certificate_document_url: string | null;
  surveillance_interval_months: number;
  next_surveillance_date: string | null;
  days_until_expiry: number;
  expiry_urgency: "OK" | "WARNING" | "CRITICAL" | "EXPIRED";
}

interface CertificationBody {
  id: string;
  name: string;
  logo: string;
  specialty: string[];
}

// ---------------------------------------------------------------------------
// Colour palette (consistent with rest of app)
// ---------------------------------------------------------------------------
const C = {
  bg: "#F2F2F7",
  card: "#FFFFFF",
  border: "#E5E5EA",
  text: "#1C1C1E",
  sub: "#8E8E93",
  blue: "#007AFF",
  green: "#34C759",
  orange: "#FF9500",
  red: "#FF3B30",
  inset: "rgba(60,60,67,0.06)",
};

const AUDIT_TYPE_LABELS: Record<string, string> = {
  ISO_CERTIFICATION: "ISO Certifiering",
  ISO_SURVEILLANCE: "ISO Övervakningsrevision",
  ISO_RECERTIFICATION: "ISO Omcertifiering",
  TUV_INSPECTION: "TÜV Inspektion",
  DEKRA_INSPECTION: "DEKRA Besiktning",
  SGS_AUDIT: "SGS Revision",
  DNV_AUDIT: "DNV Revision",
  SWEDAC_ACCREDITATION: "Swedac Ackreditering",
  INTERNAL_SPOT_CHECK: "Internt Stickprov",
  CUSTOMER_AUDIT: "Kundrevision",
  OEM_AUDIT: "OEM Revision",
  OTHER: "Övrigt",
};

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: C.blue,
  IN_PROGRESS: C.orange,
  COMPLETED: C.green,
  CANCELLED: C.sub,
  PENDING_REPORT: C.orange,
};

const RESULT_COLORS: Record<string, string> = {
  PASSED: C.green,
  PASSED_WITH_OBSERVATIONS: C.orange,
  FAILED: C.red,
  CONDITIONAL: C.orange,
};

const RESULT_LABELS: Record<string, string> = {
  PASSED: "Godkänd",
  PASSED_WITH_OBSERVATIONS: "Godkänd med anmärkningar",
  FAILED: "Underkänd",
  CONDITIONAL: "Villkorad",
};

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("sv-SE");
}

function urgencyColor(u: string): string {
  if (u === "EXPIRED") return C.red;
  if (u === "CRITICAL") return C.red;
  if (u === "WARNING") return C.orange;
  return C.green;
}

function urgencyLabel(days: number): string {
  if (days < 0) return `Utgått för ${Math.abs(days)} dagar sedan`;
  if (days === 0) return "Utgår idag!";
  return `${days} dagar kvar`;
}

// ---------------------------------------------------------------------------
// Modal component
// ---------------------------------------------------------------------------
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{
        background: C.card, borderRadius: 16, padding: 28, maxWidth: 640, width: "100%",
        maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text }}>{title}</h2>
          <button onClick={onClose} style={{
            background: C.inset, border: "none", borderRadius: 8, padding: "6px 12px",
            cursor: "pointer", fontSize: 13, color: C.sub,
          }}>Stäng</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Schedule Audit Modal
// ---------------------------------------------------------------------------
function ScheduleAuditModal({
  orgId, bodies, standards, onClose, onSaved,
}: {
  orgId: string;
  bodies: CertificationBody[];
  standards: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    audit_type: "ISO_CERTIFICATION",
    certification_body: "",
    certification_standard: "",
    auditor_name: "",
    auditor_company: "",
    scheduled_date: new Date().toISOString().split("T")[0],
    scope: "",
    location: "",
    next_audit_date: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await apiClient.post(`/api/external-audits?org_id=${orgId}`, form);
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const inp = (label: string, field: keyof typeof form, type = "text") => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 4 }}>{label}</label>
      <input
        type={type}
        value={form[field] as string}
        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        style={{
          width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`,
          fontSize: 14, color: C.text, background: C.bg, boxSizing: "border-box",
        }}
      />
    </div>
  );

  return (
    <Modal title="Schemalägg ny revision" onClose={onClose}>
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 4 }}>Revisionstyp</label>
        <select value={form.audit_type} onChange={e => setForm(f => ({ ...f, audit_type: e.target.value }))}
          style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, background: C.bg }}>
          {Object.entries(AUDIT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 4 }}>Certifieringsorgan</label>
        <select value={form.certification_body} onChange={e => setForm(f => ({ ...f, certification_body: e.target.value }))}
          style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, background: C.bg }}>
          <option value="">— välj —</option>
          {bodies.map(b => <option key={b.id} value={b.name}>{b.logo} {b.name}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 4 }}>Standard</label>
        <select value={form.certification_standard} onChange={e => setForm(f => ({ ...f, certification_standard: e.target.value }))}
          style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, background: C.bg }}>
          <option value="">— välj —</option>
          {standards.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {inp("Revisors namn", "auditor_name")}
      {inp("Revisionsbolag", "auditor_company")}
      {inp("Datum", "scheduled_date", "date")}
      {inp("Plats", "location")}
      {inp("Scope / vad granskas", "scope")}
      {inp("Nästa revisionsdatum", "next_audit_date", "date")}
      {error && <p style={{ color: C.red, fontSize: 13 }}>{error}</p>}
      <button onClick={save} disabled={saving} style={{
        background: C.blue, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px",
        fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%",
      }}>
        {saving ? "Sparar…" : "Schemalägg revision"}
      </button>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Complete Audit Modal
// ---------------------------------------------------------------------------
function CompleteAuditModal({
  audit, onClose, onSaved,
}: {
  audit: Audit;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    result: "PASSED",
    actual_date: new Date().toISOString().split("T")[0],
    certificate_number: audit.certificate_number ?? "",
    certificate_valid_until: audit.certificate_valid_until ?? "",
    next_audit_date: audit.next_audit_date ?? "",
    report_url: audit.report_url ?? "",
    findings_text: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const findings = form.findings_text
        ? form.findings_text.split("\n").filter(Boolean).map(line => ({
            type: "OBSERVATION",
            description: line,
            reference: "",
          }))
        : [];
      await apiClient.patch(`/api/external-audits/${audit.id}/complete`, {
        result: form.result,
        actual_date: form.actual_date,
        certificate_number: form.certificate_number || null,
        certificate_valid_until: form.certificate_valid_until || null,
        next_audit_date: form.next_audit_date || null,
        report_url: form.report_url || null,
        findings,
      });
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Slutför revision" onClose={onClose}>
      <p style={{ color: C.sub, fontSize: 13, marginTop: 0 }}>
        {AUDIT_TYPE_LABELS[audit.audit_type] ?? audit.audit_type} · {audit.certification_body ?? ""}
      </p>
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 4 }}>Resultat</label>
        <select value={form.result} onChange={e => setForm(f => ({ ...f, result: e.target.value }))}
          style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, background: C.bg }}>
          <option value="PASSED">✅ Godkänd</option>
          <option value="PASSED_WITH_OBSERVATIONS">⚠️ Godkänd med anmärkningar</option>
          <option value="CONDITIONAL">🔶 Villkorad</option>
          <option value="FAILED">❌ Underkänd</option>
        </select>
      </div>
      {[
        ["Faktiskt datum", "actual_date", "date"],
        ["Certifikatnummer", "certificate_number", "text"],
        ["Certifikat giltigt t.o.m.", "certificate_valid_until", "date"],
        ["Nästa revisionsdatum", "next_audit_date", "date"],
        ["Rapport-URL", "report_url", "url"],
      ].map(([label, field, type]) => (
        <div key={field} style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 4 }}>{label}</label>
          <input type={type} value={(form as any)[field]}
            onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, background: C.bg, boxSizing: "border-box" }}
          />
        </div>
      ))}
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 4 }}>Findings / anmärkningar (en per rad)</label>
        <textarea value={form.findings_text}
          onChange={e => setForm(f => ({ ...f, findings_text: e.target.value }))}
          rows={4}
          style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, background: C.bg, boxSizing: "border-box", resize: "vertical" }}
          placeholder="T.ex. Dokumentation saknas för process X..."
        />
      </div>
      {error && <p style={{ color: C.red, fontSize: 13 }}>{error}</p>}
      <button onClick={save} disabled={saving} style={{
        background: C.green, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px",
        fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%",
      }}>
        {saving ? "Sparar…" : "Slutför revision"}
      </button>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Register Certificate Modal
// ---------------------------------------------------------------------------
function RegisterCertModal({
  orgId, bodies, standards, onClose, onSaved,
}: {
  orgId: string;
  bodies: CertificationBody[];
  standards: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    standard: "",
    certification_body: "",
    certificate_number: "",
    scope: "",
    issued_date: "",
    valid_until: "",
    surveillance_interval_months: "12",
    next_surveillance_date: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!form.standard || !form.valid_until) { setError("Standard och giltighetstid krävs"); return; }
    setSaving(true);
    try {
      await apiClient.post(`/api/certifications?org_id=${orgId}`, {
        ...form,
        surveillance_interval_months: parseInt(form.surveillance_interval_months),
      });
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Registrera certifikat" onClose={onClose}>
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 4 }}>Standard *</label>
        <select value={form.standard} onChange={e => setForm(f => ({ ...f, standard: e.target.value }))}
          style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, background: C.bg }}>
          <option value="">— välj standard —</option>
          {standards.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 4 }}>Certifieringsorgan</label>
        <select value={form.certification_body} onChange={e => setForm(f => ({ ...f, certification_body: e.target.value }))}
          style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, background: C.bg }}>
          <option value="">— välj —</option>
          {bodies.map(b => <option key={b.id} value={b.name}>{b.logo} {b.name}</option>)}
        </select>
      </div>
      {[
        ["Certifikatnummer", "certificate_number", "text"],
        ["Scope", "scope", "text"],
        ["Utfärdningsdatum", "issued_date", "date"],
        ["Giltigt t.o.m. *", "valid_until", "date"],
        ["Nästa övervakningsrevision", "next_surveillance_date", "date"],
        ["Övervakningsintervall (månader)", "surveillance_interval_months", "number"],
      ].map(([label, field, type]) => (
        <div key={field} style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 4 }}>{label}</label>
          <input type={type} value={(form as any)[field]}
            onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, background: C.bg, boxSizing: "border-box" }}
          />
        </div>
      ))}
      {error && <p style={{ color: C.red, fontSize: 13 }}>{error}</p>}
      <button onClick={save} disabled={saving} style={{
        background: C.blue, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px",
        fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%",
      }}>
        {saving ? "Sparar…" : "Registrera certifikat"}
      </button>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Audit Detail Panel
// ---------------------------------------------------------------------------
function AuditDetailPanel({ audit, onClose, onComplete, orgId }: {
  audit: Audit;
  orgId: string;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [showComplete, setShowComplete] = useState(false);

  return (
    <>
      <Modal title={AUDIT_TYPE_LABELS[audit.audit_type] ?? audit.audit_type} onClose={onClose}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {[
            ["Certifieringsorgan", audit.certification_body ?? "—"],
            ["Standard", audit.certification_standard ?? "—"],
            ["Revisor", audit.auditor_name ?? "—"],
            ["Revisionsbolag", audit.auditor_company ?? "—"],
            ["Planerat datum", formatDate(audit.scheduled_date)],
            ["Faktiskt datum", formatDate(audit.actual_date)],
            ["Plats", audit.location ?? "—"],
            ["Status", audit.status],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
              <div style={{ fontSize: 14, color: C.text, marginTop: 2 }}>{value}</div>
            </div>
          ))}
        </div>
        {audit.scope && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.05em" }}>Scope</div>
            <div style={{ fontSize: 14, color: C.text, marginTop: 4 }}>{audit.scope}</div>
          </div>
        )}
        {audit.result && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Resultat</div>
            <span style={{
              background: `${RESULT_COLORS[audit.result]}20`,
              color: RESULT_COLORS[audit.result],
              borderRadius: 8, padding: "4px 12px", fontSize: 13, fontWeight: 600,
            }}>{RESULT_LABELS[audit.result] ?? audit.result}</span>
          </div>
        )}
        {audit.findings && audit.findings.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
              Findings ({audit.findings.length})
            </div>
            {audit.findings.map((f: any, i: number) => (
              <div key={i} style={{
                background: C.bg, borderRadius: 8, padding: "10px 14px", marginBottom: 8,
                borderLeft: `3px solid ${f.type === "NC" ? C.red : f.type === "OBSERVATION" ? C.orange : C.blue}`,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, marginBottom: 4 }}>{f.type ?? "OBSERVATION"}</div>
                <div style={{ fontSize: 13, color: C.text }}>{f.description}</div>
              </div>
            ))}
          </div>
        )}
        {audit.certificate_number && (
          <div style={{ background: `${C.green}15`, borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.green }}>🏅 CERTIFIKAT</div>
            <div style={{ fontSize: 14, color: C.text, marginTop: 4 }}>Nr: {audit.certificate_number}</div>
            <div style={{ fontSize: 13, color: C.sub }}>Giltigt t.o.m. {formatDate(audit.certificate_valid_until)}</div>
          </div>
        )}
        {audit.status !== "COMPLETED" && audit.status !== "CANCELLED" && (
          <button onClick={() => setShowComplete(true)} style={{
            background: C.green, color: "#fff", border: "none", borderRadius: 10,
            padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%",
          }}>
            Slutför revision
          </button>
        )}
      </Modal>
      {showComplete && (
        <CompleteAuditModal
          audit={audit}
          onClose={() => setShowComplete(false)}
          onSaved={onComplete}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function ExternalAuditModule({ orgId }: { orgId?: string }) {
  const [view, setView] = useState<"dashboard" | "calendar" | "registry">("dashboard");
  const [audits, setAudits] = useState<Audit[]>([]);
  const [certs, setCerts] = useState<Certification[]>([]);
  const [expiring, setExpiring] = useState<Certification[]>([]);
  const [bodies, setBodies] = useState<CertificationBody[]>([]);
  const [standards, setStandards] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showRegisterCert, setShowRegisterCert] = useState(false);
  const [spotChecking, setSpotChecking] = useState(false);
  const [filterStandard, setFilterStandard] = useState("");
  const [filterBody, setFilterBody] = useState("");

  const oid = orgId ?? "00000000-0000-0000-0000-000000000000";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, c, e, b] = await Promise.all([
        apiClient.get<{ audits: Audit[] }>(`/api/external-audits?org_id=${oid}`),
        apiClient.get<{ certifications: Certification[] }>(`/api/certifications?org_id=${oid}`),
        apiClient.get<{ expiring: Certification[] }>(`/api/external-audits/expiring-certs?org_id=${oid}`),
        apiClient.get<{ bodies: CertificationBody[]; standards: string[] }>("/api/external-audits/certification-bodies"),
      ]);
      setAudits(a.audits ?? []);
      setCerts(c.certifications ?? []);
      setExpiring(e.expiring ?? []);
      setBodies(b.bodies ?? []);
      setStandards(b.standards ?? []);
    } catch { /* silently fail — API may not be up in preview */ }
    setLoading(false);
  }, [oid]);

  useEffect(() => { load(); }, [load]);

  const createSpotCheck = async () => {
    setSpotChecking(true);
    try {
      await apiClient.post(`/api/external-audits/spot-check?org_id=${oid}`, { trigger: "random" });
      await load();
    } catch { /* ignore */ }
    setSpotChecking(false);
  };

  const filteredCerts = certs.filter(c =>
    (!filterStandard || c.standard === filterStandard) &&
    (!filterBody || c.certification_body === filterBody)
  );

  const upcoming = audits
    .filter(a => a.status === "SCHEDULED" || a.status === "IN_PROGRESS")
    .sort((a, b) => (a.scheduled_date ?? "").localeCompare(b.scheduled_date ?? ""));

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: C.text }}>Revisioner & Certifikat</h1>
          <p style={{ margin: "4px 0 0", color: C.sub, fontSize: 14 }}>
            DEKRA · TÜV · SGS · DNV · ISO-certifikat · Interna stickprov
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={createSpotCheck} disabled={spotChecking} style={{
            background: C.inset, border: `1px solid ${C.border}`, borderRadius: 10,
            padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: C.text,
          }}>
            {spotChecking ? "Slumpar…" : "🎲 Stickprov"}
          </button>
          <button onClick={() => setShowRegisterCert(true)} style={{
            background: C.inset, border: `1px solid ${C.border}`, borderRadius: 10,
            padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: C.text,
          }}>
            + Certifikat
          </button>
          <button onClick={() => setShowSchedule(true)} style={{
            background: C.blue, color: "#fff", border: "none", borderRadius: 10,
            padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            + Schemalägg revision
          </button>
        </div>
      </div>

      {/* Expiry Alerts */}
      {expiring.length > 0 && (
        <div style={{
          background: `${C.red}12`, border: `1px solid ${C.red}30`, borderRadius: 12,
          padding: "14px 18px", marginBottom: 20,
          display: "flex", alignItems: "flex-start", gap: 12,
        }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 700, color: C.red, fontSize: 14 }}>
              {expiring.length} certifikat förfaller inom 90 dagar
            </div>
            <div style={{ color: C.text, fontSize: 13, marginTop: 4 }}>
              {expiring.slice(0, 3).map(e => `${e.standard} (${formatDate(e.valid_until)})`).join(" · ")}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: C.inset, borderRadius: 12, padding: 4 }}>
        {[
          { key: "dashboard", label: "📊 Certifikat-dashboard" },
          { key: "calendar", label: "📅 Revisionskalender" },
          { key: "registry", label: "🏅 Certifikatsregister" },
        ].map(t => (
          <button key={t.key} onClick={() => setView(t.key as any)} style={{
            flex: 1, padding: "8px 16px", borderRadius: 10, border: "none",
            background: view === t.key ? C.card : "transparent",
            fontWeight: view === t.key ? 700 : 400,
            color: view === t.key ? C.text : C.sub,
            cursor: "pointer", fontSize: 13,
            boxShadow: view === t.key ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: C.sub }}>Laddar…</div>
      ) : (
        <>
          {/* ─── VY 1: Dashboard ─── */}
          {view === "dashboard" && (
            <div>
              {/* Stats row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
                {[
                  { label: "Aktiva certifikat", value: certs.filter(c => c.status === "ACTIVE").length, color: C.green },
                  { label: "Kommande revisioner", value: upcoming.length, color: C.blue },
                  { label: "Förfaller inom 90 dagar", value: expiring.length, color: expiring.length > 0 ? C.red : C.sub },
                  { label: "Avslutade revisioner", value: audits.filter(a => a.status === "COMPLETED").length, color: C.sub },
                ].map(s => (
                  <div key={s.label} style={{
                    background: C.card, borderRadius: 14, padding: "18px 20px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Active Certs */}
              <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 14 }}>Aktiva certifikat</h2>
              {certs.filter(c => c.status === "ACTIVE").length === 0 ? (
                <div style={{ background: C.card, borderRadius: 14, padding: 40, textAlign: "center", color: C.sub }}>
                  Inga aktiva certifikat — registrera ditt första certifikat →
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14, marginBottom: 28 }}>
                  {certs.filter(c => c.status === "ACTIVE").map(cert => (
                    <div key={cert.id} style={{
                      background: C.card, borderRadius: 14, padding: "18px 20px",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                      borderLeft: `4px solid ${urgencyColor(cert.expiry_urgency)}`,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{cert.standard}</div>
                        <span style={{
                          background: `${urgencyColor(cert.expiry_urgency)}20`,
                          color: urgencyColor(cert.expiry_urgency),
                          borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700,
                        }}>
                          {urgencyLabel(cert.days_until_expiry)}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: C.sub, marginTop: 6 }}>{cert.certification_body ?? "—"}</div>
                      {cert.certificate_number && (
                        <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>Nr: {cert.certificate_number}</div>
                      )}
                      <div style={{ fontSize: 13, color: C.text, marginTop: 10, fontWeight: 600 }}>
                        Giltigt t.o.m. {formatDate(cert.valid_until)}
                      </div>
                      {cert.scope && (
                        <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>{cert.scope}</div>
                      )}
                      {cert.next_surveillance_date && (
                        <div style={{ fontSize: 12, color: C.blue, marginTop: 8 }}>
                          📅 Nästa övervakningsrevision: {formatDate(cert.next_surveillance_date)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upcoming timeline */}
              {upcoming.length > 0 && (
                <>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 14 }}>Kommande revisioner</h2>
                  <div style={{ background: C.card, borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                    {upcoming.slice(0, 5).map((audit, i) => (
                      <div key={audit.id} onClick={() => setSelectedAudit(audit)} style={{
                        display: "flex", alignItems: "center", gap: 16, padding: "14px 20px",
                        borderBottom: i < upcoming.length - 1 ? `1px solid ${C.border}` : "none",
                        cursor: "pointer",
                      }}
                        onMouseEnter={e => (e.currentTarget.style.background = C.bg)}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <div style={{ fontSize: 24 }}>{
                          bodies.find(b => b.name === audit.certification_body)?.logo ?? "📋"
                        }</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>
                            {AUDIT_TYPE_LABELS[audit.audit_type] ?? audit.audit_type}
                          </div>
                          <div style={{ fontSize: 13, color: C.sub }}>
                            {audit.certification_body ?? "Intern"} · {audit.certification_standard ?? ""}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{formatDate(audit.scheduled_date)}</div>
                          <span style={{
                            background: `${STATUS_COLORS[audit.status]}20`,
                            color: STATUS_COLORS[audit.status],
                            borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700,
                          }}>{audit.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ─── VY 2: Revisionskalender ─── */}
          {view === "calendar" && (
            <div>
              <div style={{ background: C.card, borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                {audits.length === 0 ? (
                  <div style={{ padding: 60, textAlign: "center", color: C.sub }}>
                    Inga revisioner schemalagda — klicka "Schemalägg revision" ovan
                  </div>
                ) : (
                  audits.map((audit, i) => (
                    <div key={audit.id} onClick={() => setSelectedAudit(audit)} style={{
                      display: "flex", alignItems: "center", gap: 16, padding: "16px 20px",
                      borderBottom: i < audits.length - 1 ? `1px solid ${C.border}` : "none",
                      cursor: "pointer",
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = C.bg)}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ fontSize: 28 }}>{
                        audit.is_spot_check ? "🎲" :
                        bodies.find(b => b.name === audit.certification_body)?.logo ?? "📋"
                      }</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>
                          {AUDIT_TYPE_LABELS[audit.audit_type] ?? audit.audit_type}
                          {audit.is_spot_check && <span style={{ color: C.orange, marginLeft: 8, fontSize: 12 }}>STICKPROV</span>}
                        </div>
                        <div style={{ fontSize: 13, color: C.sub }}>
                          {audit.certification_body ?? "Intern"}
                          {audit.certification_standard ? ` · ${audit.certification_standard}` : ""}
                          {audit.scope ? ` · ${audit.scope.slice(0, 60)}` : ""}
                        </div>
                        {audit.findings && audit.findings.length > 0 && (
                          <div style={{ fontSize: 12, color: C.orange, marginTop: 4 }}>
                            {audit.findings.length} finding(s)
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: "right", minWidth: 100 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                          {formatDate(audit.scheduled_date)}
                        </div>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 4 }}>
                          {audit.result && (
                            <span style={{
                              background: `${RESULT_COLORS[audit.result]}20`,
                              color: RESULT_COLORS[audit.result],
                              borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700,
                            }}>{RESULT_LABELS[audit.result]}</span>
                          )}
                          <span style={{
                            background: `${STATUS_COLORS[audit.status]}20`,
                            color: STATUS_COLORS[audit.status],
                            borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700,
                          }}>{audit.status}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ─── VY 3: Certifikatsregister ─── */}
          {view === "registry" && (
            <div>
              {/* Filters */}
              <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
                <select value={filterStandard} onChange={e => setFilterStandard(e.target.value)}
                  style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, background: C.card }}>
                  <option value="">Alla standarder</option>
                  {standards.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={filterBody} onChange={e => setFilterBody(e.target.value)}
                  style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, background: C.card }}>
                  <option value="">Alla certifieringsorgan</option>
                  {bodies.map(b => <option key={b.id} value={b.name}>{b.logo} {b.name}</option>)}
                </select>
                <div style={{ flex: 1 }} />
                <button onClick={() => {
                  const rows = filteredCerts.map(c =>
                    [c.standard, c.certification_body, c.certificate_number, c.valid_until, c.status].join("\t")
                  );
                  const text = ["Standard\tOrgan\tCertifikatnummer\tGiltigt t.o.m.\tStatus", ...rows].join("\n");
                  navigator.clipboard.writeText(text);
                }} style={{
                  background: C.inset, border: `1px solid ${C.border}`, borderRadius: 8,
                  padding: "8px 14px", fontSize: 13, cursor: "pointer", color: C.sub,
                }}>
                  📋 Exportera
                </button>
              </div>

              {filteredCerts.length === 0 ? (
                <div style={{ background: C.card, borderRadius: 14, padding: 60, textAlign: "center", color: C.sub }}>
                  Inga certifikat registrerade
                </div>
              ) : (
                <div style={{ background: C.card, borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  {/* Header */}
                  <div style={{
                    display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr",
                    padding: "10px 20px", borderBottom: `1px solid ${C.border}`,
                    fontSize: 11, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: "0.05em",
                  }}>
                    <div>Standard</div>
                    <div>Certifieringsorgan</div>
                    <div>Certifikatnr</div>
                    <div>Giltigt t.o.m.</div>
                    <div>Status</div>
                  </div>
                  {filteredCerts.map((cert, i) => (
                    <div key={cert.id} style={{
                      display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr",
                      padding: "14px 20px", alignItems: "center",
                      borderBottom: i < filteredCerts.length - 1 ? `1px solid ${C.border}` : "none",
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{cert.standard}</div>
                        {cert.scope && <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{cert.scope.slice(0, 50)}</div>}
                      </div>
                      <div style={{ fontSize: 14, color: C.text }}>
                        {bodies.find(b => b.name === cert.certification_body)?.logo ?? ""} {cert.certification_body ?? "—"}
                      </div>
                      <div style={{ fontSize: 13, color: C.sub, fontFamily: "monospace" }}>
                        {cert.certificate_number ?? "—"}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: urgencyColor(cert.expiry_urgency) }}>
                          {formatDate(cert.valid_until)}
                        </div>
                        <div style={{ fontSize: 12, color: urgencyColor(cert.expiry_urgency) }}>
                          {urgencyLabel(cert.days_until_expiry)}
                        </div>
                      </div>
                      <div>
                        <span style={{
                          background: `${cert.status === "ACTIVE" ? C.green : C.red}20`,
                          color: cert.status === "ACTIVE" ? C.green : C.red,
                          borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 700,
                        }}>{cert.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showSchedule && (
        <ScheduleAuditModal
          orgId={oid}
          bodies={bodies}
          standards={standards}
          onClose={() => setShowSchedule(false)}
          onSaved={load}
        />
      )}
      {showRegisterCert && (
        <RegisterCertModal
          orgId={oid}
          bodies={bodies}
          standards={standards}
          onClose={() => setShowRegisterCert(false)}
          onSaved={load}
        />
      )}
      {selectedAudit && (
        <AuditDetailPanel
          audit={selectedAudit}
          orgId={oid}
          onClose={() => setSelectedAudit(null)}
          onComplete={() => { load(); setSelectedAudit(null); }}
        />
      )}
    </div>
  );
}
