import { ulid } from "ulid";
import { config } from "./config.js";
import { topTargets } from "./db/neo4j.js";
import { planTasksForTarget } from "./planner.js";
import { saveRun, saveTasks } from "./store.js";
import { publishTasks } from "./kafka.js";
import type { AgentRun, AgentTask } from "./shared/schemas.js";

/**
 * Fetch the combined /api/decision payload for a target via the
 * influence-api. The agent doesn't talk to access-engine or
 * deal-flow-engine directly — it asks the API gateway for the
 * pre-joined view.
 */
async function fetchDecision(personId: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(
      `${config.INFLUENCE_API_URL}/api/decision/${encodeURIComponent(personId)}`
    );
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function runAgent(): Promise<AgentRun> {
  const runId = ulid();
  const startedAt = Date.now();
  const targets = await topTargets(config.AGENT_TOP_N);
  console.log(`[agent] run ${runId} — ${targets.length} targets`);

  const allTasks: AgentTask[] = [];
  for (const target of targets) {
    const decision = await fetchDecision(target.id);
    if (!decision) continue;
    try {
      const tasks = await planTasksForTarget({ target, decision }, runId);
      allTasks.push(...tasks);
    } catch (err) {
      console.warn(`[agent] plan for ${target.id} failed:`, (err as Error).message);
    }
  }

  if (allTasks.length > 0) {
    await saveTasks(allTasks);
    await publishTasks(allTasks);
  }

  const run: AgentRun = {
    run_id: runId,
    started_at: startedAt,
    finished_at: Date.now(),
    target_count: targets.length,
    task_count: allTasks.length,
    model: config.ANTHROPIC_API_KEY ? config.ANTHROPIC_MODEL : "deterministic-heuristic",
  };
  await saveRun(run);
  console.log(
    `[agent] run ${runId} finished — ${run.task_count} tasks over ${run.target_count} targets`
  );
  return run;
}
