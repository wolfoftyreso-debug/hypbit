// ─── Kafka Producer — Wavult ──────────────────────────────────────────────────
// Singleton producer. Call publish() to emit events.

import { Producer, ProducerRecord } from 'kafkajs'
import { v4 as uuidv4 } from 'uuid'
import { kafka } from './client'
import { TopicName } from './topics'
import { WavultEvent } from './events'

let producer: Producer | null = null
let connected = false

// ─── Connect ──────────────────────────────────────────────────────────────────

export async function connectProducer(): Promise<void> {
  if (connected) return
  producer = kafka.producer({
    idempotent: true,
    maxInFlightRequests: 5,
  })
  await producer.connect()
  connected = true
  console.log('[kafka] Producer connected')
}

export async function disconnectProducer(): Promise<void> {
  if (!producer || !connected) return
  await producer.disconnect()
  connected = false
  console.log('[kafka] Producer disconnected')
}

// ─── Publish ──────────────────────────────────────────────────────────────────

interface PublishOptions {
  tenantId: string
  organizationId: string
  userId: string
}

export async function publish<T extends WavultEvent>(
  topic: TopicName,
  eventType: T['eventType'],
  payload: T['payload'],
  opts: PublishOptions
): Promise<void> {
  if (!producer || !connected) {
    // Lazy connect — graceful for startup race conditions
    await connectProducer()
  }

  const event: Omit<WavultEvent, 'payload'> & { payload: unknown } = {
    eventId: uuidv4(),
    eventType,
    tenantId: opts.tenantId,
    organizationId: opts.organizationId,
    userId: opts.userId,
    timestamp: new Date().toISOString(),
    schemaVersion: '1.0',
    payload,
  }

  const record: ProducerRecord = {
    topic,
    messages: [
      {
        key: opts.tenantId,           // partition by tenant
        value: JSON.stringify(event),
        headers: {
          eventType,
          schemaVersion: '1.0',
          tenantId: opts.tenantId,
        },
      },
    ],
  }

  await producer!.send(record)

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[kafka] → ${topic} | ${eventType} | tenant:${opts.tenantId}`)
  }
}

// ─── Audit helper ─────────────────────────────────────────────────────────────

export async function publishAudit(
  action: string,
  resource: string,
  resourceId: string,
  opts: PublishOptions & { ip?: string; result?: 'success' | 'failure'; metadata?: Record<string, unknown> }
): Promise<void> {
  await publish(
    'wavult.system.audit' as TopicName,
    'wavult.system.audit',
    {
      action,
      resource,
      resourceId,
      ip: opts.ip,
      result: opts.result ?? 'success',
      metadata: opts.metadata,
    },
    opts
  )
}
