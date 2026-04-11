import { useMemo } from "react";
import Map, { Layer, Source } from "react-map-gl";
import type { MapLayerMouseEvent } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { FeatureCollection, PersonFeatureProps } from "../types";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

/**
 * Color by access_band when the access-engine has a score for a
 * person; fall back to relevance_score heatmap for unknown people.
 *
 * HIGH  — emerald (var(--access-high-fg))
 * MED   — amber  (var(--access-medium-fg))
 * LOW   — crimson (var(--access-low-fg))
 * unknown — neutral blue→purple→red relevance ramp
 */
const circleLayer = {
  id: "people-layer",
  type: "circle" as const,
  source: "people",
  paint: {
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["get", "influence_score"],
      0,
      4,
      100,
      18,
    ] as unknown as number,
    "circle-color": [
      "case",
      ["==", ["get", "access_band"], "HIGH"],
      "#10b981",
      ["==", ["get", "access_band"], "MEDIUM"],
      "#f59e0b",
      ["==", ["get", "access_band"], "LOW"],
      "#ef4444",
      [
        "interpolate",
        ["linear"],
        ["get", "relevance_score"],
        0,
        "#2563eb",
        50,
        "#9333ea",
        100,
        "#ef4444",
      ],
    ] as unknown as string,
    "circle-opacity": 0.9,
    "circle-stroke-width": [
      "case",
      ["has", "access_band"],
      1.5,
      1,
    ] as unknown as number,
    "circle-stroke-color": [
      "case",
      ["has", "access_band"],
      "#f1f5f9",
      "#0b1220",
    ] as unknown as string,
  },
};

function Legend() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "var(--space-4)",
        right: "var(--space-4)",
        background: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: "10px 12px",
        fontSize: "var(--text-xs)",
        color: "var(--color-text-secondary)",
        boxShadow: "var(--shadow-md)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          textTransform: "uppercase",
          letterSpacing: "var(--tracking-wider)",
          color: "var(--color-text-muted)",
        }}
      >
        Access
      </div>
      <LegendRow color="#10b981" label="High" />
      <LegendRow color="#f59e0b" label="Medium" />
      <LegendRow color="#ef4444" label="Low" />
      <LegendRow color="#9333ea" label="Unscored" />
    </div>
  );
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: color,
          display: "inline-block",
        }}
      />
      {label}
    </div>
  );
}

export function InfluenceMap({
  geo,
  onSelect,
}: {
  geo: FeatureCollection | null;
  onSelect: (p: PersonFeatureProps) => void;
}) {
  const emptyGeo = useMemo<FeatureCollection>(
    () => ({ type: "FeatureCollection", features: [] }),
    []
  );

  if (!MAPBOX_TOKEN) {
    return (
      <div
        style={{
          height: "100%",
          minHeight: 480,
          display: "grid",
          placeItems: "center",
          background: "var(--color-bg-elevated)",
          color: "var(--color-text-muted)",
          padding: 24,
          textAlign: "center",
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: "var(--text-md)" }}>
            Map disabled — set <code>VITE_MAPBOX_TOKEN</code> to enable the influence map.
          </p>
          <p style={{ margin: "12px 0 0", fontSize: "var(--text-sm)" }}>
            {geo?.features.length ?? 0} people loaded from the API.
          </p>
        </div>
      </div>
    );
  }

  const onClick = (e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (!feature) return;
    onSelect(feature.properties as unknown as PersonFeatureProps);
  };

  return (
    <>
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{ longitude: 10, latitude: 40, zoom: 1.8 }}
        style={{ position: "absolute", inset: 0 }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        interactiveLayerIds={["people-layer"]}
        onClick={onClick}
      >
        <Source id="people" type="geojson" data={geo ?? emptyGeo}>
          <Layer {...circleLayer} />
        </Source>
      </Map>
      <Legend />
    </>
  );
}
