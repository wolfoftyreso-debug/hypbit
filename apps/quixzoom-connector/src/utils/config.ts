// Centralised runtime config. All env reads go through here.

export interface Config {
  port: number;
  nodeEnv: string;
  redisUrl: string;
  kafkaBrokers: string[];
  kafkaClientId: string;
  kafkaConsumerGroup: string;
  mapboxToken: string;
  apiKey: string;
  traceHeader: string;
  defaultRadiusM: number;
  defaultTimeoutS: number;
  maxRetries: number;
}

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function listEnv(name: string, fallback: string[]): string[] {
  const raw = process.env[name];
  if (!raw) return fallback;
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export const config: Config = {
  port: intEnv('PORT', 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  kafkaBrokers: listEnv('KAFKA_BROKERS', ['localhost:9092']),
  kafkaClientId: process.env.KAFKA_CLIENT_ID ?? 'quixzoom-connector',
  kafkaConsumerGroup:
    process.env.KAFKA_CONSUMER_GROUP ?? 'quixzoom-connector-group',
  mapboxToken: process.env.MAPBOX_TOKEN ?? '',
  apiKey: process.env.QUIXZOOM_API_KEY ?? '',
  traceHeader: 'x-trace-id',
  defaultRadiusM: intEnv('DEFAULT_RADIUS_M', 100),
  defaultTimeoutS: intEnv('DEFAULT_TIMEOUT_S', 300),
  maxRetries: intEnv('MAX_RETRIES', 3),
};
