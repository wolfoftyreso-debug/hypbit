// ─── Knowledge Hub — Data Layer ──────────────────────────────────────────────

export type DocCategory = 'Wavult Group' | 'QuiXzoom' | 'Landvex' | 'Internt' | 'Juridik' | 'Idéportfolio'

export interface KnowledgeDoc {
  id: string
  title: string
  category: DocCategory
  summary: string
  tags: string[]
  updatedAt: string
  content: string
}

export const KNOWLEDGE_DOCS: KnowledgeDoc[] = [
  // ─────────────────────────────────────────────────────────────────────────────
  // WAVULT GROUP
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'doc-wg-001',
    title: 'Bolagsstruktur — Komplett Koncernkarta',
    category: 'Wavult Group',
    summary: 'Alla 6 entiteter, ägarskapsled, Dubai 0% skatt, IP-ägande och intercompany-flöden.',
    tags: ['holding', 'dubai', 'struktur', 'entiteter', 'fzco', 'uab', 'llc'],
    updatedAt: '2026-03-27',
    content: `## Wavult Group — Komplett Bolagsstruktur

### Koncernhierarki

Wavult Group bygger på ett trelager-system med juridisk och skattemässig optimering i centrum.

~~~
WAVULT GROUP FZCO (Dubai)
└── WAVULT DEVOPS FZCO (Dubai)
    ├── QuiXzoom Inc (Delaware, USA)
    ├── QuiXzoom UAB (Vilnius, Litauen)
    ├── Landvex Inc (Houston, Texas, USA)
    └── Landvex AB (Stockholm, Sverige)
~~~

---

### Entitet 1: Wavult Group FZCO (Dubai)

**Juridisk form:** Free Zone Company (FZCO)  
**Hemort:** Dubai, UAE — ansöker via DMCC (Dubai Multi Commodities Centre)  
**Roll:** Ultimate holding company — äger 100% av alla andra entiteter samt ALL IP  
**Skatteläge:** 0% bolagsskatt på kvalificerade inkomster (UAE CIT 2023)  
**Status 2026-03-27:** 🔴 Ej bildad — business plan klar, dmcc.ae/apply är nästa steg

**Äger:**
- Alla varumärken: Wavult, QuiXzoom, Landvex, Bernt, Wavult OS, Wavult Mobile
- All källkod och immateriella rättigheter
- Domänportfölj: wavult.com, quixzoom.com, landvex.com m.fl.
- 100% av Wavult DevOps FZCO

---

### Entitet 2: Wavult DevOps FZCO (Dubai)

**Juridisk form:** Free Zone Company (FZCO)  
**Hemort:** Dubai, UAE — DMCC  
**Roll:** Operationellt holdingbolag — bygger systemen, licensierar IP till driftsbolagen  
**Ansvarsområde:** All produktutveckling, drift av Wavult OS, anställer tech-teamet  
**Ägs av:** Wavult Group FZCO (100%)

**Intäkter:**
- Management fees från driftsbolag (8–15% av omsättning, arm's length OECD)
- IP-licensintäkter från alla driftsbolag

---

### Entitet 3: QuiXzoom Inc (Delaware, USA)

**Juridisk form:** C Corporation  
**Hemort:** Delaware, USA — bildas via Stripe Atlas  
**Bankförbindelser:** Mercury Bank (planerat)  
**Roll:** Global/USA-verksamhet för QuiXzoom-plattformen  
**Status 2026-03-27:** 🟡 Stripe Atlas granskar — väntar på mail → signera → Mercury Bank  
**Ägs av:** Wavult DevOps FZCO (100%)

**OBS — 83(b) Election:** Kritisk skatteåtgärd. Måste skickas in inom 30 dagar från registreringsdatum. Stripe Atlas guidar.

---

### Entitet 4: QuiXzoom UAB (Vilnius, Litauen)

**Juridisk form:** UAB (Uždaroji akcinė bendrovė) — litauisk privat aktiebolagsform  
**Hemort:** Vilnius, Litauen  
**Roll:** EU-verksamhet för QuiXzoom — GDPR-hemvist, SEPA-betalningar, EU-upphandlingar  
**Bolagsskatt Litauen:** 15% (reducerat 5% för små bolag, 0% i FEZ-zon)  
**Status 2026-03-27:** 🟡 Compliance-förfrågan skickad till 6 byråer  
**Ägs av:** Wavult DevOps FZCO (100%)

---

### Entitet 5: Landvex AB (Stockholm, Sverige)

**Juridisk form:** Aktiebolag  
**Org.nr:** 559141-7042  
**Tidigare namn:** Sommarliden Holding AB  
**Hemort:** Stockholm, Sverige  
**Roll:** EU B2G-verksamhet — säljer Landvex till kommuner, Trafikverket, myndigheter  
**Bolagsskatt Sverige:** 20,6%  
**Status 2026-03-27:** 🟡 Namnbyte inlämnat Bolagsverket (~1–2 veckor för registrering)  
**Ägs av:** Erik Svensson direkt (ska överföras till Wavult DevOps FZCO)

---

### Entitet 6: Landvex Inc (Houston, Texas, USA)

**Juridisk form:** Texas LLC  
**Hemort:** Houston, Texas, USA — SOSDirect Form 201  
**Roll:** USA B2G-verksamhet — US municipalities, port authorities, federal contracts  
**Registreringsavgift:** $300 (+ $25 expedited)  
**Status 2026-03-27:** 🔴 SOSDirect Form 201 halvklar  
**Ägs av:** Wavult DevOps FZCO (100%)

---

### Skatteoptimering — Hur det fungerar

| Flöde | Från | Till | Skatteeffekt |
|---|---|---|---|
| IP-licens | QuiXzoom Inc/UAB | Wavult Group FZCO | Profit → Dubai (0%) |
| IP-licens | Landvex AB/Inc | Wavult Group FZCO | Profit → Dubai (0%) |
| Management fee | Alla driftsbolag | Wavult DevOps FZCO | Profit → Dubai (0%) |
| Lokal intäkt | Driftsbolag | Stannar lokalt | Beskattas lokalt |

**Resultat:** Marginaler koncentreras i Dubai. Driftsbolagen betalar lokal skatt enbart på den margin som kvarstår efter avdrag för IP-licens och management fees.

**OECD arm's length:** Alla intercompany-priser måste vara marknadsmässiga (8–15%). Transfer pricing-dokumentation krävs.`
  },
  {
    id: 'doc-wg-002',
    title: 'Go-to-Market Strategi — Tre-fas Sekvens',
    category: 'Wavult Group',
    summary: 'QuiXzoom → Quixom Ads → Landvex. Sverige juni 2026. Skärgården som startpunkt.',
    tags: ['gtm', 'strategi', 'quixzoom', 'quixom-ads', 'landvex', 'sverige', 'skärgården'],
    updatedAt: '2026-03-27',
    content: `## Go-to-Market Strategi — Tre-fas Sekvens

### Det Fundamentala Problemet Vi Löser

Infrastrukturägare (kommuner, Trafikverket, fastighetsbolag) har i dag inget kostnadseffektivt sätt att veta vad som händer på marknivå i realtid. Inspektioner är dyra, sker sällan och ger en snapshot — inte ett levande flöde. Wavult Group löser detta med tre inbyggda faser som bygger på varandra.

---

### Fas 1: QuiXzoom — Bygg Supply (Data)

**Vad:** QuiXzoom är en mobilapp där zoomers (fältpersonal) tar uppdrag via karta och levererar bilddata mot betalning.  
**Vem samlar data:** Zoomers — frilansar, studenter, hobbyentusiaster som vill tjäna pengar på sin smartphone.  
**Uppdragsgivare i fas 1:** Wavult Group självt lägger ut uppdrag för att bootstrapa databasen.

**Sverige-lansering:**
- **Datum:** Mitten juni 2026
- **Startpunkt:** Stockholms skärgård — tusentals bryggor, pirar, kajer, fritidshus som saknar digital representation
- **Mål fas 1:** 100 aktiva zoomers i Stockholm/skärgården inom 60 dagar

**Varför skärgården?**
- Tydliga geografiska objekt att zooma (bryggor, fyrar, infrastruktur)
- Hög densitet av värdefulla objekt
- Visuellt imponerande för demos och pitch
- Unik marknadsföringsvärld ("skärgårdszoomers")

**Nyckelmetrik fas 1:**
- Antal aktiva zoomers
- Uppdrag kompletterade per vecka
- Kostnad per datapunkt
- Databas-coverage (% av target-objekt mappade)

---

### Fas 2: Quixom Ads — Monetisera Data

**Trigger:** Aktiveras när databasen är substantiell (minst 10 000 uppdrag, 5+ städer)  
**Vad:** Datan från QuiXzoom paketeras som hyperlokal affärsintelligens och säljs B2B.

**Produkter:**
- **Leadpaket:** "Alla bryggägare på Värmdö" — för båtmotorhandlare, marinförsäkring, fritidshusbolag
- **Marknadsdata:** Realtidsdata om handelsplatser, parkering, folkliv
- **Annonsering:** Hyperlokal annonsering direkt på kartan i QuiXzoom-appen (zoomers ser annonser)

**Prismodell:** Prenumeration per geografi + CPM-annonsering

**Kunder:**
- Lokal handel och franchise
- Fastighetsbolag
- Försäkringsbolag
- Kommunikationsbyråer

---

### Fas 3: Landvex — Enterprise B2G

**Trigger:** Aktiveras när databasen är bevisad och flödena stabila  
**Vad:** Landvex säljer enterprise-abonnemang till kommuner, Trafikverket och myndigheter.  
**Skillnad:** Landvex säljer INTE rådata — de säljer larm, händelserapporter och analysabonnemang.

**Kärnvärde (låst av Erik Svensson):**  
*"Right control. Right cost. Right interval."*  
Systemet hjälper kommuner hitta sweet spot för när kostnaden för att ha kontroll rätt i relation till värdet.

**Landvex-kunden betalar för:**
- Automatiska larm när avvikelse detekteras (trasig skylt, igensatt brunn, skadad brygga)
- Händelserapporter med bild och geo-data
- Analysabonnemang (trend, årstidsvariation, prioriteringsstöd)

**Inte:** Råbilder. Inte kameror. Inte bevakning.

---

### Marknadsstrategi — Tidslinje

| Kvartal | Händelse |
|---|---|
| Q2 2026 | QuiXzoom beta-lansering Stockholm (Juni) |
| Q2 2026 | 100 zoomers onboardade i skärgården |
| Q3 2026 | Quixom Ads pilot med 5 kunder |
| Q4 2026 | Landvex pilot med 2 kommuner |
| Q1 2027 | Expansion Nederländerna |
| Q2 2027 | 500 aktiva zoomers, 10 Landvex-kunder |

---

### Varumärkessegmentering

| Varumärke | Mål | Aldrig |
|---|---|---|
| QuiXzoom | Zoomers, B2C | Kommuner, myndigheter |
| Quixom Ads | B2B, lokala varumärken | Offentlig sektor |
| Landvex | Kommuner, Trafikverket, B2G | Zoomers, konsumenter |

**Regel:** Nämn aldrig Landvex i QuiXzoom-kontext. Separata varumärken, separata säljkanaler.`
  },
  {
    id: 'doc-wg-003',
    title: 'Thailand Workcamp — 11 April 2026',
    category: 'Wavult Group',
    summary: 'Fullständig agenda, mål, teambuilding och vad som ska byggas. Nysa Hotel Bangkok.',
    tags: ['thailand', 'workcamp', 'bangkok', 'nysa-hotel', 'teambuilding', 'april'],
    updatedAt: '2026-03-27',
    content: `## Thailand Workcamp — 11 April 2026

### Grundinfo

**Startdatum:** 11 april 2026  
**Minsta längd:** 1 månad  
**Plats:** Bangkok, Thailand  
**Boende:** Nysa Hotel Bangkok  
  Adress: 73/7-8 Soi Sukhumvit 13, Khwaeng Khlong Toei Nuea, Watthana, Bangkok 10110  
  Tel: (02) 079 6999 | enquiry@nysahotelbankok.com  
  Kontaktperson: Arthur (Leon förhandlar 3 rum + ev lokal)

**Deltagare:**
- Erik Svensson (Chairman + Group CEO)
- Dennis Bjarnemark (Chief Legal & Operations)
- Leon Russo De Cerame (CEO Wavult Operations)
- Winston Bjarnemark (CFO)
- Johan Berglund (Group CTO)

---

### Vecka 1 — Orientering & Utbildning (11–17 april)

**Måndag 11/4 — Ankomst & Kickoff**
- Check-in Nysa Hotel
- Gemensam middag — teamets ankomst firas
- Kvällsbrief: vad vi är här för att göra

**Tisdag 12/4 — Wavult OS Bootcamp**
- Genomgång: Hela Wavult OS — moduler, entiteter, roller
- Alla i teamet tar sig igenom Academy-kurserna
- Mål: Alla certifierade på Wavult OS grundnivå

**Onsdag 13/4 — Bolagsstruktur & Juridik**
- Dubai-strukturen presenteras av Dennis
- IP-avtal och MSA genomgångna
- Texas LLC (Landvex Inc) — kvarstående steg beslutas
- UAB-process (QuiXzoom UAB) — beslut om agency

**Torsdag 14/4 — Tech Deep Dive**
- Johan presenterar fullständig tech stack
- AWS-infrastruktur genomgång
- CI/CD-pipelines och deployprocess
- Supabase-arkitektur (EU + planerat US)

**Fredag 15/4 — Teambuilding**
- Utflykt till Chatuchak-marknaden
- Gemensam lunch utanför hotellet
- Eftermiddag: fri tid, teamet utforskar Bangkok

**Lördag–Söndag 16–17/4 — Sprint-planering**
- 90-dagars sprint plan för varje produkt
- OKR-formulering (Q2 2026) för hela gruppen
- Rollfördelning och ansvar dokumenterat

---

### Vecka 2+ — Byggfas

**QuiXzoom:**
- Slutföra React Native-appen till beta-standard
- Onboarding-flöde för zoomers
- Betalningssystem (Stripe/Revolut integration)
- Mål: Redo för Sverige-lansering Juni 2026

**Landvex:**
- Beta-sajt live på landvex.com
- Enterprise pitch-deck klar
- Kontaktlista med 20 svenska kommuner identifierade
- Mål: 3 demos bokade med kommuner inom 60 dagar

**Wavult OS:**
- Knowledge Hub fullt populerat (detta dokument!)
- Finance-modulen klar för CFO-bruk
- Legal-modulen med alla bolagsdokument
- Bernt-integration i alla moduler

**Dubai-struktur:**
- Business plan finaliserad för DMCC-ansökan
- IP-licensavtal utkast klara
- Management Service Agreement utkast klart

---

### Mål för Workcamp (Definition of Done)

| Mål | Ansvarig | Status |
|---|---|---|
| Alla i teamet certifierade på Wavult OS | Erik | 🎯 Mål |
| QuiXzoom MVP demo redo | Johan + Leon | 🎯 Mål |
| Landvex beta-sajt live | Johan | 🎯 Mål |
| Dubai-struktur presenterad och förankrad | Dennis + Erik | 🎯 Mål |
| Texas LLC (Landvex Inc) slutförd | Dennis | 🎯 Mål |
| 90-dagars sprint plan klar | Alla | 🎯 Mål |
| 3 Landvex-demos bokade | Leon | 🎯 Mål |

---

### Kommunikation

**Nyhetsbrev:** Bernt skickar dagliga Morning Briefs med nedräkning till Thailand + pepp  
**Team-kanal:** Telegram-grupp för dagliga uppdateringar  
**Externa möten:** Bokas av Leon och Dennis parallellt med byggarbetet`
  },
  {
    id: 'doc-wg-004',
    title: 'Intercompany Cashflow & Transfer Pricing',
    category: 'Wavult Group',
    summary: 'IP-licenser, management fees, arm\'s length OECD 8–15%. Hur pengar flödar från driftsbolag till Dubai.',
    tags: ['cashflow', 'transfer-pricing', 'oecd', 'ip-licens', 'management-fee', 'dubai'],
    updatedAt: '2026-03-27',
    content: `## Intercompany Cashflow & Transfer Pricing

### Principen

Wavult Groups skatteoptimering bygger på att vinster koncentreras i Dubai (0% bolagsskatt) via legala intercompany-transaktioner. Alla transaktioner måste följa OECD Transfer Pricing Guidelines och vara arm's length — dvs prissatta som om de vore mellan oberoende parter.

---

### IP-Licensavtal (IP License Agreement)

**Flöde:** Driftsbolag → Wavult Group FZCO (Dubai)  
**Vad:** Driftsbolagen betalar en royalty för rätten att använda Wavults IP (kod, varumärken, plattformstillstånd)  
**Pris (arm's length):** 5–15% av omsättning, beroende på geografisk marknad och marginal

| Driftsbolag | Royalty % | Beräkningsgrund |
|---|---|---|
| QuiXzoom Inc (USA) | 8–12% av nettoomsättning | CUT-metoden (Comparable Uncontrolled Transaction) |
| QuiXzoom UAB (EU) | 8–12% av nettoomsättning | CUT-metoden |
| Landvex AB (SE) | 5–10% av nettoomsättning | Profit Split-metoden |
| Landvex Inc (USA) | 5–10% av nettoomsättning | Profit Split-metoden |

**Dokumentationskrav:**
- Intercompany agreement (skriftligt avtal)
- Benchmarking-analys (jämförbara transaktioner på marknaden)
- Uppdateras vid väsentliga förändringar i verksamheten

---

### Management Service Agreement (MSA)

**Flöde:** Driftsbolag → Wavult DevOps FZCO (Dubai)  
**Vad:** Wavult DevOps levererar management-tjänster (tech, drift, HR, strategi) till driftsbolagen  
**Pris:** Cost-plus marknad (kostnader + 10–15% marknadsmässig marginal)

**Tjänster som ingår i MSA:**
- Teknisk drift och utveckling av plattformar
- HR-administration och rekryteringsstöd
- Strategisk rådgivning och styrning
- Cloudinfrastruktur (AWS, Cloudflare)
- AI-drift (Bernt/OpenClaw)

---

### Pengaflödesmodell

~~~
Kundintäkt: 1 000 000 SEK (Landvex AB)
        │
        ├── IP-licens (10%):     100 000 SEK → Wavult Group FZCO (Dubai, 0%)
        ├── Management fee (15%): 150 000 SEK → Wavult DevOps FZCO (Dubai, 0%)
        ├── Drift & kostnader:   600 000 SEK (kvarstår i Landvex AB)
        └── Lokalt skattepliktig vinst: 150 000 SEK × 20,6% = 30 900 SEK (Sverige)

NETTO till Dubai: 250 000 SEK (0% skatt)
NETTO lokal skatt: 30 900 SEK
TOTAL skatt: 30 900 SEK / 1 000 000 SEK = 3,09% effektiv skattesats
~~~

---

### Dividend-flöde (Tier 3)

När Dubai-bolagen ackumulerat kapital kan det delas ut uppåt:
- Wavult DevOps → Wavult Group FZCO: 0% källskatt (intra-UAE)
- Wavult Group FZCO → Aktieägare: UAE har INGEN källskatt på utdelning

**OBS:** UAE-CIT 2023 — bolagsskatt 9% på vinst > AED 375 000. Qualifying income (ex. IP-inkomster från utländska dotterbolag) kan nollbeskattas om rätt struktur.

---

### Compliance-krav

1. **Transfer Pricing-dokumentation:** Obligatorisk för alla intercompany-transaktioner > 250 000 SEK
2. **Country-by-Country Reporting (CbCR):** Krävs om koncernens omsättning > 750 MSEK (ej aktuellt nu)
3. **Substance Requirements (UAE):** Wavult Group + DevOps FZCO måste ha faktisk substans i Dubai (kontor, anställda, styrelsemöten)
4. **BEPS-compliance:** OECD Base Erosion and Profit Shifting — alla avtal måste uppfylla BEPS Action Plan 8-10

---

### Kritiska Nästa Steg

- [ ] Bilda Wavult Group FZCO + Wavult DevOps FZCO (DMCC)
- [ ] Upprätta IP-licensavtal (mall finns i docs/legal/)
- [ ] Upprätta Management Service Agreement
- [ ] Transfer pricing-analys av initial royalty-nivå
- [ ] Koppla revisorer för löpande compliance (offert skickad till 8 byråer)`
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // QUIXZOOM
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'doc-qx-001',
    title: 'QuiXzoom — Plattformsarkitektur Komplett',
    category: 'QuiXzoom',
    summary: 'AWS ECS, Supabase, React Native, Mapbox. Fullständig tech stack och microservices-arkitektur.',
    tags: ['arkitektur', 'aws', 'ecs', 'supabase', 'react-native', 'mapbox', 'microservices'],
    updatedAt: '2026-03-27',
    content: `## QuiXzoom — Plattformsarkitektur Komplett

### Konceptet i ett Mening

QuiXzoom är en crowdsourcad kamerainfrastruktur där zoomers tar geo-taggade uppdrag via mobilapp, levererar visuell data och betalar ut via automatiserad payout-motor. "Last mile intelligence capture."

---

### Tech Stack — Fullständig Bild

| Lager | Teknologi | Motivering |
|---|---|---|
| Mobilapp | React Native (Expo) | Cross-platform, snabb iteration |
| Karta | Mapbox SDK | Offline-stöd, custom styling, gesture-API |
| Kamera | Vision Camera (RN) | Nativt kameraframework, real-time processing |
| Backend | Node.js + TypeScript | Strikt typning, snabb iteration |
| Hosting | AWS ECS Fargate (eu-north-1) | Serverless containers, auto-scaling |
| Databas | Supabase (PostgreSQL) | Real-time subscriptions, RLS, auth |
| Supabase-projekt | quixzoom-v2 (eu-west-1) | GDPR EU-region |
| Filer/Bilder | AWS S3 (eu-north-1) | wavult-images-eu-primary |
| CDN | CloudFront | dewrtqzc20flx.cloudfront.net (app.quixzoom.com) |
| DNS | Cloudflare | Zone: e9a9520b64cd67eca1d8d926ca9daa79 |
| Auth | Supabase Auth | JWT + RLS policies |
| Events | SNS + SQS | Asynkron kommunikation mellan services |
| Payments | Stripe + Revolut | Stripe för intäkter, Revolut för zoomer-payout |
| CI/CD | GitHub Actions → ECR → ECS | Automatisk deploy på main-merge |

---

### Microservices-Arkitektur

Alla services körs som ECS Fargate tasks i cluster "hypbit" (eu-north-1):

**mission-service** (primär)
- Skapar och hanterar uppdrag (missions)
- Geo-sökning via PostGIS (ST_DWithin)
- Uppdragsstatus: draft → published → assigned → submitted → validated → paid
- Hanterar uppdragsdeadlines och auto-expiry

**auth-service**
- Wrapper runt Supabase Auth
- JWT-verifiering för alla inkommande requests
- Roll-baserad access: zoomer / admin / client (Landvex)
- BankID-integration (planerat för Landvex-kunder)

**media-service**
- Tar emot bilder och video från zoomers
- Validerar metadata (GPS, timestamp, enhetssignatur)
- Compressar och lagrar i S3 (wavult-images-eu-primary)
- Genererar CDN-URLs via CloudFront

**notification-service**
- Push-notiser via Expo Push Notifications
- E-post via AWS SES (transaktionell)
- In-app notiser via Supabase real-time

**billing-service**
- Beräknar utbetalning per zoomer
- Integration med Stripe Connect (zoomer-utbetalningar)
- Wise Business (planerat) för internationella utbetalningar
- Fakturering mot Landvex-kunder

**validation-service** (planerat — Optical Insight)
- AI-analys av inlevererade bilder
- Kvalitetsbedömning (suddig, fel vinkel, felaktigt objekt)
- Godkänn / underkänn / begär om-tag
- Händelsedetektering för Landvex-larm

---

### Dataflöde — Uppdrag från skapande till leverans

~~~
1. Klient (Landvex/intern) skapar uppdrag
   → POST /missions {location, type, instructions, reward}

2. QuiXzoom-appen hämtar tillgängliga uppdrag nära zoomer
   → GET /missions/nearby?lat=&lon=&radius=

3. Zoomer accepterar uppdrag (assignment)
   → POST /missions/{id}/accept

4. Zoomer utför och laddar upp
   → POST /media/upload (multipart, GPS-metadata)

5. Validation-service analyserar
   → SNS event → validation-queue → AI-analys

6. Godkänt → mission markeras som completed
   → billing-service skapar payout

7. Payout körs (Stripe/Revolut)
   → Zoomer ser pengar i plånboken
~~~

---

### Infrastruktur-detaljer

**ECS Cluster:** hypbit (eu-north-1, AWS account 155407238699)  
**Task definition:** quixzoom-api:6 (senaste, fixades 2026-03-27 — SUPABASE_SERVICE_KEY saknades)  
**ALB:** hypbit-api-alb, priority 20, host api.quixzoom.com → quixzoom-api-tg  
**ACM cert:** api.quixzoom.com + app.quixzoom.com + quixzoom.com (eu-north-1, ISSUED)  
**CloudFront:** dewrtqzc20flx.cloudfront.net → app.quixzoom.com (alias aktiv)

---

### Multi-Region Plan (fas 2)

| Region | Trigger | Kostnad |
|---|---|---|
| eu-north-1 (live) | Aktiv nu | ~$150/mån |
| us-east-1 | När USA-zoomers > 100 | ~$150/mån |
| ap-southeast-1 | Asien-expansion (2027+) | ~$150/mån |

GDPR-regel: EU-data (QuiXzoom UAB) replikeras ALDRIG till USA-buckets.`
  },
  {
    id: 'doc-qx-002',
    title: 'Zoomers — Identitet, Onboarding & Betalning',
    category: 'QuiXzoom',
    summary: 'Vad är en zoomer? Uppdragsflöde, certifiering och betalningsmodell.',
    tags: ['zoomer', 'onboarding', 'identitet', 'betalning', 'certifiering', 'uppdrag'],
    updatedAt: '2026-03-27',
    content: `## Zoomers — Identitet, Onboarding & Betalning

### Vad är en Zoomer?

En zoomer är en fältoperatör i QuiXzoom-nätverket. De tar uppdrag via kartan i QuiXzoom-appen, fotograferar/filmar specifika objekt och levererar geo-taggad bilddata mot betalning.

**ALDRIG:** Fotografer, fältpersonal, operatörer, field agents  
**ALLTID:** Zoomers

**Identiteten:** Frihet, samhällsnytta, egna villkor. En zoomer väljer sina egna uppdrag, sin egna tid, sin egen plats. Det kan se lite roligt ut — man ser dem zooma in en papperskorg med dödligt allvar — men det är på riktigt samhällsviktigt.

*"altså det va helt dött i stan idag det enda man såg va massa zoomers som va ute"*

---

### Certifieringsnivåer

| Nivå | Krav | Förmåner |
|---|---|---|
| **Standard Zoomer** | Klarat grundkurs, 5 godkända uppdrag, accepterat plattformsavtal | Tillgång till standarduppdrag |
| **Pro Zoomer** | 50+ uppdrag, betyg ≥ 4.5/5.0 | Prioritet i uppdragskö, högre ersättning (+20%) |
| **Elite Zoomer** | 200+ uppdrag, betyg ≥ 4.8/5.0, specialistutbildning | Exklusiva uppdrag, direktkontakt med klienter, bonusprogram |

---

### Onboarding-flöde (Standard Zoomer)

**Steg 1 — Registrering**
- Ladda ner QuiXzoom-appen (iOS / Android)
- Registrera med e-post eller Google/Apple Sign-In
- Verifiera telefonnummer (SMS OTP)

**Steg 2 — Identitetsverifiering**
- Ladda upp giltig ID-handling (pass eller nationellt ID)
- Selfie-verifiering (face match)
- KYC-process (Sumsub eller liknande, planerat)

**Steg 3 — Grundkurs**
- 30 min online-kurs i appen
- Ämnen: Vad är ett uppdrag, bildkvalitet, GPS-krav, etik, integritet
- Avslutas med quiz (80% krävs för godkänt)

**Steg 4 — Testuppdrag**
- 5 gratis testuppdrag i sin stad
- Granskas manuellt av Wavult-team
- Feedback ges inom 24h

**Steg 5 — Aktiv Zoomer**
- Betalningsuppgifter (IBAN eller Swish)
- Plattformsavtal digitalt signerat
- Tillgång till alla standarduppdrag

---

### Uppdragsflöde

~~~
Karta i appen
→ Zoomer ser uppdrag i sin omgivning (grön/gul/röd baserat på datum)
→ Trycker på uppdrag → Instruktioner + ersättning + deadline
→ "Acceptera" → Uppdrag låst i 2h
→ Zoomer tar sig till plats
→ Fotograferar / filmar med kameraguide i appen
→ "Skicka in" → Media + GPS validerat automatiskt
→ AI-granskning (30 sek–2 min)
→ Godkänt: Betalning initieras (inom 24h)
→ Underkänt: Feedback + möjlighet att göra om (om deadline tillåter)
~~~

---

### Betalningsmodell

**Uppdragsersättning:** 25–500 SEK per uppdrag beroende på:
- Komplexitet (antal bilder, videolängd, specifika krav)
- Prioritet (bråttom uppdrag betalar mer)
- Zoomer-nivå (Pro/Elite = högre multiplikator)

**Utbetalning:**
- Minimum utbetalning: 50 SEK
- Frekvens: Manuell begäran (fas 1) → Veckovis automatik (fas 2)
- Metoder: Swish (Sverige), SEPA-banköverföring (EU), Wise (internationellt)

**Plattsformsavgift:**
- Wavult tar 25% av uppdragsersättningen
- Zoomer får 75%

**Exempelkalkyl:**
- Klient betalar: 100 SEK för ett standarduppdrag
- Zoomer får: 75 SEK
- Wavult behåller: 25 SEK
- Kostnader (infrastruktur, validering): ~5 SEK
- Netto till Wavult: ~20 SEK per uppdrag

---

### Kommunikation mot Zoomers

**Aldrig:** "Join as Photographer", "Field Operator Program", "Photographer Network"  
**Alltid:** "Become a Zoomer", "For Zoomers", "Zoomer Community"

**Ton:** Informell, ung, lite rebellisk. Som Uber Eats möter ett socialt uppdrag. Zoomers är inte löneslavar — de är en rörelse.

**Tagline-kandidater:**
- "See the world. Get paid."
- "Zoom in. Cash out."
- "The world needs your eyes."`
  },
  {
    id: 'doc-qx-003',
    title: 'Lansering Sverige — Skärgården & Första 100 Zoomers',
    category: 'QuiXzoom',
    summary: 'Detaljerad lanseirngsstrategi för Sverige, mitten juni 2026. Skärgården som startpunkt.',
    tags: ['lansering', 'sverige', 'skärgården', 'marketing', 'zoomers', 'juni-2026'],
    updatedAt: '2026-03-27',
    content: `## QuiXzoom Lansering Sverige — Juni 2026

### Varför Sverige Först?

Sverige är ett perfekt testmarknaden för QuiXzoom:
- Hög smartphonepenetration (95%+)
- Välutbildad befolkning van vid gig-economy (Foodora, Bolt)
- Tydlig infrastrukturproblematik (kommunerna brottas med inspektionskostnader)
- Skärgården erbjuder unikt visuellt material för marknadsföring
- Nära till teamet — snabb feedback-loop

**Datum:** Mitten juni 2026 (exakt datum fastläggs efter Thailand Workcamp)  
**Geografi start:** Stockholms skärgård + Stockholm innerstad

---

### Skärgården som Startmarknad

**Varför skärgården?**
- 30 000+ öar, skär och holmar
- Tusentals privata och kommunala bryggor saknar digital representation
- Sommarens högsäsong (juni–aug) skapar naturlig trafik av potentiella zoomers
- Dramatiskt visuellt material för PR och sociala medier
- Kommuner (Värmdö, Nacka, Vaxholm, Norrtälje) är framtida Landvex-kunder

**Target-objekt för uppdrag:**
- Privata bryggor och pirar
- Kommunala badplatser
- Kajak- och båtuthyrningsplatser
- Fyrar och sjömärken
- Hamnar och gästhamnar

---

### Zoomer-rekrytering — Väg till 100

**Fas 1 (Juni, vecka 1–2): Soft Launch**
- 20 handplockade beta-zoomers (vänner, bekanta, testpersoner)
- Personliga invitationer via Telegram/SMS
- Mål: Testa flödet, hitta buggar

**Fas 2 (Juni, vecka 3–4): Open Beta**
- Instagram/TikTok-kampanj: "Bli en av Sveriges första zoomers"
- Partnership med 2–3 outdoor/äventyrsbloggar
- Annonsering på Facebook (Stockholmare 18–35, aktiva utomhus)
- Mål: 50 aktiva zoomers

**Fas 3 (Juli): Full Launch**
- Pressrelease till TechCrunch Nordic, Di Digital, Breakit
- Influencer-samarbete (1–2 mid-size creators, 50k–200k följare)
- Zoomer-community på Discord/Telegram
- Mål: 100 aktiva zoomers

---

### Budget (Uppskattad)

| Post | Budget |
|---|---|
| Instagram/Facebook-ads | 15 000 SEK |
| Influencer-samarbeten | 20 000 SEK |
| PR-material & foto | 10 000 SEK |
| Gratis testuppdrag (bootstrapping) | 25 000 SEK |
| Event/meetup för zoomers | 5 000 SEK |
| **Totalt** | **75 000 SEK** |

---

### KPIer för Lansering

| KPI | Mål vid 30 dagar | Mål vid 60 dagar |
|---|---|---|
| Aktiva zoomers | 50 | 100 |
| Uppdrag kompletterade | 200 | 1 000 |
| App-nedladdningar | 500 | 2 000 |
| Genomsnittlig uppdragskvalitet | 4.0/5.0 | 4.3/5.0 |
| Kostnad per zoomer-rekrytering | < 500 SEK | < 300 SEK |
| NPS (zoomer-nöjdhet) | > 40 | > 50 |

---

### Kommunikationsplan

**Ton mot zoomers:** Unga, fria, lite rebelliska. "Gör något meningsfullt med din telefon."

**Budskap:**
- Tjäna pengar på promenaden
- Se din stad på ett nytt sätt
- Var en del av något bigger än dig själv
- Skärgårdsuppdrag = sommarjobb + äventyr

**Kanaler:**
- Instagram (primär — visuellt starka bilder)
- TikTok (kort video "en dag som zoomer")
- Facebook (äldre demografin 30–45)
- LinkedIn (för att attrahera deltidszoomers som har "riktiga jobb")

---

### Landvex-kopplingen (Intern info — EJ mot zoomers)

De 10 000 första uppdragen i skärgården bygger databasen som Landvex behöver för sin pilot. Kommunerna i skärgården (Värmdö, Nacka) är primärtarget för Landvex. QuiXzoom-lanseringen och Landvex-piloten synkroniseras medvetet — men kommuniceras som helt separata produkter.`
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // LANDVEX
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'doc-lx-001',
    title: 'Landvex — Produktspec & Marknadspositionering',
    category: 'Landvex',
    summary: 'Vad är Landvex? Kommuner, Trafikverket, Right Control Right Cost Right Interval.',
    tags: ['landvex', 'produktspec', 'kommuner', 'trafikverket', 'b2g', 'positionering'],
    updatedAt: '2026-03-27',
    content: `## Landvex — Produktspec & Marknadspositionering

### Kärnvärde (Låst beslut av Erik Svensson)

**"Right control. Right cost. Right interval."**

Landvex hjälper infrastrukturägare hitta sweet spot för när kostnaden för att ha kontroll är rätt i relation till värdet av att ha kontroll. Det handlar inte om AI-övervakning eller säkerhet — det handlar om att optimera kontrollekonomi.

---

### Problemet

Svenska kommuner och Trafikverket kämpar idag med:
- Inspektioner som kostar 500–2 000 kr/objekt (manuell inspektion)
- Inspektioner som sker 1–4 gånger per år — alldeles för sällan
- Inget varningssystem när saker faktiskt händer
- Skattepengar slösas på rutininspektioner av objekt som mår bra
- Allvarliga skador missas för att ingen var på plats

**Konkret exempel:** Stadsdelsnämnden i Nacka inspekterar kommunens 340 bryggor manuellt en gång per sommar. Kostnad: ~680 000 kr/år. Ändå gick en brygga sönder i april — ett halvår innan inspektionen.

---

### Landvex Löser Det

Landvex kombinerar QuiXzoom-data (zoomers som zoomar infrastruktur) med en optisk analysmotor som automatiskt:
1. Detekterar avvikelser (spricka, löst räcke, vatten i brunn)
2. Jämför med historik (försämras det?)
3. Genererar larm med foto + plats + allvarlighetsgrad
4. Skapar inspektionsrapport automatiskt

**Kunden betalar för larm och rapporter — INTE för kameror, satelliter eller personal.**

---

### Målkunder

**Primär:**
- Svenska kommuner (290 stycken, Trafikverket och regioner)
- Kommunala fastighetsbolag (MKB, Stångåstaden, etc.)
- Hamnar och hamnbolag (Ports of Stockholm, Göteborgs Hamn)

**Sekundär:**
- Trafikverket (vägar, broar, tunnlar)
- Privata fastighetsbolag med infrastrukturansvar
- Försvarsmakten (FMV-spår på sikt)

---

### Produktkatalog

**LandveX Basabonnemang**
- Upp till 50 objekt
- Månatlig inspektionsfrekvens (automatisk)
- Larmnotiser via e-post
- Rapportgenerering (PDF, XLSX)
- Pris: 4 900 SEK/mån

**LandveX Standard**
- Upp till 500 objekt
- Valfri inspektionsfrekvens (daglig/veckovis/månadsvis per objekt)
- Larm i realtid (SMS + e-post + webhook)
- API-access (REST)
- Pris: 14 900 SEK/mån

**LandveX Enterprise**
- Obegränsat antal objekt
- On-premise deployment möjlig
- SSO (Azure AD, Okta)
- Dedicated support + SLA 99,9%
- Integration mot CMMS (ServiceNow, Maximo)
- Pris: Offertbaserat (från 49 000 SEK/mån)

---

### Lansering Sverige

**Datum:** Mitten juni 2026 (synkroniserat med QuiXzoom-lansering)  
**Startgeografi:** Stockholms skärgård — samma objekt som QuiXzoom kartlägger  
**Pilot-modell:** 2–3 kommuner erbjuds gratis 90-dagars pilot i utbyte mot case study + testimonial  
**Target-kommuner:** Värmdö, Nacka, Vaxholm (skärgårdskommuner med hög bryggtäthet)

---

### Positionering mot Konkurrenter

| Konkurrent | Deras modell | Landvex skillnad |
|---|---|---|
| Traditionell inspektion | Manuell, dyr, sällan | 10x billigare, kontinuerlig |
| Drönare/IoT-sensorer | Dyr hardware, komplex drift | Inga egna sensorer, crowdsourced |
| GIS-data (Lantmäteriet) | Statisk kartor, ej realtid | Händelsebaserade larm |
| Kameraövervakning | Konstant bevakning, GDPR-problem | Diskret, händelsestyrd, GDPR-säker |`
  },
  {
    id: 'doc-lx-002',
    title: 'Landvex — Enterprise-arkitektur & Deployment',
    category: 'Landvex',
    summary: 'OI Cloud EU/US, on-premise, SSO, webhooks, air-gapped. Tre deployment-tiers.',
    tags: ['enterprise', 'deployment', 'oi-cloud', 'on-premise', 'sso', 'webhooks', 'arkitektur'],
    updatedAt: '2026-03-27',
    content: `## Landvex — Enterprise-arkitektur & Deployment

### Tre Deployment-Tiers (Låst beslut 2026-03-25)

| Tier | Deployment | Kund |
|---|---|---|
| **OI Cloud EU** | optical-insight-eu.pages.dev | Kommuner, fastighetsbolag, hamnar (EU) |
| **OI Cloud US** | optical-insight-us.pages.dev | US municipalities, port authorities |
| **OI Enterprise** | On-premise / private cloud | Trafikverket, Försvarsmakten, skyddsobjekt |

---

### OI Cloud EU (Primär)

**Frontend:** Cloudflare Pages (optical-insight-eu.pages.dev)  
**API:** AWS ECS Fargate, eu-north-1  
**Databas:** Supabase EU West (lpeipzdmnnlbcoxlfhoe)  
**Bildlagring:** wavult-images-eu-primary (S3, eu-north-1)  
**Auth:** Supabase Auth EU  
**CDN:** CloudFront (EU distribution)

**GDPR-compliance:**
- Alla data stannar i EU (eu-north-1 + eu-west-1)
- Ingen data replikeras till USA
- Data Processing Agreement (DPA) ingår i kundavtalet
- Rätt till radering implementerat

---

### OI Cloud US (Planerat)

**Status:** Ej byggt ännu  
**Kräver:** Nytt Supabase-projekt (us-east-1), ny ECS-service (us-east-1)  
**Frontend:** optical-insight-us.pages.dev (separat CF Pages-projekt)  
**Databas:** Supabase US East (ska skapas, kräver Pro-uppgradering)  
**Juridik:** Data stannar i USA (FedRAMP-förberedelse på sikt)

**Isolation:** OI EU och OI US delar ALDRIG data, databas eller backend. Separata instanser, samma kodbas.

---

### OI Enterprise (On-Premise)

För kunder med strikta krav på datasuveränitet (Trafikverket, Försvarsmakten, kritisk infrastruktur).

**Leveransformat:** Docker Compose eller Kubernetes Helm Chart  
**Offline-stöd:** Air-gapped deployment — noll utgående trafik  
**Uppdateringar:** Paketerade offline-bundles, levererade via säker kanal

**Enterprise-krav:**
- **SSO:** OAuth2/SAML via Azure AD, Okta, ADFS
- **API-integration:** REST API + webhooks mot CMMS (ServiceNow, Maximo, SCADA)
- **Proximity alerting:** Geofence, opt-in, device-side (utan offentliga register)
- **Air-gapped:** Docker/K8s-paket, noll utgående trafik
- **Certifiering:** ISO 27001 som grund, FMV-certifieringsspår på sikt
- **Audit log:** Fullständig loggning av alla användarhandlingar

---

### Integrations-API

REST API tillgängligt för Standard och Enterprise-kunder:

~~~
GET  /api/v1/objects            # Lista alla övervakade objekt
GET  /api/v1/objects/{id}       # Enskilt objekt med senaste inspektion
GET  /api/v1/alerts             # Aktiva larm (filtrerbart)
GET  /api/v1/reports/{period}   # Inspektionsrapport (PDF/JSON)
POST /api/v1/webhooks           # Registrera webhook-endpoint
~~~

**Webhook Events:**
- 'alert.created' — nytt larm skapat
- 'alert.resolved' — larm åtgärdat och stängt
- 'inspection.completed' — inspektionscykel slutförd
- 'object.status_changed' — objektstatus förändrad

**Auth:** API-nyckel (header: 'X-Landvex-Key') eller OAuth2 Bearer Token

---

### Datamodell — Nyckelobjekt

**Object (infrastrukturobjekt)**
- id, name, type (bridge/pier/road/building/etc.)
- coordinates (PostGIS Point)
- municipality_id, owner_ref
- inspection_frequency (daily/weekly/monthly)
- status (ok/warning/critical/unknown)

**Inspection**
- id, object_id, timestamp, zoomer_id
- images[] (S3 URLs)
- ai_score (0–100)
- findings[] (detekterade avvikelser)
- report_url

**Alert**
- id, object_id, inspection_id
- severity (low/medium/high/critical)
- description, image_url
- status (open/acknowledged/resolved)
- notified_at, resolved_at`
  },
  {
    id: 'doc-lx-003',
    title: 'Landvex — Försäljningsstrategi B2G Sverige',
    category: 'Landvex',
    summary: 'B2G-säljprocess, pitchdeck, kommunupphandling (LOU), prismodell och pipeline.',
    tags: ['försäljning', 'b2g', 'lou', 'kommuner', 'upphandling', 'pipeline', 'pitchdeck'],
    updatedAt: '2026-03-27',
    content: `## Landvex — Försäljningsstrategi B2G Sverige

### B2G Säljprocessen (Business-to-Government)

Att sälja till kommuner och myndigheter är fundamentalt annorlunda från B2B:

**Längre säljcykel:** 6–18 månader (vs 1–3 månader B2B)  
**Beslutsfattare:** Teknisk chef + ekonomichef + politiker (nämnd)  
**Krav:** Ofta kräver formell upphandling enligt LOU (Lagen om offentlig upphandling)  
**Trovärdighet:** Referenskunder och case studies är avgörande  

---

### Säljprocess — Steg för Steg

**Steg 1 — Identifiera**
- Lista kommuner med hög infrastrukturkostnad
- Fokus: Skärgårdskommuner (Värmdö, Nacka, Vaxholm, Norrtälje)
- Källor: Kommuners årsredovisningar, SKR:s data, mediebevakning

**Steg 2 — Första kontakt**
- E-post till teknisk chef + stadsmiljöchef
- Ämne: "Ny metod för att halvera inspektionskostnaderna"
- Bifoga 2-sidig executive summary (ej 30-sidig rapport!)
- Följ upp med telefonsamtal inom 3 dagar

**Steg 3 — Demo**
- 30-45 min online-demo eller fysiskt besök
- Visa verklig data från skärgårdsuppdrag (QuiXzoom-data)
- Fokus: ROI-kalkyl anpassad till kommunens specifika situation
- "Hur mycket betalar ni idag för manuell inspektion?"

**Steg 4 — Gratis Pilot**
- 90-dagars gratis pilot med 20–50 objekt
- Ingen onboarding-kostnad, inga bindningstider
- Krav: Deltagande i case study + 30 min intervju efter pilot

**Steg 5 — Kommers**
- Efter pilot: Formell offert
- Ofta krävs LOU-upphandling om värde > 700 000 SEK/år
- Direktupphandling möjlig under < 700 000 SEK/år
- Ramavtal via SKR Kommentus (ambition 2027)

---

### Upphandling enligt LOU

**Direkt upphandling:** < 700 000 SEK/år — Landvex kan avtala direkt med kommunen  
**Förenklad upphandling:** 700 000 – 6 MSEK — anbudsförfarande, 10 dagars ansvarstid  
**Öppen upphandling:** > 6 MSEK — EU-direktiv, längre process

**Tips:** Strukturera avtalet som 12-månaders basavtal + tillägg för att hålla nere initialt kontraktsvärde.

---

### ROI-kalkyl för Kommuner

| Post | Traditionellt | Landvex | Besparing |
|---|---|---|---|
| Inspektionskostnad (300 objekt) | 600 000 SEK/år | 60 000 SEK/år | 540 000 SEK |
| Skador som missas | 1–2 per år, ~200 000 SEK | < 0,5 per år | ~150 000 SEK |
| Dokumentationstid | 40 h/mån intern tid | 2 h/mån | ~38 h × 350 SEK/h = 160 800 SEK |
| **Total besparing** | | | **~850 000 SEK/år** |
| Landvex Standard (500 obj) | | 178 800 SEK/år | |
| **Netto ROI** | | | **~670 000 SEK/år** |

---

### Pitchdeck Struktur (7 Slides)

1. **Problem** — Inspektioner är dyra, sällsynta och reaktiva
2. **Lösning** — Right control. Right cost. Right interval.
3. **Produkt** — Demo-screenshot + nyckelfeatures
4. **Kunder** — Referenskommuner (fylls i efter pilot)
5. **ROI** — Kalkyl anpassad till kommunens storlek
6. **Pilot** — 90 dagar gratis, inga risker
7. **Nästa steg** — "När kan vi boka en demo?"

---

### Pipeline Q2 2026

| Kommun | Status | Kontakt | Nästa åtgärd |
|---|---|---|---|
| Värmdö | 🎯 Target | Teknisk chef | Identifiera kontakt |
| Nacka | 🎯 Target | Stadsmiljöchef | Identifiera kontakt |
| Vaxholm | 🎯 Target | TBD | Cold outreach |
| Norrtälje | 🎯 Target | TBD | Cold outreach |
| Stockholm Stad | 🔮 Q3 | TBD | Vänta på referens |

**Mål Thailand Workcamp:** Kontaktlista med 20 kommuner identifierade. 3 demos bokade.`
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // INTERNT
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'doc-int-001',
    title: 'Tech Stack & Infrastruktur — Komplett Bild',
    category: 'Internt',
    summary: 'AWS, Cloudflare, Supabase, GitHub Actions, ECS. All live infrastruktur dokumenterad.',
    tags: ['aws', 'cloudflare', 'supabase', 'github-actions', 'ecs', 'infrastruktur', 'tech-stack'],
    updatedAt: '2026-03-27',
    content: `## Tech Stack & Infrastruktur — Komplett Bild

### Principerna

Wavult Groups infrastruktur bygger på fyra grundprinciper:
1. **Serverless-first:** ECS Fargate (inga EC2 att hantera)
2. **Edge-first:** Cloudflare Pages för frontends (global CDN, gratis)
3. **EU-first:** eu-north-1 som primär region (GDPR, låg latens Sverige)
4. **GitOps:** All infrastrukturförändring via GitHub Actions

---

### AWS (Account: 155407238699, Region: eu-north-1)

**ECS Cluster: hypbit**

| Service | Task Definition | Status | URL |
|---|---|---|---|
| wavult-os-api | hypbit-api:14 | ✅ Live | api.hypbit.com |
| quixzoom-api | quixzoom-api:6 | ✅ Live | api.quixzoom.com |
| n8n | n8n-task:latest | ✅ Live | /n8n path via ALB |
| team-pulse | team-pulse:latest | ✅ Live | intern |

**ALB: hypbit-api-alb**
- Default → hypbit-api-tg (port 3001)
- Priority 10: /n8n* → n8n-tg (port 5678)
- Priority 20: host api.quixzoom.com → quixzoom-api-tg
- Priority 30: host api.hypbit.com → hypbit-api-tg

**S3 Buckets:**
- wavult-images-eu-primary (eu-north-1) — EU primär bildlagring
- wavult-images-eu-backup (eu-west-1) — EU backup (CRR auto)
- wavult-images-us-primary (us-east-1) — USA primär
- wavult-images-us-backup (us-west-2) — USA backup (CRR auto)
- quixzoom-app-prod (eu-north-1) — QuiXzoom frontend
- quixzoom-landing-prod (eu-north-1) — Landing page

**CloudFront Distributions:**
| ID | Alias |
|---|---|
| E2QUO7HIHWWP18 | app.quixzoom.com ✅ |
| EE30B9WM5ZYM7 | quixzoom.com, www.quixzoom.com |
| E2JOYHG1LYOXGM | hypbit.com, www.hypbit.com |

---

### Cloudflare

**Account ID:** b65ff6fbc9b5a7a7da71bb0d3f1beb28  
**Email:** wolfoftyreso@gmail.com

| Domän | Zone ID | Status |
|---|---|---|
| wavult.com | 5bed27e91d719b3f9d82c234d191ad99 | Pending (NS ej satt på Loopia) |
| quixzoom.com | e9a9520b64cd67eca1d8d926ca9daa79 | ✅ Active |
| hypbit.com | 128f872b669d059d1dfca3c9474098f1 | ✅ Active |

**wavult.com NS (för Loopia):**
- arch.ns.cloudflare.com
- gina.ns.cloudflare.com

---

### Supabase

| Projekt ID | Namn | Region | Syfte |
|---|---|---|---|
| lpeipzdmnnlbcoxlfhoe | quixzoom-v2 | eu-west-1 | QuiXzoom + OI EU portal |
| znmxtnxxjpmgtycmsqjv | wavult-os | eu-west-1 | Wavult OS command center |

**Org:** wqicazplbdsactxkpdkg (wolfoftyreso-debug)  
**US-instans:** Behöver nytt Supabase-projekt (us-east-1) — kräver Pro-uppgradering

---

### GitHub Actions CI/CD

**Repo:** wolfoftyreso-debug/hypbit (→ ska byta namn till wavult-os)

**Workflows:**
- 'deploy-api.yml' — deploy wavult-os-api (path-filter: apps/api/**)
- 'deploy-quixzoom.yml' — deploy quixzoom-api (path-filter: apps/quixzoom-api/**)
- 'deploy-pages.yml' — build & deploy Cloudflare Pages (command-center)

**Deploy-process:**
~~~
git push origin main
  → GitHub Actions triggas
  → Docker build
  → Push till ECR (eu-north-1)
  → ECS force-new-deployment
  → Healthcheck (/health)
  → Done (~3–5 min)
~~~

---

### Frontends — Cloudflare Pages

| Projekt | URL | Status |
|---|---|---|
| wavult-os | wavult-os.pages.dev | ✅ Live (os.wavult.com när NS satt) |
| landvex-eu | landvex-eu.pages.dev | ✅ Live |
| optical-insight-eu | optical-insight-eu.pages.dev | ✅ Live |

---

### n8n — Automation Hub

n8n körs som ECS-service (n8n-task). Används för:
- Morning Brief automation (nyhetsbrev kl 08:00)
- Webhook-triggers från Supabase → diverse workflows
- Slack/Telegram-notiser (intern)
- Planerat: Zoomer-payout automation (koppla Stripe)

**Tillgång:** Via ALB /n8n (intern URL — ej publik)

---

### Öppna Infrastruktur-TODOs

- [ ] wavult.com DNS: Byt NS på Loopia → wavult.com aktiveras i CF
- [ ] Supabase US East — nytt projekt för OI US
- [ ] ECS us-east-1 — ny service för OI US API
- [ ] CF API-token: Skapa nytt med "Cloudflare Pages: Edit" scope
- [ ] Wavult Mobile — Expo build → TestFlight`
  },
  {
    id: 'doc-int-002',
    title: 'Teamet — Roller, Ansvar & Kontaktinfo',
    category: 'Internt',
    summary: 'Erik, Leon, Dennis, Winston, Johan. Full rollbeskrivning med ansvar och kontaktuppgifter.',
    tags: ['team', 'roller', 'ansvar', 'kontakt', 'erik', 'leon', 'dennis', 'winston', 'johan'],
    updatedAt: '2026-03-27',
    content: `## Teamet — Roller, Ansvar & Kontaktinfo

### Erik Svensson — Chairman & Group CEO

**E-post:** erik@hypbit.com | wolfoftyreso@gmail.com  
**Telefon:** +46 709 123 223  
**Roll:** Grundare, yttersta beslutsfattaren, visionär  
**Ansvar:**
- Övergripande strategi och vision för Wavult Group
- Investerarrelationer och extern kommunikation
- Godkänner alla beslut på L3 (board-nivå)
- Slutlig productsägare för Wavult OS, QuiXzoom och Landvex
- Bernt-konfiguration och AI-strategi

**Specialiteter:** Produktvision, storytelling, affärsstrategi, systemtänkande  
**AI-agent:** Bernt (denna agent) — integrerad i Wavult OS

---

### Leon Maurizio Russo De Cerame — CEO Wavult Operations

**E-post:** leon@hypbit.com  
**Telefon:** +46 738 968 949  
**Roll:** Operationell CEO — gör att saker faktiskt händer  
**Ansvar:**
- Dag-till-dag drift av Wavult Operations FZCO (planerat)
- Zoomer-nätverket och rekrytering
- Säljledning för QuiXzoom B2B-kunder
- Thailand Workcamp-koordination (hotel-förhandling, logistik)
- HR-frågor och teamhantering

**Specialiteter:** Sälj, operations, people management, förhandling  
**Pågående:** Förhandlar 3 rum + lokal på Nysa Hotel Bangkok (April 2026)

---

### Dennis Bjarnemark — Board Member / Chief Legal & Operations (Interim)

**E-post:** dennis@hypbit.com  
**Telefon:** +46 761 474 243  
**Roll:** Juridisk ansvarig och operationsövervakare  
**Ansvar:**
- Bolagsbildningar (Dubai, Litauen, USA, Sverige)
- Juridiska avtal (IP-licenser, MSA, SHA, DPA)
- LOU-upphandlingsprocesser (Landvex)
- GDPR-compliance och integritetsskydd
- Styrelsework och bolagsstyrning

**Specialiteter:** Bolagsrätt, kontraktsrätt, due diligence, compliance  
**Pågående:** Namnbyte Sommarliden → Landvex AB, Bolagsverket

---

### Winston Gustav Bjarnemark — CFO

**E-post:** winston@hypbit.com  
**Telefon:** +46 768 123 548  
**Roll:** Finanschef  
**Ansvar:**
- Finansiell rapportering och budgetering
- Bankrelationer (Revolut Business, Mercury Bank planerat)
- Transfer pricing-dokumentation
- Intercompany-fakturering (IP-licenser, management fees)
- Revisorsrelationer (offert skickad till 8 byråer)
- Zoomer-utbetalningar och payout-reconciliation

**Specialiteter:** Redovisning, finansiell analys, skattestrategi  
**Pågående:** Väntar på revisorsoffert från PwC, Deloitte, KPMG m.fl.

---

### Johan Putte Berglund — Group CTO

**E-post:** johan@hypbit.com  
**Telefon:** +46 736 977 576  
**Roll:** Teknisk chef, arkitekt, lead developer  
**Ansvar:**
- All teknisk arkitektur och implementation
- AWS-infrastruktur och CloudOps
- GitHub repo-hantering och CI/CD
- Frontend (React/TypeScript) och Backend (Node.js)
- Supabase-arkitektur och databas-design
- Wavult Mobile-app (React Native)

**Specialiteter:** Full-stack development, cloud architecture, mobile development, DevOps  
**Pågående:** Wavult Mobile röstintegration (Bernt + Whisper), CI/CD-pipeline optimering

---

### Teamstruktur

~~~
Erik Svensson (Chairman & Group CEO)
├── Leon (CEO Operations) — dag-till-dag drift, sälj
├── Dennis (CLO Interim) — juridik, bolag, compliance
├── Winston (CFO) — finans, bank, skatt
└── Johan (CTO) — tech, infra, kod

Bernt (AI-agent) — rapporterar till Erik, assisterar hela teamet
~~~

---

### Kommunikationskanaler

**Primär kanal:** Telegram (intern grupp + direktmeddelanden)  
**Nyhetsbrev:** Morning Brief via e-post, kl 08:00 dagligen  
**Kodfrågor:** GitHub Issues + Discussions  
**Dokumentation:** Wavult OS Knowledge Hub (detta system)  
**Juridik:** DocuSign för signaturer, dennis@hypbit.com för utkast

---

### Signaturrätt (Decision Levels)

| Nivå | Vem | Exempel |
|---|---|---|
| L1 | Valfri teammedlem | Verktygsköp < 1 000 SEK |
| L2 | CEO (Erik eller Leon) | Avtal < 50 000 SEK, anställning |
| L3 | Board (Erik + Dennis) | Bolagsavtal, IP-avtal, investering > 50 000 SEK |`
  },
  {
    id: 'doc-int-003',
    title: 'Beslutslogs & Milstolpar 2026',
    category: 'Internt',
    summary: 'Alla viktiga beslut och milstolpar chronologiskt. Single source of truth för vad som bestämts.',
    tags: ['beslut', 'milstolpar', 'historik', 'changelog', 'decisions'],
    updatedAt: '2026-03-27',
    content: `## Beslutslogs & Milstolpar 2026

### Format

Varje beslut loggas med datum, beslutsfattare och beslutets kärna. Dessa är LÅSTA — de ändras inte, de revideras genom nya beslut.

---

### Mars 2026

**2026-03-27 — CANONICAL_SYSTEM.md låst**
- Beslutsfattare: Erik Svensson
- Beslut: Canonical names för hela Wavult Group fastlåsta. Inga undantag.
- Berört: Alla produkter, bolag och kommunikation framöver
- Dokument: /docs/CANONICAL_SYSTEM.md

**2026-03-27 — Thailand Workcamp bekräftat**
- Beslutsfattare: Erik Svensson
- Beslut: 11 april 2026, Bangkok, Nysa Hotel. Leon förhandlar rum.
- Berört: Hela teamet (5 personer)
- Status: Leon kontaktar Arthur (hotell) för förhandling om 3 rum + lokal

**2026-03-27 — quixzoom-api fix**
- Beslutsfattare: Johan Berglund (tech)
- Beslut: ECS task def :6 — SUPABASE_SERVICE_KEY saknades, lade till
- Berört: quixzoom-api ECS service
- Status: ✅ Live och fungerande

**2026-03-27 — Wavult Mobile röstintegration**
- Beslutsfattare: Erik Svensson
- Beslut: Röstflöde Siri → "Hey Siri, Bernt" → Wavult Mobile → Whisper → Bernt
- Berört: apps/wavult-mobile
- Status: Kod klar, väntar på Expo build + TestFlight

**2026-03-25 — OI Produktstruktur låst**
- Beslutsfattare: Erik Svensson
- Beslut: Tre deployment-tiers (OI Cloud EU/US, OI Enterprise)
- Citat: "Systemet existerar i en EU-variant och en USA-variant."
- Dokument: MEMORY.md → OI Produktstruktur

**2026-03-25 — S3 Multi-Region live**
- Beslutsfattare: Johan Berglund
- Beslut: 4 S3-buckets (EU + US, primary + backup), CRR aktiverat
- EU-data replikeras ALDRIG till USA
- Status: ✅ Live

**2026-03-25 — LandveX kärnvärde låst**
- Beslutsfattare: Erik Svensson
- Citat: "Right control. Right cost. Right interval."
- Beslut: Detta är LandveX positionering. Aldrig "AI-övervakning", aldrig "säkerhet".

**2026-03-24 — Go-to-Market Sekvens låst**
- Beslutsfattare: Erik Svensson
- Beslut: QuiXzoom → Quixom Ads → Landvex (i denna ordning)
- Marknad 1: Sverige, mitten juni 2026, startpunkt skärgården
- LandveX aktiveras FÖRST när databasen är substantiell

**2026-03-24 — Varumärkessegmentering låst**
- Beslutsfattare: Erik Svensson
- Beslut: LandveX SEPARAT från QuiXzoom i all kommunikation
- Quixom Ads = B2B monetisering (separat från Landvex)
- Nämn ALDRIG Landvex i QuiXzoom-kontext

**2026-03-21 — Bolagsstruktur fastställd**
- Beslutsfattare: Erik Svensson + Dennis Bjarnemark
- Beslut: 6-entitetsmodell (2 Dubai + 2 USA + 1 EU + 1 SE)
- Alla lokala bolag ägs av Wavult DevOps FZCO
- Intercompany: IP-licens + management fee (OECD arm's length 8-15%)

---

### Pågående / Väntar på Beslut

| Ämne | Status | Ansvarig | Beslut krävs av |
|---|---|---|---|
| Val av UAE Free Zone (DMCC vs IFZA vs DIFC) | 🔄 Pågår | Dennis | Dennis + Erik |
| QuiXzoom UAB — rehabilitera vs nytt bolag | 🔄 Pågår | Dennis | Väntar på byrå-svar |
| Revisorsval | 🔄 Pågår | Winston | Väntar på offert |
| Exact lanserings-datum Sverige | 🔮 Kommande | Erik + Leon | Post-Thailand |
| Quixom Ads-launch timing | 🔮 Kommande | Erik | Post-QuiXzoom |`
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // JURIDIK
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'doc-jur-001',
    title: 'Landvex Inc — Texas LLC Formation (SOSDirect)',
    category: 'Juridik',
    summary: 'SOSDirect Form 201, kvarstående steg, adressuppgifter, 83b election och tidslinje.',
    tags: ['texas', 'llc', 'sosdirect', 'form-201', 'landvex-inc', '83b', 'houston'],
    updatedAt: '2026-03-27',
    content: `## Landvex Inc — Texas LLC Formation

### Status

🔴 **Halvklar** — SOSDirect Form 201 påbörjad men ej inlämnad.  
**Myndighet:** Texas Secretary of State — SOSDirect  
**Formulär:** Form 201 (Certificate of Formation — Limited Liability Company)  
**Avgift:** $300 (+ $25 för expedited 24h-handläggning)

---

### Kvarstående Steg (Vad Som Ska Fyllas i)

**1. Registrerat namn**
- Namn: **Landvex Inc** (eller Landvex LLC — Texas)
- Verifiera tillgänglighet på SOSDirect före inlämning

**2. Adressuppgifter — Director + Organizer**
- Ändra till: **Åvägen 9, 135 48 Tyresö, Sweden**
- Gäller både Director och Organizer (Erik Svensson)

**3. Article 4 — Aktier**
- Antal aktier: **10 000 000**
- Kryssa: **B (No par value)**

**4. Registered Agent**
- Behöver texasregistrerad agent
- **Northwest Registered Agent** är förvald
- Adress: 5900 Balcones Drive STE 100, Austin TX 78731

**5. Initial Mailing Address**
- Använd Northwest-adressen för initial mailing
- Ändra till Åvägen 9, Tyresö, Sverige som permanent adress

**6. Effectiveness**
- Kryssa: **A (File date)**

**7. Signering**
- Signeras av: Erik Svensson (Organizer)
- Datum: Inlämningsdatum

---

### Betalning

- Kortbetalning via SOSDirect (kreditkort / debet)
- Standard: $300
- Expedited (24h): $300 + $25 = $325 total
- **Rekommendation:** Välj expedited — 1 dag vs 5–7 dagar

---

### 83(b) Election — KRITISK

**Vad:** Skatteoptimering för grundarens andelar. Väljer att bli beskattad vid tilldelningstillfället (0 kr värde) istället för vid vesting.

**Tidsgräns:** Måste skickas in inom **30 dagar** från registreringsdatum.

**Hur:**
1. Fyll i IRS Form 83(b) (kan laddas ner gratis)
2. Skicka via USPS certified mail till IRS
3. Behåll bekräftelsekopian (livsviktigt)
4. Notera: Stripe Atlas guidar genom 83(b) om QuiXzoom Inc bildas via Atlas

**Konsekvens av att missa:** Beskattas vid vesting på hela marknadsvärdet. Kan bli 6-siffriga skatter i framtiden.

---

### After Filing — Nästa Steg

1. **EIN (Employer Identification Number)** — SS-4 form till IRS (gratis, tar 1–2 veckor via post)
2. **Bankkonto** — Mercury Bank (startup-vänlig, remote onboarding)
3. **Intercompany-avtal** — IP-licensavtal från Wavult DevOps FZCO
4. **Revisorsnotis** — Informera revisionsbyrå om ny entitet

---

### Tidslinje

| Datum | Händelse |
|---|---|
| ASAP | Slutför Form 201, betala $325 |
| +1 dag (expedited) | Certificate of Formation mottaget |
| +30 dagar från reg | 83(b) Election deadline |
| +2 veckor | EIN klar |
| +1 månad | Mercury Bank-konto öppnat |
| Thailand Workcamp | Dennis presenterar slutfört Landvex Inc |`
  },
  {
    id: 'doc-jur-002',
    title: 'Landvex AB — Bolagsverket Namnbyte',
    category: 'Juridik',
    summary: 'Sommarliden Holding AB → Landvex AB. Org.nr 559141-7042. Status och kvarstående steg.',
    tags: ['landvex-ab', 'bolagsverket', 'namnbyte', 'sommarliden', 'org-nr', 'aktiebolag'],
    updatedAt: '2026-03-27',
    content: `## Landvex AB — Bolagsverket Namnbyte

### Grundinfo

**Tidigare namn:** Sommarliden Holding AB  
**Nytt namn:** Landvex AB  
**Org.nr:** 559141-7042  
**Hemort:** Stockholm, Sverige  
**Status:** 🟡 Namnbyte inlämnat till Bolagsverket (~1–2 veckor för registrering)

---

### Vad som Ändras

**Namn:** Sommarliden Holding AB → Landvex AB  
**Inget annat ändras:**
- Org.nr kvarstår: 559141-7042
- Styrelse och ägare oförändrade
- Alla befintliga avtal och tillstånd fortsätter gälla
- Bankförbindelser kvarstår (kräver dock underrättelse till bank)

---

### Revisionsstatus

**Bolaget är vilande** — inga aktiva affärsrelationer, inga anställda, ren bokföring.

Offert skickad till 8 revisionsbyråer:
- PwC, Deloitte, KPMG, EY (big four)
- Grant Thornton, BDO, Mazars, Advisense (mellanstora)

Offertens innehåll: Sommarliden Holding AB / Landvex AB (559141-7042), vilande, namnbyte pågår. Väntar svar 1–3 dagar.

---

### Kvarstående Steg efter Namnbyte

**1. Officiell bekräftelse från Bolagsverket**
- Ta emot registreringsbevis
- Diarienummer: (sparas när mottaget)

**2. Uppdatera banken**
- Meddela bank om namnbytet
- Begär uppdaterade kontoutdrag och kort med nytt namn

**3. Uppdatera skattemyndigheten**
- Skatteverket uppdateras automatiskt från Bolagsverket, men verifiera

**4. Domäner och digitala tillgångar**
- landvex.com (status: TBD, CF zone ej skapad)
- Uppdatera Cloudflare med nya bolagsuppgifter

**5. Ägaröverföring (framtida steg)**
- Aktierna ägs idag av Erik Svensson
- Plan: Överlåta till Wavult DevOps FZCO (Dubai) när FZCO är bildat
- Kräver aktieöverlåtelseavtal + stämpelskatt (om tillämpligt)

---

### Varför Sverige som juridisk hemvist?

- Landvex primärsäljer till **svenska kommuner** — inhemsk aktör ger trovärdighet
- LOU-upphandlingar premierar svenska leverantörer
- Enkel kommunikation med myndigheter
- Befintligt bolag (Sommarliden) återanvänds — sparar tid och pengar
- Momsregistrering och F-skattsedel enkelt att hantera

---

### Framtida Bolagsstruktur

När Dubai-bolagen är bildade:

~~~
Wavult Group FZCO (Dubai)
└── Wavult DevOps FZCO (Dubai)
    ├── Landvex AB (559141-7042, Sverige) ← Du är här
    └── Landvex Inc (Texas, USA) ← Halvklar
~~~

**Ägarskifte:** Erik Svensson → Wavult DevOps FZCO (100%)  
Tidpunkt: När Wavult DevOps FZCO är bildat och bankkonto öppnat

---

### Nyckelkontakter

**Bolagsverket:** bolagsverket.se, 0771-670 670  
**Revisor:** TBD (väntar på offert)  
**Jurist:** Dennis Bjarnemark (dennis@hypbit.com)  
**Ansvarig:** Dennis Bjarnemark (daglig kontakt med Bolagsverket)`
  },
]

// ─── Knowledge Graph Nodes ────────────────────────────────────────────────────

export type NodeType = 'holding' | 'operations' | 'product' | 'system' | 'person' | 'market'

export interface GraphNode {
  id: string
  name: string
  type: NodeType
  color: string
  description: string
  layer: number
  links?: string[]
}

export const GRAPH_NODES: GraphNode[] = [
  {
    id: 'wavult-group',
    name: 'Wavult Group FZCO',
    type: 'holding',
    color: '#8B5CF6',
    description: 'Ultimate parent. Äger all IP, varumärken och kod. Dubai Free Zone (DMCC). 0% bolagsskatt.',
    layer: 0,
    links: ['wavult-devops']
  },
  {
    id: 'wavult-devops',
    name: 'Wavult DevOps FZCO',
    type: 'operations',
    color: '#6366F1',
    description: 'Central driftsenhet. Bygger systemen, licensierar IP till driftsbolagen. Dubai.',
    layer: 1,
    links: ['quixzoom-uab', 'quixzoom-inc', 'landvex-ab', 'landvex-inc']
  },
  {
    id: 'quixzoom-inc',
    name: 'QuiXzoom Inc',
    type: 'product',
    color: '#F59E0B',
    description: 'QuiXzoom Global/USA-verksamhet. Delaware C Corp. Stripe Atlas.',
    layer: 2,
    links: ['quixzoom-app', 'quixzoom-api']
  },
  {
    id: 'quixzoom-uab',
    name: 'QuiXzoom UAB',
    type: 'product',
    color: '#F59E0B',
    description: 'QuiXzoom EU-verksamhet. Litauen UAB. GDPR-hemvist, SEPA-betalningar.',
    layer: 2,
    links: ['quixzoom-app', 'quixzoom-api']
  },
  {
    id: 'landvex-ab',
    name: 'Landvex AB',
    type: 'product',
    color: '#10B981',
    description: 'Landvex EU B2G. Org.nr 559141-7042. Namnbyte Sommarliden → Landvex. Stockholm.',
    layer: 2,
    links: ['landvex-app']
  },
  {
    id: 'landvex-inc',
    name: 'Landvex Inc',
    type: 'product',
    color: '#10B981',
    description: 'Landvex USA B2G. Texas LLC. SOSDirect Form 201 halvklar.',
    layer: 2,
    links: ['landvex-app']
  },
  {
    id: 'quixzoom-app',
    name: 'QuiXzoom App',
    type: 'system',
    color: '#FCD34D',
    description: 'React Native mobilapp. Mapbox + Vision Camera. Zoomers verktyg.',
    layer: 3,
    links: ['quixzoom-api']
  },
  {
    id: 'quixzoom-api',
    name: 'QuiXzoom API',
    type: 'system',
    color: '#FCD34D',
    description: 'Node.js backend på AWS ECS eu-north-1. Mission, auth, media, billing services.',
    layer: 3
  },
  {
    id: 'landvex-app',
    name: 'Landvex Platform',
    type: 'system',
    color: '#34D399',
    description: 'Optical Insight-motorn. Händelsebaserade larm och analysrapporter för kommuner.',
    layer: 3
  },
  {
    id: 'wavult-os',
    name: 'Wavult OS',
    type: 'system',
    color: '#3B82F6',
    description: 'Internt enterprise OS. React + TypeScript, Cloudflare Pages. Hjärnan.',
    layer: 3,
    links: ['bernt']
  },
  {
    id: 'bernt',
    name: 'Bernt (AI)',
    type: 'person',
    color: '#EC4899',
    description: 'Wavult Groups AI-agent. OpenClaw-instans i Wavult OS. Hjälper hela teamet.',
    layer: 4
  },
  {
    id: 'dubai',
    name: 'Dubai (UAE)',
    type: 'market',
    color: '#EF4444',
    description: 'Primär juridisk hemvist. DMCC Free Zone. 0% skatt, full kapitalrepatriering.',
    layer: 1,
    links: ['wavult-group', 'wavult-devops']
  },
  {
    id: 'eu-market',
    name: 'EU Market',
    type: 'market',
    color: '#0EA5E9',
    description: 'Litauen som EU-bas. GDPR-hemvist, SEPA, EU-upphandlingar. Sverige för B2G.',
    layer: 2,
    links: ['quixzoom-uab', 'landvex-ab']
  },
  {
    id: 'usa-market',
    name: 'USA Market',
    type: 'market',
    color: '#0EA5E9',
    description: 'Delaware (QuiXzoom) + Texas (Landvex). Välkänd för investerare, enkel bolagsform.',
    layer: 2,
    links: ['quixzoom-inc', 'landvex-inc']
  }
]

// ─── Idéportfolio ─────────────────────────────────────────────────────────────

export const IDEA_PORTFOLIO = [
  {
    id: 'mlcs',
    title: 'MLCS Protokoll',
    domain: 'Kliniskt ledningssystem',
    pages: 103,
    updated: '2026-03-17',
    status: 'aktiv' as const,
    description: 'Meta-Level Clinical Structuring — beslutsarkitektur för klinisk och organisatorisk styrning. Evidensbaserat, med artikel-scoring, governance, certifiering och forum.',
    potential: 'Knowledge Hub, certifieringsmodul, governance-ramverk för Wavult',
    tags: ['Sjukvård', 'Governance', 'Certifiering', 'B2B', 'Sverige'],
    repo: 'mlcs',
  },
  {
    id: 'certified-academy',
    title: 'Certified Academy',
    domain: 'Editorial + Certifieringsplattform',
    pages: 41,
    updated: '2026-03-14',
    status: 'aktiv' as const,
    description: 'LinkedIn Learning möter The Economist. Kurser, certifikat, redaktionellt innehåll, regionala byråer, annonsörer, governance.',
    potential: 'Zoomer-utbildning, intern academy för Wavult-teamet',
    tags: ['Utbildning', 'Certifiering', 'Media', 'SaaS'],
    repo: 'certified-academy',
  },
  {
    id: 'dissg',
    title: 'DISSG / Lambda System',
    domain: 'Civilisations-oscilloskop',
    pages: 115,
    updated: '2026-03-16',
    status: 'aktiv' as const,
    description: 'Ett instrument som mäter samhällssignaler utan narrativ eller åsikter. Geo-kontext, AI-diagnos, city nodes, causal DAG, global intelligence layer.',
    potential: 'Data-layer för Landvex/Quixom Ads, global intelligence API',
    tags: ['Data', 'AI', 'Samhälle', 'Global', 'API'],
    repo: 'dissg',
  },
  {
    id: 'strimdev',
    title: 'STRIM',
    domain: 'Missbruksvård / Samhällsstöd',
    pages: 192,
    updated: '2026-03-17',
    status: 'aktiv' as const,
    description: 'Stiftelsen för Samordning och Riktlinjer inom Missbruksvård. Hjälper människor navigera stöd- och vårdsystemet i Sverige. Transparent, värderingsfri, intelligent.',
    potential: 'Eget venture / stiftelse. Potentiell samhällsfinansiering.',
    tags: ['Hälsa', 'Samhälle', 'Sverige', 'Stiftelse'],
    repo: 'strimdev',
  },
  {
    id: 'certified-spark-engine',
    title: 'Certified Spark Engine',
    domain: 'Certifieringsplattform v2',
    pages: 32,
    updated: '2026-03-16',
    status: 'aktiv' as const,
    description: 'Nästa generations certifierings-OS. DISC-analys, kompetenshantering, globalt certifieringsregister, auditramverk.',
    potential: 'Vidareutveckling av certified-academy + mlcs till en plattform',
    tags: ['Certifiering', 'DISC', 'Kompetens', 'Global', 'SaaS'],
    repo: 'certified-spark-engine',
  },
  {
    id: 'cert-integrity-engine',
    title: 'Cert Integrity Engine',
    domain: 'Labb-certifiering / Konsumenthälsa',
    pages: 32,
    updated: '2026-03-16',
    status: 'aktiv' as const,
    description: 'Oberoende laboratorietestning och certifiering för konsumenthälsoprodukter. QR-ingrediensanalys, förpackningsstandarder, EU-partner-labb.',
    potential: 'Eget venture inom konsumenthälsa / regulatorisk compliance',
    tags: ['Hälsa', 'Labb', 'EU', 'Certifiering', 'B2B'],
    repo: 'cert-integrity-engine',
  },
  {
    id: 'honest-shelves-builder',
    title: 'Honest Shelves Builder',
    domain: 'E-handel Kosttillskott / Hudvård',
    pages: 16,
    updated: '2026-03-16',
    status: 'aktiv' as const,
    description: 'Transparent e-handel för naturliga/kliniska kosttillskott. Shopify-integrerat, klinisk potens-data, tredjepartsverifiering.',
    potential: 'Eget D2C-varumärke eller SaaS-plattform för naturproduktsbolag',
    tags: ['E-handel', 'Shopify', 'Hälsa', 'D2C', 'B2B'],
    repo: 'honest-shelves-builder',
  },
  {
    id: 'vision-kredit-byggare',
    title: 'Vision Kredit Byggare',
    domain: 'B2B Fintech — Fakturakredit',
    pages: 21,
    updated: '2026-03-14',
    status: 'aktiv' as const,
    description: 'Fakturakredit, utrustningsleasing, sale-leaseback, leverantörsfaktura, one-click invoice.',
    potential: 'Eget fintech-venture eller integration med Revolut Business',
    tags: ['Fintech', 'Kredit', 'Leasing', 'B2B', 'Sverige'],
    repo: 'vision-kredit-byggare',
  },
  {
    id: 'lucid-bridge-build',
    title: 'Lucid Bridge Build',
    domain: 'B2B CRM + AI-försäljning',
    pages: 25,
    updated: '2026-01-13',
    status: 'pausad' as const,
    description: 'AI-driven B2B-försäljningsplattform. Dashboard med leads, pipeline, live news feed, market pulse.',
    potential: 'CRM-modul för Wavult OS eller fristående SaaS',
    tags: ['CRM', 'AI', 'Försäljning', 'B2B', 'SaaS'],
    repo: 'lucid-bridge-build',
  },
  {
    id: 'it-insight-weaver',
    title: 'IT Insight Weaver',
    domain: 'IT-analys PDF-generator',
    pages: 3,
    updated: '2026-03-15',
    status: 'aktiv' as const,
    description: '14 branscher, 17-sektioners systemanalysrapport, ROI-beräkning, PDFMonkey-integration.',
    potential: 'Säljverktyg för Landvex-konsulter eller fristående produkt',
    tags: ['IT-konsult', 'PDF', 'ROI', 'B2B', 'Sverige'],
    repo: 'it-insight-weaver',
  },
  {
    id: 'story-weaver-ai',
    title: 'Story Weaver AI',
    domain: 'AI Filmproduktion',
    pages: 5,
    updated: '2026-02-12',
    status: 'pausad' as const,
    description: 'Komplett pre-production suite för AI-genererat filminnehåll. Karaktärer, scener, manus, branding.',
    potential: 'Content-verktyg för QuiXzoom-marknadsföring eller fristående',
    tags: ['Film', 'AI', 'Content', 'Kreativt'],
    repo: 'story-weaver-ai',
  },
  {
    id: 'smart-founder-engine',
    title: 'Smart Founder Engine',
    domain: 'Grundar-wizard',
    pages: 2,
    updated: '2025-12-23',
    status: 'tidig' as const,
    description: 'Guided onboarding för grundare: affärsidé → bolagsform → bank → försäkring → tillstånd → registrering.',
    potential: 'Integration med vision-kredit-byggare eller fristående fintech',
    tags: ['Startup', 'Bolagsregistrering', 'Sverige', 'Wizard'],
    repo: 'smart-founder-engine',
  },
  {
    id: 'projekt-q',
    title: 'Projekt Q — System Build Handbook',
    domain: 'Teknisk specifikation',
    pages: 0,
    updated: '2026-01-22',
    status: 'referens' as const,
    description: 'Professionellt system build-handbook för externa devteam. Modulbaserat med OVERVIEW/TASKS/ACCEPTANCE per modul.',
    potential: 'Referensdokument för Thailand-workcamp-bygge',
    tags: ['Dokumentation', 'Devteam', 'RFP', 'Moduler'],
    repo: 'projekt-q',
  },
]
