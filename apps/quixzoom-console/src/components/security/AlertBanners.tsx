import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, X } from "lucide-react";
import type { AlertRule } from "@/lib/alert-rules-store";

interface FiredAlert extends AlertRule {
  currentValue: number;
  metricLabel: string;
}

interface AlertBannersProps {
  alerts: FiredAlert[];
  dismissedIds: Set<string>;
  onDismiss: (id: string) => void;
}

export function AlertBanners({ alerts, dismissedIds, onDismiss }: AlertBannersProps) {
  const visible = alerts.filter(a => !dismissedIds.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {visible.map(alert => (
        <div
          key={alert.id}
          className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
            alert.severity === 'critical'
              ? 'bg-destructive/10 border-destructive/30 text-destructive'
              : alert.severity === 'warning'
              ? 'bg-warning/10 border-warning/30 text-warning'
              : 'bg-info/10 border-info/30 text-info'
          }`}
        >
          <Bell className="h-4 w-4 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-semibold">{alert.name}</span>
            <span className="mx-2">—</span>
            <span>
              {alert.metricLabel}:{" "}
              <span className="font-mono font-bold">
                {typeof alert.currentValue === 'number' && alert.currentValue < 1
                  ? alert.currentValue.toFixed(3)
                  : alert.currentValue}
              </span>{" "}
              {alert.operator} {alert.threshold}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {alert.channels.map(ch => (
              <Badge key={ch} variant="outline" className="text-[10px] capitalize">{ch}</Badge>
            ))}
            <Link to={`/alerts?rule=${alert.id}`} className="text-xs underline underline-offset-2 hover:opacity-80">Configure</Link>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDismiss(alert.id)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
