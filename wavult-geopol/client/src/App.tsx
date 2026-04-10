import { useEffect, useState } from "react";

type ReadinessResponse = {
  status: string;
  services: { neo4j: boolean; redis: boolean; opensearch: boolean };
};

type Entity = {
  id: string;
  name: string;
  type: string;
  summary?: string;
};

export function App() {
  const [readiness, setReadiness] = useState<ReadinessResponse | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/health/ready")
      .then((r) => r.json())
      .then(setReadiness)
      .catch(() => setReadiness(null));
  }, []);

  useEffect(() => {
    const url = query ? `/api/entities?q=${encodeURIComponent(query)}` : "/api/entities";
    fetch(url)
      .then((r) => r.json())
      .then((data) => setEntities(data.results ?? []))
      .catch(() => setEntities([]));
  }, [query]);

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: 32, maxWidth: 880, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 4 }}>Wavult Geopol</h1>
      <p style={{ color: "#666", marginTop: 0 }}>Graph-backed geopolitical intelligence.</p>

      <section style={{ marginTop: 24, padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
        <h2 style={{ marginTop: 0 }}>System readiness</h2>
        {readiness ? (
          <ul>
            <li>Neo4j: {readiness.services.neo4j ? "ok" : "down"}</li>
            <li>Redis: {readiness.services.redis ? "ok" : "down"}</li>
            <li>OpenSearch: {readiness.services.opensearch ? "ok" : "down"}</li>
          </ul>
        ) : (
          <p>Checking…</p>
        )}
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Entities</h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, type, summary…"
          style={{ width: "100%", padding: 8, fontSize: 16 }}
        />
        <ul style={{ marginTop: 16 }}>
          {entities.length === 0 ? (
            <li style={{ color: "#999" }}>No results</li>
          ) : (
            entities.map((e) => (
              <li key={e.id} style={{ marginBottom: 8 }}>
                <strong>{e.name}</strong> <em style={{ color: "#888" }}>({e.type})</em>
                {e.summary && <div style={{ color: "#555" }}>{e.summary}</div>}
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}
