import { EventEmitter } from 'events';
import type {
  WorkItem,
  PhaseId,
  PhaseRecord,
  ValidationResult,
  Blocker,
  WorkItemType,
  InfraDomain,
  Approval,
} from './types.js';
import { WorkItemManager, PHASE_ORDER } from './work-item.js';
import { AuditService } from './audit.service.js';

export interface PhaseHandler {
  phaseId: PhaseId;
  /** Execute the phase. Returns output to store on PhaseRecord. */
  execute(item: WorkItem, input: unknown): Promise<unknown>;
  /** Validate the output. Returns validation results. */
  validate(item: WorkItem, output: unknown): Promise<ValidationResult[]>;
}

export interface LifecycleEngineConfig {
  /** Auto-proceed to next phase if all validations pass (default: true for non-P0) */
  autoAdvance?: boolean;
  /** Require explicit approval at Phase 08 */
  approvalRequired?: boolean;
}

/**
 * LifecycleEngine — orchestrates the 18-phase infrastructure execution lifecycle.
 *
 * Emits:
 *   "phase:start"     { workItemId, phaseId }
 *   "phase:pass"      { workItemId, phaseId, output }
 *   "phase:fail"      { workItemId, phaseId, error, blockers }
 *   "phase:blocked"   { workItemId, phaseId, blockers }
 *   "item:complete"   { workItemId }
 *   "item:rollback"   { workItemId, triggeredBy }
 *   "item:failed"     { workItemId, error }
 */
export class LifecycleEngine extends EventEmitter {
  private readonly workItems: WorkItemManager;
  private readonly audit: AuditService;
  private readonly handlers = new Map<PhaseId, PhaseHandler>();
  private readonly approvals = new Map<string, Approval>();
  private readonly config: Required<LifecycleEngineConfig>;

  constructor(config: LifecycleEngineConfig = {}) {
    super();
    this.workItems = new WorkItemManager();
    this.audit = new AuditService();
    this.config = {
      autoAdvance: config.autoAdvance ?? true,
      approvalRequired: config.approvalRequired ?? true,
    };
  }

  // ─── Registration ───────────────────────────────────────────────────────────

  /** Register a handler for a specific phase. Domain-specific logic goes here. */
  registerPhaseHandler(handler: PhaseHandler): void {
    this.handlers.set(handler.phaseId, handler);
  }

  // ─── Work Item Creation ─────────────────────────────────────────────────────

  createWorkItem(
    type: WorkItemType,
    domain: InfraDomain,
    title: string,
    description: string,
    requestedBy: string,
    metadata?: Record<string, unknown>,
  ): WorkItem {
    const item = this.workItems.create(type, domain, title, description, requestedBy, metadata);
    this.audit.audit('TRIGGER', item.id, `WorkItem created: ${title}`, {
      type,
      domain,
      requestedBy,
    });
    return item;
  }

  getWorkItem(id: string): WorkItem | undefined {
    return this.workItems.get(id);
  }

  listWorkItems(): WorkItem[] {
    return this.workItems.list();
  }

  // ─── Phase Execution ────────────────────────────────────────────────────────

  /**
   * Execute a single phase for a work item.
   * Validates output, records results, and emits events.
   */
  async executePhase(workItemId: string, phaseId: PhaseId, input?: unknown): Promise<PhaseRecord> {
    const item = this.requireItem(workItemId);
    const record = this.workItems.getPhaseRecord(workItemId, phaseId)!;

    // Approval gate check
    if (phaseId === 'APPROVAL_GATE' || this.requiresApprovalBefore(phaseId)) {
      const approval = this.approvals.get(workItemId);
      if (this.config.approvalRequired && (!approval || !approval.approved)) {
        const blocker: Blocker = {
          id: `blocker-approval-${Date.now()}`,
          description: 'Approval required before proceeding past APPROVAL_GATE',
          severity: 'P0',
        };
        this.workItems.addBlocker(workItemId, phaseId, blocker);
        this.emit('phase:blocked', { workItemId, phaseId, blockers: [blocker] });
        this.audit.warn(phaseId, workItemId, 'Blocked: awaiting approval');
        return record;
      }
    }

    // Start phase
    this.workItems.updatePhaseRecord(workItemId, phaseId, {
      status: 'running',
      startedAt: new Date(),
      input: input ?? null,
    });
    this.workItems.advancePhase(workItemId, phaseId);
    this.emit('phase:start', { workItemId, phaseId });
    this.audit.info(phaseId, workItemId, `Phase started`);

    // Execute handler (if registered)
    let output: unknown = null;
    const handler = this.handlers.get(phaseId);

    try {
      if (handler) {
        output = await handler.execute(item, input ?? null);
      }

      // Validate
      const validations = handler
        ? await handler.validate(item, output)
        : [];

      const p0Failures = validations.filter((v) => !v.passed && v.severity === 'P0');
      const p1Failures = validations.filter((v) => !v.passed && v.severity === 'P1');

      this.workItems.updatePhaseRecord(workItemId, phaseId, {
        output,
        validationResults: validations,
        completedAt: new Date(),
        status: p0Failures.length > 0 || p1Failures.length > 0 ? 'failed' : 'passed',
      });

      if (p0Failures.length > 0 || p1Failures.length > 0) {
        const blockers: Blocker[] = [...p0Failures, ...p1Failures].map((f) => ({
          id: `blocker-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          description: f.detail ?? f.check,
          severity: f.severity,
        }));

        for (const b of blockers) {
          this.workItems.addBlocker(workItemId, phaseId, b);
        }

        this.audit.error(phaseId, workItemId, `Phase failed validation`, {
          failures: p0Failures.length + p1Failures.length,
        });
        this.emit('phase:fail', { workItemId, phaseId, blockers });

        // Auto-trigger rollback for execution phases
        if (this.isExecutionPhase(phaseId)) {
          await this.triggerRollback(workItemId, phaseId);
        }
      } else {
        this.audit.info(phaseId, workItemId, `Phase passed`, {
          validations: validations.length,
        });
        this.emit('phase:pass', { workItemId, phaseId, output });
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.workItems.updatePhaseRecord(workItemId, phaseId, {
        status: 'failed',
        completedAt: new Date(),
        error: errMsg,
      });
      this.audit.error(phaseId, workItemId, `Phase threw exception: ${errMsg}`);
      this.emit('phase:fail', { workItemId, phaseId, error: errMsg });

      if (this.isExecutionPhase(phaseId)) {
        await this.triggerRollback(workItemId, phaseId);
      }
    }

    return this.workItems.getPhaseRecord(workItemId, phaseId)!;
  }

  /** Record an approval decision for a work item. */
  recordApproval(workItemId: string, approval: Approval): void {
    this.approvals.set(workItemId, approval);
    this.audit.audit('APPROVAL_GATE', workItemId, `Approval recorded`, {
      approved: approval.approved,
      approvedBy: approval.approvedBy,
      conditions: approval.conditions,
    });
    if (approval.approved) {
      this.workItems.setStatus(workItemId, 'approved');
    } else {
      this.workItems.setStatus(workItemId, 'rejected');
    }
  }

  /** Resolve a blocker on a phase. */
  resolveBlocker(
    workItemId: string,
    phaseId: PhaseId,
    blockerId: string,
    resolvedBy: string,
    resolution: string,
  ): void {
    this.workItems.resolveBlocker(workItemId, phaseId, blockerId, resolvedBy, resolution);
    this.audit.info(phaseId, workItemId, `Blocker resolved`, { blockerId, resolvedBy, resolution });
  }

  /** Get all unresolved blockers across all phases for a work item. */
  getBlockers(workItemId: string) {
    return this.workItems.getUnresolvedBlockers(workItemId);
  }

  /** Get audit log for a work item. */
  getAuditLog(workItemId: string) {
    return this.audit.getForWorkItem(workItemId);
  }

  // ─── Internal ───────────────────────────────────────────────────────────────

  private async triggerRollback(workItemId: string, triggeredBy: PhaseId): Promise<void> {
    this.audit.warn('ROLLBACK', workItemId, `Rollback triggered by ${triggeredBy}`);
    this.workItems.setStatus(workItemId, 'rolled-back');
    this.emit('item:rollback', { workItemId, triggeredBy });

    const rollbackHandler = this.handlers.get('ROLLBACK');
    if (rollbackHandler) {
      await this.executePhase(workItemId, 'ROLLBACK');
    }
  }

  private requireItem(id: string): WorkItem {
    const item = this.workItems.get(id);
    if (!item) throw new Error(`WorkItem not found: ${id}`);
    return item;
  }

  private isExecutionPhase(phaseId: PhaseId): boolean {
    return ['STAGED_EXECUTION', 'HEALTH_VALIDATION', 'INTEGRATION_VALIDATION', 'CUTOVER'].includes(phaseId);
  }

  private requiresApprovalBefore(phaseId: PhaseId): boolean {
    const idx = PHASE_ORDER.indexOf(phaseId);
    const approvalIdx = PHASE_ORDER.indexOf('APPROVAL_GATE');
    return idx > approvalIdx;
  }
}
