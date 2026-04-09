import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

interface HeatmapRow { signal: string; avg: number; max: number; fill: string; }
interface GeoPoint { x: number; y: number; z: number; fill: string; }
interface FraudHeatmapGeoProps { heatmapData: HeatmapRow[]; geoData: GeoPoint[]; }

export const FraudHeatmapGeo = React.memo(function FraudHeatmapGeo({ heatmapData, geoData }: FraudHeatmapGeoProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="glass-card glow-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Fraud Signal Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {heatmapData.map(row => (
              <div key={row.signal} className="flex items-center gap-3 group/row">
                <span className="text-xs text-muted-foreground w-28 capitalize">{row.signal}</span>
                <div className="flex-1 h-8 bg-muted rounded-sm overflow-hidden relative">
                  <div
                    className="h-full rounded-sm flex items-center px-2 transition-all duration-500 group-hover/row:opacity-100"
                    style={{
                      width: `${Math.max(row.avg * 100, 5)}%`,
                      backgroundColor: row.fill,
                      opacity: 0.7,
                    }}
                  >
                    <span className="text-xs font-mono font-medium text-foreground">{row.avg}</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground w-12">max {row.max}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card glow-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Fraud Geo Hotspots</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={230}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="x" name="Lon" tick={{ fontSize: 10 }} domain={[-80, 150]} />
              <YAxis dataKey="y" name="Lat" tick={{ fontSize: 10 }} domain={[20, 65]} />
              <ZAxis dataKey="z" range={[40, 250]} />
              <Tooltip />
              <Scatter data={geoData}>
                {geoData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} fillOpacity={0.7} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
});
