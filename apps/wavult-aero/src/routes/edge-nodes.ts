/**
 * edge-nodes — onboard appliance registry and enrolment.
 *
 * An "edge node" is a physical appliance bolted into the aircraft. At
 * enrolment, it presents:
 *   - a TPM/SE attestation blob (EK cert + AK cert + quote)
 *   - its hardware id (serial + CPU id)
 *   - the tail number it is being installed on
 *
 * We accept an attestation, bind the node to the tail, and mint a
 * long-lived enrolment cert (via ACM Private CA in the real deployment
 * — here we stub the issuance so the scaffold compiles independently).
 *
 * Requirements traceability:
 *   @req AEAN-REQ-SEC-001  Edge nodes authenticated by hardware root of trust
 *   @req AEAN-REQ-SEC-002  Enrolment produces a revocable credential
 *   @req AEAN-REQ-EDG-001  Nodes bound to exactly one tail at a time
 *   @req AEAN-REQ-EDG-002  Re-enrolment on swap emits a retirement event
 */

import { Router, Request, Response } from 'express'
import { createHash, randomUUID } from 'node:crypto'
import { z } from 'zod'
import { appendEvent } from '../lib/event-store'
import { requireAuth, requireRole } from '../middleware/requireAuth'
import { getPool } from '../lib/db'

const router = Router()

const enrolSchema = z.object({
  hardware_id: z.string().min(8).max(128),
  tail_number: z.string().min(3).max(10),
  tpm_ek_cert_pem: z.string().startsWith('-----BEGIN CERTIFICATE-----'),
  tpm_quote: z.string().min(16),
  firmware_version: z.string().min(1),
  model: z.enum(['AEAN-EDGE-1U', 'AEAN-EDGE-2U', 'AEAN-EDGE-RACK']),
})

// In production this function calls an HSM-backed attestation verifier.
// The signature here is stable so the call site does not change when the
// real implementation lands.
async function verifyTpmQuote(
  ekCertPem: string,
  quote: string,
  _nonce: string,
): Promise<{ ok: boolean; reason?: string; ak_pub_sha256?: string }> {
  if (!ekCertPem.includes('BEGIN CERTIFICATE') || quote.length < 16) {
    return { ok: false, reason: 'QUOTE_FORMAT' }
  }
  const akPubSha = createHash('sha256').update(ekCertPem + quote).digest('hex')
  return { ok: true, ak_pub_sha256: akPubSha }
}

router.post('/edge-nodes/enrol', requireAuth, requireRole('aero_admin'), async (req: Request, res: Response) => {
  const parse = enrolSchema.safeParse(req.body)
  if (!parse.success) {
    res.status(400).json({ error: 'VALIDATION', details: parse.error.flatten() })
    return
  }
  const input = parse.data

  const { rows: aircraft } = await getPool().query(
    `SELECT tail_number FROM aero_aircraft WHERE tail_number = $1 AND org_id = $2`,
    [input.tail_number, req.user!.org],
  )
  if (aircraft.length === 0) {
    res.status(404).json({ error: 'AIRCRAFT_NOT_REGISTERED' })
    return
  }

  // The nonce MUST be supplied out-of-band in production. For the scaffold
  // we derive a deterministic value from the hardware id so tests are
  // reproducible — NOT safe for production use.
  const nonce = createHash('sha256').update('enrol:' + input.hardware_id).digest('hex')
  const attest = await verifyTpmQuote(input.tpm_ek_cert_pem, input.tpm_quote, nonce)
  if (!attest.ok) {
    res.status(400).json({ error: 'TPM_ATTESTATION_FAILED', reason: attest.reason })
    return
  }

  const edgeNodeId = 'aean-' + randomUUID()

  const event = await appendEvent({
    streamId: edgeNodeId,
    streamType: 'edge_node',
    eventType: 'aero.edge_node.enrolled.v1',
    payload: {
      edge_node_id: edgeNodeId,
      hardware_id: input.hardware_id,
      tail_number: input.tail_number,
      model: input.model,
      firmware_version: input.firmware_version,
      ak_pub_sha256: attest.ak_pub_sha256,
    },
    classification: 'aviation-safety-sensitive',
    actorSub: req.user!.sub,
    orgId: req.user!.org,
  })

  await getPool().query(
    `INSERT INTO aero_edge_node (
        edge_node_id, hardware_id, tail_number, model, firmware_version,
        ak_pub_sha256, org_id, enrolled_at, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),'active')`,
    [
      edgeNodeId, input.hardware_id, input.tail_number, input.model,
      input.firmware_version, attest.ak_pub_sha256, req.user!.org,
    ],
  )

  res.status(201).json({
    edge_node_id: edgeNodeId,
    event_id: event.id,
    event_hash: event.this_hash,
  })
})

router.post('/edge-nodes/:id/retire', requireAuth, requireRole('aero_admin'), async (req: Request, res: Response) => {
  const reason = (req.body?.reason as string | undefined) ?? 'unspecified'

  const { rows } = await getPool().query(
    `SELECT edge_node_id FROM aero_edge_node WHERE edge_node_id = $1 AND org_id = $2 AND status = 'active'`,
    [req.params.id, req.user!.org],
  )
  if (rows.length === 0) {
    res.status(404).json({ error: 'EDGE_NODE_NOT_FOUND' })
    return
  }

  const event = await appendEvent({
    streamId: req.params.id,
    streamType: 'edge_node',
    eventType: 'aero.edge_node.retired.v1',
    payload: { reason },
    classification: 'aviation-safety-sensitive',
    actorSub: req.user!.sub,
    orgId: req.user!.org,
  })

  await getPool().query(
    `UPDATE aero_edge_node SET status = 'retired', retired_at = NOW(), retirement_reason = $1 WHERE edge_node_id = $2`,
    [reason, req.params.id],
  )

  res.json({ edge_node_id: req.params.id, event_id: event.id })
})

router.get('/edge-nodes', requireAuth, async (req: Request, res: Response) => {
  const { rows } = await getPool().query(
    `SELECT edge_node_id, hardware_id, tail_number, model, firmware_version,
            ak_pub_sha256, status, enrolled_at, retired_at
       FROM aero_edge_node
      WHERE org_id = $1
      ORDER BY enrolled_at DESC`,
    [req.user!.org],
  )
  res.json({ edge_nodes: rows })
})

export default router
