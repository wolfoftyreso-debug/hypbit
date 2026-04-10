import type { Notification, Severity } from "../types";

const SEVERITY_COLORS: Record<Severity, { bg: string; text: string; border: string; label: string }> = {
  CRITICAL: { bg: "#7f1d1d", text: "#fecaca", border: "#b91c1c", label: "CRITICAL" },
  IMPORTANT: { bg: "#78350f", text: "#fde68a", border: "#b45309", label: "IMPORTANT" },
  INFO: { bg: "#1e293b", text: "#94a3b8", border: "#334155", label: "INFO" },
};

export function LiveFeedPanel({
  notifications,
  onSelect,
}: {
  notifications: Notification[];
  onSelect: (n: Notification) => void;
}) {
  return (
    <aside
      style={{
        width: 360,
        background: "#0b1220",
        color: "#e2e8f0",
        borderLeft: "1px solid #1f2937",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid #1f2937",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: 11, letterSpacing: 1, color: "#64748b" }}>LIVE INTELLIGENCE</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Feed</div>
        </div>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#10b981",
            boxShadow: "0 0 10px #10b981",
          }}
          title="SSE connected"
        />
      </div>

      <div style={{ overflowY: "auto", flex: 1 }}>
        {notifications.length === 0 ? (
          <div style={{ padding: 20, color: "#64748b", fontSize: 13 }}>Waiting for events…</div>
        ) : (
          notifications.map((n) => {
            const c = SEVERITY_COLORS[n.severity];
            return (
              <button
                key={n.id}
                onClick={() => onSelect(n)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  borderBottom: "1px solid #1f2937",
                  background: "transparent",
                  color: "inherit",
                  padding: "12px 16px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span
                    style={{
                      fontSize: 9,
                      padding: "2px 6px",
                      borderRadius: 999,
                      background: c.bg,
                      color: c.text,
                      border: `1px solid ${c.border}`,
                      letterSpacing: 1,
                    }}
                  >
                    {c.label}
                  </span>
                  <span style={{ fontSize: 10, color: "#64748b" }}>
                    {n.kind === "ACTION" ? "ACTION" : "ALERT"}
                  </span>
                  <span style={{ fontSize: 10, color: "#475569", marginLeft: "auto" }}>
                    {new Date(n.ts).toLocaleTimeString()}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{n.title}</div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#94a3b8",
                    marginTop: 4,
                    lineHeight: 1.4,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {n.body}
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
