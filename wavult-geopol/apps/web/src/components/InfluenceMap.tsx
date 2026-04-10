import { useMemo } from "react";
import Map, { Layer, Source, Popup } from "react-map-gl";
import type { MapLayerMouseEvent } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { FeatureCollection, PersonFeatureProps } from "../types";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

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
      "interpolate",
      ["linear"],
      ["get", "relevance_score"],
      0,
      "#2563eb",
      50,
      "#9333ea",
      100,
      "#ef4444",
    ] as unknown as string,
    "circle-opacity": 0.85,
    "circle-stroke-width": 1,
    "circle-stroke-color": "#0b1220",
  },
};

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
          background: "#0b1220",
          color: "#94a3b8",
          padding: 24,
          textAlign: "center",
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 14 }}>
            Map disabled — set <code>VITE_MAPBOX_TOKEN</code> to enable the influence map.
          </p>
          <p style={{ margin: "12px 0 0", fontSize: 12 }}>
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
  );
}
