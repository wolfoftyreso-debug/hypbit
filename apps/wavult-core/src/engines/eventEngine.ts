import { v4 as uuid } from 'uuid'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Guard: krascha inte om Supabase ej är konfigurerat (system kör mot RDS direkt)
let supabase: SupabaseClient | null = null
if (SUPABASE_URL.match(/^https?:\/\//i) && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
} else {
  console.warn('[eventEngine] Supabase ej konfigurerat — event-logging inaktiverat')
}

export type EventType =
  | 'task.created' | 'task.accepted' | 'task.submitted' | 'task.validated' | 'task.approved' | 'task.rejected'
  | 'payment.initiated' | 'payment.captured' | 'payment.split_executed' | 'payment.completed'
  | 'payout.triggered' | 'payout.executed' | 'payout.failed'
  | 'ads.created' | 'ads.purchased'
  | 'fraud.detected'
  | 'fx.updated'

export interface DomainEvent {
  id: string
  idempotency_key: string
  event_type: EventType
  aggregate_type: string
  aggregate_id: string
  entity_id?: string
  actor_id?: string
  payload: Record<string, unknown>
  occurred_at: string
}

export async function emitEvent(
  eventType: EventType,
  aggregateType: string,
  aggregateId: string,
  payload: Record<string, unknown>,
  opts?: { entityId?: string; actorId?: string }
): Promise<void> {
  const event: DomainEvent = {
    id: uuid(),
    idempotency_key: `${eventType}:${aggregateId}:${Date.now()}`,
    event_type: eventType,
    aggregate_type: aggregateType,
    aggregate_id: aggregateId,
    entity_id: opts?.entityId,
    actor_id: opts?.actorId,
    payload,
    occurred_at: new Date().toISOString(),
  }

  if (!supabase) {
    console.log(`[eventEngine] Event skipped (no Supabase): ${eventType} ${aggregateId}`)
    return
  }

  const { error } = await supabase
    .schema('wavult')
    .from('financial_events')
    .insert({
      id: event.id,
      idempotency_key: event.idempotency_key,
      event_type: event.event_type,
      aggregate_type: event.aggregate_type,
      aggregate_id: event.aggregate_id,
      entity_id: event.entity_id,
      actor_id: event.actor_id,
      payload: event.payload,
      occurred_at: event.occurred_at,
    })

  if (error) {
    console.error('[EventEngine] Failed to emit event:', event.event_type, error)
    // Don't throw — event emission failure should not block business logic
    // Log to CloudWatch instead
  }

  console.log(`[Event] ${event.event_type} | ${aggregateType}:${aggregateId}`)
}
