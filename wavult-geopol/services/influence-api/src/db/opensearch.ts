import { Client } from "@opensearch-project/opensearch";
import { config } from "../config.js";

let client: Client | null = null;

export function getOpenSearch(): Client {
  if (!client) {
    client = new Client({
      node: config.OPENSEARCH_URL,
      auth:
        config.OPENSEARCH_USER && config.OPENSEARCH_PASSWORD
          ? { username: config.OPENSEARCH_USER, password: config.OPENSEARCH_PASSWORD }
          : undefined,
      ssl: { rejectUnauthorized: false },
    });
  }
  return client;
}

export async function pingOpenSearch(): Promise<boolean> {
  try {
    const res = await getOpenSearch().ping();
    return res.statusCode === 200;
  } catch {
    return false;
  }
}
