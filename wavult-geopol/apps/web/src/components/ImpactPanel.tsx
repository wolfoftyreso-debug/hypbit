import { Badge, Metric, Panel, SectionLabel } from "./ui/index.js";
import type { Notification } from "../types";

export function ImpactPanel({
  notification,
  onClose,
}: {
  notification: Notification;
  onClose: () => void;
}) {
  const event = notification.alert?.event ?? null;
  const action = notification.action;

  return (
    <Panel
      floating
      onClose={onClose}
      style={{
        left: "var(--space-6)",
        bottom: "var(--space-6)",
        width: "var(--drawer-width)",
        maxHeight: "calc(100% - 48px)",
        overflowY: "auto",
      }}
    >
      <div>
        <SectionLabel>What happened</SectionLabel>
        <h2
          style={{
            margin: 0,
            fontSize: "var(--text-xl)",
            lineHeight: "var(--leading-tight)",
          }}
        >
          {notification.title}
        </h2>
        {event?.url && (
          <a
            href={event.url}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: "var(--text-sm)", display: "inline-block", marginTop: 6 }}
          >
            source →
          </a>
        )}
      </div>

      {event && (
        <>
          <div>
            <SectionLabel>Why it matters</SectionLabel>
            <p
              style={{
                margin: 0,
                fontSize: "var(--text-base)",
                lineHeight: "var(--leading-normal)",
                color: "var(--color-text-secondary)",
              }}
            >
              {event.enrichment.summary}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "var(--space-2)",
            }}
          >
            <Metric label="Relevance" value={event.enrichment.relevance_score} />
            <div className="wg-metric">
              <div className="wg-metric__label">Risk</div>
              <div style={{ marginTop: 6 }}>
                <Badge severity={impactToSeverity(event.enrichment.risk)}>
                  {event.enrichment.risk}
                </Badge>
              </div>
            </div>
            <div className="wg-metric">
              <div className="wg-metric__label">Opportunity</div>
              <div style={{ marginTop: 6 }}>
                <Badge severity={impactToSeverity(event.enrichment.opportunity)}>
                  {event.enrichment.opportunity}
                </Badge>
              </div>
            </div>
          </div>
        </>
      )}

      <div>
        <SectionLabel>What to do</SectionLabel>
        {action ? (
          <div>
            <div style={{ fontSize: "var(--text-base)", fontWeight: 600 }}>{action.title}</div>
            <div
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--color-text-tertiary)",
                marginTop: 4,
              }}
            >
              {action.description}
            </div>
            {action.path.length > 0 && (
              <div
                className="mono"
                style={{
                  display: "block",
                  marginTop: 10,
                  padding: 10,
                  background: "var(--color-bg-raised)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--color-text-secondary)",
                }}
              >
                path: {action.path.join(" → ")}
              </div>
            )}
          </div>
        ) : event ? (
          <ul
            style={{
              margin: 0,
              paddingLeft: 18,
              color: "var(--color-text-secondary)",
              fontSize: "var(--text-base)",
              lineHeight: "var(--leading-normal)",
            }}
          >
            {event.enrichment.recommended_actions.length === 0 ? (
              <li style={{ color: "var(--color-text-muted)" }}>(no actions suggested)</li>
            ) : (
              event.enrichment.recommended_actions.map((a, i) => <li key={i}>{a}</li>)
            )}
          </ul>
        ) : null}
      </div>

      {notification.alert && (
        <div
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-text-subtle)",
            letterSpacing: 0.5,
          }}
        >
          matched rule: <strong>{notification.alert.rule_name}</strong> · score{" "}
          {notification.alert.alert_score}
        </div>
      )}
    </Panel>
  );
}

function impactToSeverity(i: "LOW" | "MEDIUM" | "HIGH"): "INFO" | "IMPORTANT" | "CRITICAL" {
  return i === "HIGH" ? "CRITICAL" : i === "MEDIUM" ? "IMPORTANT" : "INFO";
}
