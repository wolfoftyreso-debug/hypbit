import { ulid } from "ulid";
import { config } from "./config.js";
import { getPerson, findCandidates } from "./candidates.js";
import { analyzeRelation } from "./analyst.js";
import { neoSession } from "./db/neo4j.js";
import type { DiscoveredRelation } from "./shared/schemas.js";

/** Upsert a DISCOVERED_CONNECTION edge in canonical (low→high) order. */
async function persist(rel: DiscoveredRelation): Promise<void> {
  const session = neoSession();
  try {
    await session.run(
      `
      WITH CASE WHEN $a < $b THEN $a ELSE $b END AS lo,
           CASE WHEN $a < $b THEN $b ELSE $a END AS hi
      MATCH (low:Person {id: lo})
      MATCH (high:Person {id: hi})
      MERGE (low)-[r:DISCOVERED_CONNECTION]->(high)
      SET r.id = $id,
          r.kind = $kind,
          r.strength = $strength,
          r.confidence = $confidence,
          r.narrative = $narrative,
          r.recommendation = $recommendation,
          r.model = $model,
          r.evidence = $evidence_json,
          r.discovered_at = $ts
      `,
      {
        a: rel.person_a_id,
        b: rel.person_b_id,
        id: rel.id,
        kind: rel.kind,
        strength: rel.strength,
        confidence: rel.confidence,
        narrative: rel.narrative,
        recommendation: rel.recommendation ?? "",
        model: rel.model,
        evidence_json: JSON.stringify(rel.evidence),
        ts: rel.ts,
      }
    );
  } finally {
    await session.close();
  }
}

/**
 * Discover hidden connections for a seed person. Returns only the
 * relations that passed the minimum-confidence gate and were newly
 * persisted in this run.
 */
export async function discoverForPerson(seedId: string): Promise<DiscoveredRelation[]> {
  const seed = await getPerson(seedId);
  if (!seed) return [];

  const candidates = await findCandidates(
    seedId,
    config.DISCOVERY_MAX_CANDIDATES_PER_PERSON
  );
  if (candidates.length === 0) return [];

  const discovered: DiscoveredRelation[] = [];

  for (const candidate of candidates) {
    const other = await getPerson(candidate.person_id);
    if (!other) continue;

    const analysis = await analyzeRelation({
      a: { id: seed.id, name: seed.name ?? seed.id, tags: seed.tags },
      b: {
        id: other.id,
        name: other.name ?? other.id,
        tags: other.tags,
      },
      evidence: candidate.evidence,
    });

    if (analysis.confidence < config.DISCOVERY_MIN_CONFIDENCE) continue;

    const rel: DiscoveredRelation = {
      id: ulid(),
      ts: Date.now(),
      person_a_id: seed.id,
      person_b_id: other.id,
      person_a_name: seed.name,
      person_b_name: other.name,
      kind: analysis.kind,
      strength: analysis.strength,
      confidence: analysis.confidence,
      narrative: analysis.narrative,
      recommendation: analysis.recommendation,
      evidence: candidate.evidence,
      model: analysis.model,
    };

    await persist(rel);
    discovered.push(rel);
  }

  return discovered;
}
