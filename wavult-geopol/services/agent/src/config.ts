import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4500),
  HOST: z.string().default("0.0.0.0"),
  CORS_ORIGIN: z.string().default("*"),

  REDIS_URL: z.string().default("redis://redis:6379"),
  NEO4J_URI: z.string().default("bolt://neo4j:7687"),
  NEO4J_USER: z.string().default("neo4j"),
  NEO4J_PASSWORD: z.string().default("password"),
  NEO4J_DATABASE: z.string().default("neo4j"),

  KAFKA_BROKERS: z.string().default("kafka:9092"),
  KAFKA_CLIENT_ID: z.string().default("agent"),

  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-4-6"),
  COMPANY_CONTEXT: z.string().default("Wavult builds an influence intelligence platform."),

  INFLUENCE_API_URL: z.string().default("http://influence-api:4000"),
  AGENT_SCHEDULE_MS: z.coerce.number().default(60 * 60 * 1000),
  AGENT_TOP_N: z.coerce.number().default(10),
  AGENT_MAX_TASKS_PER_TARGET: z.coerce.number().default(2),
});

export const config = schema.parse(process.env);
