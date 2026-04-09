import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldX, ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";

interface SecurityKPIsProps {
  criticalCount: number;
  highCount: number;
  mitigatedPct: number;
  unmitigatedCount: number;
}

export const SecurityKPIs = React.memo(function SecurityKPIs({ criticalCount, highCount, mitigatedPct, unmitigatedCount }: SecurityKPIsProps) {
  const kpis = [
    { label: 'Critical Threats', value: criticalCount, icon: ShieldX, color: 'text-destructive', bg: 'bg-destructive/10' },
    { label: 'High Severity', value: highCount, icon: ShieldAlert, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Auto-Mitigated', value: `${mitigatedPct}%`, icon: ShieldCheck, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Active Unmitigated', value: unmitigatedCount, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
      {kpis.map(kpi => (
        <Card key={kpi.label} className="glass-card glow-border group">
          <CardContent className="pt-5 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg ${kpi.bg} flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}>
              <kpi.icon className={`h-5 w-5 ${kpi.color} transition-transform duration-300 group-hover:scale-110`} />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});
