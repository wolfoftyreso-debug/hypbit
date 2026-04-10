import type { PersonFeatureProps } from "../types";

export function PersonDrawer({
  person,
  onClose,
}: {
  person: PersonFeatureProps;
  onClose: () => void;
}) {
  return (
    <aside
      style={{
        position: "absolute",
        right: 16,
        top: 16,
        bottom: 16,
        width: 320,
        background: "#0b1220",
        color: "#f9fafb",
        border: "1px solid #1f2937",
        borderRadius: 12,
        padding: 20,
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        overflowY: "auto",
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          background: "transparent",
          border: "none",
          color: "#94a3b8",
          fontSize: 18,
          cursor: "pointer",
        }}
        aria-label="Close"
      >
        ×
      </button>
      <h2 style={{ margin: "0 0 4px", fontSize: 20 }}>{person.name}</h2>
      <p style={{ margin: 0, color: "#64748b", fontSize: 12 }}>id: {person.id}</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 20 }}>
        <Metric label="Influence" value={person.influence_score} />
        <Metric label="Relevance" value={person.relevance_score} />
      </div>

      <div style={{ marginTop: 20 }}>
        <button
          style={{
            background: "#2563eb",
            color: "white",
            border: "none",
            padding: "10px 14px",
            borderRadius: 8,
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 13,
            width: "100%",
          }}
          onClick={() =>
            fetch("/api/intelligence/path/" + encodeURIComponent(person.id))
              .then((r) => r.json())
              .then((d) => alert(JSON.stringify(d, null, 2)))
              .catch(() => alert("no path"))
          }
        >
          Compute access path →
        </button>
      </div>
    </aside>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: "#111827", borderRadius: 8, padding: "12px 14px" }}>
      <div style={{ color: "#94a3b8", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 600, marginTop: 2 }}>{value}</div>
    </div>
  );
}
