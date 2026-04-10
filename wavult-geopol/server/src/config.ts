import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default("*"),

  NEO4J_URI: z.string().default("bolt://neo4j:7687"),
  NEO4J_USER: z.string().default("neo4j"),
  NEO4J_PASSWORD: z.string().default("geopol-dev-password"),
  NEO4J_DATABASE: z.string().default("neo4j"),

  REDIS_URL: z.string().default("redis://redis:6379"),

  OPENSEARCH_URL: z.string().default("http://opensearch:9200"),
  OPENSEARCH_USER: z.string().optional(),
  OPENSEARCH_PASSWORD: z.string().optional(),
});

export const config = schema.parse(process.env);
export type Config = z.infer<typeof schema>;
