import neo4j, { Driver } from "neo4j-driver";
import { config } from "../config.js";

let driver: Driver | null = null;

function getDriver(): Driver {
  if (!driver) {
    driver = neo4j.driver(
      config.NEO4J_URI,
      neo4j.auth.basic(config.NEO4J_USER, config.NEO4J_PASSWORD),
      { disableLosslessIntegers: true }
    );
  }
  return driver;
}

export type Target = {
  id: string;
  name: string;
  influence_score: number;
  relevance_score: number;
  tags: string[];
};

export async function topTargets(limit: number): Promise<Target[]> {
  const session = getDriver().session({ database: config.NEO4J_DATABASE });
  try {
    const result = await session.run(
      `MATCH (p:Person)
       WHERE coalesce(p.visibility_org, true) = true
         AND p.id <> 'our_node'
       RETURN p.id AS id, p.name AS name,
              coalesce(p.influence_score, 0) AS influence_score,
              coalesce(p.relevance_score, 0) AS relevance_score,
              coalesce(p.tags, []) AS tags
       ORDER BY coalesce(p.relevance_score, 0) DESC,
                coalesce(p.influence_score, 0) DESC
       LIMIT $limit`,
      { limit }
    );
    return result.records.map((r) => ({
      id: r.get("id"),
      name: r.get("name"),
      influence_score: r.get("influence_score"),
      relevance_score: r.get("relevance_score"),
      tags: r.get("tags") as string[],
    }));
  } finally {
    await session.close();
  }
}

export async function pingNeo4j(): Promise<boolean> {
  const session = getDriver().session({ database: config.NEO4J_DATABASE });
  try {
    await session.run("RETURN 1");
    return true;
  } catch {
    return false;
  } finally {
    await session.close();
  }
}

export async function closeNeo4j(): Promise<void> {
  if (driver) await driver.close();
  driver = null;
}
