import { v4 as uuidv4 } from 'uuid';
import { query, withTransaction } from '../db/client';
import { getJson, setJson } from '../redis/client';
import { publish } from '../kafka/producer';
import { config } from '../config';
import { logger } from '../logger';
import { NotFoundError } from '../errors';

export interface EventInput {
  type: string;
  source: string;
  subject?: string;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface EventRecord {
  id: string;
  type: string;
  source: string;
  subject: string | null;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  published_at: string | null;
}

const CACHE_TTL_SECONDS = 300;
const cacheKey = (id: string): string => `event:${id}`;

export async function createEvent(input: EventInput): Promise<EventRecord> {
  const id = uuidv4();
  const metadata = { ...(input.metadata ?? {}), ingestedAt: new Date().toISOString() };

  const event = await withTransaction(async (client) => {
    const result = await client.query<EventRecord>(
      `INSERT INTO events (id, type, source, subject, payload, metadata)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb)
       RETURNING id, type, source, subject, payload, metadata, created_at, published_at`,
      [id, input.type, input.source, input.subject ?? null, input.payload, metadata],
    );

    await client.query(
      `INSERT INTO outbox (event_id, topic, key, value)
       VALUES ($1, $2, $3, $4::jsonb)`,
      [id, config.KAFKA_TOPIC_EVENTS, input.subject ?? id, result.rows[0]],
    );

    return result.rows[0];
  });

  // Best-effort direct publish. Outbox worker will retry on failure.
  try {
    await publish({
      topic: config.KAFKA_TOPIC_EVENTS,
      key: event.subject ?? event.id,
      value: event,
      headers: {
        'event-id': event.id,
        'event-type': event.type,
      },
    });
    await query(
      `UPDATE events SET published_at = NOW() WHERE id = $1;
       UPDATE outbox SET status = 'sent', processed_at = NOW() WHERE event_id = $1`,
      [event.id],
    );
  } catch (err) {
    logger.warn({ err, eventId: event.id }, 'direct publish failed, relying on outbox');
  }

  await setJson(cacheKey(event.id), event, CACHE_TTL_SECONDS);
  return event;
}

export async function getEventById(id: string): Promise<EventRecord> {
  const cached = await getJson<EventRecord>(cacheKey(id));
  if (cached) return cached;

  const { rows } = await query<EventRecord>(
    `SELECT id, type, source, subject, payload, metadata, created_at, published_at
     FROM events WHERE id = $1`,
    [id],
  );
  if (rows.length === 0) throw new NotFoundError('Event', id);

  await setJson(cacheKey(id), rows[0], CACHE_TTL_SECONDS);
  return rows[0];
}
