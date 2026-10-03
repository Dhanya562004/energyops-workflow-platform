export interface EndpointMetric {
  endpoint: string;
  count: number;
  avgLatency: number;
  errors: number;
}

export interface DistributionMetric {
  currentStage?: string;
  status?: string;
  count: number;
}

export interface SystemMetrics {
  totalRequests: number;
  failedRequests: number;
  successRate: number;
  avgLatencyMs: number;
  maxLatencyMs: number;
  frontendErrorCount: number;
  workflowTransitionFailures: number;
  version: string;
  environment: string;
  databaseDriver: string;
  uptimeSeconds: number;
  endpointMetrics: EndpointMetric[];
  stageDistribution: DistributionMetric[];
  statusDistribution: DistributionMetric[];
}
