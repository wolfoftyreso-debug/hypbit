# pixdrift — Din To-Do (2026-03-21)

> **Byggt idag:** Komplett OMS-plattform live på pixdrift.com — landing page, 5 subdomäner (app/admin/crm/sales/workstation), 62 API-endpoints, Open Banking (Tink/PSD2), Fortnox+Visma integrationer, SAP/Oracle/Dynamics 365 ERP-nav, multi-currency, SIE4-export, compliance-modul med personalliggare+kassaregister, Swedish tax compliance (moms/AGI/ROT/RUT), onboarding-flow (6-stegs OOBE), SEO-optimering (sitemap, schema.org, blog, SIE4 landing page), i18n på 6 språk, fullständig GTM-strategi + outreach-playbook, brand-positionering. System i produktion i ECS eu-north-1. Inga 500-fel. SSL giltigt t.o.m. 2026-10.

---

## 🔴 KRITISKT — Gör detta idag

### 1. Mergea branch till main (5 min)
All ny kod sitter på `claude/setup-hypbit-oms-B9rQI` — main är bakom.

```bash
cd /mnt/c/Users/erik/Desktop/hypbit
git checkout main
git merge claude/setup-hypbit-oms-B9rQI
git push origin main
```

> ⚠️ Produktionskoden är på feature-branchen. Detta MÅSTE göras för att CI/CD ska deployas till produktion vid nästa push.

---

### 2. Fixa CORS i SSM (15 min)
Systemtestet visar att `CORS_ORIGIN` i SSM innehåller `workstation.pixdrift.com` men appen lever på `app.bc.pixdrift.com`. API-anrop från appen kan blockeras.

```bash
aws ssm put-parameter \
  --name "/hypbit/prod/CORS_ORIGIN" \
  --value "https://pixdrift.com,https://app.bc.pixdrift.com,https://admin.bc.pixdrift.com,https://crm.bc.pixdrift.com,https://sales.bc.pixdrift.com" \
  --type "String" \
  --overwrite \
  --region eu-north-1

# Starta om API:t:
aws ecs update-service \
  --cluster hypbit \
  --service hypbit-api \
  --force-new-deployment \
  --region eu-north-1
```

---

### 3. Stripe-aktivering (30 min)
Systemet är redo — Stripe-koden finns. Du behöver bara konton och nycklar.

**Steg:**
1. Skapa Stripe-konto på [stripe.com](https://stripe.com)
2. Hämta: `STRIPE_SECRET_KEY` (sk_live_...) och `STRIPE_WEBHOOK_SECRET` (whsec_...)
3. Skapa två priser i Stripe:
   - **Starter** → €499/månad (recurring) → hämta Price ID (`price_...`)
   - **Growth** → €999/månad (recurring) → hämta Price ID (`price_...`)
4. Konfigurera webhook i Stripe: URL = `https://api.bc.pixdrift.com/api/stripe/webhook`, events: `checkout.session.completed`, `customer.subscription.deleted`
5. Kör:

```bash
aws ssm put-parameter --name "/hypbit/prod/STRIPE_SECRET_KEY" --value "sk_live_..." --type SecureString --overwrite --region eu-north-1
aws ssm put-parameter --name "/hypbit/prod/STRIPE_WEBHOOK_SECRET" --value "whsec_..." --type SecureString --overwrite --region eu-north-1
aws ssm put-parameter --name "/hypbit/prod/STRIPE_PRICE_STARTER" --value "price_..." --type SecureString --overwrite --region eu-north-1
aws ssm put-parameter --name "/hypbit/prod/STRIPE_PRICE_GROWTH" --value "price_..." --type SecureString --overwrite --region eu-north-1

aws ecs update-service --cluster hypbit --service hypbit-api --force-new-deployment --region eu-north-1
```

6. Testa checkout: [https://pixdrift.com/checkout.html](https://pixdrift.com/checkout.html)

> 💰 **Inkomstblockerare #1** — Inga betalningar kan tas emot utan detta.

---

### 4. Ersätt IndexNow placeholder (10 min)
Det finns en fil `apps/landing/PLACEHOLDER_INDEXNOW_KEY_REPLACE_WITH_REAL.txt`. IndexNow kräver en riktig UUID-nyckel.

1. Generera nyckel: [indexnow.org/en](https://www.indexnow.org/en) eller kör `uuidgen | tr -d '-' | tr '[:upper:]' '[:lower:]'`
2. Byt namn på filen:
```bash
cd /mnt/c/Users/erik/Desktop/hypbit/apps/landing
INDEXNOW_KEY="din-nyckel-här"
mv PLACEHOLDER_INDEXNOW_KEY_REPLACE_WITH_REAL.txt "${INDEXNOW_KEY}.txt"
echo "$INDEXNOW_KEY" > "${INDEXNOW_KEY}.txt"
```
3. Uppdatera `sitemap.xml` och relevanta HTML-filer med din nyckel
4. Submitta till IndexNow: `https://api.indexnow.org/indexnow?url=https://pixdrift.com&key=${INDEXNOW_KEY}`

---

### 5. Google Search Console (15 min)
SEO-strategin är klar men 0 sidor är indexerade. Detta startar Googles crawling.

1. Gå till [search.google.com/search-console](https://search.google.com/search-console)
2. Lägg till `pixdrift.com` som domän-property
3. Verifiera med DNS TXT-post i Cloudflare (enklaste metoden)
4. Indexing → Sitemaps → Lägg till: `https://pixdrift.com/sitemap.xml`
5. Begär indexering av startsidan manuellt: URL Inspection → Request indexing

> 🔍 Utan detta syns pixdrift.com inte på Google. Tar 1-2 veckor att kicka in.

---

## 🟠 HÖG PRIORITET — Denna vecka

### 6. Apple Developer Program (15 min + 24h väntan)
AASA-filen (apple-app-site-association) har `TEAMID` som placeholder.

1. Gå till [developer.apple.com/programs/](https://developer.apple.com/programs/)
2. Betala $99/år (krävs för App Store)
3. Hämta ditt **Team ID** (Membership-sidan, 10 tecken, t.ex. `AB1234CDEF`)
4. Ersätt `TEAMID` i:

```bash
# Fil: /mnt/c/Users/erik/Desktop/hypbit/apps/landing/.well-known/apple-app-site-association
# Ersätt TEAMID med ditt faktiska Team ID, t.ex. AB1234CDEF
sed -i 's/TEAMID/AB1234CDEF/g' /mnt/c/Users/erik/Desktop/hypbit/apps/landing/.well-known/apple-app-site-association
```

---

### 7. Sätt upp Tink Open Banking (2-4h)
Koden är klar. Behöver bara credentials.

1. Registrera på [console.tink.com](https://console.tink.com/)
2. Skapa en app → konfigurera redirect URI: `https://api.bc.pixdrift.com/api/banking/callback`
3. Aktivera scoper: `accounts:read`, `transactions:read`, `balances:read`, `identity:read`
4. Hämta: `TINK_CLIENT_ID` och `TINK_CLIENT_SECRET`

```bash
aws ssm put-parameter --name "/hypbit/prod/TINK_CLIENT_ID" --value "..." --type SecureString --overwrite --region eu-north-1
aws ssm put-parameter --name "/hypbit/prod/TINK_CLIENT_SECRET" --value "..." --type SecureString --overwrite --region eu-north-1
```

5. Testa: `https://api.bc.pixdrift.com/api/banking/connect` (kräver auth)

> 💰 **Inkomstblockerare #2** — Open Banking är en av pixdrifts starkaste USP:ar.

---

### 8. Fortnox Developer API-nyckel (30 min)
Koden är klar. Integrationen är fullständig men credentials saknas.

1. Registrera på [developer.fortnox.se](https://developer.fortnox.se/)
2. Skapa en integration → hämta Client ID + Client Secret
3. Konfigurera redirect URI: `https://api.bc.pixdrift.com/api/integrations/fortnox/callback`
4. Scoper: `companyinformation`, `invoice`, `bookkeeping`, `supplierinvoice`

```bash
aws ssm put-parameter --name "/hypbit/prod/FORTNOX_CLIENT_ID" --value "..." --type SecureString --overwrite --region eu-north-1
aws ssm put-parameter --name "/hypbit/prod/FORTNOX_CLIENT_SECRET" --value "..." --type SecureString --overwrite --region eu-north-1
```

---

### 9. Visma e-conomic credentials (30 min)

1. Registrera på [developer.visma.com](https://developer.visma.com/)
2. Skapa OAuth2-app för e-conomic
3. Hämta App Secret Token + konfigurera redirect URI: `https://api.bc.pixdrift.com/api/integrations/visma/callback`

```bash
aws ssm put-parameter --name "/hypbit/prod/VISMA_CLIENT_ID" --value "..." --type SecureString --overwrite --region eu-north-1
aws ssm put-parameter --name "/hypbit/prod/VISMA_SECRET_TOKEN" --value "..." --type SecureString --overwrite --region eu-north-1
```

---

### 10. Sentry — felövervakning (1h)
Systemtestet konstaterar: "Error monitoring: ❌ Saknas". Fel i produktion är helt osynliga.

1. Skapa konto på [sentry.io](https://sentry.io) (gratis upp till 5 000 händelser/mo)
2. Skapa projekt → Node.js → hämta DSN
3. Installera i API:

```bash
cd /mnt/c/Users/erik/Desktop/hypbit/server
npm install @sentry/node
```

4. Lägg till i `server/src/index.ts`:
```typescript
import * as Sentry from '@sentry/node';
Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
```

```bash
aws ssm put-parameter --name "/hypbit/prod/SENTRY_DSN" --value "https://..." --type SecureString --overwrite --region eu-north-1
```

---

### 11. Konvertera SVG-assets till PNG (1h)
SEO-strategin påpekar: "Sociala medier och iOS stödjer inte SVG som OG-image eller favicon."

- `og-image.svg` → `og-image.png` (1200×630px) — används vid delning på LinkedIn/Twitter/Slack
- `favicon.svg` → `favicon-32x32.png`, `favicon-16x16.png`, `apple-touch-icon.png`

```bash
# Med ImageMagick (om installerat):
cd /mnt/c/Users/erik/Desktop/hypbit/apps/landing
magick og-image.svg -resize 1200x630 og-image.png
magick favicon.svg -resize 32x32 favicon-32x32.png
magick favicon.svg -resize 16x16 favicon-16x16.png
magick favicon.svg -resize 180x180 apple-touch-icon.png

# Alternativ: Använd squoosh.app eller figma för konvertering
```

---

### 12. Starta LinkedIn-outreach (3h)
GTM-strategin är klar med kompletta email-mallar och sekvenser. Börja nu — varje vecka räknas.

**Steg idag:**
1. Optimera din LinkedIn-profil: Headline → `"Building pixdrift — the operating system for serious teams | SIE4 + CRM + OMS"`
2. Publicera lanseringspost (mall finns i LAUNCH_PLAN.md)
3. Bygg ICP-lista med Apollo.io (€79/mo): 20-200 anst., SaaS/tech/professionella tjänster, Sverige
4. Skicka 10 personliga emails till ditt befintliga nätverk

**Ämnesrader att A/B-testa (från GTM_STRATEGY.md):**
- `Vilket OS kör [Bolagsnamn] på?`
- `[Förnamn] — ert team jobbar i 5 system. Vi är ett.`
- `Ni har Windows för era datorer. Vad kör ni era operationer på?`

---

### 13. Sätt upp Anthropic API-nyckel (5 min)
AI-kategorisering av banktransaktioner mot BAS-konton kräver detta.

1. Gå till [console.anthropic.com](https://console.anthropic.com)
2. API Keys → Create key

```bash
aws ssm put-parameter --name "/hypbit/prod/ANTHROPIC_API_KEY" --value "sk-ant-..." --type SecureString --overwrite --region eu-north-1
```

---

## 🟡 MEDIUM — Inom en månad

### 14. Implementera Vitest-tester (1-2 dagar)
Systemtestet konstaterar: "Automatiserade tester: ❌ Saknas". Noll testfiler.

Prioritera:
```
server/src/__tests__/
  health.test.ts        — /health returnerar 200 + supabase connected
  auth.test.ts          — 401 på skyddade routes
  currencies.test.ts    — currencies returnerar valid data
  error-handling.test.ts — 404-svar korrekt
```

```bash
cd /mnt/c/Users/erik/Desktop/hypbit/server
npm install -D vitest supertest @types/supertest
```

---

### 15. Fixa /api/capabilities/team prestanda (4-8h)
Systemtestet flaggar denna endpoint som 755ms — 5× långsammare än genomsnittet.

```sql
-- Kör i Supabase SQL-editor:
EXPLAIN ANALYZE SELECT * FROM capabilities WHERE org_id = '...';
-- Lägg till index om det saknas:
CREATE INDEX IF NOT EXISTS capabilities_org_id_idx ON capabilities(org_id);
```

---

### 16. Lägg till 404-handler i API (30 min)
Systemtestet: `/api/nonexistent` returnerar 401 istället för 404, vilket avslöjar API-strukturen.

```typescript
// Lägg till sist i server/src/index.ts, efter alla routes:
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});
```

---

### 17. Skapa konkurrentjämförelsesidor (2h per sida)
SEO-strategin: competitor-sidor har extrem köpintent. Skriv dessa:

- [ ] `/vs/monday-alternativ.html` — "Monday.com alternativ Sverige"
- [ ] `/vs/hubspot-alternativ.html` — "HubSpot alternativ affärssystem"
- [ ] `/vs/notion-jira-alternativ.html` — "Notion Jira alternativ B2B"
- [ ] `/vs/asana-alternativ.html` — "Asana alternativ Sverige"

Mall i SEO_STRATEGY.md finns klar.

---

### 18. Skapa ISO 9001 bloggpost (4h)
SEO-strategin: "ISO 9001 system", "kvalitetsledning software Sverige" — 400+ sök/mån, liten konkurrens.

Skapa `/blog/iso-9001-compliance-guide.html` (1500-2000 ord, FAQPage Schema).

---

### 19. Kontrollenhetsintegration (kassaregister) — offert (2h)
TAX_COMPLIANCE.md är tydlig: pixdrift är kassasystem, men kunderna BEHÖVER en certifierad kontrollenhet (CE). pixdrift kan inte sälja kassafunktioner utan att kunder har CE kopplad.

**Du behöver:**
1. Kontakta minst en CE-leverantör för partneravtal/integration:
   - [Infrasec](https://infrasec.se) — `infrasec.se`
   - [Retail Innovation](https://retailinnovation.se)
2. Integrera CE via RS232/USB/TCP och `POST /api/cash-register/receipt`
3. Dokumentera kopplingskrav tydligt för kunder (annars böter på 10 000 kr)

---

### 20. Registrera pixdrift på G2 och Capterra (3h)
GTM-strategin: "G2/Capterra skapar high-DA backlinks och long-tail SEO."

1. [g2.com/products/new](https://g2.com/products/new) — gratis profil
2. [capterra.com](https://capterra.com) — gratis lista
3. [alternativeto.net](https://alternativeto.net) — lägg till pixdrift som alternativ till Monday, Notion, Jira

---

### 21. Sätt upp Google Play Console ($25 engång)
Android-app krävs för full mobil-coverage.

1. [play.google.com/console](https://play.google.com/console) — $25 engångsavgift
2. Skapa developer-konto
3. Reservera app-listing för pixdrift

---

### 22. LinkedIn company page (30 min)
Launch-checklistan: `@pixdrift LinkedIn company page` saknas.

1. linkedin.com/company/new
2. Fyll i: logo, banner, beskrivning (tagline från BRAND_POSITIONING_V2.md)
3. Claim `linkedin.com/company/pixdrift`

---

### 23. Konfigurera Loops/ConvertKit för email-sekvenser (2h)
Email-sekvenserna (Welcome, Day 3, Day 7) är skrivna i LAUNCH_PLAN.md. Konfigurera dem i ett email-verktyg.

**Rekommenderat:** [Loops.so](https://loops.so) (byggt för SaaS, enklare än ConvertKit)

Tre sekvenser att bygga:
1. Welcome (omedelbart)
2. Value proof – Day 3
3. Urgency – Day 7

---

### 24. Fixa .env.example (15 min)
Systemtestet: `.env.example` refererar `app.hypbit.com` (gammalt domännamn).

```bash
# Uppdatera med korrekta domäner och alla nya SSM-variabler
grep -n "hypbit.com" /mnt/c/Users/erik/Desktop/hypbit/.env.example
# Byt till pixdrift.com
```

---

### 25. Höj ECS till 2 tasks (redundans) (30 min)
Systemtestet: `desired: 1, running: 1` — API är nere 30-60s vid deploy eller krasch.

```bash
aws ecs update-service \
  --cluster hypbit \
  --service hypbit-api \
  --desired-count 2 \
  --region eu-north-1
```

---

### 26. Ansök om ALMI-lån (2h)
GTM-strategin rekommenderar: "ALMI-lån upp till 4M SEK, låg ränta, ingen equity-utspädning."

1. [almi.se/ansok](https://almi.se/ansok) — Innovationslån 500K–4M SEK
2. Förbered: affärsplan (redan klar), budget, marknadsstrategi (GTM_STRATEGY.md)
3. Kan ge 3+ månaders extra runway

---

## 🟢 LÅGT — Backlog

### 27. Kompilera Typescript i Docker (4h)
Systemtestet: Docker kör `npx tsx src/index.ts` (TypeScript direkt). Kompilerat JS startar snabbare och är säkrare.

```dockerfile
# Lägg till i Dockerfile:
RUN npm run build
CMD ["node", "dist/index.js"]
```

---

### 28. Dark mode (2-3 dagar)
Onboarding-flödet är designat i mörkt läge — resten av apparna bör följa.

---

### 29. Drag-n-drop i Kanban (2-3 dagar)
Execution-modulen har Kanban-board — lägg till dnd-kit för drag-and-drop.

---

### 30. Notification-panel (1-2 dagar)
`/api/notifications/changelog` finns men frontend-panel saknas.

---

### 31. API-dokumentation (Swagger/OpenAPI) (3 dagar)
55 endpoints finns men ingen publik dokumentation. Blockerar externa integrationer och Developer Hub-sidan.

---

### 32. Delaware C-Corp (USA) (1h + 2-3 dagar handläggningstid)
GTM-strategin: Behövs vid månad 9 för US-kunder och potentiell VC-runda.

1. [stripe.com/atlas](https://stripe.com/atlas) — $500 inkl. Delaware C-Corp setup
2. Mercury-bankkonto ([mercury.com](https://mercury.com)) — öppnar utan US-adress

---

### 33. Supabase Vault för token-kryptering
BANKING_INTEGRATION.md: "I nuläget lagras tokens i klartext i Supabase. För produktion rekommenderas Supabase Vault."

Aktivera Vault-kryptering för `bank_connections.credentials` och `accounting_integrations.credentials`.

---

### 34. Rate limit — höj från 100 till 500 req/15 min
Systemtestet: "100 req/15 min är aggressivt låg om dashboards har polling."

---

## 🤖 KAN AUTOMATISERAS AV AGENT

Uppgifter agent kan göra utan manuell input från Erik:

- [ ] Köra Playwright E2E-tester dagligen mot production
- [ ] SEO-rapport varje måndag (Lighthouse CI + ranking-check)
- [ ] Uppdatera exchange rates (`/api/exchange-rates` — daglig cron via SSM/ECS)
- [ ] Submitta nya sidor till IndexNow automatiskt vid deploy
- [ ] Outreach-email-generering (batch 100 emails/dag, du godkänner dem)
- [ ] LinkedIn-post-utkast (3 per vecka, du publicerar)
- [ ] Skriva blogg-artiklar (SEO content calendar vecka 3-8, du reviewar)
- [ ] Skriva konkurrensjämförelsesidor (4 sidor, du reviewar)
- [ ] Bygga prospect-lista (Apollo.io API + ICP-kriterier)
- [ ] Veckorapport: MRR, pipeline, trafik (Stripe + GSC + Supabase)
- [ ] Skapa Use Case-sidor (4 branschsidor, vecka 9-12 enligt content calendar)
- [ ] Vitest smoke-tester (skriva, du godkänner PR)
- [ ] 404.html SEO-vänlig felsida
- [ ] Bildkonvertering SVG → PNG (om Python/ImageMagick finns)
- [ ] Daglig banksynk-cron (`/api/banking/sync`) via ECS Scheduled Task
- [ ] Churn-alert om kund ej aktiv >7 dagar (Supabase Edge Function)

---

## 📋 EXTERNA KONTON ATT SKAPA

| Tjänst | Syfte | URL | Kostnad | Status |
|--------|-------|-----|---------|--------|
| Stripe | Betalningar (kritiskt) | stripe.com | Gratis + 1.4%+0.25€/tx | ❌ Saknas |
| Apple Developer | App Store | developer.apple.com | $99/år | ❌ Saknas |
| Google Play Console | Android | play.google.com/console | $25 engång | ❌ Saknas |
| Tink (Visa) | Open Banking PSD2 | tink.com | Kontakta för volym | ❌ Saknas |
| Fortnox Developer | Bokföringsintegration | developer.fortnox.se | Gratis | ❌ Saknas |
| Visma Developer | e-conomic integration | developer.visma.com | Gratis | ❌ Saknas |
| Sentry | Felövervakning | sentry.io | Gratis upp till 5k | ❌ Saknas |
| Google Search Console | SEO-indexering | search.google.com/search-console | Gratis | ❌ Saknas |
| Google Analytics 4 | Webbanalys | analytics.google.com | Gratis | ❌ Okänt |
| G2 | Reviews + backlinks | g2.com/products/new | Gratis | ❌ Saknas |
| Capterra | Reviews + backlinks | capterra.com | Gratis | ❌ Saknas |
| AlternativeTo | Jämförelseplattform | alternativeto.net | Gratis | ❌ Saknas |
| Product Hunt | Launch (månad 3) | producthunt.com | Gratis | ❌ Saknas |
| Apollo.io | Outreach + prospecting | apollo.io | $79/mo | ❌ Saknas |
| Calendly | Demo-bokningar | calendly.com | $12/mo | ❌ Okänt |
| Loom | Demo-videos async | loom.com | $12/mo | ❌ Okänt |
| Loops.so | Email sequences | loops.so | $49/mo start | ❌ Saknas |
| LinkedIn Sales Navigator | Nordic prospecting | linkedin.com | $99/mo | ❌ Okänt |
| Ahrefs | SEO-analys | ahrefs.com | €99/mo | ❌ Okänt |
| Swish for Business | Betalningar (kräver bankavtal) | developer.swish.nu | Gratis + bankkostnad | ❌ Saknas |

---

## 🔑 CREDENTIALS ATT KONFIGURERA
*(SSM Parameter Store i AWS eu-north-1)*

| Parameter | Status | Var du hittar den |
|-----------|--------|-------------------|
| `STRIPE_SECRET_KEY` | ❌ Saknas | stripe.com → API keys |
| `STRIPE_WEBHOOK_SECRET` | ❌ Saknas | stripe.com → Webhooks |
| `STRIPE_PRICE_STARTER` | ❌ Saknas | stripe.com → Products → Price ID |
| `STRIPE_PRICE_GROWTH` | ❌ Saknas | stripe.com → Products → Price ID |
| `TINK_CLIENT_ID` | ❌ Saknas | console.tink.com → Apps |
| `TINK_CLIENT_SECRET` | ❌ Saknas | console.tink.com → Apps |
| `FORTNOX_CLIENT_ID` | ❌ Saknas | developer.fortnox.se |
| `FORTNOX_CLIENT_SECRET` | ❌ Saknas | developer.fortnox.se |
| `VISMA_CLIENT_ID` | ❌ Saknas | developer.visma.com |
| `VISMA_SECRET_TOKEN` | ❌ Saknas | developer.visma.com |
| `ANTHROPIC_API_KEY` | ❌ Saknas | console.anthropic.com |
| `SENTRY_DSN` | ❌ Saknas | sentry.io → Project → DSN |
| `CORS_ORIGIN` | ⚠️ Fel värde | Rätta med kommando i punkt #2 |
| `PNR_ENCRYPTION_KEY` | ❓ Kontrollera | `openssl rand -hex 32` |
| `PNR_HASH_SALT` | ❓ Kontrollera | `openssl rand -hex 32` |

**Kontrollera vad som faktiskt finns i SSM:**
```bash
aws ssm get-parameters-by-path --path "/hypbit/prod/" --with-decryption --region eu-north-1 | jq '.Parameters[].Name'
```

---

## 📱 APPSTORE-CHECKLIST

- [ ] Apple Developer Program ($99/år) → developer.apple.com/programs/
- [ ] Hämta Team ID → ersätt `TEAMID` i `apps/landing/.well-known/apple-app-site-association`
- [ ] macOS med Xcode installerat (krävs för iOS-build)
- [ ] `cd /Users/erik/Desktop/PixdriftApp && npm install && cd ios && pod install`
- [ ] Skapa App ID i Apple Developer Portal: `com.pixdrift.app`
- [ ] Skapa App Store Connect listing
- [ ] TestFlight beta → involvera 5-10 testare
- [ ] App Store review (tar 24-48h)
- [ ] Google Play Console ($25 engång) → play.google.com/console
- [ ] Android app listing + screenshots

---

## 🚀 LAUNCH-CHECKLIST

- [ ] **Branch mergad till main** (punkt #1)
- [ ] **CORS fixat** (punkt #2)
- [ ] **Stripe live och testat** (punkt #3)
- [ ] **IndexNow-nyckel riktig** (punkt #4)
- [ ] **Google Search Console aktivt** (punkt #5)
- [ ] Onboarding-flow testad end-to-end (app.bc.pixdrift.com)
- [ ] Email-sekvenser i Loops konfigurerade
- [ ] 5 betatestare som validerat systemet
- [ ] Loom demo-video inspelad (<5 min)
- [ ] Calendly-länk för demo-bokningar
- [ ] LinkedIn company page skapad (@pixdrift)
- [ ] LinkedIn-lanseringspost publicerad (mall i LAUNCH_PLAN.md)
- [ ] Pressmeddelande live på pixdrift.com/press/ ✅ (finns redan)
- [ ] hello@pixdrift.com fungerar och tar emot email
- [ ] Sentry för felövervakning

---

## 📊 NYCKELTAL ATT FÖLJA

| Period | Mål |
|--------|-----|
| Vecka 1 | 200 waitlist-signups |
| Månad 1 | 2 betalande kunder, €1 000 MRR |
| Månad 3 | 10 kunder, €5 000 MRR |
| Månad 6 | 30 kunder, €30 000 MRR |
| Månad 12 | 80 kunder, €80 000 MRR (€960K ARR) |

**Check-in: Om MRR < €3 000 vid månad 3 → öka direktsälj, pausa ads.**

---

## 🏗️ TEKNISK SKULD (agent kan hjälpa)

- [ ] Merga `claude/setup-hypbit-oms-B9rQI` → `main` *(punkt #1 — gör nu)*
- [ ] CORS-fix i SSM *(punkt #2 — gör nu)*
- [ ] Vitest-tester — 0 testfiler i kodbasen *(punkt #14)*
- [ ] `/api/capabilities/team` 755ms — N+1 query eller saknar databasindex *(punkt #15)*
- [ ] 404-handler i API saknas *(punkt #16)*
- [ ] Docker kör tsx (ej kompilerat JS) *(punkt #27)*
- [ ] Rate limit 100 req/15 min för lågt för dashboards *(punkt #34)*
- [ ] ECS 1 task (ingen redundans) *(punkt #25)*
- [ ] Supabase Vault för token-kryptering *(punkt #33)*
- [ ] `Permissions-Policy` HTTP-header saknas (30 min fix)
- [ ] `GET /api/convert` 400 utan tydligt felmeddelande (30 min)
- [ ] `.env.example` refererar gamla `hypbit.com`-domänen *(punkt #24)*
- [ ] Kontrollenhetsintegration för kassaregister *(punkt #19)*
- [ ] Dark mode *(punkt #28)*
- [ ] Drag-n-drop i Kanban *(punkt #29)*
- [ ] Notification-panel *(punkt #30)*
- [ ] OpenAPI/Swagger-dokumentation *(punkt #31)*
- [ ] Hreflang saknas på alla sidor utom index.html

---

## 💰 KOSTNADSÖVERSIKT (månatlig, när allt är uppe)

| Tjänst | Kostnad/mo |
|--------|-----------|
| AWS ECS + ECR (1 task) | ~€30 |
| AWS ECS (2 tasks, redundans) | ~€60 |
| Supabase (Pro) | $25 |
| Apollo.io | $79 |
| LinkedIn Sales Navigator | $99 |
| Ahrefs | €99 |
| Loops.so | $49 |
| Calendly Pro | $12 |
| Loom Pro | $12 |
| Sentry (gratis tier) | $0 |
| **Total operationell (basic)** | **~€330/mo** |
| **Break-even:** | **1 Starter-kund (€499/mo) täcker allt** |

---

*Genererad: 2026-03-21 av OpenClaw senior produktchef-agent*  
*Baserad på: LAUNCH_PLAN.md, GTM_STRATEGY.md, BRAND_POSITIONING_V2.md, ONBOARDING_FLOW.md, BANKING_INTEGRATION.md, ERP_INTEGRATIONS.md, TAX_COMPLIANCE.md, SEO_STRATEGY.md, SYSTEM_TEST_REPORT.md*
