import neo4j, { Driver } from "neo4j-driver";

const URI = process.env.NEO4J_URI ?? "bolt://neo4j:7687";
const USER = process.env.NEO4J_USER ?? "neo4j";
const PASS = process.env.NEO4J_PASSWORD ?? "password";
const DB = process.env.NEO4J_DATABASE ?? "neo4j";
const OUR_NODE = process.env.OUR_NODE_ID ?? "our_node";

let driver: Driver | null = null;

function getDriver(): Driver {
  if (!driver) {
    driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASS), { disableLosslessIntegers: true });
  }
  return driver;
}

export async function shortestPath(targetId: string): Promise<string[]> {
  const session = getDriver().session({ database: DB });
  try {
    const result = await session.run(
      `MATCH path = shortestPath((me:Person {id:$me})-[:CONNECTED*..5]-(target:Person {id:$target}))
       RETURN [n IN nodes(path) | n.id] AS node_ids`,
      { me: OUR_NODE, target: targetId }
    );
    if (result.records.length === 0) return [];
    return result.records[0].get("node_ids") as string[];
  } catch {
    return [];
  } finally {
    await session.close();
  }
}

export async function closeNeo(): Promise<void> {
  if (driver) await driver.close();
}
