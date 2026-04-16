import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default("0.0.0.0"),
  CORS_ORIGIN: z.string().default("*"),

  NEO4J_URI: z.string().default("bolt://neo4j:7687"),
  NEO4J_USER: z.string().default("neo4j"),
  NEO4J_PASSWORD: z.string().default("password"),
  NEO4J_DATABASE: z.string().default("neo4j"),

  REDIS_URL: z.string().default("redis://redis:6379"),

  OPENSEARCH_URL: z.string().default("http://opensearch:9200"),
  OPENSEARCH_USER: z.string().optional(),
  OPENSEARCH_PASSWORD: z.string().optional(),

  KAFKA_BROKERS: z.string().default("kafka:9092"),
  KAFKA_CLIENT_ID: z.string().default("influence-api"),
  KAFKA_ENABLED: z
    .string()
    .default("true")
    .transform((v) => v === "true"),

  OUR_NODE_ID: z.string().default("our_node"),
});

export const config = schema.parse(process.env);
export type Config = z.infer<typeof schema>;
