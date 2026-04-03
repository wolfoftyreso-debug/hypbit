import { CloudflareClient } from './client.js';

export interface PagesProject {
  id: string;
  name: string;
  domains: string[];
  subdomain: string;
  production_branch: string;
  created_on: string;
  latest_deployment?: PagesDeployment;
}

export interface PagesDeployment {
  id: string;
  url: string;
  environment: 'production' | 'preview';
  created_on: string;
  modified_on: string;
  latest_stage: {
    name: string;
    status: 'idle' | 'active' | 'canceled' | 'success' | 'failure';
    ended_on?: string;
  };
  stages: Array<{
    name: string;
    status: string;
    started_on?: string;
    ended_on?: string;
  }>;
}

export class PagesService {
  constructor(
    private readonly client: CloudflareClient,
    private readonly accountId: string,
  ) {}

  /** List all Pages projects. */
  async listProjects(): Promise<PagesProject[]> {
    const res = await this.client.cfFetch<PagesProject[]>(
      `/accounts/${this.accountId}/pages/projects`,
      'pages',
    );
    return res.result;
  }

  /** Get a single Pages project by name. */
  async getProject(name: string): Promise<PagesProject> {
    const res = await this.client.cfFetch<PagesProject>(
      `/accounts/${this.accountId}/pages/projects/${name}`,
      'pages',
    );
    return res.result;
  }

  /** Get recent deployments for a project. */
  async getDeployments(name: string, limit = 10): Promise<PagesDeployment[]> {
    const res = await this.client.cfFetch<PagesDeployment[]>(
      `/accounts/${this.accountId}/pages/projects/${name}/deployments?per_page=${limit}`,
      'pages',
    );
    return res.result;
  }

  /** Trigger a new deployment. */
  async triggerDeploy(name: string): Promise<PagesDeployment> {
    const res = await this.client.cfFetch<PagesDeployment>(
      `/accounts/${this.accountId}/pages/projects/${name}/deployments`,
      'pages',
      { method: 'POST', body: JSON.stringify({}) },
    );
    return res.result;
  }

  /** Get the latest deployment for a project. */
  async getLatestDeployment(name: string): Promise<PagesDeployment | undefined> {
    const deployments = await this.getDeployments(name, 1);
    return deployments[0];
  }

  /**
   * Poll until a deployment reaches success or failure.
   * @param timeoutMs - Maximum wait time in ms (default: 5 minutes)
   */
  async waitForDeployment(
    projectName: string,
    deploymentId: string,
    timeoutMs = 300_000,
  ): Promise<PagesDeployment> {
    const deadline = Date.now() + timeoutMs;
    const intervalMs = 5_000;

    while (Date.now() < deadline) {
      const res = await this.client.cfFetch<PagesDeployment>(
        `/accounts/${this.accountId}/pages/projects/${projectName}/deployments/${deploymentId}`,
        'pages',
      );
      const deployment = res.result;
      const status = deployment.latest_stage?.status;

      if (status === 'success' || status === 'failure' || status === 'canceled') {
        return deployment;
      }

      await new Promise((r) => setTimeout(r, intervalMs));
    }

    throw new Error(
      `Deployment ${deploymentId} did not complete within ${timeoutMs}ms`,
    );
  }
}
