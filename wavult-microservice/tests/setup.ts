// Jest setup — provide required env vars so config/index.ts doesn't exit.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.KAFKA_BROKERS = 'localhost:9092';
process.env.API_KEY = 'test-api-key';
process.env.OTEL_ENABLED = 'false';
process.env.METRICS_ENABLED = 'false';
process.env.LOG_LEVEL = 'fatal';
