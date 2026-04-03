import { EventEmitter } from 'events';
import type {
  DeploymentPlan,
  DeploymentResult,
  DeploymentStatus,
  DeploymentStep,
} from './types.js';
import { DirectStrategy } from './strategies/direct.js';
import { BlueGreenStrategy, type BlueGreenConfig } from './strategies/blue-green.js';

export interface DeployEngineConfig {
  /** Max deployment history entries kept in memory (default: 100) */
  maxHistory?: number;
}

export interface DeploymentRecord {
  plan: DeploymentPlan;
  result?: DeploymentResult;
  status: DeploymentStatus;
  startedAt: Date;
}

/**
 * DeployEngine — orchestrates deployments across all strategies.
 *
 * Emits:
 *   "step:start"       (step: DeploymentStep)
 *   "step:complete"    (step: DeploymentStep)
 *   "step:fail"        (step: DeploymentStep)
 *   "deploy:complete"  (result: DeploymentResult)
 *   "deploy:rollback"  (result: DeploymentResult)
 */
export class DeployEngine extends EventEmitter {
  private readonly history = new Map<string, DeploymentRecord>();
  private readonly maxHistory: number;

  constructor(config: DeployEngineConfig = {}) {
    super();
    this.maxHistory = config.maxHistory ?? 100;
  }

  /**
   * Run a deployment plan according to its strategy.
   */
  async deploy(plan: DeploymentPlan, blueGreenConfig?: BlueGreenConfig): Promise<DeploymentResult> {
    this.recordStart(plan);

    const onStepUpdate = (step: DeploymentStep): void => {
      if (step.status === 'running') this.emit('step:start', step);
      else if (step.status === 'success') this.emit('step:complete', step);
      else if (step.status === 'failed') this.emit('step:fail', step);
    };

    let result: DeploymentResult;

    if (plan.strategy === 'blue-green') {
      if (!blueGreenConfig) {
        throw new Error('BlueGreenConfig required for blue-green strategy');
      }
      const strategy = new BlueGreenStrategy(blueGreenConfig);
      result = await strategy.deploy(plan, onStepUpdate);
    } else {
      const strategy = new DirectStrategy();
      result = await strategy.deploy(plan, onStepUpdate);
    }

    this.recordResult(plan.id, result);

    if (result.status === 'rolled-back') {
      this.emit('deploy:rollback', result);
    } else {
      this.emit('deploy:complete', result);
    }

    return result;
  }

  /** Get current status of a deployment by plan ID. */
  getStatus(planId: string): DeploymentStatus | undefined {
    return this.history.get(planId)?.status;
  }

  /** Get full deployment record. */
  getDeployment(planId: string): DeploymentRecord | undefined {
    return this.history.get(planId);
  }

  /** List all deployment records (newest first). */
  listDeployments(): DeploymentRecord[] {
    return [...this.history.values()].sort(
      (a, b) => b.startedAt.getTime() - a.startedAt.getTime(),
    );
  }

  private recordStart(plan: DeploymentPlan): void {
    this.history.set(plan.id, {
      plan,
      status: 'running',
      startedAt: new Date(),
    });
    this.pruneHistory();
  }

  private recordResult(planId: string, result: DeploymentResult): void {
    const record = this.history.get(planId);
    if (record) {
      record.result = result;
      record.status = result.status;
    }
  }

  private pruneHistory(): void {
    if (this.history.size > this.maxHistory) {
      const oldest = [...this.history.keys()][0];
      if (oldest) this.history.delete(oldest);
    }
  }
}
