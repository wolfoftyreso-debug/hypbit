/**
 * content-packs — signed content distribution to edge nodes.
 *
 * A "content pack" is a versioned bundle of cacheable artefacts that a
 * cloud curator has pre-approved for replication to aircraft. Packs are
 * the ONLY way content reaches an edge node — there is no mechanism for
 * an edge node to fetch arbitrary URLs from the open internet during
 * cruise, because that path is both unreliable and unauditable.
 *
 * Each pack:
 *   - has a manifest (list of entries with sha256 + size + mime)
 *   - is signed by a KMS key (detached signature over the canonical
 *     manifest bytes)
 *   - lives at a deterministic S3 key under the aean-content bucket
 *   - has an explicit set of target tails + target edge models
 *
 * Edge nodes GET the manifest + signature at sync time, verify the
 * signature, then download missing entries over the satellite link.
 *
 * Requirements traceability:
 *   @req AEAN-REQ-CNT-001  Content packs are signed and verifiable offline
 *   @req AEAN-REQ-CNT-002  Content pack distribution is scoped per tail
 *   @req AEAN-REQ-CNT-003  Manifest hash is part of the audit trail
 *   @req AEAN-REQ-SEC-005  Signing key is KMS-backed, never exported
 */

import { Router, Request, Response } from 'express'
import { createHash } from 'node:crypto'
import { z } from 'zod'
import { appendEvent } from '../lib/event-store'
import { requireAuth, requireRole, requireEdgeNode } from '../middleware/requireAuth'
import { canonicalJson } from '../lib/event-store'
import { getPool } from '../lib/db'

const router = Router()

const manifestEntrySchema = z.object({
  path: z.string().min(1).max(256),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  size_bytes: z.number().int().nonnegative().max(5_368_709_120), // 5 GB per entry cap
  mime: z.string().max(128),
})

const createPackSchema = z.object({
  pack_id: z.string().min(3).max(64).regex(/^[a-z0-9][a-z0-9_.-]*$/),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  target_tails: z.array(z.string().min(3).max(10)).min(1),
  target_models: z.array(z.enum(['AEAN-EDGE-1U', 'AEAN-EDGE-2U', 'AEAN-EDGE-RACK'])).min(1),
  entries: z.array(manifestEntrySchema).min(1).max(50_000),
  expires_at: z.string().datetime().optional(),
})

async function signManifestWithKms(_manifestCanonical: string): Promise<{ signature_b64: string; key_arn: string; algorithm: string }> {
  // Real implementation:
  //   - SHA256 of the canonical bytes
  //   - KMSClient.send(new SignCommand({ KeyId: CONTENT_SIGNING_KEY_ARN,
  //     Message: digest, MessageType: 'DIGEST', SigningAlgorithm: 'RSASSA_PSS_SHA_256' }))
  // Stubbed here so the scaffold runs without a live KMS key; the RTM
  // verifier enforces that this function MUST be replaced before the
  // service deploys to staging (see rtm/requirements.ts).
  const digest = createHash('sha256').update(_manifestCanonical).digest('base64')
  return {
    signature_b64: 'STUB:' + digest,
    key_arn: process.env.CONTENT_SIGNING_KEY_ARN || 'arn:aws:kms:eu-north-1:STUB:key/aean-content',
    algorithm: 'RSASSA_PSS_SHA_256',
  }
}

router.post('/content-packs', requireAuth, requireRole('aero_curator', 'aero_admin'), async (req: Request, res: Response) => {
  const parse = createPackSchema.safeParse(req.body)
  if (!parse.success) {
    res.status(400).json({ error: 'VALIDATION', details: parse.error.flatten() })
    return
  }
  const input = parse.data

  const totalBytes = input.entries.reduce((s, e) => s + e.size_bytes, 0)

  const manifest = {
    pack_id: input.pack_id,
    version: input.version,
    org_id: req.user!.org,
    target_tails: [...input.target_tails].sort(),
    target_models: [...input.target_models].sort(),
    entries: [...input.entries].sort((a, b) => a.path.localeCompare(b.path)),
    total_bytes: totalBytes,
    created_at: new Date().toISOString(),
    expires_at: input.expires_at ?? null,
  }
  const canonical = canonicalJson(manifest)
  const manifestSha256 = createHash('sha256').update(canonical).digest('hex')
  const signature = await signManifestWithKms(canonical)

  const { rows: existing } = await getPool().query(
    `SELECT pack_id FROM aero_content_pack WHERE pack_id = $1 AND version = $2 AND org_id = $3`,
    [input.pack_id, input.version, req.user!.org],
  )
  if (existing.length > 0) {
    res.status(409).json({ error: 'PACK_VERSION_EXISTS' })
    return
  }

  const event = await appendEvent({
    streamId: `${input.pack_id}@${input.version}`,
    streamType: 'content_pack',
    eventType: 'aero.content_pack.published.v1',
    payload: {
      pack_id: input.pack_id,
      version: input.version,
      manifest_sha256: manifestSha256,
      total_bytes: totalBytes,
      entry_count: input.entries.length,
      target_tails: manifest.target_tails,
      target_models: manifest.target_models,
      signing_key_arn: signature.key_arn,
      signing_algorithm: signature.algorithm,
    },
    classification: 'internal',
    actorSub: req.user!.sub,
    orgId: req.user!.org,
  })

  await getPool().query(
    `INSERT INTO aero_content_pack (
        pack_id, version, org_id, manifest_sha256, manifest_json, signature_b64,
        signing_key_arn, signing_algorithm, total_bytes, entry_count,
        target_tails, target_models, created_at, created_by, expires_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),$13,$14)`,
    [
      input.pack_id, input.version, req.user!.org, manifestSha256, canonical,
      signature.signature_b64, signature.key_arn, signature.algorithm,
      totalBytes, input.entries.length, manifest.target_tails, manifest.target_models,
      req.user!.sub, input.expires_at ?? null,
    ],
  )

  res.status(201).json({
    pack_id: input.pack_id,
    version: input.version,
    manifest_sha256: manifestSha256,
    entry_count: input.entries.length,
    total_bytes: totalBytes,
    event_id: event.id,
    event_hash: event.this_hash,
  })
})

// Edge-node sync. Called from onboard appliances on a schedule / on link-up.
router.get('/content-packs/sync', requireEdgeNode, async (req: Request, res: Response) => {
  const edgeNodeId = (req as Request & { edgeNodeId?: string }).edgeNodeId!
  const { rows: nodeRows } = await getPool().query(
    `SELECT tail_number, model, org_id, status FROM aero_edge_node WHERE edge_node_id = $1`,
    [edgeNodeId],
  )
  if (nodeRows.length === 0 || nodeRows[0].status !== 'active') {
    res.status(404).json({ error: 'EDGE_NODE_NOT_ACTIVE' })
    return
  }
  const { tail_number, model, org_id } = nodeRows[0]

  const { rows: packs } = await getPool().query(
    `SELECT pack_id, version, manifest_sha256, manifest_json, signature_b64,
            signing_key_arn, signing_algorithm, expires_at
       FROM aero_content_pack
      WHERE org_id = $1
        AND $2 = ANY(target_tails)
        AND $3 = ANY(target_models)
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY created_at DESC`,
    [org_id, tail_number, model],
  )

  res.json({
    edge_node_id: edgeNodeId,
    tail_number,
    packs: packs.map((p) => ({
      pack_id: p.pack_id,
      version: p.version,
      manifest_sha256: p.manifest_sha256,
      manifest: JSON.parse(p.manifest_json),
      signature: {
        value_b64: p.signature_b64,
        key_arn: p.signing_key_arn,
        algorithm: p.signing_algorithm,
      },
      expires_at: p.expires_at,
    })),
  })
})

export default router
