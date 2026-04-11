import { useEffect, useMemo, useState } from "react";
import { InfluenceMap } from "./components/InfluenceMap";
import { ModeToggle, type Mode } from "./components/ModeToggle";
import { PersonDrawer } from "./components/PersonDrawer";
import { LiveFeedPanel } from "./components/LiveFeedPanel";
import { ImpactPanel } from "./components/ImpactPanel";
import { Badge } from "./components/ui/index.js";
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
    <main className="flex flex-col h-full">
      <header
        style={{
          padding: "14px var(--space-6)",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-bg-elevated)",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-4)",
          height: "var(--header-height)",
        }}
      >
        <div style={{ marginRight: "auto" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "var(--text-md)",
              letterSpacing: "var(--tracking-wider)",
            }}
          >
            WAVULT GEOPOL
          </h1>
          <p
            style={{
              margin: 0,
              color: "var(--color-text-muted)",
              fontSize: "var(--text-xs)",
            }}
          >
            Influence Intelligence Platform
          </p>
        </div>
        <ModeToggle value={mode} onChange={setMode} />
        <ReadinessPill readiness={readiness} />
      </header>

      <div className="flex flex-1 min-h-0">
        <section className="flex-1 relative" style={{ minWidth: 0 }}>
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
  if (!readiness) {
    return <Badge>CHECKING…</Badge>;
  }
  const ok = Object.values(readiness.services).every(Boolean);
  return (
    <Badge severity={ok ? "INFO" : "CRITICAL"} title={JSON.stringify(readiness.services)}>
      {ok ? "ALL SYSTEMS OK" : "DEGRADED"}
    </Badge>
  );
}
