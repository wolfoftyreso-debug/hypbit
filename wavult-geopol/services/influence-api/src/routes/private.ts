import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { neoSession } from "../db/neo4j.js";

/**
 * Private layer — user-scoped data that sits *beside* the neutral
 * business influence graph. Nothing here is allowed to mutate core
 * Person scores, visibility, or ranking. All queries are scoped by
 * the `x-user-id` header.
 *
 * Schema:
 *   (:User {id})-[:PRIVATE_CONTACT]->(:Person)
 *   (:User {id})-[:OWNS]->(:PrivateNote {id, body, createdAt})-[:ABOUT]->(:Person)
 *   (:User {id})-[:HAS_LIST]->(:PrivateList {id, name})-[:INCLUDES]->(:Person)
 */

function getUserId(req: FastifyRequest): string {
  const h = req.headers["x-user-id"];
  if (typeof h === "string" && h.length > 0) return h;
  return "anonymous";
}

const addContactSchema = z.object({ personId: z.string().min(1) });

const noteSchema = z.object({
  personId: z.string().min(1),
  body: z.string().min(1).max(4000),
});

const listSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  personIds: z.array(z.string()).default([]),
});

export async function privateRoutes(app: FastifyInstance) {
  // Add a person to the caller's private contacts
  app.post("/private/contacts", async (req, reply) => {
    const { personId } = addContactSchema.parse(req.body);
    const userId = getUserId(req);
    const session = neoSession();
    try {
      await session.run(
        `MERGE (u:User {id:$userId})
         WITH u
         MATCH (p:Person {id:$personId})
         MERGE (u)-[:PRIVATE_CONTACT]->(p)`,
        { userId, personId }
      );
      reply.code(201);
      return { ok: true };
    } finally {
      await session.close();
    }
  });

  // List the caller's private contacts
  app.get("/private/contacts", async (req) => {
    const userId = getUserId(req);
    const session = neoSession();
    try {
      const result = await session.run(
        `MATCH (u:User {id:$userId})-[:PRIVATE_CONTACT]->(p:Person)
         RETURN p
         ORDER BY p.name`,
        { userId }
      );
      return result.records.map((r) => r.get("p").properties);
    } finally {
      await session.close();
    }
  });

  // Create a private note about a person
  app.post("/private/notes", async (req, reply) => {
    const { personId, body } = noteSchema.parse(req.body);
    const userId = getUserId(req);
    const session = neoSession();
    try {
      const noteId = `${userId}:${personId}:${Date.now()}`;
      await session.run(
        `MERGE (u:User {id:$userId})
         WITH u
         MATCH (p:Person {id:$personId})
         CREATE (u)-[:OWNS]->(n:PrivateNote {id:$noteId, body:$body, createdAt:timestamp()})-[:ABOUT]->(p)`,
        { userId, personId, noteId, body }
      );
      reply.code(201);
      return { id: noteId };
    } finally {
      await session.close();
    }
  });

  app.get("/private/notes/:personId", async (req) => {
    const { personId } = req.params as { personId: string };
    const userId = getUserId(req);
    const session = neoSession();
    try {
      const result = await session.run(
        `MATCH (u:User {id:$userId})-[:OWNS]->(n:PrivateNote)-[:ABOUT]->(p:Person {id:$personId})
         RETURN n
         ORDER BY n.createdAt DESC`,
        { userId, personId }
      );
      return result.records.map((r) => r.get("n").properties);
    } finally {
      await session.close();
    }
  });

  // Create/update a private list
  app.put("/private/lists", async (req) => {
    const { id, name, personIds } = listSchema.parse(req.body);
    const userId = getUserId(req);
    const session = neoSession();
    try {
      await session.run(
        `MERGE (u:User {id:$userId})
         MERGE (u)-[:HAS_LIST]->(l:PrivateList {id:$id})
         SET l.name = $name
         WITH l
         OPTIONAL MATCH (l)-[r:INCLUDES]->(:Person)
         DELETE r
         WITH l
         UNWIND $personIds AS pid
         MATCH (p:Person {id:pid})
         MERGE (l)-[:INCLUDES]->(p)`,
        { userId, id, name, personIds }
      );
      return { ok: true };
    } finally {
      await session.close();
    }
  });

  app.get("/private/lists", async (req) => {
    const userId = getUserId(req);
    const session = neoSession();
    try {
      const result = await session.run(
        `MATCH (u:User {id:$userId})-[:HAS_LIST]->(l:PrivateList)
         OPTIONAL MATCH (l)-[:INCLUDES]->(p:Person)
         RETURN l, collect(p.id) AS personIds`,
        { userId }
      );
      return result.records.map((r) => ({
        ...r.get("l").properties,
        personIds: r.get("personIds"),
      }));
    } finally {
      await session.close();
    }
  });
}
