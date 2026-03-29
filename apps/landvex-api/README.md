# Landvex API

Express API service för Landvex — infrastrukturövervakning inom Wavult Group.

## Endpoints

| Method | Path | Beskrivning |
|--------|------|-------------|
| GET | /health | Hälsostatus |
| GET | /v1/objects | Infrastrukturobjekt (pier, quay, etc.) |
| GET | /v1/alerts | Aktiva larm |
| POST | /v1/webhooks/bos | BOS scheduler webhook |

## Lokal utveckling

```bash
npm install
npm run dev
```

## Deploy

GitHub Actions deployar automatiskt vid push till `apps/landvex-api/**` på `main`-branchen.

## ALB routing (framtida)

När NS-byte för wavult.com är gjort behöver en ALB listener rule läggas till:

- **Host:** `api.wavult.com`
- **Path:** `/landvex/*`
- **Target group:** landvex-api

## Supabase-integration

Koppla `SUPABASE_URL` och `SUPABASE_SERVICE_KEY` som ECS task env-variabler (via Secrets Manager) när Supabase-schemat är klart.
