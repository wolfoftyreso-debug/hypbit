# Wavult Geopol — Global Influence Monitoring & Response Platform

Operativt system för att navigera makt i realtid. Graph-backed,
event-driven, multi-datastore, AI-enriched — designat för self-hosting
via Gitea.

## What it does

Continuously watches the world for moves that affect you — role
changes, investments, regulatory decisions, M&A, events — then:

1. **Normalizes** the noise into a canonical event schema
2. **Enriches** every event with Claude-powered analysis of what
   it means *for your company* (relevance, risk, opportunity,
   recommended actions)
3. **Scores** the event against the people graph and matches it
   against your alert rules
4. **Generates** concrete next-best-actions (intro requests, event
   attendance, CRM tasks) including graph shortest-path access
   routes through your network
5. **Notifies** you via in-app live feed (SSE) with a map-based
   UI and an impact drawer

## Layers & strict separation

1. **Business Influence Layer** — neutral, objective, org-visible.
   The shared graph of people, organisations and events. Scoring
   is driven by data, not by personal preference.
2. **Private Layer** — user-scoped overlays: private contacts,
   notes, lists. Separate node types, never mutates core scores.
3. **Event / Intelligence Layer** — the real-time pipeline of
   normalised + enriched events, alerts, actions and notifications.

## Architecture

```
External Sources (RSS, filings, events, social)
        │
        ▼
┌──────────────────────┐
│ influence-ingestion  │  →  raw.events
└──────────────────────┘
        │
        ▼
┌──────────────────────┐
│ event-normalizer     │  →  events.normalized
└──────────────────────┘
        │
        ▼
┌──────────────────────┐
│ influence-enrichment │  →  events.enriched   (Claude, prompt-cached)
└──────────────────────┘
        │
        ▼
┌──────────────────────┐
│ alert-engine         │  →  alerts.triggered  (rules + scoring)
└──────────────────────┘
        │
        ▼
┌──────────────────────┐
│ action-engine        │  →  actions.generated (access paths via Neo4j)
└──────────────────────┘
        │
        ▼
┌──────────────────────┐
│ notification-dispatcher │  →  notification.created  (in-app feed)
└──────────────────────┘
        │
        ▼
┌──────────────────────┐
│ influence-api (SSE)  │  →  apps/web live feed + impact panel
└──────────────────────┘
```

Backing stores (external):

```
  Neo4j (graph)   Redis (cache + rule store + feed)
  OpenSearch (search)   Kafka (event backbone)
```

## Layout

```
wavult-geopol/
├── apps/
│   └── web/                           React + Vite + Mapbox dashboard
│       └── src/
│           ├── App.tsx                 map + live feed + impact panel
│           ├── components/
│           │   ├── InfluenceMap.tsx
│           │   ├── LiveFeedPanel.tsx   SSE-connected live feed
│           │   ├── ImpactPanel.tsx     What happened / why / what to do
│           │   ├── ModeToggle.tsx      [ GLOBAL | MY NETWORK | PRIVATE ]
│           │   └── PersonDrawer.tsx
│           └── hooks/
│               └── useNotifications.ts SSE hook
│
├── services/
│   ├── influence-api/                  Fastify API
│   │   └── src/routes/
│   │       ├── people.ts               mode-aware people + map
│   │       ├── intelligence.ts         access engine (shortest path)
│   │       ├── private.ts              private layer
│   │       ├── notifications.ts        GET /api/notifications + SSE stream
│   │       ├── rules.ts                /api/rules CRUD
│   │       └── health.ts
│   │
│   ├── influence-ingestion/            RSS + news → raw.events
│   ├── event-normalizer/               raw.events → events.normalized
│   ├── influence-enrichment/           events.normalized → events.enriched
│   │                                    Uses @anthropic-ai/sdk with
│   │                                    prompt caching on the system block.
│   ├── alert-engine/                   events.enriched → alerts.triggered
│   │                                    Rules stored in Redis; HTTP CRUD at :4100.
│   │                                    Scoring: 0.4·influence + 0.4·relevance + 0.2·impact
│   │                                    Severity: ≥85 CRITICAL, ≥70 IMPORTANT, ≥50 INFO
│   ├── action-engine/                  alerts.triggered → actions.generated
│   │                                    Computes Neo4j shortest access paths.
│   ├── notification-dispatcher/        alerts + actions → Redis in-app feed
│   ├── relation-discovery/             Finds hidden connections between people.
│   │                                    Three discovery strategies (COMMON_NEIGHBORS,
│   │                                    SAME_ORG, SAME_EVENT) + Claude analyst for
│   │                                    classification. Hourly scheduler + Kafka
│   │                                    consumer on events.enriched. HTTP :4300.
│   ├── access-engine/                  Computes access probability for every
│   │                                    (our_node, target) pair. Scoring:
│   │                                      0.3 · (1/distance)
│   │                                    + 0.25 · relation_strength
│   │                                    + 0.15 · mutual_connection_score
│   │                                    + 0.10 · event_overlap
│   │                                    + 0.10 · geo_proximity
│   │                                    + 0.10 · historical_success
│   │                                    Redis-cached, ranked via sorted set. HTTP :4200.
│   ├── deal-flow-engine/               Matches person tags × event types against
│   │                                    a rule set to produce deal opportunities
│   │                                    (FUNDING, PARTNERSHIP, REGULATORY_ACCESS,
│   │                                    ACQUISITION, CUSTOMER). HTTP :4400.
│   └── enrichment-ai-core/             legacy Person enrichment worker
│
├── packages/
│   └── events/                         Canonical zod schemas + topics + rules DSL
│
├── infra/
│   ├── neo4j/schema.cypher             Constraints, indexes, seed data
│   ├── kafka/topics.md                 Topic catalog
│   └── terraform/                      AWS scaffold
│
├── docker-compose.yml                  Prod: 9 app services
├── docker-compose.dev.yml              Dev: Neo4j + Redis + OpenSearch + Kafka
└── .env.example
```

## API (influence-api)

### People, map, intelligence

| Method | Path                           | Notes |
| ------ | ------------------------------ | ----- |
| GET    | `/health/live`                 | liveness |
| GET    | `/health/ready`                | pings Neo4j, Redis, OpenSearch |
| GET    | `/api/people?mode=global`      | list/search, mode-aware |
| GET    | `/api/people/top?limit=20`     | priority engine |
| GET    | `/api/people/:id`              | single, Redis-cached |
| POST   | `/api/people`                  | upsert → Neo4j + OpenSearch + Kafka |
| GET    | `/api/map?mode=global`         | GeoJSON FeatureCollection |
| GET    | `/api/intelligence/path/:id`   | shortest access path |
| GET    | `/api/intelligence/events`     | top-impact events |

### Notifications (in-app live feed)

| Method | Path                           | Notes |
| ------ | ------------------------------ | ----- |
| GET    | `/api/notifications`           | backlog of recent notifications |
| GET    | `/api/notifications/stream`    | SSE: backlog + live updates |

### Alert rules

| Method | Path                           | Notes |
| ------ | ------------------------------ | ----- |
| GET    | `/api/rules`                   | list active rules |
| POST   | `/api/rules`                   | create rule |
| PUT    | `/api/rules/:id`               | update rule |
| DELETE | `/api/rules/:id`               | disable rule |

### Intelligence layer (relation discovery, access, deal flow)

| Method | Path                                     | Notes |
| ------ | ---------------------------------------- | ----- |
| GET    | `/api/relations/:personId`               | discovered connections for a person |
| GET    | `/api/relations/between/:a/:b`           | discovered connection between two people |
| GET    | `/api/access/:id`                        | access probability (proxy → access-engine) |
| GET    | `/api/access/top?limit=20`               | top reachable people |
| GET    | `/api/deals?limit=50`                    | recent deal opportunities (proxy → deal-flow-engine) |
| GET    | `/api/deals/person/:id`                  | deals for a person |
| GET    | `/api/decision/:personId`                | **combined decision** — joins access + top deal + top relation into a single recommendation |

### Private layer (scoped by `x-user-id`)

| Method | Path                               | Notes |
| ------ | ---------------------------------- | ----- |
| GET    | `/api/private/contacts`            | caller's private contacts |
| POST   | `/api/private/contacts`            | add private contact |
| GET    | `/api/private/notes/:personId`     | notes about a person |
| POST   | `/api/private/notes`               | create note |
| GET    | `/api/private/lists`               | caller's lists |
| PUT    | `/api/private/lists`               | upsert a list |

### Mode semantics

Pass `?mode=` on `/api/people` and `/api/map`:

- `global` — only `visibility_org = true` (the neutral layer)
- `my_network` — org-visible **plus** caller's private contacts
- `private` — only the caller's private contacts

## Kafka topics

See `infra/kafka/topics.md`. Canonical constants live in
`packages/events/src/topics.ts`.

## Alert rule DSL

Rules live in Redis under the hash `alert-engine:rules`. Both the
`alert-engine` service and `influence-api` can read/write them.

```json
{
  "id": "base-high-impact",
  "name": "High-impact moves on top-relevance people",
  "enabled": true,
  "event_types": ["ROLE_CHANGE", "MA_ANNOUNCEMENT"],
  "min_impact_on_us": "HIGH",
  "min_influence_score": 80,
  "min_relevance_score": 70
}
```

The engine computes an `alert_score`:

```
alert_score = influence_score * 0.4
            + relevance_score * 0.4
            + impact_weight   * 0.2     (LOW=20, MEDIUM=60, HIGH=100)
```

Severity mapping: ≥85 CRITICAL, ≥70 IMPORTANT, ≥50 INFO, <50 dropped.

## Quick start (local dev)

```bash
# 1. Spin up the dev backends (Neo4j, Redis, OpenSearch, Kafka)
docker compose -f docker-compose.dev.yml up -d

# 2. Load Neo4j schema + seed data
docker compose -f docker-compose.dev.yml exec -T neo4j \
  cypher-shell -u neo4j -p password < infra/neo4j/schema.cypher

# 3. Configure env
cp .env.example .env
# edit .env:
#   NEO4J_URI=bolt://localhost:7687
#   NEO4J_PASSWORD=password
#   REDIS_URL=redis://localhost:6379
#   OPENSEARCH_URL=http://localhost:9200
#   KAFKA_BROKERS=localhost:9092
#   ANTHROPIC_API_KEY=sk-ant-...        # optional; falls back to deterministic
#   VITE_MAPBOX_TOKEN=pk...              # optional; falls back to no-map view

# 4. Run influence-api
cd services/influence-api && npm install && npm run dev

# 5. In separate shells, run the pipeline services you want:
cd services/influence-ingestion   && npm install && npm run dev
cd services/event-normalizer      && npm install && npm run dev
cd services/influence-enrichment  && npm install && npm run dev
cd services/alert-engine          && npm install && npm run dev
cd services/action-engine         && npm install && npm run dev
cd services/notification-dispatcher && npm install && npm run dev

# 6. Run the web UI
cd apps/web && npm install && npm run dev
```

- Web:   <http://localhost:5173>
- API:   <http://localhost:4000>
- Alert-engine HTTP: <http://localhost:4100>
- Neo4j Browser: <http://localhost:7474>

The ingestion service ships with a `USE_MOCK=true` flag that emits a
handful of plausible events on every poll, so the full loop works
even without RSS/API credentials.

## Production deploy (self-hosted)

```bash
cp .env.example .env
# Point at your real external backends and set ANTHROPIC_API_KEY

docker compose build
docker compose up -d
```

All 9 application services come up. Put your reverse proxy in front
of `web` (port 8080) for TLS.

## Deploying from Gitea

1. Create a repo on your Gitea (`wavult-geopol`).
2. Push this folder as the root of that repo.
3. On the target host:
   ```bash
   git clone git@your-gitea:you/wavult-geopol.git
   cd wavult-geopol
   cp .env.example .env
   docker compose up -d --build
   ```

## Roadmap

Already on the board but not yet implemented:

- **Predictive Engine** — forward-look ("this will happen based on
  hiring/investment/movement patterns")
- **Opportunity Detection** — surface openings, not just risks
- **Autonomous Agent** — auto-schedule tasks, suggest meetings
- **Influence Drift Tracking** — detect when someone gains/loses power
- **War Room Mode** — real-time situation awareness dashboard
- **CRM integration** — action-engine writes tasks to HubSpot/Attio
- **Slack / email notifier** — currently in-app only
