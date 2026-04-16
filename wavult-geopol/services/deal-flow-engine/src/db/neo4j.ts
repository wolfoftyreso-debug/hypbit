import neo4j, { Driver, Session } from "neo4j-driver";
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

function session(): Session {
  return getDriver().session({ database: config.NEO4J_DATABASE });
}

export type PersonRow = {
  id: string;
  name: string;
  tags: string[];
  influence_score: number;
  relevance_score: number;
};

export async function getPerson(id: string): Promise<PersonRow | null> {
  const s = session();
  try {
    const result = await s.run(
      `MATCH (p:Person {id:$id})
       RETURN p.id AS id, p.name AS name,
              coalesce(p.tags, []) AS tags,
              coalesce(p.influence_score, 0) AS influence_score,
              coalesce(p.relevance_score, 0) AS relevance_score
       LIMIT 1`,
      { id }
    );
    if (result.records.length === 0) return null;
    const r = result.records[0];
    return {
      id: r.get("id"),
      name: r.get("name"),
      tags: r.get("tags") as string[],
      influence_score: r.get("influence_score"),
      relevance_score: r.get("relevance_score"),
    };
  } finally {
    await s.close();
  }
}

export async function pingNeo4j(): Promise<boolean> {
  const s = session();
  try {
    await s.run("RETURN 1");
    return true;
  } catch {
    return false;
  } finally {
    await s.close();
  }
}

export async function closeNeo4j(): Promise<void> {
  if (driver) await driver.close();
  driver = null;
}
