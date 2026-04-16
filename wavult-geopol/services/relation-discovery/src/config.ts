import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4300),
  HOST: z.string().default("0.0.0.0"),
  CORS_ORIGIN: z.string().default("*"),

  NEO4J_URI: z.string().default("bolt://neo4j:7687"),
  NEO4J_USER: z.string().default("neo4j"),
  NEO4J_PASSWORD: z.string().default("password"),
  NEO4J_DATABASE: z.string().default("neo4j"),

  KAFKA_BROKERS: z.string().default("kafka:9092"),
  KAFKA_CLIENT_ID: z.string().default("relation-discovery"),
  KAFKA_GROUP_ID: z.string().default("relation-discovery"),

  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-4-6"),
  COMPANY_CONTEXT: z.string().default("Wavult builds an influence intelligence platform."),

  DISCOVERY_SCHEDULE_MS: z.coerce.number().default(60 * 60 * 1000),
  DISCOVERY_TOP_N: z.coerce.number().default(20),
  DISCOVERY_MAX_CANDIDATES_PER_PERSON: z.coerce.number().default(8),
  DISCOVERY_MIN_CONFIDENCE: z.coerce.number().default(0.3),
});

export const config = schema.parse(process.env);
