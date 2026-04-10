import neo4j, { Driver } from "neo4j-driver";
import { config } from "../config.js";

let driver: Driver | null = null;

export function getNeo4j(): Driver {
  if (!driver) {
    driver = neo4j.driver(
      config.NEO4J_URI,
      neo4j.auth.basic(config.NEO4J_USER, config.NEO4J_PASSWORD),
      { disableLosslessIntegers: true }
    );
  }
  return driver;
}

export async function pingNeo4j(): Promise<boolean> {
  try {
    const session = getNeo4j().session({ database: config.NEO4J_DATABASE });
    try {
      await session.run("RETURN 1 AS ok");
      return true;
    } finally {
      await session.close();
    }
  } catch {
    return false;
  }
}

export async function closeNeo4j(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}
