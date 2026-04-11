# Kafka topics

The event backbone for Wavult Geopol. Canonical constants live in
`packages/events/src/topics.ts` and are copied verbatim into each
service's `src/shared/topics.ts`.

## Person / graph topics

| Topic                   | Producers          | Consumers           |
|-------------------------|--------------------|---------------------|
| `person.created`        | influence-api      | enrichment-ai-core  |
| `person.enriched`       | enrichment-ai-core | influence-api       |
| `relationship.updated`  | influence-api      | (future)            |
| `interaction.logged`    | influence-api      | (future)            |

## Influence Monitoring & Response pipeline

| Topic                   | Produced by            | Consumed by             | Payload shape           |
|-------------------------|------------------------|-------------------------|-------------------------|
| `raw.events`            | influence-ingestion    | event-normalizer        | `SourceEventRaw`        |
| `events.normalized`     | event-normalizer       | influence-enrichment, relation-discovery | `NormalizedEvent` |
| `events.enriched`       | influence-enrichment   | alert-engine, access-engine, deal-flow-engine, relation-discovery | `EnrichedEvent` |
| `alerts.triggered`      | alert-engine           | action-engine, notification-dispatcher | `Alert`  |
| `actions.generated`     | action-engine          | notification-dispatcher | `Action`                |
| `notification.created`  | notification-dispatcher | influence-api (SSE)    | `Notification`          |

## Intelligence layer

| Topic                      | Produced by          | Consumed by          | Payload shape        |
|----------------------------|----------------------|----------------------|----------------------|
| `relation.discovered`      | relation-discovery   | (future: graph-writer, UI notifier) | `DiscoveredRelation` |
| `access.scores.updated`    | access-engine        | (future: UI overlay, deal-flow-engine) | `AccessScore` |
| `dealflow.detected`        | deal-flow-engine     | (future: action-engine, CRM) | `DealOpportunity` |

See `packages/events/src/schemas.ts` for the complete zod schemas.

## Create topics (local dev)

With the docker-compose.dev.yml Kafka running:

```bash
for t in raw.events events.normalized events.enriched alerts.triggered actions.generated notification.created; do
  docker compose -f docker-compose.dev.yml exec kafka \
    kafka-topics.sh --bootstrap-server kafka:9092 --create --if-not-exists \
    --partitions 3 --replication-factor 1 --topic "$t"
done
```

Topics auto-create if `allowAutoTopicCreation` is set (it is in
every KafkaJS producer in this repo), so explicit creation is
optional for dev.
