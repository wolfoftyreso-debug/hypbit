# Amos Identity Platform

A production-grade, event-driven identity verification platform — the open
engineering equivalent of Persona. Built as a monorepo of NestJS
microservices designed for enterprise deployment on AWS.

---

## Capabilities

- **Identity session orchestration** — end-to-end verification pipeline
- **Document verification** — passport / ID card OCR + field validation
- **Face recognition + face match** — selfie vs document portrait
- **Liveness detection** — challenge-response + texture analysis
- **Risk scoring engine** — composite fraud score (0-100)
- **Immutable audit logs** — append-only, hash-chained
- **Event-driven architecture** — Kafka as the spine
- **Secure PII storage** — AES-256 encryption, signed URLs
- **API gateway ready** — internal vs external API separation

---

## Architecture

```
                    ┌──────────────────┐
                    │   External API   │   JWT auth
                    │  (identity-svc)  │
                    └────────┬─────────┘
                             │
            ┌────────────────┼──────────────────┐
            │                │                  │
            ▼                ▼                  ▼
  ┌────────────────┐  ┌──────────────┐  ┌──────────────┐
  │ document-svc   │  │  face-svc    │  │  risk-svc    │
  │ OCR/Tesseract  │  │  CompreFace  │  │  scoring     │
  └───────┬────────┘  └──────┬───────┘  └──────┬───────┘
          │                  │                  │
          └──────────────────▼──────────────────┘
                             │
                       Kafka event bus
                             │
                             ▼
                   ┌──────────────────┐
                   │  audit-service   │   immutable
                   └──────────────────┘
```

Shared infrastructure:

| Component   | Local               | AWS production       |
| ----------- | ------------------- | -------------------- |
| Database    | Postgres 16         | RDS Postgres         |
| Cache       | Redis 7             | ElastiCache          |
| Event bus   | Kafka               | MSK                  |
| Blob store  | MinIO               | S3                   |
| Face engine | CompreFace          | CompreFace on ECS    |
| OCR         | Tesseract           | Tesseract in ECS     |

---

## Services

| Service             | Port | Responsibility                                 |
| ------------------- | ---- | ---------------------------------------------- |
| `identity-service`  | 3000 | Session orchestration, public API              |
| `document-service`  | 3001 | OCR, MRZ parsing, document field validation    |
| `face-service`      | 3002 | Face match, liveness detection                 |
| `risk-service`      | 3003 | Composite risk scoring                         |
| `audit-service`     | 3004 | Immutable audit log ingest and query           |

---

## API

See `api/openapi.yaml` for the full OpenAPI 3.1 specification.

Core flow:

```
POST /identity/session          → create a verification session
POST /identity/:id/document     → upload document (signed URL)
POST /identity/:id/selfie       → upload selfie + liveness
POST /identity/:id/verify       → run full pipeline
GET  /identity/:id/status       → poll final status
```

---

## Pipeline

1. **Create session** — `identity-service` issues a session id and short-lived
   JWT.
2. **Upload document** — `document-service` stores the image in S3 (MinIO
   locally), runs Tesseract OCR, parses MRZ, publishes
   `document.uploaded`.
3. **Upload selfie** — `face-service` stores the selfie, runs CompreFace face
   match vs the document portrait, runs liveness, publishes `face.processed`.
4. **Run risk** — `risk-service` consumes the above events, computes a
   composite score, publishes `risk.completed`.
5. **Finalize** — `identity-service` consumes `risk.completed`, writes the
   decision (approve / review / reject) and publishes `identity.verified`.
6. **Audit** — `audit-service` consumes every event and appends a hash-chained
   entry.

---

## Getting Started

### Prerequisites

- Docker + Docker Compose
- Node.js 20+ (only required if running services outside containers)

### Run the full stack

```bash
cp .env.example .env
docker compose up --build
```

This boots:

- All 5 NestJS microservices
- PostgreSQL, Redis, Kafka (+ Zookeeper)
- MinIO (S3-compatible, console at <http://localhost:9001>)
- CompreFace (face engine, UI at <http://localhost:8000>)

### Quick smoke test

```bash
# 1. Create a session
curl -X POST http://localhost:3000/identity/session \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer dev-key' \
  -d '{"country":"SE","reference":"demo-001"}'

# 2. Upload a document
curl -X POST http://localhost:3000/identity/<id>/document \
  -H 'Authorization: Bearer dev-key' \
  -F 'file=@./samples/passport.jpg' \
  -F 'type=passport'

# 3. Upload a selfie
curl -X POST http://localhost:3000/identity/<id>/selfie \
  -H 'Authorization: Bearer dev-key' \
  -F 'file=@./samples/selfie.jpg'

# 4. Run verification
curl -X POST http://localhost:3000/identity/<id>/verify \
  -H 'Authorization: Bearer dev-key'

# 5. Poll status
curl http://localhost:3000/identity/<id>/status \
  -H 'Authorization: Bearer dev-key'
```

---

## Security

| Control                     | Implementation                                       |
| --------------------------- | ---------------------------------------------------- |
| PII encryption at rest      | AES-256-GCM via `libs/crypto`                        |
| Signed upload URLs          | S3 presigned PUT, 15 min TTL                         |
| JWT auth                    | RS256, rotated keys from Secrets Manager             |
| Immutable audit             | `audit-service` hash-chain (SHA-256)                 |
| Internal vs external APIs   | Separate controllers + JWT audiences                 |
| Secret management           | AWS Secrets Manager (prod), `.env` (local only)      |
| Rate limiting               | per-IP + per-session in `identity-service`           |

---

## Repository Layout

```
amos-identity-platform/
├── services/
│   ├── identity-service/      NestJS orchestrator, public API
│   ├── document-service/      OCR + field validation
│   ├── face-service/          CompreFace integration + liveness
│   ├── risk-service/          Composite scoring
│   └── audit-service/         Immutable audit log
├── libs/
│   ├── crypto/                AES-256 helpers + JWT
│   ├── ocr/                   Tesseract wrapper
│   ├── face/                  CompreFace client
│   └── utils/                 Logger, errors, kafka helpers
├── infra/
│   ├── docker/                Extra Dockerfiles (tesseract, etc.)
│   └── terraform/             AWS ECS + RDS + MSK + S3
├── api/
│   └── openapi.yaml           OpenAPI 3.1 spec
├── events/
│   └── kafka-topics.json      Topic catalog
├── docker-compose.yml         Full local stack
└── README.md
```

---

## Testing

```bash
# from repo root
npm install
npm run test         # runs all service test suites
npm run test:cov     # with coverage
```

Each service includes unit tests. Mock providers for OCR and CompreFace
are in `libs/ocr/src/mock.ts` and `libs/face/src/mock.ts`, and are used
automatically when `NODE_ENV=test`.

---

## Deployment

```bash
cd infra/terraform
terraform init
terraform plan -var-file=prod.tfvars
terraform apply -var-file=prod.tfvars
```

This provisions an ECS Fargate cluster with a task definition per service,
an RDS Postgres instance, an MSK cluster, an ElastiCache Redis cluster, an
S3 bucket for PII payloads, and an ALB in front of `identity-service`.

---

## License

Proprietary — © Amos. All rights reserved.
