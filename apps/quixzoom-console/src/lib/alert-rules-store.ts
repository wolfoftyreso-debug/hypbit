// Shared alert rules store — simple pub/sub so AlertConfig and SecurityDashboard stay in sync
// Types come from api-schemas.ts (single source of truth)

import type { AlertRule } from './api-schemas';
import { ALERT_METRICS } from './api-schemas';

// Re-export for consumers
export type { AlertRule };
export { ALERT_METRICS as METRICS };

const DEFAULT_RULES: AlertRule[] = [
  {
    id: "rule_1",
    name: "High Fraud Score Alert",
    metric: "fraud_score",
    operator: ">",
    threshold: 0.85,
    window: "1m",
    channels: ["email", "sms"],
    severity: "critical",
    enabled: true,
    cooldownMinutes: 5,
    lastTriggered: new Date(Date.now() - 1200000).toISOString(),
  },
  {
    id: "rule_2",
    name: "Fraud BLOCK Decision",
    metric: "fraud_block_count",
    operator: ">=",
    threshold: 3,
    window: "5m",
    channels: ["email", "slack"],
    severity: "critical",
    enabled: true,
    cooldownMinutes: 10,
  },
  {
    id: "rule_3",
    name: "Threat Spike",
    metric: "threat_count",
    operator: ">",
    threshold: 20,
    window: "15m",
    channels: ["slack"],
    severity: "warning",
    enabled: true,
    cooldownMinutes: 15,
    lastTriggered: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "rule_4",
    name: "Critical Threat Detected",
    metric: "critical_threat_count",
    operator: ">=",
    threshold: 1,
    window: "1m",
    channels: ["email", "sms", "slack"],
    severity: "critical",
    enabled: true,
    cooldownMinutes: 5,
  },
  {
    id: "rule_5",
    name: "Auth Failure Burst",
    metric: "auth_failure_count",
    operator: ">",
    threshold: 50,
    window: "5m",
    channels: ["email"],
    severity: "warning",
    enabled: false,
    cooldownMinutes: 30,
  },
];

const STORAGE_KEY = "alert-rules-v5";

function loadRules(): AlertRule[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore corrupt data */ }
  return [...DEFAULT_RULES];
}

function persistRules(r: AlertRule[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(r)); } catch { /* quota */ }
}

type Listener = () => void;
let rules: AlertRule[] = loadRules();
const listeners = new Set<Listener>();

export const alertRulesStore = {
  getRules: () => rules,
  setRules: (next: AlertRule[]) => {
    rules = next;
    persistRules(next);
    listeners.forEach(l => l());
  },
  resetToDefaults: () => {
    rules = DEFAULT_RULES.map(r => ({
      ...r,
      lastTriggered: r.lastTriggered ? new Date(Date.now() - Math.random() * 3600000).toISOString() : undefined,
    }));
    persistRules(rules);
    listeners.forEach(l => l());
  },
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
};
