import { Badge } from "./ui/index.js";
import type { Notification } from "../types";

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
        width: "var(--rail-width)",
        background: "var(--color-bg-elevated)",
        borderLeft: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <div
        style={{
          padding: "14px var(--space-4)",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            className="wg-section-label"
            style={{ marginBottom: 0 }}
          >
            Live intelligence
          </div>
          <div style={{ fontSize: "var(--text-md)", fontWeight: 600 }}>Feed</div>
        </div>
        <span className="wg-live-dot" title="SSE connected" />
      </div>

      <div style={{ overflowY: "auto", flex: 1 }}>
        {notifications.length === 0 ? (
          <div
            style={{
              padding: "var(--space-5)",
              color: "var(--color-text-muted)",
              fontSize: "var(--text-base)",
            }}
          >
            Waiting for events…
          </div>
        ) : (
          notifications.map((n) => (
            <button key={n.id} onClick={() => onSelect(n)} className="wg-feed-item">
              <div className="wg-feed-item__head">
                <Badge severity={n.severity}>{n.severity}</Badge>
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-subtle)",
                    letterSpacing: "var(--tracking-wider)",
                    textTransform: "uppercase",
                  }}
                >
                  {n.kind}
                </span>
                <span className="wg-feed-item__time">
                  {new Date(n.ts).toLocaleTimeString()}
                </span>
              </div>
              <div className="wg-feed-item__title">{n.title}</div>
              <div className="wg-feed-item__body">{n.body}</div>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
