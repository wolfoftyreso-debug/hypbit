import { useEffect, useMemo, useState } from "react";
import { InfluenceMap } from "./components/InfluenceMap";
import { ModeToggle, type Mode } from "./components/ModeToggle";
import { PersonDrawer } from "./components/PersonDrawer";
import { LiveFeedPanel } from "./components/LiveFeedPanel";
import { ImpactPanel } from "./components/ImpactPanel";
import { useNotifications } from "./hooks/useNotifications";
import type { FeatureCollection, Notification, PersonFeatureProps } from "./types";

type ReadinessResponse = {
  status: string;
  services: { neo4j: boolean; redis: boolean; opensearch: boolean };
};

const USER_ID = "demo_user";

export function App() {
  const [readiness, setReadiness] = useState<ReadinessResponse | null>(null);
  const [mode, setMode] = useState<Mode>("global");
  const [geo, setGeo] = useState<FeatureCollection | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<PersonFeatureProps | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const headers = useMemo(() => ({ "x-user-id": USER_ID }), []);
  const notifications = useNotifications(100);

  useEffect(() => {
    fetch("/health/ready")
      .then((r) => r.json())
      .then(setReadiness)
      .catch(() => setReadiness(null));
  }, []);

  useEffect(() => {
    fetch(`/api/map?mode=${mode}`, { headers })
      .then((r) => r.json())
      .then(setGeo)
      .catch(() => setGeo(null));
  }, [mode, headers]);

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          padding: "14px 24px",
          borderBottom: "1px solid #1f2937",
          background: "#0b1220",
          color: "#f9fafb",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div style={{ marginRight: "auto" }}>
          <h1 style={{ margin: 0, fontSize: 16, letterSpacing: 1 }}>WAVULT GEOPOL</h1>
          <p style={{ margin: 0, color: "#64748b", fontSize: 11 }}>
            Influence Intelligence Platform
          </p>
        </div>
        <ModeToggle value={mode} onChange={setMode} />
        <ReadinessPill readiness={readiness} />
      </header>

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <section style={{ flex: 1, position: "relative", minWidth: 0 }}>
          <InfluenceMap geo={geo} onSelect={setSelectedPerson} />
          {selectedPerson && !selectedNotification && (
            <PersonDrawer person={selectedPerson} onClose={() => setSelectedPerson(null)} />
          )}
          {selectedNotification && (
            <ImpactPanel
              notification={selectedNotification}
              onClose={() => setSelectedNotification(null)}
            />
          )}
        </section>
        <LiveFeedPanel notifications={notifications} onSelect={setSelectedNotification} />
      </div>
    </main>
  );
}

function ReadinessPill({ readiness }: { readiness: ReadinessResponse | null }) {
  if (!readiness) return <span style={{ color: "#64748b", fontSize: 11 }}>checking…</span>;
  const ok = Object.values(readiness.services).every(Boolean);
  return (
    <span
      style={{
        fontSize: 10,
        padding: "4px 10px",
        borderRadius: 999,
        background: ok ? "#064e3b" : "#7f1d1d",
        color: ok ? "#6ee7b7" : "#fecaca",
        border: `1px solid ${ok ? "#065f46" : "#991b1b"}`,
        letterSpacing: 1,
      }}
      title={JSON.stringify(readiness.services)}
    >
      {ok ? "ALL SYSTEMS OK" : "DEGRADED"}
    </span>
  );
}
