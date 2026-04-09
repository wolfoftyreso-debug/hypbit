export function ThreatLevelIndicator({ level, pulse }: { level: string; pulse: boolean }) {
  const colors: Record<string, string> = {
    CRITICAL: 'bg-destructive',
    ELEVATED: 'bg-warning',
    GUARDED: 'bg-primary',
    LOW: 'bg-success',
  };
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className={`h-4 w-4 rounded-full ${colors[level]}`} />
        {pulse && <div className={`absolute inset-0 h-4 w-4 rounded-full ${colors[level]} animate-ping opacity-40`} />}
      </div>
      <span className="text-sm font-semibold">{level}</span>
    </div>
  );
}
