# Wavult Geopol — Influence Intelligence Platform

Operativt system för att navigera makt. Graph-backed, event-driven,
multi-datastore — designat för self-hosting via Gitea.

## Two layers, strict separation

1. **Business Influence Layer** — neutral, objective, org-visible.
   The shared graph of people, organizations, events, and the
   `:CONNECTED` relationships between them. Scoring and ranking
   is driven by data, not by personal preference.
2. **Private Layer** — user-scoped overlays: private contacts,
   private notes, private lists. Stored as separate node types
   (`:User`, `:PrivateNote`, `:PrivateList`) with user-scoped edges.
   **Never** mutates the core Person scores or visibility.

This separation is enforced both at the data model and in the API:
core endpoints filter on `visibility_org = true`, while `/api/private/*`
is always scoped by the `x-user-id` header.

## Architecture

```
                 ┌──────────────────────────┐
                 │   React + Mapbox UI      │
                 │   (apps/web)             │
                 └──────────┬───────────────┘
                            │
                     ┌──────▼──────┐
                     │ influence-api│  Fastify + TS
                     └──────┬───────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
   ┌─────▼─────┐      ┌─────▼─────┐      ┌─────▼──────┐
   │   Neo4j   │      │   Redis   │      │ OpenSearch │
   │   (graph) │      │  (cache)  │      │  (search)  │
   └───────────┘      └───────────┘      └────────────┘
                            │
                      Kafka (event backbone)
                            │
                  ┌─────────▼──────────┐
                  │ enrichment-ai-core │  async worker
                  └────────────────────┘
```

All datastores + Kafka are **external** in production. The main
`docker-compose.yml` deploys only the app services (`influence-api`,
`enrichment-ai-core`, `web`) and expects env-configured endpoints
for the backends. A separate `docker-compose.dev.yml` exists only
to spin them up locally for development.

## Layout

```
wavult-geopol/
├── apps/
│   └── web/                         React + Vite + Mapbox frontend
│       ├── src/
│       │   ├── App.tsx
│       │   ├── components/
│       │   └── types.ts
│       ├── Dockerfile
│       └── nginx.conf
│
├── services/
│   ├── influence-api/               Fastify + TS, graph + cache + search
│   │   └── src/
│   │       ├── db/          Neo4j / Redis / OpenSearch clients
│   │       ├── lib/kafka.ts Kafka producer
│   │       └── routes/      health, people, intelligence, private
│   │
│   └── enrichment-ai-core/          Kafka consumer; scores & summarizes
│       └── src/worker.ts
│
├── infra/
│   ├── neo4j/schema.cypher          Constraints, indexes, seed data
│   ├── kafka/topics.md              Topic catalog
│   └── terraform/                   AWS scaffold (ECS / MSK / VPC)
│
├── docker-compose.yml               Prod: app services only
├── docker-compose.dev.yml           Dev: Neo4j + Redis + OpenSearch + Kafka
└── .env.example
```

## API

All application endpoints are under `/api`. Health is at `/health`.

### Business Influence Layer (neutral)

| Method | Path                           | Notes |
| ------ | ------------------------------ | ----- |
| GET    | `/health/live`                 | liveness |
| GET    | `/health/ready`                | pings Neo4j, Redis, OpenSearch |
| GET    | `/api/people?mode=global       | list/search, mode-aware |
| GET    | `/api/people?q=...&mode=...`   | text search + mode |
| GET    | `/api/people/top?limit=20`     | priority engine — top-N by relevance |
| GET    | `/api/people/:id`              | single, Redis-cached |
| POST   | `/api/people`                  | upsert → Neo4j + OpenSearch + `person.created` event |
| GET    | `/api/map?mode=global`         | GeoJSON for the map UI |
| GET    | `/api/intelligence/path/:id`   | **Access Engine** — shortest path from `OUR_NODE_ID` |
| GET    | `/api/intelligence/events`     | top-impact events (stub) |

### Private Layer (scoped by `x-user-id`)

| Method | Path                               | Notes |
| ------ | ---------------------------------- | ----- |
| GET    | `/api/private/contacts`            | caller's private contacts |
| POST   | `/api/private/contacts`            | `{ personId }` → `:PRIVATE_CONTACT` edge |
| GET    | `/api/private/notes/:personId`     | notes about a person |
| POST   | `/api/private/notes`               | `{ personId, body }` |
| GET    | `/api/private/lists`               | caller's lists |
| PUT    | `/api/private/lists`               | upsert a list |

### Mode semantics

Pass `?mode=` on `/api/people` and `/api/map`:

- `global` — only `visibility_org = true` (the neutral layer)
- `my_network` — org-visible **plus** caller's private contacts
- `private` — only the caller's private contacts

## Kafka topics

See `infra/kafka/topics.md`.

| Topic                  | Produced by          | Consumed by              |
| ---------------------- | -------------------- | ------------------------ |
| `person.created`       | influence-api        | enrichment-ai-core       |
| `person.enriched`      | enrichment-ai-core   | influence-api writer     |
| `relationship.updated` | influence-api        | intelligence-engine      |
| `event.detected`       | intelligence-engine  | influence-api, ui-notifier |
| `interaction.logged`   | influence-api        | intelligence-engine      |

## Quick start (local dev)

```bash
# 1. Spin up the dev backends (Neo4j, Redis, OpenSearch, Kafka)
docker compose -f docker-compose.dev.yml up -d

# 2. Load Neo4j schema + seed data
docker compose -f docker-compose.dev.yml exec -T neo4j \
  cypher-shell -u neo4j -p password < infra/neo4j/schema.cypher

# 3. Configure env
cp .env.example .env
# edit .env to point at localhost:
#   NEO4J_URI=bolt://localhost:7687
#   NEO4J_PASSWORD=password
#   REDIS_URL=redis://localhost:6379
#   OPENSEARCH_URL=http://localhost:9200
#   KAFKA_BROKERS=localhost:9092
#   VITE_MAPBOX_TOKEN=<your token>   # optional, falls back to no-map view

# 4. Run influence-api
cd services/influence-api && npm install && npm run dev

# 5. In another shell, run the web UI
cd apps/web && npm install && npm run dev

# 6. (Optional) Run the enrichment worker
cd services/enrichment-ai-core && npm install && npm run dev
```

- Web:   <http://localhost:5173>
- API:   <http://localhost:4000>
- Neo4j Browser: <http://localhost:7474>

## Production deploy (self-hosted)

```bash
cp .env.example .env
# Point the env at your real external services:
#   NEO4J_URI, NEO4J_PASSWORD, REDIS_URL, OPENSEARCH_URL, KAFKA_BROKERS

docker compose build
docker compose up -d
```

The web UI is exposed on `${WEB_PORT:-8080}`. Put your reverse proxy
(Caddy, nginx, Traefik) in front of it for TLS.

## Deploying from Gitea

1. Create a repo on your Gitea (`wavult-geopol`).
2. Push this folder as the root of that repo.
3. On the target host:
   ```bash
   git clone git@your-gitea:you/wavult-geopol.git
   cd wavult-geopol
   cp .env.example .env   # edit for your external services
   docker compose up -d --build
   ```

## Roadmap

- **Access Engine** — weight the shortest path by `CONNECTED.strength`
  and personal-trust signals from the private layer (without mutating
  the core scores).
- **Event Engine** — ingest signals from external feeds into
  `event.detected` and rank by impact.
- **Priority Engine** — top-N people that matter *right now*, computed
  on a schedule and cached in Redis.
- **Private layer UI** — contacts/lists/notes pane behind the mode toggle.
- **Real AI enrichment** — replace the stub in `enrichment-ai-core`
  with a real model call.
