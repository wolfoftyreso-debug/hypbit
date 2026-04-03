import type { DeploymentPlan, DeploymentResult, DeploymentStep } from '../types.js';
import { checkHTTP, retryUntilHealthy } from '../health-check.js';

export interface BlueGreenConfig {
  /** URL of the green (new) environment for health checking before switch */
  greenHealthUrl: string;
  /** URL of the blue (current) environment — used for rollback validation */
  blueHealthUrl?: string;
  /** Seconds to monitor green after switch before declaring success (default: 60) */
  monitorAfterSwitchMs?: number;
  /** Called when the traffic switch should happen (e.g. update DNS or ALB) */
  switchTraffic: () => Promise<void>;
  /** Called to roll back to blue (e.g. revert DNS or ALB) */
  rollbackTraffic: () => Promise<void>;
}

/**
 * BlueGreenStrategy — deploy new version, verify, switch traffic, monitor.
 * Auto-rolls back if health checks fail after switch.
 *
 * Flow:
 *   1. Deploy green environment
 *   2. Health check green (before any traffic)
 *   3. Switch traffic → green
 *   4. Monitor green for monitorAfterSwitchMs
 *   5. If healthy → success
 *   6. If unhealthy → rollback to blue
 */
export class BlueGreenStrategy {
  constructor(private readonly bgConfig: BlueGreenConfig) {}

  async deploy(
    plan: DeploymentPlan,
    onStepUpdate: (step: DeploymentStep) => void,
  ): Promise<DeploymentResult> {
    const deploymentId = `bg-${Date.now()}`;
    const start = Date.now();
    const steps: DeploymentStep[] = [...plan.steps];
    let switched = false;

    const update = (id: string, patch: Partial<DeploymentStep>): void => {
      const step = steps.find((s) => s.id === id);
      if (step) {
        Object.assign(step, patch);
        onStepUpdate({ ...step });
      }
    };

    const findStep = (action: string): DeploymentStep | undefined =>
      steps.find((s) => s.action === action);

    try {
      // 1. Deploy green
      const deployStep = findStep('deploy-green');
      if (deployStep) {
        update(deployStep.id, { status: 'running', startedAt: new Date() });
        await new Promise((r) => setTimeout(r, 200)); // caller triggers actual deploy
        update(deployStep.id, { status: 'success', completedAt: new Date() });
      }

      // 2. Health check green (pre-switch)
      const preHcStep = findStep('health-check-green');
      if (preHcStep) {
        update(preHcStep.id, { status: 'running', startedAt: new Date() });
        const healthy = await retryUntilHealthy(
          () => checkHTTP(this.bgConfig.greenHealthUrl),
          12,
          5_000,
        );
        update(preHcStep.id, {
          status: healthy ? 'success' : 'failed',
          completedAt: new Date(),
          error: healthy ? undefined : 'Green environment failed pre-switch health check',
        });
        if (!healthy) throw new Error('Green environment not healthy before switch');
      }

      // 3. Switch traffic
      const switchStep = findStep('switch-traffic');
      if (switchStep) {
        update(switchStep.id, { status: 'running', startedAt: new Date() });
        await this.bgConfig.switchTraffic();
        switched = true;
        update(switchStep.id, { status: 'success', completedAt: new Date() });
      }

      // 4. Monitor post-switch
      const monitorStep = findStep('monitor-post-switch');
      if (monitorStep) {
        update(monitorStep.id, { status: 'running', startedAt: new Date() });
        const monitorMs = this.bgConfig.monitorAfterSwitchMs ?? 60_000;
        const deadline = Date.now() + monitorMs;
        let healthy = true;

        while (Date.now() < deadline) {
          const result = await checkHTTP(this.bgConfig.greenHealthUrl);
          if (!result.healthy) { healthy = false; break; }
          await new Promise((r) => setTimeout(r, 10_000));
        }

        update(monitorStep.id, {
          status: healthy ? 'success' : 'failed',
          completedAt: new Date(),
          error: healthy ? undefined : 'Green became unhealthy after traffic switch',
        });
        if (!healthy) throw new Error('Post-switch monitoring failed — rolling back');
      }

      return {
        success: true,
        deploymentId,
        planId: plan.id,
        status: 'success',
        duration: Date.now() - start,
        steps,
        rollbackAvailable: true,
      };
    } catch (err) {
      // Auto-rollback if we already switched
      if (switched) {
        const rollbackStep = findStep('rollback');
        if (rollbackStep) {
          update(rollbackStep.id, { status: 'running', startedAt: new Date() });
          try {
            await this.bgConfig.rollbackTraffic();
            update(rollbackStep.id, { status: 'success', completedAt: new Date() });
          } catch (rollbackErr) {
            update(rollbackStep.id, {
              status: 'failed',
              completedAt: new Date(),
              error: rollbackErr instanceof Error ? rollbackErr.message : String(rollbackErr),
            });
          }
        }
      }

      return {
        success: false,
        deploymentId,
        planId: plan.id,
        status: 'rolled-back',
        duration: Date.now() - start,
        steps,
        rollbackAvailable: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
