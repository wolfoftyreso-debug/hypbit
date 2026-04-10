import type { Notification } from "../types";

export function ImpactPanel({
  notification,
  onClose,
}: {
  notification: Notification;
  onClose: () => void;
}) {
  const alert = notification.alert ?? notification.action?.alert_id;
  const event = notification.alert?.event ?? null;
  const action = notification.action;

  return (
    <aside
      style={{
        position: "absolute",
        left: 24,
        bottom: 24,
        width: 520,
        maxHeight: "calc(100% - 48px)",
        background: "#0b1220",
        color: "#f1f5f9",
        border: "1px solid #1f2937",
        borderRadius: 12,
        padding: 24,
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        overflowY: "auto",
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          background: "transparent",
          border: "none",
          color: "#94a3b8",
          fontSize: 22,
          cursor: "pointer",
        }}
        aria-label="Close"
      >
        ×
      </button>

      <div style={{ fontSize: 10, letterSpacing: 1.5, color: "#64748b", marginBottom: 4 }}>
        WHAT HAPPENED
      </div>
      <h2 style={{ margin: 0, fontSize: 18, lineHeight: 1.25 }}>{notification.title}</h2>
      {event?.url && (
        <a
          href={event.url}
          target="_blank"
          rel="noreferrer"
          style={{ color: "#60a5fa", fontSize: 11, display: "inline-block", marginTop: 4 }}
        >
          source →
        </a>
      )}

      {event && (
        <>
          <div style={{ fontSize: 10, letterSpacing: 1.5, color: "#64748b", marginTop: 20, marginBottom: 4 }}>
            WHY IT MATTERS
          </div>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "#cbd5e1" }}>
            {event.enrichment.summary}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 16 }}>
            <Metric label="Relevance" value={event.enrichment.relevance_score} />
            <Chip label="Risk" value={event.enrichment.risk} />
            <Chip label="Opportunity" value={event.enrichment.opportunity} />
          </div>
        </>
      )}

      <div style={{ fontSize: 10, letterSpacing: 1.5, color: "#64748b", marginTop: 20, marginBottom: 4 }}>
        WHAT TO DO
      </div>
      {action ? (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{action.title}</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{action.description}</div>
          {action.path.length > 0 && (
            <div
              style={{
                marginTop: 10,
                padding: 10,
                background: "#111827",
                borderRadius: 6,
                fontSize: 11,
                color: "#cbd5e1",
                fontFamily: "ui-monospace, monospace",
              }}
            >
              path: {action.path.join(" → ")}
            </div>
          )}
        </div>
      ) : event ? (
        <ul style={{ margin: 0, paddingLeft: 18, color: "#cbd5e1", fontSize: 13, lineHeight: 1.6 }}>
          {event.enrichment.recommended_actions.length === 0 ? (
            <li style={{ color: "#64748b" }}>(no actions suggested)</li>
          ) : (
            event.enrichment.recommended_actions.map((a, i) => <li key={i}>{a}</li>)
          )}
        </ul>
      ) : null}

      {notification.alert && (
        <div style={{ marginTop: 18, fontSize: 10, color: "#475569", letterSpacing: 0.5 }}>
          matched rule: <strong>{notification.alert.rule_name}</strong> · score{" "}
          {notification.alert.alert_score}
        </div>
      )}
    </aside>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: "#111827", borderRadius: 8, padding: "10px 12px" }}>
      <div style={{ color: "#64748b", fontSize: 9, letterSpacing: 1, textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 600, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: "LOW" | "MEDIUM" | "HIGH" }) {
  const colors = {
    LOW: { bg: "#1e293b", text: "#94a3b8" },
    MEDIUM: { bg: "#78350f", text: "#fde68a" },
    HIGH: { bg: "#7f1d1d", text: "#fecaca" },
  }[value];
  return (
    <div style={{ background: "#111827", borderRadius: 8, padding: "10px 12px" }}>
      <div style={{ color: "#64748b", fontSize: 9, letterSpacing: 1, textTransform: "uppercase" }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          marginTop: 4,
          display: "inline-block",
          padding: "2px 8px",
          borderRadius: 999,
          background: colors.bg,
          color: colors.text,
          letterSpacing: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}
