import 'dotenv/config';
import { z } from 'zod';

const ConfigSchema = z.object({
  // service
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  SERVICE_NAME: z.string().default('wavult-microservice'),
  SERVICE_VERSION: z.string().default('1.0.0'),
  PORT: z.coerce.number().int().positive().default(8080),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),

  // postgres
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(20),
  DATABASE_SSL: z.coerce.boolean().default(false),

  // redis
  REDIS_URL: z.string().url(),
  REDIS_KEY_PREFIX: z.string().default('wavult:'),

  // kafka
  KAFKA_BROKERS: z.string().transform((s) => s.split(',').map((x) => x.trim())),
  KAFKA_CLIENT_ID: z.string().default('wavult-microservice'),
  KAFKA_GROUP_ID: z.string().default('wavult-microservice-consumer'),
  KAFKA_TOPIC_EVENTS: z.string().default('wavult.events.v1'),
  KAFKA_SSL: z.coerce.boolean().default(false),
  KAFKA_SASL_MECHANISM: z.enum(['plain', 'scram-sha-256', 'scram-sha-512', '']).optional(),
  KAFKA_SASL_USERNAME: z.string().optional(),
  KAFKA_SASL_PASSWORD: z.string().optional(),

  // aws
  AWS_REGION: z.string().default('eu-north-1'),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_SQS_QUEUE_URL: z.string().optional(),
  AWS_SECRETS_MANAGER_ID: z.string().optional(),

  // observability
  OTEL_ENABLED: z.coerce.boolean().default(true),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  METRICS_ENABLED: z.coerce.boolean().default(true),

  // security
  API_KEY: z.string().min(8),
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
});

export type Config = z.infer<typeof ConfigSchema>;

const parsed = ConfigSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config: Config = parsed.data;

export const isProduction = config.NODE_ENV === 'production';
export const isDevelopment = config.NODE_ENV === 'development';
export const isTest = config.NODE_ENV === 'test';
