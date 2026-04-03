export type DeploymentTargetType = 'ecs' | 'pages' | 's3';
export type DeploymentStrategy = 'blue-green' | 'rolling' | 'direct';
export type StepStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped';
export type DeploymentStatus = 'pending' | 'running' | 'success' | 'failed' | 'rolled-back';

export interface ECSTargetConfig {
  cluster: string;
  service: string;
  taskDefinition: string;
  region: string;
}

export interface PagesTargetConfig {
  projectName: string;
  branch?: string;
}

export interface S3TargetConfig {
  bucket: string;
  prefix?: string;
  region: string;
  cloudfrontDistributionId?: string;
}

export interface DeploymentTarget {
  id: string;
  name: string;
  type: DeploymentTargetType;
  config: ECSTargetConfig | PagesTargetConfig | S3TargetConfig;
  healthCheckUrl?: string;
}

export interface DeploymentStep {
  id: string;
  name: string;
  action: string;
  status: StepStatus;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  output?: string;
}

export interface DeploymentPlan {
  id: string;
  name: string;
  targets: DeploymentTarget[];
  strategy: DeploymentStrategy;
  steps: DeploymentStep[];
  createdAt: Date;
  triggeredBy?: string;
}

export interface DeploymentResult {
  success: boolean;
  deploymentId: string;
  planId: string;
  status: DeploymentStatus;
  duration: number;
  steps: DeploymentStep[];
  rollbackAvailable: boolean;
  error?: string;
}

export interface HealthResult {
  healthy: boolean;
  statusCode?: number;
  latencyMs?: number;
  error?: string;
}
