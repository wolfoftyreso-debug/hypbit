import { neoSession } from "./db/neo4j.js";
import type { RelationEvidence } from "./shared/schemas.js";

/**
 * A candidate is a person we believe has a hidden / undiscovered link
 * to the seed person, together with the evidence that brought them up.
 */
export type Candidate = {
  person_id: string;
  person_name: string;
  evidence: RelationEvidence[];
};

type PersonInfo = {
  id: string;
  name?: string;
  influence_score?: number;
  relevance_score?: number;
  tags?: string[];
  lat?: number;
  lng?: number;
};

export async function getPerson(id: string): Promise<PersonInfo | null> {
  const session = neoSession();
  try {
    const result = await session.run(
      `MATCH (p:Person {id:$id}) RETURN p LIMIT 1`,
      { id }
    );
    if (result.records.length === 0) return null;
    return result.records[0].get("p").properties as PersonInfo;
  } finally {
    await session.close();
  }
}

/**
 * Find candidate related people via the three graph strategies:
 *
 *   1. COMMON_NEIGHBORS: (seed)-[:CONNECTED]-(x)-[:CONNECTED]-(candidate)
 *      but NOT already directly connected.
 *   2. SAME_ORG:         both people WORKS_FOR the same organisation.
 *   3. SAME_EVENT:       both people have ATTENDED the same Event.
 *
 * Results are already deduped by candidate id; evidence is merged.
 * We also exclude candidates we have already discovered via an existing
 * :DISCOVERED_CONNECTION edge, so each run only produces new pairs.
 */
export async function findCandidates(
  seedId: string,
  limit: number
): Promise<Candidate[]> {
  const session = neoSession();
  try {
    const result = await session.run(
      `
      MATCH (a:Person {id:$seedId})

      // 1. Common neighbours via :CONNECTED
      OPTIONAL MATCH (a)-[:CONNECTED]-(m:Person)-[:CONNECTED]-(cn:Person)
      WHERE cn.id <> a.id
        AND NOT (a)-[:CONNECTED]-(cn)
        AND NOT (a)-[:DISCOVERED_CONNECTION]-(cn)
      WITH a, cn, collect(DISTINCT m.id) AS mutuals

      WITH a,
           collect({
             id: cn.id, name: cn.name,
             kind: 'COMMON_NEIGHBORS',
             weight: CASE WHEN size(mutuals) > 0 THEN toFloat(size(mutuals)) / 5.0 ELSE 0.0 END,
             details: { mutuals: mutuals }
           }) AS cn_evidence

      // 2. Same organisation
      OPTIONAL MATCH (a)-[:WORKS_FOR]->(o:Organization)<-[:WORKS_FOR]-(co:Person)
      WHERE co.id <> a.id
        AND NOT (a)-[:DISCOVERED_CONNECTION]-(co)
      WITH a, cn_evidence, co, collect(DISTINCT o.id) AS shared_orgs

      WITH a, cn_evidence,
           collect({
             id: co.id, name: co.name,
             kind: 'SAME_ORG',
             weight: CASE WHEN size(shared_orgs) > 0 THEN 0.8 ELSE 0.0 END,
             details: { orgs: shared_orgs }
           }) AS org_evidence

      // 3. Same event
      OPTIONAL MATCH (a)-[:ATTENDED]->(e:Event)<-[:ATTENDED]-(ce:Person)
      WHERE ce.id <> a.id
        AND NOT (a)-[:DISCOVERED_CONNECTION]-(ce)
      WITH a, cn_evidence, org_evidence, ce, collect(DISTINCT e.id) AS shared_events

      WITH cn_evidence, org_evidence,
           collect({
             id: ce.id, name: ce.name,
             kind: 'SAME_EVENT',
             weight: CASE WHEN size(shared_events) > 0 THEN 0.7 ELSE 0.0 END,
             details: { events: shared_events }
           }) AS event_evidence

      // Combine and dedupe per candidate id
      UNWIND cn_evidence + org_evidence + event_evidence AS row
      WITH row WHERE row.id IS NOT NULL AND row.weight > 0
      RETURN row.id AS id, row.name AS name,
             collect({ kind: row.kind, weight: row.weight, details: row.details }) AS evidence
      LIMIT $limit
      `,
      { seedId, limit: Math.max(1, limit) }
    );

    const merged = new Map<string, Candidate>();
    for (const record of result.records) {
      const id = record.get("id") as string | null;
      if (!id) continue;
      const name = (record.get("name") as string | null) ?? id;
      const evidence = record.get("evidence") as RelationEvidence[];

      const existing = merged.get(id);
      if (existing) {
        existing.evidence.push(...evidence);
      } else {
        merged.set(id, { person_id: id, person_name: name, evidence: [...evidence] });
      }
    }

    return Array.from(merged.values()).slice(0, limit);
  } finally {
    await session.close();
  }
}

/**
 * Top-N people by relevance × influence — the seeds for the
 * scheduled discovery pass.
 */
export async function topTargets(limit: number): Promise<string[]> {
  const session = neoSession();
  try {
    const result = await session.run(
      `MATCH (p:Person)
       WHERE coalesce(p.visibility_org, true) = true
         AND p.id <> 'our_node'
       RETURN p.id AS id
       ORDER BY coalesce(p.relevance_score, 0) DESC,
                coalesce(p.influence_score, 0) DESC
       LIMIT $limit`,
      { limit }
    );
    return result.records.map((r) => r.get("id") as string);
  } finally {
    await session.close();
  }
}
