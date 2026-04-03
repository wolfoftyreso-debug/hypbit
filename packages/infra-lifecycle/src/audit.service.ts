import type { LogEntry, PhaseId } from './types.js';

const SECRET_PATTERNS = [
  /cfut_[a-zA-Z0-9]+/g,
  /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, // JWT
  /sk-[a-zA-Z0-9]+/g,
  /[A-Za-z0-9+/]{40,}={0,2}/g, // base64 long strings
];

/**
 * AuditService — structured logging for every lifecycle phase.
 * Secret values are redacted automatically before any log is stored.
 */
export class AuditService {
  private readonly entries: LogEntry[] = [];
  private readonly maxEntries = 100_000;

  log(
    phase: PhaseId,
    workItemId: string,
    level: LogEntry['level'],
    message: string,
    data?: Record<string, unknown>,
  ): void {
    const sanitized = data ? this.redactSecrets(data) : undefined;
    const entry: LogEntry = {
      timestamp: new Date(),
      phase,
      workItemId,
      level,
      message,
      data: sanitized,
      secretsRedacted: sanitized !== data,
    };

    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) this.entries.shift();

    // Console output for development visibility
    const prefix = `[${entry.timestamp.toISOString()}] [${phase}] [${workItemId.slice(0, 8)}] [${level.toUpperCase()}]`;
    if (level === 'error') {
      console.error(prefix, message, sanitized ?? '');
    } else {
      console.log(prefix, message, sanitized ? JSON.stringify(sanitized) : '');
    }
  }

  info(phase: PhaseId, workItemId: string, message: string, data?: Record<string, unknown>): void {
    this.log(phase, workItemId, 'info', message, data);
  }

  warn(phase: PhaseId, workItemId: string, message: string, data?: Record<string, unknown>): void {
    this.log(phase, workItemId, 'warn', message, data);
  }

  error(phase: PhaseId, workItemId: string, message: string, data?: Record<string, unknown>): void {
    this.log(phase, workItemId, 'error', message, data);
  }

  audit(phase: PhaseId, workItemId: string, message: string, data?: Record<string, unknown>): void {
    this.log(phase, workItemId, 'audit', message, data);
  }

  /** Get all entries for a work item. */
  getForWorkItem(workItemId: string): LogEntry[] {
    return this.entries.filter((e) => e.workItemId === workItemId);
  }

  /** Get all entries for a phase across all work items. */
  getForPhase(phase: PhaseId): LogEntry[] {
    return this.entries.filter((e) => e.phase === phase);
  }

  /** Export all audit entries (for persistence). */
  export(): LogEntry[] {
    return [...this.entries];
  }

  private redactSecrets(data: Record<string, unknown>): Record<string, unknown> {
    const str = JSON.stringify(data);
    let redacted = str;
    for (const pattern of SECRET_PATTERNS) {
      redacted = redacted.replace(pattern, '[REDACTED]');
    }
    try {
      return JSON.parse(redacted) as Record<string, unknown>;
    } catch {
      return { _redactionError: 'Failed to parse redacted data', original: '[REDACTED]' };
    }
  }
}
