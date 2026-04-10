# Kafka topics

The event backbone for Wavult Geopol. Each topic is produced by one or more
services and consumed by downstream workers.

| Topic                   | Producers            | Consumers                    | Payload shape |
|-------------------------|----------------------|------------------------------|---------------|
| `person.created`        | influence-api        | enrichment-ai-core           | `{id, name, lat, lng, ...}` |
| `person.enriched`       | enrichment-ai-core   | influence-api (writer), opensearch-indexer | `{id, scores, summary}` |
| `relationship.updated`  | influence-api        | intelligence-engine          | `{from, to, strength}` |
| `event.detected`        | intelligence-engine  | influence-api, ui-notifier   | `{id, type, impact_score, entities[]}` |
| `interaction.logged`    | influence-api        | intelligence-engine          | `{actor, target, channel, ts}` |

## Create topics (local dev)

```bash
docker compose -f docker-compose.dev.yml exec kafka \
  kafka-topics.sh --bootstrap-server kafka:9092 --create --if-not-exists \
  --partitions 3 --replication-factor 1 --topic person.created
# repeat for each topic
```

Or use `scripts/create-topics.sh` once written.
