import neo4j, { Driver, Session } from "neo4j-driver";
import { config } from "../config.js";

let driver: Driver | null = null;

export function getDriver(): Driver {
  if (!driver) {
    driver = neo4j.driver(
      config.NEO4J_URI,
      neo4j.auth.basic(config.NEO4J_USER, config.NEO4J_PASSWORD),
      { disableLosslessIntegers: true }
    );
  }
  return driver;
}

export function neoSession(): Session {
  return getDriver().session({ database: config.NEO4J_DATABASE });
}

export async function pingNeo4j(): Promise<boolean> {
  const session = neoSession();
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
