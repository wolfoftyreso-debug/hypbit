// Wavult guardrails — scannas av AI-agenten och CI
export const WAVULT_CONSTRAINTS = {
  FORBIDDEN_PATTERNS: [
    { pattern: /createClient\s*\(.*supabase/i, rule: 'NO_SUPABASE', severity: 'critical' },
    { pattern: /EXPO_PUBLIC_/,                  rule: 'NO_EXPOSED_KEYS', severity: 'critical' },
    { pattern: /localhost:\d+/,                 rule: 'NO_HARDCODED_URLS', severity: 'error' },
    { pattern: /console\.log\(/,                rule: 'NO_CONSOLE_LOG', severity: 'warning' },
    { pattern: /(mock|dummy|fake)Data/i,        rule: 'NO_MOCK_DATA', severity: 'error' },
    { pattern: /\.env\./,                       rule: 'USE_VITE_ENV', severity: 'warning' },
  ],

  REQUIRED_PATTERNS: [
    { pattern: /@wavult\/sdk/,    rule: 'USE_WAVULT_SDK', message: 'Import from @wavult/sdk' },
  ],

  DESIGN_TOKENS: {
    bg:    '#F5F0E8',
    navy:  '#0A3D62',
    gold:  '#E8B84B',
    fonts: ['Inter', 'JetBrains Mono'],
  },

  scan(code: string): Array<{ rule: string; severity: string; match: string }> {
    const issues: Array<{ rule: string; severity: string; match: string }> = []
    for (const { pattern, rule, severity } of this.FORBIDDEN_PATTERNS) {
      const match = code.match(pattern)
      if (match) issues.push({ rule, severity, match: match[0] })
    }
    return issues
  }
}
