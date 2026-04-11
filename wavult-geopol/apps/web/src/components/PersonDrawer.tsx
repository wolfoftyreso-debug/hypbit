import { useEffect, useState } from "react";
import { Badge, Button, Metric, Panel, SectionLabel } from "./ui/index.js";
import type { AccessBand, PersonFeatureProps } from "../types";

export function PersonDrawer({
  person,
  onClose,
}: {
  person: PersonFeatureProps;
  onClose: () => void;
}) {
  return (
    <Panel
      floating
      onClose={onClose}
      style={{
        right: "var(--space-4)",
        top: "var(--space-4)",
        bottom: "var(--space-4)",
        width: 340,
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
        <Metric label="Influence" value={person.influence_score} />
        <Metric label="Relevance" value={person.relevance_score} />
      </div>

      <div>
        <SectionLabel>Access engine</SectionLabel>
        <AccessFetcher personId={person.id} />
      </div>

      <div>
        <SectionLabel>Actions</SectionLabel>
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
      </div>
    </Panel>
  );
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
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
      <Badge access={data.band}>{data.band}</Badge>
      <span style={{ fontSize: "var(--text-lg)", fontWeight: 600 }}>
        {Math.round(data.probability * 100)}%
      </span>
      {data.best_next_hop && (
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
          via {data.best_next_hop}
        </span>
      )}
    </div>
  );
}
