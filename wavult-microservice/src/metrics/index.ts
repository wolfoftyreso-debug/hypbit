import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client';
import { config } from '../config';

export const registry = new Registry();

registry.setDefaultLabels({
  service: config.SERVICE_NAME,
  version: config.SERVICE_VERSION,
  env: config.NODE_ENV,
});

if (config.METRICS_ENABLED) {
  collectDefaultMetrics({ register: registry });
}

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [registry],
});

export const httpRequestDurationSeconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency in seconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registry],
});

export const kafkaMessagesProduced = new Counter({
  name: 'kafka_messages_produced_total',
  help: 'Total number of Kafka messages produced',
  labelNames: ['topic', 'status'] as const,
  registers: [registry],
});

export const kafkaMessagesConsumed = new Counter({
  name: 'kafka_messages_consumed_total',
  help: 'Total number of Kafka messages consumed',
  labelNames: ['topic', 'status'] as const,
  registers: [registry],
});

export const cacheOperations = new Counter({
  name: 'cache_operations_total',
  help: 'Cache operations grouped by result',
  labelNames: ['operation', 'result'] as const,
  registers: [registry],
});
