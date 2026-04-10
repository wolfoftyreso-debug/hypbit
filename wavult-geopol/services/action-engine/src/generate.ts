import { ulid } from "ulid";
import type { Alert, Action } from "./shared/schemas.js";
import { shortestPath } from "./access-path.js";

/**
 * Convert an alert into one or more concrete next-best-actions.
 *
 * Rules of thumb:
 *   - ROLE_CHANGE on a relevant person    → REVIEW_STRATEGY + INTRO_REQUEST
 *   - EVENT_ATTENDANCE with known person  → ATTEND_EVENT
 *   - INVESTMENT / MA on a dependency     → CONTACT_PARTNER
 *   - REGULATORY_DECISION affecting us    → REVIEW_STRATEGY
 *   - Anything else with high severity    → MONITOR fallback
 */
export async function generateActions(alert: Alert): Promise<Action[]> {
  const actions: Action[] = [];
  const event = alert.event;
  const targetId = alert.matched_person_id;
  const targetName = alert.matched_person_name;
  const path = targetId ? await shortestPath(targetId) : [];

  const base = {
    id: ulid(),
    ts: Date.now(),
    alert_id: alert.id,
    target_person_id: targetId,
    target_person_name: targetName,
    path,
    priority: alert.severity,
  } as const;

  switch (event.event_type) {
    case "ROLE_CHANGE":
      actions.push({
        ...base,
        id: ulid(),
        action_type: "REVIEW_STRATEGY",
        title: `Re-evaluate access strategy for ${targetName ?? "target"}`,
        description: `${targetName ?? "The target"} has undergone a role change. Review your current access path and primary contact.`,
        deadline_ts: Date.now() + 7 * 24 * 3600 * 1000,
      });
      if (path.length > 1) {
        actions.push({
          ...base,
          id: ulid(),
          action_type: "INTRO_REQUEST",
          title: `Request intro to ${targetName ?? "target"} via ${path[1]}`,
          description: `Shortest access path: ${path.join(" → ")}. Reach out to ${path[1]} this week.`,
          deadline_ts: Date.now() + 7 * 24 * 3600 * 1000,
        });
      }
      break;

    case "EVENT_ATTENDANCE":
      actions.push({
        ...base,
        id: ulid(),
        action_type: "ATTEND_EVENT",
        title: `Attend the same event as ${targetName ?? "target"}`,
        description: event.title,
        deadline_ts: Date.now() + 30 * 24 * 3600 * 1000,
      });
      break;

    case "INVESTMENT":
    case "MA_ANNOUNCEMENT":
      actions.push({
        ...base,
        id: ulid(),
        action_type: "CONTACT_PARTNER",
        title: `Contact partner inside ${event.org_ids[0] ?? "the organisation"}`,
        description: `Recent ${event.event_type} — ${event.title}. Investigate our exposure.`,
        deadline_ts: Date.now() + 3 * 24 * 3600 * 1000,
      });
      break;

    case "REGULATORY_DECISION":
      actions.push({
        ...base,
        id: ulid(),
        action_type: "REVIEW_STRATEGY",
        title: "Review regulatory exposure",
        description: `${event.title}. Check which products this affects and brief leadership.`,
        deadline_ts: Date.now() + 5 * 24 * 3600 * 1000,
      });
      break;

    default:
      actions.push({
        ...base,
        id: ulid(),
        action_type: "MONITOR",
        title: `Monitor ${targetName ?? event.entity_id ?? "entity"}`,
        description: event.title,
      });
      break;
  }

  // Create a CRM task action for anything CRITICAL, on top of the type-specific one.
  if (alert.severity === "CRITICAL") {
    actions.push({
      ...base,
      id: ulid(),
      action_type: "CREATE_CRM_TASK",
      title: `[CRITICAL] ${event.title}`,
      description: event.enrichment.summary,
      deadline_ts: Date.now() + 2 * 24 * 3600 * 1000,
    });
  }

  return actions;
}
