/**
 * Revolut Payment Routes — Wavult Core
 *
 * POST /api/revolut/payment      — Initiate outbound payment (e.g. Texas LLC filing fee)
 * POST /api/revolut/webhook      — Receive Revolut webhook events → generate receipt
 * GET  /api/revolut/payment/:id  — Get payment status
 *
 * Webhook events handled:
 * - PaymentCreated   → receipt with status "pending"
 * - PaymentCompleted → receipt with status "completed", update payment record
 * - PaymentFailed    → receipt with status "failed"
 */

import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { v4 as uuid } from 'uuid'
import { getRevolutAccessToken } from '../config/revolut'
import { processReceipt, type ReceiptData } from '../services/receipt.service'
import { requireAuth } from '../middleware/requireAuth'
import { createClient } from '@supabase/supabase-js'

const router = Router()
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

const REVOLUT_API = 'https://b2b.revolut.com/api/1.0'
const REVOLUT_ACCOUNT_ID = process.env.REVOLUT_BUSINESS_ACCOUNT_ID

// ── Schema ────────────────────────────────────────────────────────────────────

const InitiatePaymentSchema = z.object({
  amount: z.number().int().positive(),       // in cents (e.g. 32500 = $325.00)
  currency: z.string().length(3),            // ISO 4217
  description: z.string().min(1).max(200),
  reference: z.string().min(1).max(100),
  // Optional: direct counterparty id (Revolut Business counterparty)
  counterparty_id: z.string().optional(),
  // OR external bank details
  recipient_name: z.string().optional(),
  recipient_email: z.string().email().optional(),
})

// ── POST /api/revolut/payment ─────────────────────────────────────────────────

router.post('/payment', requireAuth, async (req: Request, res: Response) => {
  try {
    const data = InitiatePaymentSchema.parse(req.body)

    if (!REVOLUT_API) {
      return res.status(503).json({ error: 'Revolut not configured' })
    }

    const accessToken = await getRevolutAccessToken().catch(() => process.env.REVOLUT_ACCESS_TOKEN)
    if (!accessToken) {
      return res.status(503).json({ error: 'Revolut access token unavailable. Re-authorize at /revolut/callback' })
    }

    if (!REVOLUT_ACCOUNT_ID) {
      return res.status(503).json({ error: 'REVOLUT_BUSINESS_ACCOUNT_ID not configured' })
    }

    const requestId = `wavult-${data.reference}-${Date.now()}`

    // Build payment payload
    const paymentBody: Record<string, unknown> = {
      request_id: requestId,
      account_id: REVOLUT_ACCOUNT_ID,
      amount: data.amount / 100,   // Revolut API uses decimal amounts
      currency: data.currency,
      reference: data.reference,
      ...(data.counterparty_id
        ? { receiver: { counterparty_id: data.counterparty_id } }
        : {}),
    }

    const resp = await fetch(`${REVOLUT_API}/pay`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(paymentBody),
    })

    const result = await resp.json() as { id?: string; state?: string; error?: string; message?: string }

    if (!resp.ok) {
      console.error('[Revolut] Payment initiation failed:', result)
      return res.status(resp.status).json({
        error: 'REVOLUT_PAYMENT_FAILED',
        detail: result.message ?? result.error ?? 'Unknown Revolut error',
      })
    }

    // Save payment record to Supabase
    const paymentId = result.id ?? uuid()
    const now = new Date().toISOString()

    await supabase.schema('wavult').from('revolut_payments').upsert({
      id: paymentId,
      request_id: requestId,
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      reference: data.reference,
      status: result.state ?? 'pending',
      revolut_response: result,
      created_at: now,
      updated_at: now,
    }).select()

    // Generate initial receipt (pending)
    const receipt: ReceiptData = {
      id: paymentId,
      reference: data.reference,
      date: now,
      status: 'pending',
      direction: 'outbound',
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      toName: data.recipient_name,
      revolutPaymentId: result.id,
    }

    processReceipt(receipt).catch(err =>
      console.error('[Revolut] Receipt generation failed:', err)
    )

    return res.json({
      payment_id: paymentId,
      status: result.state ?? 'pending',
      reference: data.reference,
      amount: data.amount,
      currency: data.currency,
    })

  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'VALIDATION_ERROR', details: err.errors })
    console.error('[Revolut] Payment error:', err)
    return res.status(500).json({ error: 'INTERNAL_ERROR' })
  }
})

// ── GET /api/revolut/payment/:id ──────────────────────────────────────────────

router.get('/payment/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Try Supabase first
    const { data: local } = await supabase.schema('wavult')
      .from('revolut_payments')
      .select('*')
      .eq('id', id)
      .single()

    if (local) return res.json(local)

    // Fall through to Revolut API
    const accessToken = await getRevolutAccessToken().catch(() => process.env.REVOLUT_ACCESS_TOKEN)
    if (!accessToken) return res.status(503).json({ error: 'Revolut not configured' })

    const resp = await fetch(`${REVOLUT_API}/transaction/${id}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    })

    if (!resp.ok) return res.status(resp.status).json({ error: 'Payment not found' })
    return res.json(await resp.json())

  } catch (err) {
    return res.status(500).json({ error: 'INTERNAL_ERROR' })
  }
})

// ── POST /api/revolut/webhook ─────────────────────────────────────────────────
// No auth — Revolut signs with HMAC-SHA256, validate if secret configured

router.post('/webhook', async (req: Request, res: Response) => {
  // Validate Revolut webhook signature if secret is set
  const webhookSecret = process.env.REVOLUT_WEBHOOK_SECRET
  if (webhookSecret) {
    const signature = req.headers['revolut-signature'] as string
    if (!signature) {
      console.warn('[Revolut Webhook] Missing signature')
      return res.status(401).json({ error: 'Missing signature' })
    }
    // Revolut v2 webhook signature: HMAC-SHA256 of raw body
    const rawBody = JSON.stringify(req.body)
    const crypto = await import('crypto')
    const expected = crypto.createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex')
    if (signature !== expected) {
      console.warn('[Revolut Webhook] Invalid signature')
      return res.status(401).json({ error: 'Invalid signature' })
    }
  }

  const event = req.body as {
    event: string
    timestamp: string
    data?: {
      id: string
      request_id?: string
      state?: string
      type?: string
      amount?: number
      currency?: string
      reference?: string
      created_at?: string
      completed_at?: string
      legs?: Array<{
        amount: number
        currency: string
        counterparty?: { name?: string; id?: string }
        description?: string
      }>
    }
  }

  console.log(`[Revolut Webhook] Event: ${event.event}`, event.data?.id)

  // Always respond 200 immediately
  res.json({ received: true })

  // Process asynchronously
  setImmediate(async () => {
    try {
      const d = event.data
      if (!d) return

      const eventType = event.event  // e.g. "PaymentCreated", "PaymentCompleted", "TransferCompleted"
      const now = d.completed_at ?? event.timestamp ?? new Date().toISOString()
      const leg = d.legs?.[0]

      let status: ReceiptData['status'] = 'pending'
      if (eventType.includes('Completed') || d.state === 'completed') status = 'completed'
      else if (eventType.includes('Failed') || d.state === 'failed') status = 'failed'

      const direction: ReceiptData['direction'] =
        (leg?.amount ?? 0) < 0 ? 'outbound' : 'inbound'

      const amount = Math.abs(leg?.amount ?? d.amount ?? 0)
      const currency = leg?.currency ?? d.currency ?? 'USD'

      // Update DB record if exists
      await supabase.schema('wavult').from('revolut_payments')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', d.id)

      const receipt: ReceiptData = {
        id: d.id,
        reference: d.reference ?? d.request_id ?? d.id,
        date: now,
        status,
        direction,
        amount: Math.round(amount * 100), // convert to cents
        currency,
        description: leg?.description ?? d.reference ?? `Revolut ${eventType}`,
        fromName: direction === 'inbound' ? leg?.counterparty?.name : 'Wavult Group',
        toName: direction === 'outbound' ? leg?.counterparty?.name : 'Wavult Group',
        revolutPaymentId: d.id,
        metadata: {
          'Event Type': eventType,
          'Revolut State': d.state ?? 'unknown',
        },
      }

      await processReceipt(receipt)
    } catch (err) {
      console.error('[Revolut Webhook] Processing error:', err)
    }
  })
})

export default router
