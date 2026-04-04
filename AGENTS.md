# AGENTS.md — Wavult OS Kontext för AI-agenter

> Läs detta innan du gör NÅGONTING. Det här är sanningskällan.

---

## Vem du hjälper

**Erik Svensson** — Chairman & Group CEO, Wavult Group  
**Dennis Bjarnemark** — Chief Legal & Operations / QMS-ansvarig  
**Johan Berglund** — Group CTO  
**Leon Russo** — CEO Wavult Operations  
**Winston Bjarnemark** — CFO  

---

## Vad Wavult är

**Wavult Group** bygger det optiska lagret i världen.

### Produkter (GTM-sekvens — LÅST)
1. **quiXzoom** — crowdsourcad bildplattform. Zoomers (ALDRIG "fotografer") tar bilduppdrag via karta, levererar bilddata, tjänar pengar. Launch Sverige Q2 2026, Stockholms skärgård.
2. **Quixom Ads** — B2B dataplattform. Leads och hyperlokal annonsering baserat på bilddata. Fas 2.
3. **LandveX / Optical Insight** — Enterprise B2G/B2B mot kommuner, Trafikverket, fastighetsbolag. Larm, händelserapporter, analysabonnemang. "Right control. Right cost. Right interval." Fas 3.
4. **Wavult OS** — Det interna enterprise-operativsystemet. **Säljs INTE.** Är ryggraden som driver alla ovanstående.

### Vad du ALDRIG ska göra
- Kalla zoomers för "fotografer" — **ABSOLUT REGEL**
- Säga att Wavult OS säljs externt
- Jämföra Wavult OS med Palantir/SAP/Salesforce (fel kategori)
- Säga "AI" om produkterna — använd: optisk analys, vision engine, optical layer, automatiserad, intelligent
- Skriva mockdata, hårdkodad data eller placeholders
- Använda dark mode / mörka teman
- Referera till Sinek, Jobs, Musk eller andra "guruer"
- Använda gamla namn: **pixdrift**, **Hypbit** som produktnamn (mailadresser @hypbit.com är temporära)

---

## Tech Stack

```
Frontend:  React + TypeScript + Tailwind CSS → Cloudflare Pages
Backend:   Node.js/Express + TypeScript → AWS ECS eu-north-1 (cluster: wavult)
Databas:   PostgreSQL 16 på AWS RDS (wavult-identity-ecs) — INTE cloud Supabase
Auth:      identity-core (separat ECS-tjänst)
CI/CD:     Gitea (git.wavult.com) + EC2 runner (Docker-mode)
CDN:       Cloudflare WAF + proxy
Secrets:   AWS SSM Parameter Store — ALDRIG i .env för klientkod
```

### Designstandard — ABSOLUT LÅST
- **Bakgrund:** `#F5F0E8` (cream)
- **Primär accent:** `#0A3D62` (navy)
- **Sekundär accent:** `#E8B84B` (gold)
- **INGEN dark mode** — permanent borttaget
- Varmt, lugnt, elegant

---

## Arkitektur — viktiga regler

### API-arkitektur (ABSOLUT REGEL)
```
✅ Klient → API Core (wavult-core) → externa tjänster
❌ Klient → OpenAI direkt
❌ EXPO_PUBLIC_OPENAI_KEY i frontend-kod
```
Alla externa API-anrop går via wavult-core. API-nycklar lever i SSM.

### Databas
- Produktionsdatabas: `wavult-identity-ecs.cvi0qcksmsfj.eu-north-1.rds.amazonaws.com`
- Database: `wavult_os`
- **Cloud Supabase är blockerat** — `assertNotCloudSupabase()` kastar error vid uppstart
- SSL krävs: `ssl: { rejectUnauthorized: false }` i pg-klienten

### Produktionslås
- **Aldrig mockdata, aldrig demo, aldrig provisoriskt**
- Allt som byggs är produktionsfärdigt enterprise från dag ett
- Om något inte kan byggas klart nu — bygg det inte, visa ett ärligt tomt state

---

## Monorepo-struktur

```
Wavult/
├── apps/
│   ├── command-center/     # React frontend (Wavult OS UI)
│   │   ├── src/features/   # Alla moduler (qms, okr, agent, visa, etc.)
│   │   └── public/         # wavult-logo.svg + PNG-ikoner
│   ├── wavult-core/        # Express API Core
│   │   ├── src/ai/         # AI Orchestration Layer
│   │   │   ├── agents/     # Expert Agents (10 st) + Proactive Engine
│   │   │   ├── orchestrator.ts
│   │   │   ├── registry.ts
│   │   │   └── providers.ts
│   │   └── src/routes/     # API-routes
│   ├── identity-core/      # Auth-tjänst
│   ├── wavult-app/         # React Native mobilapp
│   └── landvex-api/        # LandveX backend
├── packages/               # Delade paket
├── .gitea/
│   ├── workflows/          # CI/CD + RTM-gate
│   └── PULL_REQUEST_TEMPLATE/  # RTM PR-mall
└── AGENTS.md               # Den här filen
```

---

## Vad som är byggt (april 2026)

### QMS — Kvalitetsledningssystem
- 193 ISO-kontroller (ISO 9001, ISO 27001, GDPR, NIS2) i databasen
- Komplett implementation-text per kontroll
- Ägarmatris: Dennis (59), Johan (51), Erik (6), Leon (5), Winston (1)
- RoPA (15 behandlingsaktiviteter), Riskregister (15 risker), DPA-register (9 leverantörer)
- 21 styrdokument (POL/QP/WI), 6 revisionsplaner 2026, 3 aktiva CAPAs
- Modulerna: `/qms`, `/okr`, `/academy`

### AI Orchestration Layer (`src/ai/`)
- 8 modeller: llama4-scout (lokal), claude-haiku, claude-sonnet, gemini-flash, gemini-pro, whisper
- Intelligent routing per task_type med automatisk fallback
- Response-cache (in-memory, SHA-256)

### Agent Mesh (`src/ai/agents/`)
- 10 expert-agenter: qms, legal, finance, code, infra, people, risk, data, operations, product
- Rollkoppling: varje person (erik/dennis/johan/leon/winston) har tillåtna agenter + injicerad rollkontext
- Proaktiva agenter kör var 6:e timme — skapar tasks och notifications autonomt
- `/v1/agents/chat`, `/v1/agents/me/:personId`, `/v1/agents/run`

### RTM-process (Release to Manufacturing)
- `rtm`-branch kräver 4 godkännanden (Dennis/Winston/Johan/Erik) — ingen kan merga ensam
- `main` kräver 2 godkännanden
- PR-mall med fullständig juridisk/ekonomisk/teknisk/design-checklista
- Gitea webhook → skapar tasks i Wavult OS för varje granskare automatiskt

### Logotyp
- Manometer-logotyp (SVG) — visare rakt upp = inom toleransen
- `/public/wavult-logo.svg` + PNG i 16/32/48/96/192/512px
- Live i navbar och som favicon

---

## Aktiva gaps (att bygga)

| Gap | Ägare | Deadline |
|-----|-------|----------|
| MFA för externa användare | Johan | 2026-06-30 |
| DPA: OpenAI, ElevenLabs, Revolut | Dennis | 2026-05-31 |
| Kvalitetspolicy POL-001 godkännas | Erik | 2026-04-30 |
| NIS2-registrering hos MSB | Dennis | Snarast |
| GPU-instans (Llama 4) | AWS quota pending | Auto-start när klar |
| QMS för quiXzoom, LandveX, Holding | Dennis | — |
| GDPR DPIA för bilddata (quiXzoom) | Dennis | — |

---

## Branch-flöde

```
feature/din-branch
    ↓ PR mot rtm
[4 godkännanden krävs]
    ↓ merge till rtm
[auto-deploy staging]
    ↓ manuell trigger
main (produktion)
```

**Pusha ALDRIG direkt till main eller rtm.**

---

## Credentials

Alla credentials i: `/home/erikwsl/.openclaw/secrets/credentials.env` (Linux)  
AWS region: `eu-north-1`  
Gitea: `git.wavult.com`  
API prod: `api.wavult.com`  
Command Center prod: `os.wavult.com`

---

*Uppdaterad: 2026-04-04. Vid konflikt mellan den här filen och verkligheten — verkligheten vinner, uppdatera filen.*
