// ═══════════════════════════════════════════════════════════════
// Shared semantic color tokens for chart/inline-style usage
// Maps design system CSS variables to runtime hsl() strings
// ═══════════════════════════════════════════════════════════════

/** Resolves a CSS custom property to its computed hsl() string */
function resolveToken(token: string): string {
  if (typeof window === 'undefined') return `hsl(var(--${token}))`;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(`--${token}`).trim();
  return raw ? `hsl(${raw})` : `hsl(var(--${token}))`;
}

/** Semantic color tokens for use in Recharts, inline styles, etc. */
export const chartColors = {
  get destructive() { return resolveToken('destructive'); },
  get warning() { return resolveToken('warning'); },
  get success() { return resolveToken('success'); },
  get info() { return resolveToken('info'); },
  get primary() { return resolveToken('primary'); },
  get muted() { return resolveToken('muted-foreground'); },
  get foreground() { return resolveToken('foreground'); },
} as const;

/** Severity → color mapping using design tokens */
export const severityColors = {
  critical: () => chartColors.destructive,
  high: () => chartColors.warning,
  medium: () => chartColors.primary,
  low: () => chartColors.info,
} as const;

/** Decision → color mapping using design tokens */
export const decisionColors = {
  PASS: () => chartColors.success,
  FLAG: () => chartColors.warning,
  HOLD: () => chartColors.warning, // uses same warning, could be distinct
  BLOCK: () => chartColors.destructive,
} as const;

/**
 * Gradient scale from green → yellow → red for histogram/heatmap usage.
 * Returns 9 colors from success through warning to destructive.
 */
export function histogramGradient(): string[] {
  return [
    chartColors.success, chartColors.success, chartColors.success,
    chartColors.primary, chartColors.warning, chartColors.warning,
    chartColors.destructive, chartColors.destructive, chartColors.destructive,
  ];
}

/** Dynamic color based on a 0-1 score threshold */
export function scoreColor(score: number): string {
  if (score > 0.5) return chartColors.destructive;
  if (score > 0.3) return chartColors.warning;
  return chartColors.success;
}
