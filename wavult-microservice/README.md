# Wavult Microservice

Production-ready, AWS-native microservice template used across the Wavult
platform. Built with **Node.js 20 + TypeScript + Fastify**, wired for
**Kafka (MSK)**, **Redis (ElastiCache)**, **PostgreSQL (RDS)**, **S3**,
**SQS** and **Secrets Manager**. Ships with structured logging, OpenTelemetry
tracing, Prometheus metrics, a hardened Docker image and Terraform for
ECS Fargate deployment.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Quickstart](#quickstart)
3. [Configuration](#configuration)
4. [API Endpoints](#api-endpoints)
5. [Kafka Topology](#kafka-topology)
6. [Observability](#observability)
7. [Deployment to AWS](#deployment-to-aws)
8. [Project Layout](#project-layout)
9. [Testing](#testing)

---

## Architecture

```
              ┌──────────────┐
              │     ALB      │
              └──────┬───────┘
                     │ HTTPS
              ┌──────▼───────┐
              │  ECS Fargate │   ◄──── Terraform (infra/terraform)
              │   Service    │
              └──┬────┬───┬──┘
                 │    │   │
        ┌────────┘    │   └──────────┐
        │             │              │
   ┌────▼────┐  ┌─────▼─────┐  ┌─────▼──────┐
   │   RDS   │  │ ElastiCache│  │   MSK      │
   │Postgres │  │   Redis    │  │  (Kafka)   │
   └─────────┘  └────────────┘  └────────────┘

                 ┌───────────┐
                 │    S3     │  event payload archive
                 └───────────┘
                 ┌───────────┐
                 │    SQS    │  dead-letter / async work
                 └───────────┘
                 ┌───────────┐
                 │ Secrets   │  DB/API credentials
                 │ Manager   │
                 └───────────┘
```

---

## Quickstart

### Local development

```bash
cp .env.example .env
npm install
docker compose up -d postgres redis kafka zookeeper
npm run dev
```

The service is now available at <http://localhost:8080>.

### Full stack in Docker

```bash
docker compose up --build
```

This boots Postgres, Redis, Kafka/Zookeeper, the OTel collector and the
microservice.

---

## Configuration

All configuration is validated at boot time with **Zod** in
`src/config/index.ts`. If any required variable is missing or malformed the
process exits with a clear error.

See [`.env.example`](./.env.example) for the full list.

Secrets in production are loaded from **AWS Secrets Manager** (see
`AWS_SECRETS_MANAGER_ID`); everything else comes from ECS task definition
environment variables.

---

## API Endpoints

| Method | Path                 | Description                                |
| ------ | -------------------- | ------------------------------------------ |
| GET    | `/health/live`       | Liveness probe (process is alive)          |
| GET    | `/health/ready`      | Readiness probe (DB + Redis + Kafka ready) |
| GET    | `/metrics`           | Prometheus metrics                         |
| POST   | `/v1/events`         | Publish an event to Kafka + persist to DB  |
| GET    | `/v1/events/:id`     | Fetch a stored event by id (Redis cached)  |

All endpoints return JSON and emit a `x-request-id` header for distributed
tracing correlation.

---

## Kafka Topology

| Topic                 | Partitions | Retention | Purpose                    |
| --------------------- | ---------- | --------- | -------------------------- |
| `wavult.events.v1`    | 12         | 7 days    | Primary event stream       |
| `wavult.events.dlq.v1`| 3          | 30 days   | Poison-pill dead letter    |

The service runs both a producer (`src/kafka/producer.ts`) and an idempotent
consumer (`src/kafka/consumer.ts`) with at-least-once semantics and manual
offset commits.

---

## Observability

* **Logging** — `pino` with JSON in prod, pretty in dev, request-id
  propagation via Fastify hooks.
* **Tracing** — OpenTelemetry auto-instrumentation for HTTP, pg, ioredis and
  kafkajs. Exported via OTLP/HTTP to the collector (or AWS OpenTelemetry
  Distribution on ECS).
* **Metrics** — `prom-client` default metrics + custom histograms exposed at
  `/metrics`. Scraped by CloudWatch Agent / ADOT.

---

## Deployment to AWS

```bash
cd infra/terraform
terraform init
terraform plan -var-file=prod.tfvars
terraform apply -var-file=prod.tfvars
```

This provisions:

* ECS Fargate cluster + service (behind an ALB)
* ECR repository for the image
* IAM task & execution roles with least privilege
* Security groups for private subnets
* CloudWatch log group with 30-day retention

CI/CD is wired in `.github/workflows/deploy.yml` and pushes images to ECR on
every merge to `main`, then forces a new ECS deployment.

---

## Project Layout

```
wavult-microservice/
├── src/
│   ├── index.ts              # Bootstrap (tracing first!)
│   ├── server.ts             # Fastify app factory
│   ├── config/               # Zod-validated env
│   ├── logger/               # pino
│   ├── tracing/              # OTel SDK
│   ├── metrics/              # prom-client
│   ├── health/               # liveness + readiness
│   ├── kafka/                # producer + consumer
│   ├── redis/                # ioredis client
│   ├── db/                   # pg pool + migrations
│   ├── aws/                  # s3, sqs, secrets-manager
│   ├── routes/               # HTTP routes
│   ├── services/             # Business logic
│   ├── middleware/           # Fastify plugins
│   ├── errors/               # Typed error hierarchy
│   └── utils/                # circuit-breaker, graceful-shutdown
├── tests/
│   ├── unit/
│   └── integration/
├── infra/
│   ├── terraform/            # AWS ECS/MSK/ElastiCache modules
│   └── otel-collector.yaml
├── .github/workflows/        # CI + Deploy
├── Dockerfile                # Multi-stage, non-root
├── docker-compose.yml        # Local dev stack
└── README.md
```

---

## Testing

```bash
npm test                 # unit + integration
npm run test:coverage    # with coverage report
npm run lint             # ESLint
npm run format           # Prettier
```

---

## License

Proprietary — © Wavult. All rights reserved.
