import { useState } from "react";
import { Badge } from "./ui/index.js";
import { AgentTaskItem } from "./AgentTaskItem.js";
import type { AgentTask, Notification } from "../types";

type Tab = "feed" | "tasks";

/**
 * Tabbed right rail that hosts both the live intelligence feed
 * (ALERT/ACTION notifications) and the autonomous agent's task queue.
 *
 * Tabs are self-contained here — the parent only passes data and
 * two click handlers, one for notifications (opens ImpactPanel) and
 * one for tasks (navigates to the relevant person).
 */
export function RightRail({
  notifications,
  tasks,
  onSelectNotification,
  onSelectPerson,
}: {
  notifications: Notification[];
  tasks: AgentTask[];
  onSelectNotification: (n: Notification) => void;
  onSelectPerson: (personId: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("feed");

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
          padding: "12px var(--space-4)",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-3)",
        }}
      >
        <div className="wg-tabs" role="tablist" style={{ background: "var(--color-bg-raised)" }}>
          <button
            role="tab"
            aria-selected={tab === "feed"}
            className={`wg-tabs__tab ${tab === "feed" ? "wg-tabs__tab--active" : ""}`}
            onClick={() => setTab("feed")}
          >
            FEED {notifications.length > 0 && `· ${notifications.length}`}
          </button>
          <button
            role="tab"
            aria-selected={tab === "tasks"}
            className={`wg-tabs__tab ${tab === "tasks" ? "wg-tabs__tab--active" : ""}`}
            onClick={() => setTab("tasks")}
          >
            TASKS {tasks.length > 0 && `· ${tasks.length}`}
          </button>
        </div>
        <span className="wg-live-dot" title="live" />
      </div>

      <div style={{ overflowY: "auto", flex: 1 }}>
        {tab === "feed" ? (
          <FeedList notifications={notifications} onSelect={onSelectNotification} />
        ) : (
          <TasksList tasks={tasks} onSelectPerson={onSelectPerson} />
        )}
      </div>
    </aside>
  );
}

function FeedList({
  notifications,
  onSelect,
}: {
  notifications: Notification[];
  onSelect: (n: Notification) => void;
}) {
  if (notifications.length === 0) {
    return (
      <div
        style={{
          padding: "var(--space-5)",
          color: "var(--color-text-muted)",
          fontSize: "var(--text-base)",
        }}
      >
        Waiting for events…
      </div>
    );
  }
  return (
    <>
      {notifications.map((n) => (
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
            <span className="wg-feed-item__time">{new Date(n.ts).toLocaleTimeString()}</span>
          </div>
          <div className="wg-feed-item__title">{n.title}</div>
          <div className="wg-feed-item__body">{n.body}</div>
        </button>
      ))}
    </>
  );
}

function TasksList({
  tasks,
  onSelectPerson,
}: {
  tasks: AgentTask[];
  onSelectPerson: (personId: string) => void;
}) {
  if (tasks.length === 0) {
    return (
      <div
        style={{
          padding: "var(--space-5)",
          color: "var(--color-text-muted)",
          fontSize: "var(--text-base)",
        }}
      >
        No agent tasks yet. The planner runs hourly, or trigger one manually
        via <code>POST /api/agent/run</code>.
      </div>
    );
  }
  return (
    <>
      {tasks.map((t) => (
        <AgentTaskItem key={t.id} task={t} onSelectPerson={onSelectPerson} />
      ))}
    </>
  );
}
