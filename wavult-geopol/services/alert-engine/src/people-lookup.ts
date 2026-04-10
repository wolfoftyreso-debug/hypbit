import neo4j, { Driver } from "neo4j-driver";
import type { PersonContext } from "./shared/rules.js";

const URI = process.env.NEO4J_URI ?? "bolt://neo4j:7687";
const USER = process.env.NEO4J_USER ?? "neo4j";
const PASS = process.env.NEO4J_PASSWORD ?? "password";
const DB = process.env.NEO4J_DATABASE ?? "neo4j";

let driver: Driver | null = null;

function getDriver(): Driver {
  if (!driver) {
    driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASS), { disableLosslessIntegers: true });
  }
  return driver;
}

export async function lookupPeople(ids: string[]): Promise<PersonContext[]> {
  if (ids.length === 0) return [];
  const session = getDriver().session({ database: DB });
  try {
    const result = await session.run(
      `MATCH (p:Person) WHERE p.id IN $ids
       RETURN p.id AS id, p.name AS name,
              coalesce(p.influence_score, 0) AS influence_score,
              coalesce(p.relevance_score, 0) AS relevance_score`,
      { ids }
    );
    return result.records.map((r) => ({
      id: r.get("id"),
      name: r.get("name"),
      influence_score: r.get("influence_score"),
      relevance_score: r.get("relevance_score"),
    }));
  } catch (err) {
    console.warn("[alert-engine] Neo4j lookup failed:", (err as Error).message);
    return [];
  } finally {
    await session.close();
  }
}

export async function closeNeo(): Promise<void> {
  if (driver) await driver.close();
}
