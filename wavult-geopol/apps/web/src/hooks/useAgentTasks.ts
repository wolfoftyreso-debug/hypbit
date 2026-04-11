import { useEffect, useState } from "react";
import type { AgentTask } from "../types";

/**
 * Polls /api/agent/tasks every `intervalMs` (default 30s) and returns
 * the freshest list. Agent runs are hourly in production, so the
 * polling interval is very conservative vs. the actual write rate.
 */
export function useAgentTasks(limit = 50, intervalMs = 30_000): AgentTask[] {
  const [items, setItems] = useState<AgentTask[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/agent/tasks?limit=${limit}`);
        if (!res.ok) return;
        const data = (await res.json()) as AgentTask[];
        if (!cancelled) setItems(data);
      } catch {
        /* ignore transient failures */
      }
    }

    void load();
    const handle = setInterval(load, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, [limit, intervalMs]);

  return items;
}

/**
 * Per-person variant: fetches once per personId change and whenever
 * `bump` changes. Used in PersonDrawer.
 */
export function useAgentTasksForPerson(
  personId: string | null,
  bump = 0
): { tasks: AgentTask[]; loading: boolean; error: boolean } {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!personId) {
      setTasks([]);
      setLoading(false);
      setError(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);

    fetch(`/api/agent/tasks/person/${encodeURIComponent(personId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => {
        if (cancelled) return;
        setTasks(data as AgentTask[]);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [personId, bump]);

  return { tasks, loading, error };
}
