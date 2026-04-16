import { useEffect, useState } from "react";
import { Badge, Button, Metric, Panel, SectionLabel } from "./ui/index.js";
import { AgentTaskItem } from "./AgentTaskItem.js";
import { useAgentTasksForPerson } from "../hooks/useAgentTasks.js";
import type { AccessBand, PersonFeatureProps } from "../types";

export function PersonDrawer({
  person,
  onClose,
}: {
  person: PersonFeatureProps;
  onClose: () => void;
}) {
  const [runBump, setRunBump] = useState(0);
  const { tasks, loading, error } = useAgentTasksForPerson(person.id, runBump);

  return (
    <Panel
      floating
      onClose={onClose}
      style={{
        right: "var(--space-4)",
        top: "var(--space-4)",
        bottom: "var(--space-4)",
        width: 380,
        overflowY: "auto",
      }}
    >
      <div>
        <h2 style={{ margin: 0, fontSize: "var(--text-xl)" }}>{person.name}</h2>
        <p
          style={{
            margin: "4px 0 0",
            color: "var(--color-text-muted)",
            fontSize: "var(--text-xs)",
          }}
        >
          id: {person.id}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "var(--space-3)",
        }}
      >
        <Metric label="Influence" value={person.influence_score} />
        <Metric label="Relevance" value={person.relevance_score} />
      </div>

      <div>
        <SectionLabel>Access engine</SectionLabel>
        <AccessInline person={person} />
      </div>

      <div>
        <SectionLabel>Agent plan</SectionLabel>
        {loading && tasks.length === 0 ? (
          <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
            Loading tasks…
          </div>
        ) : error ? (
          <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
            Agent offline
          </div>
        ) : tasks.length === 0 ? (
          <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
            No tasks yet. Run the agent to generate a plan.
          </div>
        ) : (
          <div
            style={{
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
            }}
          >
            {tasks.slice(0, 5).map((t) => (
              <AgentTaskItem key={t.id} task={t} compact />
            ))}
          </div>
        )}
      </div>

      <div>
        <SectionLabel>Actions</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <Button
            full
            onClick={() =>
              fetch(`/api/decision/${encodeURIComponent(person.id)}`)
                .then((r) => r.json())
                .then((d) => alert(JSON.stringify(d, null, 2)))
                .catch(() => alert("decision engine unavailable"))
            }
          >
            Compute combined decision
          </Button>
          <Button
            full
            variant="ghost"
            onClick={() =>
              fetch("/api/agent/run", { method: "POST" })
                .then((r) => r.json())
                .then(() => setRunBump((n) => n + 1))
                .catch(() => alert("agent unavailable"))
            }
          >
            Run agent now
          </Button>
        </div>
      </div>
    </Panel>
  );
}

/**
 * Reuse the access info already joined into the map feature when
 * available; otherwise fall back to a live fetch from /api/access/:id.
 */
function AccessInline({ person }: { person: PersonFeatureProps }) {
  if (person.access_band) {
    return (
      <AccessRow
        band={person.access_band}
        probability={person.access_probability ?? 0}
        hop={person.best_next_hop ?? undefined}
      />
    );
  }
  return <AccessFetcher personId={person.id} />;
}

function AccessFetcher({ personId }: { personId: string }) {
  const [data, setData] = useState<
    { probability: number; band: AccessBand; best_next_hop?: string } | null
  >(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(`/api/access/${encodeURIComponent(personId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (!live) return;
        setData(d);
      })
      .catch(() => {
        if (!live) return;
        setErr(true);
      });
    return () => {
      live = false;
    };
  }, [personId]);

  if (err) return <div style={{ color: "var(--color-text-muted)" }}>unavailable</div>;
  if (!data) return <div style={{ color: "var(--color-text-muted)" }}>computing…</div>;

  return (
    <AccessRow
      band={data.band}
      probability={data.probability}
      hop={data.best_next_hop}
    />
  );
}

function AccessRow({
  band,
  probability,
  hop,
}: {
  band: AccessBand;
  probability: number;
  hop?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
      <Badge access={band}>{band}</Badge>
      <span style={{ fontSize: "var(--text-lg)", fontWeight: 600 }}>
        {Math.round(probability * 100)}%
      </span>
      {hop && (
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
          via {hop}
        </span>
      )}
    </div>
  );
}
