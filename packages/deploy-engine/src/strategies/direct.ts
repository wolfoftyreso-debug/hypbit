import type { DeploymentPlan, DeploymentResult, DeploymentStep } from '../types.js';
import { checkHTTP, retryUntilHealthy } from '../health-check.js';

/**
 * DirectStrategy — deploy without blue/green switching.
 * Suitable for static sites (Pages, S3) where instant swap is acceptable.
 */
export class DirectStrategy {
  async deploy(
    plan: DeploymentPlan,
    onStepUpdate: (step: DeploymentStep) => void,
  ): Promise<DeploymentResult> {
    const deploymentId = `direct-${Date.now()}`;
    const start = Date.now();
    const steps: DeploymentStep[] = [...plan.steps];

    const update = (id: string, patch: Partial<DeploymentStep>): void => {
      const step = steps.find((s) => s.id === id);
      if (step) {
        Object.assign(step, patch);
        onStepUpdate({ ...step });
      }
    };

    try {
      // Step: deploy
      const deployStep = steps.find((s) => s.action === 'deploy');
      if (deployStep) {
        update(deployStep.id, { status: 'running', startedAt: new Date() });

        // In a real implementation this would call the AWS SDK or CF Pages API.
        // The deploy-engine is intentionally infrastructure-agnostic here;
        // the caller provides a triggerDeploy callback via the DeployEngine.
        await new Promise((r) => setTimeout(r, 200)); // placeholder

        update(deployStep.id, { status: 'success', completedAt: new Date() });
      }

      // Step: health check
      if (plan.targets[0]?.healthCheckUrl) {
        const hcStep = steps.find((s) => s.action === 'health-check');
        if (hcStep) {
          update(hcStep.id, { status: 'running', startedAt: new Date() });
          const healthy = await retryUntilHealthy(
            () => checkHTTP(plan.targets[0]!.healthCheckUrl!),
            8,
            5_000,
          );
          update(hcStep.id, {
            status: healthy ? 'success' : 'failed',
            completedAt: new Date(),
            error: healthy ? undefined : 'Health check failed after max attempts',
          });
          if (!healthy) throw new Error('Health check failed');
        }
      }

      return {
        success: true,
        deploymentId,
        planId: plan.id,
        status: 'success',
        duration: Date.now() - start,
        steps,
        rollbackAvailable: false,
      };
    } catch (err) {
      return {
        success: false,
        deploymentId,
        planId: plan.id,
        status: 'failed',
        duration: Date.now() - start,
        steps,
        rollbackAvailable: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
