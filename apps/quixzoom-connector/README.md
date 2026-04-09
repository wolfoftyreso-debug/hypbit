# quiXzoom AI Connector

Bridges AI model platforms (ChatGPT, Claude, Gemini, etc.) to the quiXzoom
real-world visual-capture network. Sits between the LLM tool-use layer and
the existing quiXzoom backend (`apps/wavult-core`, `quixzoom-api`, identity,
finance).

## What it does

A user asks an LLM "Show me the parking lot at Blåsut right now". The LLM
invokes the `generate_real_world_dataset` tool exposed by this connector.
The connector:

1. Classifies the intent as `REAL_WORLD_CAPTURE`.
2. Resolves the location.
3. Builds a **QVL v1.0** (Query Visual Language) object describing the shot.
4. Creates a task, reserves tokens, and dispatches to the photographer
   network through Kafka.
5. Streams progress and delivered images back to the LLM chat over SSE.

## Endpoints

| Method | Path             | Purpose                                       |
|--------|------------------|-----------------------------------------------|
| POST   | `/llm/query`     | Universal LLM gateway (<500 ms p95)           |
| POST   | `/v1/tasks`      | Direct task creation for REST API consumers   |
| GET    | `/v1/tasks/:id`  | Task status                                   |
| GET    | `/stream/:id`    | Server-Sent Events progress stream            |
| GET    | `/health`        | Liveness                                      |
| GET    | `/ready`         | Readiness (Redis + Kafka)                     |

## Architecture

- **Runtime**: Node.js 20, TypeScript, Express
- **Events**: Amazon MSK (Kafka) — see `src/events/topics.ts`
- **Cache / Pub-Sub**: Amazon ElastiCache (Redis)
- **Auth**: Keycloak JWT + per-platform API keys
- **Region**: `eu-north-1` (matches Wavult OS)

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Phases

See `quiXzoom_Master_Agent_Integration_Document_v2` for the full
implementation guide. Phases implemented:

- [x] Phase 1 — Scaffolding
- [x] Phase 2 — Data models & types (QVL v1.0, Task state machine, events)
- [x] Phase 3 — Core API endpoints (Express, /llm/query, /v1/tasks, SSE)
- [x] Phase 4 — Core services (intent, qvl-builder, location, task-manager)
- [x] Phase 5 — Kafka + Redis integration (producer, consumer, pub/sub bridge)
- [x] Phase 6 — LLM platform integrations (OpenAPI, ChatGPT GPT, Claude MCP)
- [x] Phase 7 — Terraform infrastructure (VPC, Redis, ALB, ECS, MSK topics)
- [x] Phase 8 — Dockerfile + CI/CD (.gitea/workflows/deploy-quixzoom-connector.yml)
- [x] Phase 9 — End-to-end tests and go-live checklist

See [`GO_LIVE_CHECKLIST.md`](./GO_LIVE_CHECKLIST.md) for launch status.
