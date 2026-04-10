# Wavult Geopol

Graph-backed geopolitical intelligence platform.

A multi-datastore system composed of:

- **Neo4j** — graph of entities, relationships, influence networks
- **Redis** — cache, sessions, precomputed paths
- **OpenSearch** — full-text and filtered search over entities

The application itself is split into two services:

- `client/` — React + Vite frontend, served by nginx in production
- `server/` — Express + TypeScript API with clients for Neo4j, Redis, OpenSearch

## Architecture

```
 ┌────────┐   http   ┌────────┐   bolt    ┌─────────┐
 │ client │ ───────▶ │ server │ ────────▶ │  Neo4j  │
 └────────┘          │        │ ─────────▶│  Redis  │
                     │        │ ─────────▶│OpenSearch
                     └────────┘           └─────────┘
```

Neo4j, Redis and OpenSearch are **external services** in production.
They are not part of `docker-compose.yml`. Point the server at them via
environment variables (see `.env.example`).

## Quick start (local dev)

```bash
# 1. Spin up the datastores for local development
docker compose -f docker-compose.dev.yml up -d

# 2. Configure env
cp .env.example .env
# edit .env and point at localhost:
#   NEO4J_URI=bolt://localhost:7687
#   NEO4J_PASSWORD=geopol-dev-password
#   REDIS_URL=redis://localhost:6379
#   OPENSEARCH_URL=http://localhost:9200

# 3. Run server
cd server && npm install && npm run dev

# 4. In another shell, run client
cd client && npm install && npm run dev
```

Client: <http://localhost:5173>
Server: <http://localhost:4000>
Health: <http://localhost:4000/health/ready>

## Production deploy (self-hosted, e.g. Gitea + your own host)

```bash
cp .env.example .env
# edit .env to point at your external Neo4j / Redis / OpenSearch

docker compose build
docker compose up -d
```

The client will be exposed on `${CLIENT_PORT:-8080}`. Put your reverse
proxy (Caddy, nginx, Traefik) in front of it for TLS.

## API

| Method | Path                 | Description                                |
| ------ | -------------------- | ------------------------------------------ |
| GET    | `/health/live`       | Liveness probe                             |
| GET    | `/health/ready`      | Readiness — pings all backing services    |
| GET    | `/api/entities`      | List/search entities (OpenSearch)         |
| GET    | `/api/entities/:id`  | Fetch entity by id (Neo4j, Redis-cached)  |
| POST   | `/api/entities`      | Upsert entity into Neo4j + OpenSearch     |

### Example

```bash
curl -X POST http://localhost:4000/api/entities \
  -H 'content-type: application/json' \
  -d '{"id":"se","name":"Sweden","type":"country","summary":"Nordic state"}'

curl http://localhost:4000/api/entities?q=sweden
```

## Layout

```
wavult-geopol/
├── client/                 # React + Vite + nginx
│   ├── src/
│   ├── Dockerfile
│   └── nginx.conf
├── server/                 # Express + TS + Neo4j/Redis/OpenSearch clients
│   ├── src/
│   │   ├── db/
│   │   ├── routes/
│   │   └── index.ts
│   └── Dockerfile
├── docker-compose.yml      # Production: app services only
├── docker-compose.dev.yml  # Local dev: datastores only
└── .env.example
```

## Deploying from Gitea

This repo is designed to be mirrored / pushed to your own Gitea instance and
built on your own runner or server. No cloud-vendor lock-in.

Typical flow:

1. Create a repo on your Gitea (`wavult-geopol`).
2. Push this folder as the root of that repo.
3. On the target host:
   ```bash
   git clone git@your-gitea:you/wavult-geopol.git
   cd wavult-geopol
   cp .env.example .env  # edit
   docker compose up -d --build
   ```
