# @wavult-geopol/events — source of truth

This directory holds the canonical event schemas, Kafka topic constants
and alert rule types for the whole platform.

It is **documentation-first** right now: each service keeps its own
copy of the relevant files under `src/shared/`. When you change a
schema here, sync the copies in the consuming services.

| File               | Purpose                                           |
| ------------------ | ------------------------------------------------- |
| `src/topics.ts`    | Kafka topic name constants                        |
| `src/schemas.ts`   | Zod schemas for every event envelope on the bus   |
| `src/rules.ts`     | Alert rule DSL + evaluator                        |

## Event flow

```
  influence-monitoring   ──►  source.event.raw
                                       │
                                       ▼
  event-normalizer       ──►  influence.event.normalized
                                       │
                                       ▼
  alert-engine           ──►  alert.triggered
                                       │
                                       ▼
  ai-analyst             ──►  alert.enriched
                                       │
                                       ▼
  notification-dispatcher ──► notification.created (in-app feed)
```

Every Kafka message uses a common envelope:

```ts
{
  id: string;        // ULID or similar
  type: string;      // envelope kind (matches topic)
  ts: number;        // epoch millis
  source: string;    // producing service
  payload: unknown;  // type-specific; see schemas.ts
}
```
