import type {
  WorkItem,
  WorkItemType,
  InfraDomain,
  PhaseId,
  PhaseRecord,
  WorkItemStatus,
  LogEntry,
  ValidationResult,
  Blocker,
} from './types.js';

let idCounter = 0;

function generateId(): string {
  return `witem-${Date.now()}-${(++idCounter).toString().padStart(4, '0')}`;
}

const PHASE_ORDER: PhaseId[] = [
  'TRIGGER',
  'SCOPE_DEFINITION',
  'FULL_DISCOVERY',
  'CLASSIFICATION',
  'DEPENDENCY_MAPPING',
  'RISK_ASSESSMENT',
  'DESIGN',
  'APPROVAL_GATE',
  'ENV_PREPARATION',
  'PRE_FLIGHT_CHECK',
  'STAGED_EXECUTION',
  'HEALTH_VALIDATION',
  'INTEGRATION_VALIDATION',
  'CUTOVER',
  'ROLLBACK',
  'MONITORING_WINDOW',
  'CLEANUP',
  'POST_MORTEM',
];

export class WorkItemManager {
  private readonly items = new Map<string, WorkItem>();

  /** Create a new work item and initialize all phase records. */
  create(
    type: WorkItemType,
    domain: InfraDomain,
    title: string,
    description: string,
    requestedBy: string,
    metadata: Record<string, unknown> = {},
  ): WorkItem {
    const id = generateId();
    const phases: PhaseRecord[] = PHASE_ORDER.map((phaseId, index) => ({
      phaseId,
      phaseNumber: index + 1,
      status: 'pending',
      input: null,
      output: null,
      validationResults: [],
      logEntries: [],
      blockers: [],
    }));

    const item: WorkItem = {
      id,
      type,
      domain,
      title,
      description,
      requestedBy,
      requestedAt: new Date(),
      status: 'queued',
      currentPhase: 'TRIGGER',
      phases,
      metadata,
    };

    this.items.set(id, item);
    return item;
  }

  get(id: string): WorkItem | undefined {
    return this.items.get(id);
  }

  list(): WorkItem[] {
    return [...this.items.values()].sort(
      (a, b) => b.requestedAt.getTime() - a.requestedAt.getTime(),
    );
  }

  /** Advance a work item's current phase. */
  advancePhase(id: string, nextPhase: PhaseId): void {
    const item = this.requireItem(id);
    item.currentPhase = nextPhase;
    item.status = 'in-progress';
  }

  updatePhaseRecord(
    id: string,
    phaseId: PhaseId,
    patch: Partial<PhaseRecord>,
  ): void {
    const item = this.requireItem(id);
    const record = item.phases.find((p) => p.phaseId === phaseId);
    if (!record) throw new Error(`Phase ${phaseId} not found on work item ${id}`);
    Object.assign(record, patch);
  }

  addPhaseLog(id: string, phaseId: PhaseId, entry: LogEntry): void {
    const item = this.requireItem(id);
    const record = item.phases.find((p) => p.phaseId === phaseId);
    if (record) record.logEntries.push(entry);
  }

  addBlocker(id: string, phaseId: PhaseId, blocker: Blocker): void {
    const item = this.requireItem(id);
    const record = item.phases.find((p) => p.phaseId === phaseId);
    if (record) {
      record.blockers.push(blocker);
      record.status = 'blocked';
      item.status = 'blocked';
    }
  }

  resolveBlocker(id: string, phaseId: PhaseId, blockerId: string, resolvedBy: string, resolution: string): void {
    const item = this.requireItem(id);
    const record = item.phases.find((p) => p.phaseId === phaseId);
    if (!record) return;
    const blocker = record.blockers.find((b) => b.id === blockerId);
    if (blocker) {
      blocker.resolvedAt = new Date();
      blocker.resolvedBy = resolvedBy;
      blocker.resolution = resolution;
    }
    // Unblock if all blockers resolved
    if (record.blockers.every((b) => b.resolvedAt)) {
      record.status = 'pending';
      item.status = 'in-progress';
    }
  }

  setStatus(id: string, status: WorkItemStatus): void {
    this.requireItem(id).status = status;
  }

  getPhaseRecord(id: string, phaseId: PhaseId): PhaseRecord | undefined {
    return this.items.get(id)?.phases.find((p) => p.phaseId === phaseId);
  }

  getUnresolvedBlockers(id: string): Array<{ phase: PhaseId; blocker: Blocker }> {
    const item = this.items.get(id);
    if (!item) return [];
    return item.phases.flatMap((p) =>
      p.blockers
        .filter((b) => !b.resolvedAt)
        .map((blocker) => ({ phase: p.phaseId, blocker })),
    );
  }

  private requireItem(id: string): WorkItem {
    const item = this.items.get(id);
    if (!item) throw new Error(`WorkItem not found: ${id}`);
    return item;
  }
}

export { PHASE_ORDER };
