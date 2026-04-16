import { Badge } from "./ui/index.js";
import type { AgentTask } from "../types";

const KIND_LABEL: Record<AgentTask["kind"], string> = {
  MEET: "Meet",
  INTRO: "Intro",
  OUTREACH: "Outreach",
  ATTEND_EVENT: "Event",
  RESEARCH: "Research",
  ESCALATE: "Escalate",
};

function formatDeadline(ts?: number): string | null {
  if (!ts) return null;
  const days = Math.round((ts - Date.now()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "overdue";
  if (days === 1) return "in 1 day";
  return `in ${days} days`;
}

/**
 * Dense list item representing one autonomous-agent task. Used both
 * in the right-rail global queue and inside PersonDrawer's
 * per-person list.
 */
export function AgentTaskItem({
  task,
  onSelectPerson,
  compact = false,
}: {
  task: AgentTask;
  onSelectPerson?: (personId: string) => void;
  compact?: boolean;
}) {
  const deadline = formatDeadline(task.deadline_ts);

  return (
    <div
      className="wg-feed-item"
      style={{ cursor: onSelectPerson ? "pointer" : "default" }}
      onClick={() => onSelectPerson?.(task.target_person_id)}
      role={onSelectPerson ? "button" : undefined}
    >
      <div className="wg-feed-item__head">
        <Badge severity={task.priority}>{KIND_LABEL[task.kind]}</Badge>
        {!compact && task.target_person_name && (
          <span
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-text-tertiary)",
              letterSpacing: "var(--tracking-wider)",
              textTransform: "uppercase",
            }}
          >
            {task.target_person_name}
          </span>
        )}
        <span className="wg-feed-item__time">
          {deadline ?? new Date(task.ts).toLocaleDateString()}
        </span>
      </div>
      <div className="wg-feed-item__title">{task.title}</div>
      <div className="wg-feed-item__body">{task.rationale}</div>
      {task.channel && (
        <div
          className="mono"
          style={{
            display: "inline-block",
            marginTop: 6,
            fontSize: "var(--text-xs)",
            background: "var(--color-bg-elevated)",
            color: "var(--color-text-tertiary)",
          }}
        >
          via {task.channel}
        </div>
      )}
    </div>
  );
}
