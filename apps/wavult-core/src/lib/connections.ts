export const REDIS_URL     = process.env.REDIS_URL     || "redis://redis.wavult.local:6379"
export const KAFKA_BROKERS = process.env.KAFKA_BROKERS || "kafka.wavult.local:9092"
export const DATABASE_URL  = process.env.EOS_DATABASE_URL || process.env.DATABASE_URL || ""
