import { useState } from 'react'

interface Lesson {
  title: string
  duration: number // minutes
  content: string
}

interface Course {
  id: string
  title: string
  description: string
  icon: string
  color: string
  lessons: Lesson[]
}

const COURSES: Course[] = [
  // ── Dag 1-kurs ── Ny teammedlem — snabbstart ────────────────────────────────
  {
    id: 'dag-1',
    title: 'Ny teammedlem — Dag 1',
    description: 'Den snabbaste vägen in. Vad vi bygger, vilka vi är och hur du hittar rätt från dag ett.',
    icon: '🚀',
    color: '#EC4899',
    lessons: [
      {
        title: 'Vad vi bygger — 2 minuter',
        duration: 2,
        content: `Wavult Group bygger tre inbyggda produkter som tillsammans bildar en värdekedja.

**QuiXzoom**
En mobilapp där zoomers — frilansar med smartphones — tar geo-taggade fotouppdrag mot betalning. Tänk Uber Eats, fast för bilddata. Vi kallar det "last mile intelligence capture".

**Quixom Ads**
B2B-monetisering av QuiXzoom-datan. Hyperlokal affärsintelligens och annonsering. Aktiveras i fas 2.

**Landvex**
Enterprise B2G-plattform. Säljer händelsebaserade larm och analysabonnemang till kommuner och Trafikverket. Kärnvärdet: *"Right control. Right cost. Right interval."*

**Sekvensen är låst:**
QuiXzoom bygger datan → Quixom Ads monetiserar den → Landvex säljer analysen till offentlig sektor. I den ordningen, inte tvärtom.

**Nästa lansering:** Sverige, mitten juni 2026. Startpunkt: Stockholms skärgård.`,
      },
      {
        title: 'Teamet — vem gör vad',
        duration: 3,
        content: `Wavult Group är 5 personer plus en AI-agent. Lär dig vem som äger vad.

**Erik Svensson — Chairman & Group CEO**
Grundare och yttersta beslutsfattaren. Äger produktvisionen. Alla L3-beslut (> 50 000 SEK, bolagsavtal) kräver Eriks signatur.
Kontakt: +46 709 123 223

**Leon Russo — CEO Wavult Operations**
Dag-till-dag drift, sälj och zoomer-rekrytering. Frågor om operations, HR, sälj → Leon.
Kontakt: +46 738 968 949

**Dennis Bjarnemark — Chief Legal & Operations (Interim)**
Allt juridiskt: bolagsbildningar, avtal, compliance, GDPR. Frågor om juridik → Dennis.
Kontakt: +46 761 474 243

**Winston Bjarnemark — CFO**
Finans, bokföring, bank, transfer pricing, zoomer-utbetalningar. Frågor om ekonomi → Winston.
Kontakt: +46 768 123 548

**Johan Berglund — Group CTO**
All tech: AWS, frontend, backend, mobile, CI/CD. Frågor om teknik → Johan.
Kontakt: +46 736 977 576

**Bernt — AI-agent**
OpenClaw-instans integrerad i Wavult OS. Klicka på 🤖-knappen i topbaren. Bernt kan svara på de flesta frågor och utföra uppgifter.

**Kommunikation:** Telegram är primär kanal. Be om access till teamets grupp direkt.`,
      },
      {
        title: 'Bolagsstrukturen — förenklat',
        duration: 3,
        content: `Wavult Group har 6 juridiska entiteter. Du behöver förstå strukturen på en övergripande nivå.

**Lagret 1 — Dubai (Holding & IP)**
• Wavult Group FZCO — äger all IP, varumärken och kod. 0% skatt på IP-inkomster.
• Wavult DevOps FZCO — bygger systemen, licensierar IP till driftsbolagen.

**Lagret 2 — Driftsbolag**
• QuiXzoom Inc (Delaware, USA) — global/USA-verksamhet
• QuiXzoom UAB (Litauen) — EU-verksamhet, GDPR-hemvist
• Landvex AB (Stockholm, Sverige) — säljer till svenska kommuner
• Landvex Inc (Houston, Texas) — säljer till amerikanska myndigheter

**Varför Dubai?**
IP registrerat i Dubai beskattas med 0%. Driftsbolagen betalar en del av sina intäkter som "IP-licens" uppåt till Dubai — legalt och OECD-compliant. Effektiv skattesats för koncernen: < 5%.

**Status 2026-03-27:**
Dubai-bolagen är inte bildade ännu (business plan klar). Texas LLC halvklar. Sverige-namnbyte pågår.

**Du behöver inte detaljerna nu** — läs "Bolagsstruktur — Komplett Koncernkarta" i Kunskapsbasen när du är redo.`,
      },
      {
        title: 'Verktyg & access — checklista',
        duration: 2,
        content: `Säkra din access dag 1 — be din manager om följande:

**Alla i teamet:**
• Telegram — primär kommunikationskanal (privat grupp)
• Wavult OS — admin-inbjudan (detta system)
• E-postkonto (namn@hypbit.com) — be Leon

**Tech-teamet (Johan-sidan):**
• GitHub — wolfoftyreso-debug/hypbit (repo-access)
• Supabase — wavult-os + quixzoom-v2 projekt
• AWS Console — account 155407238699 (begränsat read-only för start)
• Cloudflare — pages.dev-access

**Finance (Winston-sidan):**
• Revolut Business — kortaccess

**Legal (Dennis-sidan):**
• DocuSign — för digitala signaturer
• Bolagsverket-access (om relevant)

**Bernt är alltid tillgänglig** via 🤖-knappen — ingen access krävs. Fråga Bernt om du fastnar.`,
      },
      {
        title: 'Thailand Workcamp — 11 april 2026',
        duration: 2,
        content: `**Det första stora milstolpen för hela teamet är Thailand Workcamp.**

**Datum:** 11 april 2026  
**Plats:** Bangkok, Thailand — Nysa Hotel, Sukhumvit 13  
**Deltagare:** Erik, Leon, Dennis, Winston, Johan

**Vecka 1 — Utbildning & Orientering:**
• Måndag: Ankomst & kickoff
• Tisdag: Wavult OS Bootcamp — alla tar Academy-kurserna
• Onsdag: Bolagsstruktur & juridik
• Torsdag: Tech Deep Dive
• Fredag: Teambuilding
• Lördag–Söndag: Sprint-planering

**Vecka 2+ — Byggfas:**
• QuiXzoom MVP klart för Sverige-lansering
• Landvex beta-sajt live
• Dubai-struktur presenterad

**Mål för dig innan workcamp:**
Klara minst 2 Academy-kurser + Zoomer-certifieringen. Alla i teamet ska vara certifierade.`,
      },
    ],
  },
  {
    id: 'wavult-os',
    title: 'Wavult OS — Grundkurs',
    description: 'Lär dig navigera Wavult OS: moduler, entiteter, roller och workflow för hela koncernen.',
    icon: '🖥️',
    color: '#3B82F6',
    lessons: [
      {
        title: 'Vad är Wavult OS?',
        duration: 5,
        content: `Wavult OS är det interna enterprise-operativsystemet för hela Wavult Group. Det är inte ett traditionellt operativsystem — det är ett webbaserat control center som samlar all verksamhetsinformation på ett ställe.

**Varför Wavult OS?**
Utan ett centralt OS tappar växande bolag kontrollen. Information ligger utspridd i e-post, Notion, Google Sheets och Slack. Wavult OS löser det problemet genom att ge varje teammedlem exakt den information och de verktyg de behöver — baserat på deras roll.

**Vad finns i Wavult OS?**
• Dashboard — realtidsöversikt av hela koncernen
• Finance — budgetar, cashflow, intercompany-fakturering  
• CRM — kunder och säljpipeline (Landvex-kunder, QuiXzoom B2B)
• Legal — bolagsavtal, compliance-status, signaturer
• Knowledge Hub — detta system! Allt Wavult Group vet, strukturerat
• Communications — nyhetsbrev, Bernt-interaktion
• System Status — infrastrukturhälsa, ECS-status, alerts

**Tech Stack:**
Wavult OS är byggt i React 18 + TypeScript, Tailwind CSS, Vite. Det körs på Cloudflare Pages (global CDN, blixtsnabbt). Ingen server — all state i Supabase (projekt: wavult-os, eu-west-1).`,
      },
      {
        title: 'Shell, Sidebar & Navigation',
        duration: 5,
        content: `Wavult OS har ett konsekvent shell-ramverk som omsluter alla moduler.

**Sidebar (vänster)**
Sidebaren är organiserad i grupper:
• CORE: Dashboard, Alerts
• BUSINESS: Finance, CRM, Legal
• PRODUCTS: QuiXzoom, Landvex
• TEAM: HR, Communications
• KNOWLEDGE: Knowledge Hub (du är här)
• SYSTEM: Settings, Status

Klicka på en grupp för att fälla ut/ihop den. Aktivt objekt markeras med brand-accent (lila).

**Topbar**
• Vänster: Wavult-logga + bolagets namn
• Mitten: Global sökruta (sök i hela OS:et)
• Höger: Entitetsväljare + Rollindikator + Bernt-knapp

**Bernt-knapp (🤖)**
Klicka för att öppna Bernt direkt i OS:et. Bernt har tillgång till all data i Wavult OS och kan svara på frågor, skapa rapporter och utföra uppgifter.

**Tangentbordsgenvägar:**
• Cmd/Ctrl + K → Global sök
• Escape → Stäng modal
• Tab → Navigera mellan element`,
      },
      {
        title: 'Entity Scope — Filtrera per Bolag',
        duration: 5,
        content: `Wavult Group har 6 juridiska entiteter. Entity Scope låter dig se data för ett specifikt bolag — eller för hela koncernen.

**Entiteter i systemet:**
• Wavult Group (hela koncernen — aggregerad vy)
• Wavult DevOps FZCO (Dubai — tech + operations)
• QuiXzoom Inc (Delaware, USA)
• QuiXzoom UAB (Vilnius, Litauen)
• Landvex AB (Stockholm, Sverige — org.nr 559141-7042)
• Landvex Inc (Houston, Texas)

**Hur det fungerar:**
Välj entity i topbar-dropdown. Alla moduler filtreras automatiskt — Finance visar bara det bolagets konton, Legal visar bara det bolagets avtal, CRM visar bara det bolagets kunder.

**Varför det är viktigt:**
Intercompany-transaktioner kräver tydlig separation. Om du jobbar med Landvex AB:s bokföring ska du INTE se QuiXzoom:s data — det förvirrar och kan leda till felaktiga beslut.

**Admin-rollen** ser alltid hela koncernen oavsett entity scope.`,
      },
      {
        title: 'Roller: Admin, CEO, CFO, CTO, Ops',
        duration: 5,
        content: `Wavult OS har ett rollbaserat åtkomstsystem (RBAC). Din roll bestämmer vilka moduler du ser och vilka åtgärder du kan utföra.

**Rollerna:**

**Admin (Erik Svensson)**
Full access till allt. Kan skapa användare, ändra systemkonfiguration, godkänna L3-beslut.

**CEO (Erik / Leon)**
Access till alla affärsmoduler: Finance, CRM, Legal, Products, Communications. Kan godkänna avtal upp till L2.

**CFO (Winston Bjarnemark)**
Full access till Finance-modulen. Begränsad access till Legal (se ej signera). Kan se men ej ändra CRM.

**CTO (Johan Berglund)**
Full access till Systems-sektionen. Kan se men ej ändra Finance. Access till alla tekniska konfigurationer.

**Ops (Leon Russo)**
Access till CRM, Communications, HR. Begränsad Finance (kan se budgetar, ej ändra).

**Signaturrätt:**
• L1: Valfri roll < 1 000 SEK
• L2: CEO-roll < 50 000 SEK  
• L3: Admin + Board Member (Dennis) — allt ovanför`,
      },
      {
        title: 'Knowledge Hub — Så Används Det',
        duration: 5,
        content: `Knowledge Hub (denna modul) är Wavult Groups samlade kunskapsbank. Det är designat för djupläsning — inte snabb skanning.

**Flikar i Knowledge Hub:**
• Kunskapsbas — dokument med djupt innehåll (detta!)
• Kunskapsgraf — visuell karta över hur entiteter hänger ihop
• Utbildning — strukturerade kurser med progress-tracking
• Zoomer-cert — certifieringsprogram för QuiXzoom-fältpersonal
• Idéportfolio — Eriks 13 Lovable-projekt, klonare Mars 2026

**Hur du läser ett dokument:**
1. Välj kategori (eller Alla)
2. Sök om du letar efter något specifikt
3. Klicka ett kort för att öppna dokumentet
4. Scrolla — varje dokument har hundratals ord av verklig information
5. Använd "Nästa dokument" för att fortsätta läsa

**Lästiden** visas på varje kort (~X min). Ta din tid — dessa dokument är skrivna för att du ska lära dig, inte för att du ska hinna klicka igenom.

**Bernt och Knowledge Hub:**
Bernt har tillgång till all information i Knowledge Hub. Istället för att läsa allt kan du fråga Bernt: "Förklara Landvex prismodell" eller "Vilka är stegen för Texas LLC?"`,
      },
      {
        title: 'Dashboard & Alerts',
        duration: 5,
        content: `Dashboard är Wavult OS startsida — realtidsöversikt av hela koncernen.

**Dashboard-widgets:**
• Infrastrukturstatus (ECS, Supabase, CloudFront — grön/gul/röd)
• Bolagsstatus (6 entiteter, bildningsstatus)
• Finansöversikt (budget vs utfall per bolag)
• Aktiva uppgifter och deadlines
• Team-aktivitet (senaste commits, deployments)
• Bernt-aktivitet (senaste AI-interaktioner)

**Alerts:**
Samlar alla aktiva incidents — tekniska problem, juridiska deadlines, kritiska affärshändelser.

Incident-nivåer:
• P0 (Röd): Produktionen nere — omedelbar åtgärd
• P1 (Orange): Kritisk funktion påverkad — åtgärd inom 1h  
• P2 (Gul): Degraderad funktion — åtgärd inom 24h
• P3 (Blå): Planerat arbete — nästa sprint

**Bernt-integration:**
Bernt kan skapa incidents automatiskt när den detekterar problem. Ex: "ECS service unhealthy → P1 incident skapad automatiskt."`,
      },
      {
        title: 'Inställningar & Systemstatus',
        duration: 5,
        content: `Settings-modulen ger admin-kontroll över Wavult OS konfiguration.

**Användare & Roller:**
Lägg till teammedlemmar, tilldela roller, sätt entity-access per person.

**Integrationer:**
• Cloudflare API (DNS, Pages deploy)
• AWS (ECS, S3, CloudFront — read-only)
• Supabase (real-time data)
• n8n (automation-triggers)
• GitHub (webhook för commits/deploys)

**Bernt-konfiguration:**
• Ändra Bernt-persona och instruktioner
• Konfigurera vilka kanaler Bernt svarar på
• Sätt Bernt-access till specifika moduler

**System Status:**
Realtidsstatus för all infrastruktur:
• ECS Services (wavult-os-api, quixzoom-api, n8n, team-pulse)
• Supabase (EU West — quixzoom-v2 + wavult-os)
• CloudFront distributions
• Cloudflare Pages (wavult-os, landvex-eu, optical-insight-eu)
• S3 Buckets (4 buckets, EU + US)

Allt grönt = allt bra. Rött = Bernt notifierar automatiskt.`,
      },
    ],
  },
  {
    id: 'quixzoom',
    title: 'QuiXzoom — Plattformsguide',
    description: 'Crowdsourcad kamerainfrastruktur: affärsmodell, tech stack, uppdragsflöde och Zoomer-nätverket.',
    icon: '📸',
    color: '#F59E0B',
    lessons: [
      {
        title: 'Vision: Last Mile Intelligence Capture',
        duration: 6,
        content: `QuiXzoom är byggt kring en enkel insikt: världen är full av platser som aldrig fotograferas systematiskt.

**Problemet:**
Privata bryggor, industriområden, landsvägar, parkeringsplatser, parker — dessa platser förändras konstant men ingen ser det. Kommuner vet inte när en brygga gått sönder. Fastighetsbolag vet inte när ett tak börjar läcka. Infrastrukturägare blundar och hoppas.

**Lösningen:**
QuiXzoom bygger ett nätverk av zoomers — vanliga människor med smartphones — som tar geo-taggade uppdrag och levererar bilddata mot betalning. Resultatet: ett levande, uppdaterat bildlager av hela världen.

**"Last Mile Intelligence Capture"**
Satellit täcker allt — men på 500 meters höjd. Drönare täcker mycket — men kräver tillstånd och är dyra. Traditionell kamera täcker lite — och kräver anställda.

Zoomers täcker last mile: gatunivå, inomhus, bryggor, gränder, taketer. Allt det satelliter och drönare inte når.

**Varför nu?**
• 6,8 miljarder smartphones globalt
• Gig-economy-vanan hos 18–35-åringar
• AI kan nu analysera bilder automatiskt på sekunder
• 5G gör realtidsuppladdning möjlig överallt

QuiXzoom är infrastruktur. Det spelar ingen roll om zoomers vet varför deras data är värdefull — de tar uppdrag, levererar, får betalt. Vi gör resten.`,
      },
      {
        title: 'Affärsmodell & Intäktsflöden',
        duration: 7,
        content: `QuiXzoom har tre intäktsströmmar som aktiveras i sekvens.

**Ström 1: Uppdragsmarginalen (live från dag 1)**
Klienter betalar för uppdrag. Zoomers utför. QuiXzoom tar 25%.

Exempelkalkyl:
• Klient betalar 100 SEK/uppdrag
• Zoomer får 75 SEK
• QuiXzoom behåller 25 SEK brutto
• Kostnader (infra, validering, support): ~5 SEK
• Netto: ~20 SEK per uppdrag

Vid 10 000 uppdrag/månad → 200 000 SEK/mån i bruttovinst.
Vid 100 000 uppdrag/månad → 2 000 000 SEK/mån.

**Ström 2: Quixom Ads (aktiveras fas 2)**
Datan paketeras och säljs B2B. Exempelpriser:
• "Alla bryggägare på Värmdö" — leadpaket: 25 000 SEK
• Hyperlokal annons i appen: 50 SEK CPM
• Månatlig databasering (franchise): 5 000–50 000 SEK/mån

**Ström 3: Landvex Enterprise (aktiveras fas 3)**
Databasen licensieras till kommuner via Landvex-plattformen.
• Basabonnemang: 4 900 SEK/mån
• Standard: 14 900 SEK/mån
• Enterprise: 49 000+ SEK/mån

**Unit Economics (mål år 1–2):**
• CAC (cost to acquire one zoomer): < 300 SEK
• LTV (lifetime value per zoomer): 5 000 SEK (83 uppdrag × 60 SEK netto)
• LTV/CAC ratio: > 16x — mycket hälsosamt`,
      },
      {
        title: 'Zoomer-roller: Standard, Pro, Elite',
        duration: 5,
        content: `QuiXzoom-nätverket har tre nivåer av zoomers. Alla börjar som Standard och uppgraderar baserat på merit.

**Standard Zoomer**
Krav: Grundkurs klar, 5 godkända testuppdrag, ID-verifierad, avtal signerat.
Tillgång: Standarduppdrag i sin region.
Betalning: Basersättning per uppdrag.
Exempel: 25–150 SEK beroende på uppdragstyp.

**Pro Zoomer**
Krav: 50+ slutförda uppdrag, genomsnittligt betyg ≥ 4.5/5.0.
Tillgång: Alla standarduppdrag + prioritetskö + specialuppdrag (videouppdrag, nattuppdrag).
Betalning: Basersättning × 1.20 (20% bonus).
Förmåner: Dedicated support, tidig access till nya uppdragstyper.

**Elite Zoomer**
Krav: 200+ uppdrag, betyg ≥ 4.8/5.0, specialistutbildning (drönare, termalkamera, etc.)
Tillgång: Alla uppdrag + exklusiva enterprise-uppdrag (direkta Landvex-kontrakt).
Betalning: Basersättning × 1.50 + kvartalsbonus.
Förmåner: Officiell QuiXzoom Ambassador, co-marketing möjligheter.

**Varför nivåer?**
Det skapar motivation att stanna kvar och bli bättre. En Elite Zoomer är en investering — de har bevisat sin kvalitet och vi vill behålla dem. Churn-risken minskar dramatiskt efter 50+ uppdrag.

**VIKTIGT — NOMENKLATUR:**
Kalla dem ALDRIG fotografer, fältpersonal, operatörer eller field agents.
De är ZOOMERS. Det är en identitet, inte en jobbeskrivning.`,
      },
      {
        title: 'Uppdragsflöde: Skapande → Leverans',
        duration: 6,
        content: `Varje uppdrag i QuiXzoom följer en strikt livscykel med 7 statusar.

**Status 1: Draft**
Klienten (eller Wavult internt) skapar uppdrag i systemet.
Innehåll: Plats (GPS-koordinater), uppdragstyp, instruktioner, bilder önskas, ersättning, deadline.
Verktyg: Web-app för klienter, API för enterprise-kunder.

**Status 2: Published**
Uppdraget är verifierat och publiceras i kartan för zoomers i närheten (standardradie: 5 km).
Zoomers ser: Uppdragsbeskrivning, ersättning, deadline, avstånd, tid att ta sig dit.

**Status 3: Assigned**
Zoomer accepterar uppdraget. Det låses i 2 timmar (ej synligt för andra).
Om zoomer inte levererar inom 2h → uppdraget goes back to Published.

**Status 4: Submitted**
Zoomer laddar upp bilder/video via appen.
Systemet validerar automatiskt: GPS-metadata, tidsstämpel, bildkvalitet (suddig/rätt vinkel), filstorlek.
Om validering misslyckas → omedelbar feedback till zoomer.

**Status 5: Under Validation**
AI-analys av bildinnehåll (30 sek–2 min).
Kontrollerar: Korrekt objekt fotograferat? Avvikelser detekterade? Tillräcklig bildkvalitet?

**Status 6: Completed**
Uppdraget godkänt. Billing-service initierar utbetalning.
Zoomer ser "Approved" + belopp i sin plånbok (utbetalning inom 24h).
Data tillgänglig för klientens rapport.

**Status 7: Paid**
Utbetalning genomförd. Uppdrag arkiverat i databasen.

**Om uppdraget underkänns:**
Zoomer får bildspecifik feedback. Kan göra om uppdraget om deadline tillåter.
Upprepade fel → review-process → möjlig suspension.`,
      },
      {
        title: 'Tech Stack: React Native + AWS',
        duration: 7,
        content: `QuiXzoom är byggt för skalbarhet — arkitekturen ska hantera 1 000 zoomers lika smidigt som 1 000 000.

**Mobilapp (React Native + Expo)**
Cross-platform: En kodbas, iOS och Android.
Expo SDK: Snabb iteration, OTA-updates utan App Store-granskning.
Vision Camera: Nativt kameraframework med real-time processing.
Mapbox SDK: Offline-kartfunktionalitet, gesture-API, custom styling.
Expo Push Notifications: Push-notiser på båda plattformarna.

**Backend (Node.js + TypeScript, AWS ECS)**
5 microservices på ECS Fargate (eu-north-1):
• mission-service: Uppdragslogik, geo-sökning (PostGIS)
• auth-service: JWT, Supabase Auth wrapper
• media-service: Bilduppladdning, S3, CloudFront
• notification-service: Push, SMS, e-post
• billing-service: Stripe Connect, payout-logik

**Databas (Supabase PostgreSQL)**
Projekt: quixzoom-v2 (eu-west-1)
Row Level Security: Varje zoomer ser bara sina egna uppdrag
Real-time subscriptions: Kartan uppdateras live när nya uppdrag publiceras
PostGIS-extension: Geografiska frågor (vilka uppdrag är nära mig?)

**Infrastruktur:**
• ALB: Routar trafik till rätt microservice baserat på host/path
• CloudFront: CDN för bilder (app.quixzoom.com)
• S3: Bildlagring (wavult-images-eu-primary, eu-north-1)
• GitHub Actions → ECR → ECS: CI/CD-pipeline (~3–5 min deploy)`,
      },
      {
        title: 'Marknadsstrategi & Expansion',
        duration: 5,
        content: `QuiXzoom rullas ut marknad för marknad, med Sverige som testbädd.

**Sverige (mitten juni 2026)**
Startpunkt: Stockholms skärgård. 30 000+ öar, bryggor, pirar.
Rekryteringsstrategi: Instagram/TikTok-kampanj, influencer-samarbeten.
Mål: 100 aktiva zoomers inom 60 dagar.

**Varför skärgården?**
Visuellt imponerande för demos. Kommunerna (Värmdö, Nacka) är framtida Landvex-kunder. Perfekt för sommar-PR.

**Expansion — Nordics (Q3–Q4 2026)**
Finland (Helsinki), Norge (Oslo), Danmark (Köpenhamn).
Liknande demografisk profil, gig-economy-van befolkning.
QuiXzoom UAB (Litauen) hanterar EU-verksamheten, GDPR-compliant.

**Expansion — Global (2027+)**
USA: QuiXzoom Inc (Delaware). Fokus: New York, Miami, LA.
Asien: Singapore, Bangkok — stark gig-economy, hög smartphonedensitet.
Mellanöstern: Dubai (naturlig koppling till Wavult Groups Dubai-struktur).

**Konkurrenslandskap:**
Ingen direkt konkurrent kombinerar crowdsourcing + geo-taggning + AI-analys + B2G-försäljning.
Närmaste: Mapillary (Facebook, statisk), StreetView (Google, inte realtid), Mechanical Turk (Amazon, ej geo-fokus).

**QuiXzoom-fördelar:**
• Snabbare uppdatering (dagar vs månader)
• Lägre kostnad (zoomers vs anställda)
• Händelsebaserat (uppdrag skapas vid behov)
• Integrerat med Landvex (värdekedjan är inbyggd)`,
      },
      {
        title: 'Optical Insight: B2B-armen',
        duration: 6,
        content: `Optical Insight är det tekniska systemet som köper tillgång till QuiXzoom-data och säljer analyserade insights.

**OBS — Varumärkes-regel:**
• Optical Insight = det TEKNISKA systemet/motorn
• Landvex = FÖRSÄLJNINGSPLATTFORMEN mot kommuner och myndigheter
• QuiXzoom = DATA-INSAMLINGSPLATTFORMEN (supply-sidan)

Dessa tre är separata produkter med separata varumärken. Nämn ALDRIG Landvex i QuiXzoom-kontext mot zoomers eller B2C.

**Optical Insight-motorn:**
Tar QuiXzoom-bilder → Validerar kvalitet → Analyserar innehåll → Detekterar avvikelser → Genererar rapporter och larm.

Tekniken: Computer vision, objekt-detektering, anomali-identifiering, historisk jämförelse.

**Tre Deployment-Tiers:**
• OI Cloud EU: optical-insight-eu.pages.dev (kommuner, fastighetsbolag)
• OI Cloud US: optical-insight-us.pages.dev (US municipalities)
• OI Enterprise: On-premise (Trafikverket, Försvarsmakten)

**Från data till pengar (kedjan):**
1. Zoomer zoomar brygga (QuiXzoom)
2. Optical Insight analyserar bilden
3. Avvikelse detekterad (spricka i räcket)
4. Landvex skickar larm till kommunen
5. Kommunen betalar sin månadsavgift till Landvex
6. Landvex betalar QuiXzoom för uppdraget
7. QuiXzoom betalar zoomer

Hela kedjan är integrerad. Det är styrkan.`,
      },
    ],
  },
  {
    id: 'landvex',
    title: 'Landvex — Produktkurs',
    description: 'AI-driven infrastrukturinspektion: målgrupper, EU-marknad, tech och sälj.',
    icon: '🏗️',
    color: '#10B981',
    lessons: [
      {
        title: 'Vad löser Landvex?',
        duration: 5,
        content: `Landvex löser ett specifikt problem: infrastrukturägare vet inte vad som händer med deras objekt.

**Problemet i siffror:**
• Manuell inspektion av en brygga: 500–2 000 SEK/tillfälle
• Inspektionsfrekvens: 1–4 ggr/år
• Skador som missas: 1–3 per 100 objekt/år
• Kostnad för missad skada: 50 000–500 000 SEK (reparation + ansvar)

En medelstor svensk kommun med 300 infrastrukturobjekt spenderar ~600 000 SEK/år på inspektioner och missar ändå kritiska skador.

**Landvex-kärnvärdet (LÅST av Erik Svensson):**
"Right control. Right cost. Right interval."

Det handlar INTE om att övervaka allt hela tiden. Det handlar om att optimera kontrollekonomi. Vilka objekt behöver inspekteras när? Vad är kostnaden för en inspektion vs kostnaden för att missa en skada?

Landvex gör den kalkylen möjlig — automatiskt, kontinuerligt, för tusentals objekt.

**Vad Landvex INTE är:**
• Inte en kameraövervakningslösning
• Inte en IoT-sensor-plattform  
• Inte "AI-bevakning" (Erik har förbjudit detta ord)
• Inte en GIS-plattform (statisk kartdata)

**Vad Landvex ÄR:**
• En händelsebaserad alarmeringstjänst
• En inspektionsrapport-generator
• En kontrollekonomi-optimerare
• En partner till infrastrukturägare`,
      },
      {
        title: 'Målkunder: Kommuner, Trafikverket',
        duration: 5,
        content: `Landvex riktar sig mot offentlig sektor och privata infrastrukturägare med tydliga inspektionsansvar.

**Primär Målkund: Svenska Kommuner**
Sverige har 290 kommuner. Alla ansvarar för kommunal infrastruktur: bryggor, vägar, parker, badplatser, lekplatser, tunnlar.

Typisk budget för infrastrukturinspektion: 500 000–5 000 000 SEK/år beroende på kommunens storlek.

Beslutsprocesen: Teknisk chef → Ekonomichef → Stadsdelsnämnd/KS. Långsam (6–12 månader) men stabil. Avtal brukar vara 3-åriga.

**Sekundär Målkund: Trafikverket**
Ansvarar för 98 000 km vägar, 4 000 broar, hundratals tunnlar.
Enormt inspektionsbehov — och enorma budgetar.
Landvex Enterprise (on-premise) är relevant här.
Processen är längre (LOU-upphandling, 1–2 år) men kontraktsstorlekarna är massiva.

**Tertiär Målkund: Kommunala Fastighetsbolag**
MKB (Malmö), Stångåstaden (Linköping), Familjebostäder (Stockholm).
Ansvarar för tusentals bostäder + tillhörande infrastruktur.
Kortare säljcykel än kommuner (privat bolag, snabbare beslut).

**Hamnar:**
Ports of Stockholm, Göteborgs Hamn, Helsingborgs Hamn.
Kritisk infrastruktur. Lagkrav på regelbunden inspektion.
Hög betalningsvilja — konsekvensen av en miss är enorm.

**Inte Landvex-kunder (ännu):**
Privatpersoner, fastighetsägare utan inspektionsansvar, utländska kunder (fas 3+).`,
      },
      {
        title: 'EU-strategi: Litauen UAB som bas',
        duration: 5,
        content: `Landvex ABs EU-struktur är designad för att möjliggöra snabb expansion till fler EU-länder.

**Varför Litauen (QuiXzoom UAB)?**
• 15% bolagsskatt (lägst i EU med substans)
• EU-hemvist för GDPR-compliance
• SEPA-betalningar utan extra avgifter
• Enkel bolagsbildning (2–5 dagar via agent)
• EU-upphandlingsdeltagande utan hinder

**Varför Sverige (Landvex AB)?**
• Svenska kommuner premierar svenska leverantörer
• LOU-upphandling — inhemsk aktör ger förtroende
• Personliga relationer — Dennis och Leon pratar med svenska beslutfattare på deras språk
• Befintlig entitet (Sommarliden AB → Landvex AB, org.nr 559141-7042)

**Expansion-plan EU:**
Fas 1: Sverige (juni 2026) — via Landvex AB
Fas 2: Nederländerna (Q1 2027) — via QuiXzoom UAB som EU-hub
Fas 3: Danmark, Finland, Norge — Nordic cluster
Fas 4: Tyskland, Frankrike, Belgien — via ny UAB eller filial

**OI Cloud EU:**
optical-insight-eu.pages.dev hanterar ALLA EU-kunder.
All data stannar i EU (eu-north-1, eu-west-1).
GDPR-compliance är inbyggd — inte ett efterkrav.
DPA (Data Processing Agreement) medföljer standardavtalet.`,
      },
      {
        title: 'Lansering Sverige juni 2026',
        duration: 5,
        content: `Landvex Sverige-lansering sker parallellt med QuiXzoom. Databasen byggs av QuiXzoom, Landvex säljer tillgång till den.

**Timing:**
QuiXzoom startar i juni → samlar data i skärgården → Landvex kan demo med verklig lokal data → kommunen köper abonnemang.

Det är ett hönan-och-ägget-problem löst: vi skapar datan själva (Wavult lägger ut uppdrag) tills vi har tillräckligt för en trovärdig demo.

**Pilot-strategi:**
2–3 kommuner erbjuds 90 dagars gratis pilot (20–50 objekt).
Krav: Deltagande i case study + 30 min intervju efter piloten.
Mål: Case study publiceras och används i nästa säljmöte.

**Target-kommuner (skärgård):**
• Värmdö — 40 000 invånare, högtäthet av bryggor och kommunal infrastruktur
• Nacka — 105 000 invånare, Erstavik naturreservat, kommunal hamn
• Vaxholm — 12 000 invånare, fästning, historisk infrastruktur
• Norrtälje — 62 000 invånare, norrhavsöarna, stor ytaansvar

**Säljprocessen:**
1. Cold e-post till teknisk chef (personaliserat, kortfattat)
2. Telefonsamtal inom 3 dagar
3. 30 min demo (online eller fysiskt)
4. Gratis pilot-erbjudande
5. 90 dagars pilot
6. Kommersiellt avtal

Mål: 3 demos bokade vid Thailand Workcamp (april).
Mål: 2 piloter startade juni.
Mål: 1 betalande kund september.`,
      },
      {
        title: 'Tech: AI-analys & Alertssystem',
        duration: 6,
        content: `Landvex tekniska kärna är Optical Insight — analysmotorn som förvandlar bilder till åtgärdbara larm.

**Bildanalys-pipeline:**
1. Bild inkommer från QuiXzoom (via S3, pre-signed URL)
2. Förvalidering: Storlek, format, GPS-metadata
3. Objektigenkänning: Vad är på bilden? (brygga, brunn, vägskylt, lekplats)
4. Tillståndsanalys: Korrekt tillstånd vs avvikelse?
5. Historisk jämförelse: Värre/bättre/oförändrat sedan förra gången?
6. Larmbeslut: Generera larm? Vilken prioritet?
7. Rapportgenerering: PDF med bild, GPS, analys, rekommendation

**Larmtyper:**
• Kritiskt (röd): Omedelbar säkerhetsrisk — räcke avbrutet, bro skadad
• Allvarligt (orange): Åtgärd inom 7 dagar — sprickor, rost, erosion
• Påminnelse (gul): Schemalagd underhållspåminnelse
• Info (blå): Förändring detekterad, ej säkerhetsrisk

**Alert-leverans:**
• E-post (alla abonnemang)
• SMS (Standard+)
• Webhook → CMMS/ServiceNow/Maximo (Enterprise)
• In-app notifiering i Landvex-portalen

**Inspektionsfrekvens (konfigurerbar per objekt):**
• Daglig (kritiska objekt — bro, tunnel)
• Veckovis (bryggor, hamnar)
• Månadsvis (parker, lekplatser)
• Händelsebaserad (trigger vid specifika väderförhållanden)`,
      },
      {
        title: 'Prismodell & Upphandling (LOU/LUF)',
        duration: 6,
        content: `Landvex prismodell är designad för att passa offentlig sektors upphandlingsprocesser.

**Produktkataloger:**

Bas: 4 900 SEK/mån
• 50 objekt
• Månadsinspektion
• E-post-larm
• Rapportgenerering (PDF)

Standard: 14 900 SEK/mån
• 500 objekt
• Valfri inspektionsfrekvens per objekt
• SMS + e-post + webhook
• REST API-access
• Dashboard med historik

Enterprise: Offertbaserat (från 49 000 SEK/mån)
• Obegränsat antal objekt
• On-premise möjlig
• SSO (Azure AD, Okta)
• SLA 99,9%
• Dedicated customer success

**Upphandling enligt LOU:**

Direkt upphandling (< 700 000 SEK/år): Kan köpas direkt utan anbudsprocess.
Bas och Standard-abonnemang faller under denna gräns — viktigt säljargument!

Förenklad upphandling (700 000–6 MSEK): Anbudsförfarande, 10 dagar.
Öppen upphandling (> 6 MSEK): EU-direktiv, längre process.

**Tips för kommunsälj:**
Strukturera initialt avtal som 12-månaders bas-abonnemang (< 700 000 SEK) → direktupphandling möjlig → snabbare avslut.
Utöka till Standard/Enterprise i förnyelse (år 2+).

**Ramavtal (2027-ambition):**
SKR Kommentus har ramavtal för digitala tjänster. Att finnas på ett ramavtal ger 290 kommuner enkel access utan individuell upphandling.`,
      },
      {
        title: 'Nästa marknad: Nederländerna Q1 2027',
        duration: 5,
        content: `Nederländerna är Landvex andra marknad och en naturlig expansion från Sverige.

**Varför Nederländerna?**
• 342 kommuner med enormt infrastrukturansvar (dikes, kanaler, broar — vatten är existentiellt)
• GovTech-mogen marknad — tidiga adoptörer av digital förvaltning
• Hög betalningsvilja för infrastrukturövervakning (tullar/dikes misslyckanden är nationella katastrofer)
• EU-hemvist (QuiXzoom UAB täcker GDPR)
• Engelska som affärsspråk — inga språkbarriärer

**Marknadsstorleken:**
Nederländerna: 17,9 miljoner invånare, 342 kommuner.
Genomsnittlig infrastrukturbudget: 2–10 MSEK/år.
Total adresserbar marknad: ~500 MSEK/år.

**Timing:**
Q4 2026: Första kontakter, demo-förberedelse
Q1 2027: Officiell lansering, 2–3 pilot-kommuner
Q2 2027: 5+ betalande kunder i Nederländerna

**Lokal anpassning:**
• Holländsk UI-translation (QuiXzoom UAB som kontrakt-part)
• GDPR DPA på holländska
• Lokal registered agent för bolagsrepresentation
• Fokus: vattennära infrastruktur (bryggor, slussar, dikes) — perfekt match med QuiXzoom-kompetens

**Konkurrens i NL:**
Ingen identifierad direkt konkurrent i samma nisch.
Närmaste: traditionella inspektionsföretag, drone-survey-bolag (dyra, sällan, ej kontinuerliga).`,
      },
    ],
  },
  {
    id: 'dubai',
    title: 'Dubai-strukturen',
    description: 'Wavult Groups juridiska och skattemässiga struktur: Dubai Free Zone, IP-ägande, pengaflöden.',
    icon: '🏙️',
    color: '#8B5CF6',
    lessons: [
      {
        title: 'Varför Dubai? Skatt, IP, kontroll',
        duration: 5,
        content: `Dubai är Wavult Groups juridiska hem. Det är inte ett skatteparadis i negativ mening — det är ett smart val av en jurisdiktion som erbjuder rätt kombinationen av fördelar.

**Skattefördelar:**
• 0% bolagsskatt på kvalificerade IP-inkomster (UAE Corporate Income Tax, 2023)
• 9% standard CIT, men undantag för Small Business Relief (omsättning < AED 3M) och qualifying income
• 0% källskatt på utdelningar — ingen skatt när pengar lämnar UAE
• 0% kapitalvinstskatt
• 0% personlig inkomstskatt

**IP-skydd:**
UAE har ett starkt immateriellt rättssystem. DMCC och DIFC är internationellt erkända jurisdiktioner.
IP registrerat i UAE skyddas av internationella avtal (TRIPS, Paris Convention).
Wavult Groups IP (kod, varumärken, domäner) ägs av Wavult Group FZCO — tryggt.

**Kontrollstruktur:**
Erik Svensson äger Wavult Group FZCO → äger allt annat.
Oavsett var de operationella bolagen finns — Delaware, Litauen, Sverige — kontrolleras de av Dubai-holdingen.
Om ett driftsbolag krånglar (ex. förlust, tvist) kan det avvecklas utan att affektera IP eller holdingbolaget.

**100% utländskt ägande:**
Free Zone-strukturen tillåter 100% utländskt ägande. Inget krav på lokal partner.
Detta var historiskt det stora hindret för UAE — det är löst i Free Zones.`,
      },
      {
        title: 'Free Zone LLC: IFZA vs DIFC vs ADGM',
        duration: 6,
        content: `Det finns ~40 Free Zones i UAE. För Wavult Group är tre relevanta.

**IFZA — International Free Zone Authority**
Kostnad: ~15 000–25 000 AED/år (beroende på aktiviteter)
Fördelar: Billig, snabb setup (5–7 dagar), flexibel. Bra för operationsbolag.
Nackdelar: Mindre prestige, begränsade finansiella licenser.
Passar: Wavult DevOps FZCO (operationellt bolag)

**DMCC — Dubai Multi Commodities Centre**
Kostnad: ~25 000–40 000 AED/år
Fördelar: Mest prestigefull Free Zone. Över 22 000 bolag. Stark community. Bra bankförbindelser.
Nackdelar: Dyrare, lite mer byråkrati.
Passar: Wavult Group FZCO (holding/IP) — prestige ökar trovärdighet mot investerare och banker.

**DIFC — Dubai International Financial Centre**
Kostnad: 50 000–100 000 AED/år
Fördelar: Engelsk common law. Bästa för finansiella verksamheter, fondförvaltning, banking.
Nackdelar: Dyrast. Overkill för operativt holdingbolag.
Passar: Om Wavult Group går in i finansiell verksamhet (payment processor, fond).

**Rekommendation:**
• Wavult Group FZCO → DMCC (prestige, IP-holding)
• Wavult DevOps FZCO → IFZA (operationell, kostadseffektiv)

**Nästa steg:** Kontakta DMCC (dmcc.ae/apply). Business plan finns klar.`,
      },
      {
        title: 'Wavult Group: IP & Control Layer',
        duration: 5,
        content: `Wavult Group FZCO är det ultimata holdingbolaget — det äger allt immateriellt värde i koncernen.

**Vad Wavult Group äger:**
• Alla varumärken: Wavult, QuiXzoom, Landvex, Bernt, Wavult OS, Wavult Mobile
• All källkod (de registrerade IP-rättigheterna)
• Alla domäner: wavult.com, quixzoom.com, landvex.com och derivat
• Patent (framtida)
• Affärshemligheter och know-how

**Varför IP i Dubai?**
IP-inkomster (royalties) betraktas som "qualifying income" under UAE CIT — potentiellt 0% skatt.
UAE är med i internationella IP-skyddsavtal. Din kod är lika skyddad här som i Sverige.
Kapital kan röra sig fritt ut ur UAE — inga valutakontroller.

**IP-licensstrukturen:**
Wavult Group äger IP → licensierar till Wavult DevOps (som bygger och förvaltar) → DevOps sublicensierar till driftsbolagen.

Eller: Wavult Group licensierar direkt till driftsbolagen (enklare struktur).

Valet avgörs av transfer pricing-analys.

**Substans-krav:**
För att IP-inkomster ska vara skattefria krävs att Wavult Group FZCO har faktisk substans i Dubai:
• Kontor (kan vara co-working via DMCC)
• Ledning som faktiskt befinner sig i UAE delar av året
• Styrelsmöten som hålls i UAE
• Anställda eller contracted services

Erik behöver inte bo i Dubai — men styrelsemöten och nyckelverksamhet måste kunna dokumenteras som UAE-baserade.`,
      },
      {
        title: 'Pengaflöde: Royalties & Service Fees',
        duration: 6,
        content: `Pengarna flödar uppåt i strukturen via legala, dokumenterade transaktioner.

**Tre typer av intercompany-flöden:**

1. IP-licensavgift (Royalty)
Driftsbolag betalar X% av omsättning till Wavult Group FZCO för rätten att använda IP.
Arm's length-nivå: 5–15% beroende på marknad och typ av IP.
Dokumentation: Intercompany License Agreement krävs.

2. Management Service Fee
Driftsbolag betalar till Wavult DevOps FZCO för management-tjänster (tech, HR, strategi).
Arm's length-nivå: Kostnad + 10–15% marknadsmässig markup.
Dokumentation: Management Service Agreement (MSA) krävs.

3. Dividend
När Dubai-bolagen har ackumulerat kapital → utdelning till aktieägare (Erik).
UAE: 0% källskatt på utdelning.
Sverige: Om Erik är obegränsat skattskyldig i Sverige kan utdelning beskattas i Sverige (CFC-regler). Konsultera skatterådgivare.

**Praktisk kalkyl (Landvex AB, 1 MSEK intäkt):**
IP-licens (10%): 100 000 SEK → Dubai (0% skatt)
Management fee (15%): 150 000 SEK → Dubai (0% skatt)
Kvar i Sverige: 750 000 SEK
Drift & kostnader: 600 000 SEK
Lokal vinst: 150 000 SEK × 20,6% = 30 900 SEK skatt
Effektiv skattesats: 3,09% på total intäkt

**OBS:** Alla intercompany-transaktioner måste vara arm's length och dokumenterade. Skattemyndigheter i Sverige, USA och Litauen granskar detta. Winston (CFO) ansvarar för compliance.`,
      },
      {
        title: 'Lokala bolag: UAB & Inc',
        duration: 5,
        content: `Under Wavult DevOps FZCO finns fyra driftsbolag som hanterar lokal verksamhet.

**QuiXzoom Inc (Delaware, USA)**
Bolagsform: C Corporation
Varför Delaware: Investerarvänlig, välkänd för VC, flexibel bolagsrätt.
Bank: Mercury Bank (startup-vänlig remote onboarding).
Skatt: USA federal CIT 21% + state tax. Med IP-licens-avdrag reduceras effektiv skatt.
Status: Stripe Atlas under granskning.

**QuiXzoom UAB (Vilnius, Litauen)**
Bolagsform: UAB (Uždaroji akcinė bendrovė)
Varför Litauen: 15% bolagsskatt, EU-hemvist, SEPA, GDPR.
Hantera: EU-zoomers, EU-kunder, EU-upphandlingar.
Status: Compliance-förfrågan till 6 byråer.

**Landvex AB (Stockholm, Sverige)**
Bolagsform: Aktiebolag
Org.nr: 559141-7042 (tidigare Sommarliden Holding AB)
Varför Sverige: Sälja till svenska kommuner, trovärdighet.
Skatt: 20,6% CIT.
Status: Namnbyte inlämnat Bolagsverket.

**Landvex Inc (Houston, Texas)**
Bolagsform: Texas LLC
Varför Texas: Enkel LLC-form, ingen statlig inkomstskatt.
Adress: Registered agent i Austin (Northwest Registered Agent).
Status: SOSDirect Form 201 halvklar — $325 att betala.

**Intercompany-compliance:**
Alla fyra driftsbolag måste:
✓ Ha skriftliga IP-licensavtal med Wavult Group FZCO
✓ Ha MSA med Wavult DevOps FZCO
✓ Betala intercompany-fakturor i tid
✓ Dokumentera arm's length-prissättning`,
      },
      {
        title: 'Juridisk separation: Praktiken',
        duration: 5,
        content: `Juridisk separation är inte bara papper — det måste vara verklig separation i praktiken.

**Vad som MÅSTE vara separerat:**

Bankkonton: Varje entitet har sitt eget bankkonto. Inga blandningar.
Bokföring: Separat bokföring per entitet. Ingen "vi betalar härifrån nu och bokför sen."
Avtal: Varje avtal ingås av rätt entitet. Landvex AB skriver kundavtal, inte Erik personligen.
E-post: Viktiga affärskommunikationer från rätt domän (erik@wavult.com, ej personlig Gmail).
Styrelsmöten: Dokumenterade protokoll för varje entitet.

**Risk om separation inte upprätthålls:**

Piercing the corporate veil: En domstol kan hålla aktieägare personligt ansvarigt om bolagets juridiska identitet inte respekterats.
Skattemässig genomsyn: Skattemyndigheter (Skatteverket, IRS) kan underkänna intercompany-transaktioner om de inte är genuina.
Transfer pricing-underkännande: Om management fees inte är marknadsmässiga → hela skatteoptimeringen faller.

**Praktiska steg:**

Dennis och Winston ansvarar för att dessa är på plats:
☐ Separata bankkonton för varje entitet (pågår)
☐ IP-licensavtal (utkast finns i docs/legal/)
☐ Management Service Agreement (utkast finns)
☐ Shareholders Agreement
☐ Intercompany-fakturering rutin (månadsvis)
☐ Styrelseprotokoll per kvartal per entitet

**Signaturrätt:**
Alla bolagsavtal kräver L3-signatur: Erik Svensson + Dennis Bjarnemark.
DocuSign används för digitala signaturer på internationella avtal.`,
      },
      {
        title: 'Juridisk separation: Praktiken (del 2)',
        duration: 4,
        content: `Sammanfattning av vad som är klart och vad som återstår.

**Status per 2026-03-27:**

Wavult Group FZCO: 🔴 Ej bildat. Business plan klar. Nästa steg: dmcc.ae/apply.
Wavult DevOps FZCO: 🔴 Ej bildat. Bildas parallellt med Group.
QuiXzoom Inc: 🟡 Under bildning via Stripe Atlas. 83(b) kritisk deadline.
QuiXzoom UAB: 🟡 6 byråer kontaktade. Väntar på svar.
Landvex AB: 🟡 Namnbyte inlämnat. Väntar 1–2 veckor.
Landvex Inc: 🔴 SOSDirect halvklar. $325 att betala ASAP.

**Thailand Workcamp (11 april) — Juridiska mål:**
• Dennis presenterar status på alla 6 entiteter
• Beslut om UAE Free Zone (DMCC vs IFZA)
• IP-licensavtal signerade (om bolagen är klara)
• Texas LLC slutförd av Dennis

**Långsiktig mål — end state:**
Erik Svensson äger Wavult Group FZCO.
Wavult Group FZCO äger Wavult DevOps FZCO.
Wavult DevOps FZCO äger QuiXzoom Inc, QuiXzoom UAB, Landvex AB, Landvex Inc.
Alla intercompany-flöden är dokumenterade och arm's length.
Koncernen är OECD-compliant och redo för externa investerare.`,
      },
    ],
  },
  {
    id: 'arkitektur',
    title: 'Systemarkitektur',
    description: 'Teknisk djupdykning: AWS ECS, microservices, frontend-stack och deployment-pipeline.',
    icon: '⚙️',
    color: '#6366F1',
    lessons: [
      {
        title: 'Arkitekturprinciper & Four-Layer Framework',
        duration: 5,
        content: `Wavult Groups tech-arkitektur är byggd kring fyra principer och ett four-layer framework.

**Fyra Principer:**

1. Serverless-first
Vi kör inga EC2-instanser. ECS Fargate hanterar alla containers utan att vi behöver underhålla servrar. Auto-scaling är inbyggt.

2. Edge-first
Frontends körs på Cloudflare Pages — det globala edge-nätverket. Ingen latens var du än befinner dig i världen. Gratis för statiska sajter.

3. EU-first
eu-north-1 (Stockholm) som primär AWS-region. GDPR-compliance är inbyggd, inte en efterkonstruktion. EU-data replikeras ALDRIG till USA.

4. GitOps
All förändring börjar i Git. Ingen manuell config av produktionsmiljön. GitHub Actions hanterar hela deploy-processen.

**Four-Layer Framework:**

Layer 1 — Edge (Cloudflare Pages)
Statiska frontends globalt distribuerade. Wavult OS, Landvex-sajt, QuiXzoom-landing.

Layer 2 — API (AWS ECS Fargate)
Node.js microservices i containers. Skalbar, isolerad, deployment-oberoende.

Layer 3 — Data (Supabase + S3)
PostgreSQL-databaser med real-time subscriptions. S3 för filer och bilder.

Layer 4 — Intelligence (Bernt + n8n)
AI-agent och automation-hub. Kör analyser, skickar nyhetsbrev, hanterar workflows.`,
      },
      {
        title: 'AWS Setup: ECS Fargate, eu-north-1',
        duration: 7,
        content: `AWS Account: 155407238699, Region: eu-north-1 (Stockholm).

**ECS Cluster: hypbit**
(Ska byta namn till "wavult" i nästa infrastruktur-sprint)

Aktiva services:
• wavult-os-api (task def: hypbit-api:14) — Wavult OS backend API
• quixzoom-api (task def: quixzoom-api:6) — QuiXzoom platform API
• n8n (task def: n8n-task:latest) — Automation hub
• team-pulse (task def: team-pulse:latest) — Intern teamverktyg

**Application Load Balancer: hypbit-api-alb**
En ALB hanterar all inkommande trafik och routar till rätt target group:

Priority 10: /n8n* → n8n-tg (port 5678)
Priority 20: host api.quixzoom.com → quixzoom-api-tg
Priority 30: host api.hypbit.com → hypbit-api-tg
Default: hypbit-api-tg (port 3001)

**ACM Certifikat (ISSUED):**
• eu-north-1: api.quixzoom.com + app + root + wildcard
• eu-north-1: api/app/www/hypbit.com
• us-east-1: app/api/www/quixzoom.com (för CloudFront)

**CloudFront Distributions:**
E2QUO7HIHWWP18 → dewrtqzc20flx.cloudfront.net → app.quixzoom.com ✅
EE30B9WM5ZYM7 → d3nf5qp2za1hod.cloudfront.net → quixzoom.com, www
E2JOYHG1LYOXGM → d14gf6x22fx96q.cloudfront.net → hypbit.com, www

**S3 Buckets:**
wavult-images-eu-primary (eu-north-1) — EU primär
wavult-images-eu-backup (eu-west-1) — EU backup (CRR aktiv)
wavult-images-us-primary (us-east-1) — USA primär
wavult-images-us-backup (us-west-2) — USA backup (CRR aktiv)
IAM-roll: wavult-s3-replication hanterar cross-region replication`,
      },
      {
        title: 'Microservices: Mission, Auth, Media, Billing',
        duration: 6,
        content: `QuiXzoom-backend är indelad i 5 separata microservices, var och en med ett tydligt ansvar.

**mission-service**
Ansvar: Hela uppdragslogiken
• CRUD för missions
• Geo-sökning (PostGIS ST_DWithin) — "visa uppdrag inom 5 km"
• Assignment-logik — lås uppdrag, 2h timeout
• Status-maskin: draft → published → assigned → submitted → validated → completed → paid
• Geo-indexering: Automatisk spatial index för snabba sökningar

**auth-service**
Ansvar: Autentisering och auktorisering
• JWT-verifiering för alla inkommande requests (via middleware)
• Supabase Auth-integration (email, Google, Apple Sign-In)
• Rollhantering: zoomer / client / admin
• KYC-flaggning (ID-verifiering genomförd?)
• Session-hantering och refresh tokens

**media-service**
Ansvar: All media-hantering
• Tar emot multipart uploads från appen
• Validerar: GPS-metadata, timestamp, filformat, storlek (max 50MB)
• Komprimerar och formaterar (WebP för web, original för arkiv)
• Laddar upp till S3 (wavult-images-eu-primary)
• Genererar CloudFront-signerade URLs med expiry
• Thumbnail-generering för preview

**notification-service**
Ansvar: Alla notifieringar
• Expo Push Notifications (iOS + Android)
• E-post via AWS SES (transaktionell)
• SMS via Twilio (planerat för kritiska larm)
• In-app notiser via Supabase real-time channels
• Notification preferences per zoomer

**billing-service**
Ansvar: Betalningar åt båda håll
• Kunder → QuiXzoom: Stripe (kreditkort, faktura)
• QuiXzoom → Zoomers: Stripe Connect (utbetalningar)
• Wise Business (planerat för internationella zoomers)
• Automatisk beräkning av zoomer-ersättning vid uppdragsgodkännande
• Fakturahantering för enterprise-kunder`,
      },
      {
        title: 'Frontend: React + TypeScript + Vite',
        duration: 5,
        content: `Wavult OS frontend är en SPA (Single Page Application) byggd i modern React.

**Teknikstack:**
React 18: Server Components används inte — ren client-side rendering.
TypeScript strict: Alla props och state är strikt typade. Ingen any.
Vite: Byggsystem. Extremt snabb HMR (Hot Module Replacement) under dev.
Tailwind CSS: Utility-first styling. Konsekvent design-system.
Cloudflare Pages: Hosting. Deploy sker automatiskt vid push till main.

**Projektstruktur (apps/command-center/src/):**
features/ — Alla moduler (dashboard, finance, knowledge, etc.)
components/ — Delade UI-komponenter (Shell, Sidebar, Modal, Button)
contexts/ — React Context (RoleContext, EntityScopeContext)
hooks/ — Custom hooks (useDebounce, useLocalStorage)
lib/ — Utilities och helpers

**Design-system:**
Alla färger är CSS-variabler (--brand-accent, --surface-border).
Tailwind-klasser som bg-[#0D0F1A] används för att matcha mörkt tema.
Typografin: font-mono för system-data, sans för prosa.

**State-hantering:**
Lokal UI-state: React useState/useReducer
Global app-state: React Context (roller, entitet, tema)
Server state: Supabase JS-klient (real-time subscriptions)
Persistent state: localStorage (progress, preferences)

**Build och deploy:**
npx vite build → dist/
wrangler pages deploy dist --project-name=wavult-os
Deploy-tid: ~2–3 minuter totalt`,
      },
      {
        title: 'Cloudflare: Pages, DNS, Workers',
        duration: 5,
        content: `Cloudflare är Wavult Groups edge-lager — DNS, CDN och serverless functions.

**Cloudflare Pages (aktiva projekt):**
wavult-os → wavult-os.pages.dev (→ os.wavult.com när NS satt)
landvex-eu → landvex-eu.pages.dev (Landvex-sajten)
optical-insight-eu → optical-insight-eu.pages.dev (OI Portal EU)

Deploy via: wrangler pages deploy dist --project-name=[projekt]

**Cloudflare DNS Zones:**
wavult.com (Zone: 5bed27e91d719b3f9d82c234d191ad99) — PENDING (NS ej bytt på Loopia)
quixzoom.com (Zone: e9a9520b64cd67eca1d8d926ca9daa79) — ACTIVE ✅
hypbit.com (Zone: 128f872b669d059d1dfca3c9474098f1) — ACTIVE ✅

NS för wavult.com (ska sättas på Loopia):
arch.ns.cloudflare.com
gina.ns.cloudflare.com

**Cloudflare Workers (planerat):**
Email Workers: Hantera inkommande e-post → Supabase trigger
Rate Limiting: Skydda API-endpoints mot brute force
Edge Cache: Cache API-svar vid Cloudflare-edge för snabbare respons

**Auth:**
Global API Key: Används med X-Auth-Email + X-Auth-Key headers.
INTE Authorization: Bearer — det är för scoped tokens.
Scoped token (cfut_...): Begränsad access, ej för zone:create.`,
      },
      {
        title: 'CI/CD: GitHub Actions → ECR → ECS',
        duration: 5,
        content: `Wavult Groups deploy-pipeline är fullständigt automatiserad via GitHub Actions.

**Repo:** wolfoftyreso-debug/hypbit (ska byta till wavult-os)

**Workflow 1: deploy-api.yml**
Trigger: Push till main, path-filter apps/api/**
Steg:
1. Checkout kod
2. Configure AWS credentials (via GitHub Secrets)
3. Docker build (Dockerfile i apps/api/)
4. Tag och push till ECR (eu-north-1)
5. ECS force-new-deployment (service: wavult-os-api)
6. Vänta på healthcheck (/health endpoint)
Total tid: ~3–5 minuter

**Workflow 2: deploy-quixzoom.yml**
Trigger: Push till main, path-filter apps/quixzoom-api/**
Samma struktur, target: quixzoom-api ECS service.

**Workflow 3: deploy-pages.yml**
Trigger: Push till main, path-filter apps/command-center/**
Steg:
1. Checkout kod
2. npm ci (install dependencies)
3. npx vite build
4. wrangler pages deploy dist

**GitHub Secrets (konfigurerade):**
AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
SUPABASE_SERVICE_KEY (lades till 2026-03-27 — quixzoom-api kraschade utan den)

**Lokalt — Snabbkommandon:**
cd apps/command-center && npx vite build
wrangler pages deploy dist --project-name=wavult-os --commit-dirty=true`,
      },
      {
        title: 'Bernt: AI-agent-arkitektur',
        duration: 5,
        content: `Bernt är Wavult Groups AI-agent — byggd på OpenClaw och körs som en integrerad del av Wavult OS.

**Vad Bernt är:**
OpenClaw-instans konfigurerad med Wavult Groups kontext. Inte ett chatbot — en AI-operatör med tillgång till verktyg, filer och externa tjänster.

**Bernts verktyg:**
• read/write/edit — filsystemsaccess
• exec — shell-kommandon (bygg, deploya, konfigurera)
• web_search / web_fetch — internetsökning
• image_generate — bildgenerering

**Bernts access:**
• Wavult OS workspace (/home/erikwsl/.openclaw/workspace/)
• Projektfiler (/mnt/c/Users/erik/Desktop/hypbit/)
• Cloudflare API (DNS, Pages)
• AWS (via CLI)
• GitHub (via SSH key)

**Wavult Mobile — Röstintegration:**
Siri → "Hey Siri, Bernt" → wavult:// deep link → Wavult Mobile-app → VoiceButton (håll inne) → Whisper transkribering → Bernt → svar i appen.

Filer byggda:
• apps/wavult-mobile/lib/bernt.ts — OpenClaw webhook
• apps/wavult-mobile/components/chat/VoiceButton.tsx — röstknapp
• apps/wavult-mobile/app/_layout.tsx — deep link handler

Nästa steg: Expo build + TestFlight för att testa på iPhone.

**Bernt i Knowledge Hub:**
Bernt har läst alla kunskapsdokument och kan svara på frågor om Wavult Group.
Fråga Bernt: "Vad är Texas LLC-stegen?" eller "Förklara Landvex prismodell" — Bernt vet.`,
      },
    ],
  },

  // ── Finance & Ekonomi ──────────────────────────────────────────────────────
  {
    id: 'finance',
    title: 'Finance & Ekonomi',
    description: 'Wavult Groups ekonomimodell: intercompany-flöden, Revolut, Stripe, budget och transfer pricing.',
    icon: '💰',
    color: '#22C55E',
    lessons: [
      {
        title: 'Koncernens pengaflöde — översikt',
        duration: 5,
        content: `Wavult Groups ekonomimodell är byggd för skatteeffektivitet och full kontroll.

**Tre nivåer av kassaflöde:**

Nivå 1 — Lokal intäkt (driftsbolagen)
Kunder betalar till närmaste bolag: svenska kommuner betalar Landvex AB, amerikanska betalar Landvex Inc, zoomers-relaterat via QuiXzoom UAB.

Nivå 2 — Upward transfer (till Dubai)
Driftsbolagen betalar IP-licens (5–15%) och management fees (8–15%) till Dubai-holdingen. Legala avdrag som minskar lokal skattebas.

Nivå 3 — Kapitalackumulering (Dubai)
Nettovinster samlas i Wavult Group FZCO (Dubai, 0% skatt). Härifrån reinvesteras i verksamheten eller delas ut till Erik.

**Konkret exempel (QuiXzoom EU, 1 MSEK/mån intäkt):**
Zoomer-utbetalningar: 750 000 SEK
Bruttomarginal: 250 000 SEK
IP-licens (10%): 100 000 SEK → Dubai
Management fee (10%): 100 000 SEK → Dubai
Kvar i UAB (Litauen): 50 000 SEK × 15% = 7 500 SEK skatt
Till Dubai: 200 000 SEK × 0% = 0 SEK skatt
Effektiv skattesats: 3%

**Nyckelregel:** Inga pengar ska röra sig utan faktura och dokumentation. Winston (CFO) ansvarar för alla intercompany-transaktioner.`,
      },
      {
        title: 'Revolut Business — vår moderna bank',
        duration: 4,
        content: `Revolut Business är Wavult Groups primära bankplattform. Det ersätter traditionella banker för 80% av vår verksamhet.

**Varför Revolut Business?**
• Multi-currency accounts (SEK, EUR, USD, GBP, AED) i ett gränssnitt
• Instant transfers (inga 2–3 dagars väntetider)
• Virtuella kort per projekt/avdelning (budgetkontroll)
• Automatisk kategorisering av utgifter
• API-integration för programmatiska utbetalningar
• Inget krav på fysisk närvaro för att öppna konto

**Hur vi använder det:**
Stripe-intäkter → Revolut Business-konton
Zoomer-utbetalningar → Revolut Pay / SEPA
AWS, GitHub, Cloudflare → Revolut virtuellt kort (IT-budget)
Löner → SEPA-överföring direkt från Revolut
Intercompany → Revolut-till-Revolut (instant, gratis)

**Virtual cards per kostnadscenter:**
• IT-infra: AWS, GitHub, Cloudflare, Supabase
• Marketing: Meta Ads, TikTok Ads, influencer-betalningar
• Legal: Bolagsregistreringsavgifter, DocuSign
• Travel: Hotell, flyg (Thailand!)

**Limit-sättning:** Winston sätter månadslimits per kort. Inget kort har obegränsad limit.

**OBS:** Mercury Bank planeras för QuiXzoom Inc (USA) — Revolut är inte tillgängligt som fullservice US business bank.`,
      },
      {
        title: 'Stripe — betalningsinfrastruktur',
        duration: 5,
        content: `Stripe hanterar alla inkommande betalningar och zoomer-utbetalningar för QuiXzoom.

**Stripe-produkter vi använder:**

Stripe Payments — Kundbetalningar
• Landvex-kunder: Månadsabonnemang via Stripe Billing
• QuiXzoom B2B-kunder: Faktura via Stripe Invoicing
• Betalningsmetoder: Kort, SEPA-debit, Swish (via partner)
• PCI DSS Level 1 compliance — vi lagrar aldrig kortdata

Stripe Billing — Prenumerationer
• Automatisk fakturering varje månad
• Failed payment retry-logik (3 försök i 28 dagar)
• Proration vid uppgradering/nedgradering
• Dunning-e-post för förfallna betalningar

Stripe Connect — Zoomer-utbetalningar
• Zoomers registrerar sitt konto (Stripe Express)
• Wavult samlar in betalningar → håller kvar 25% → betalar ut 75%
• Automatisk skatteformulär (1099 för USA, om tillämpligt)
• Stöd för SEPA, Swish, banköverföring

**Webhook-integration:**
payment_intent.succeeded → Supabase markerar konton aktiva
payout.paid → Supabase uppdaterar zoomer-plånbok
invoice.payment_failed → notification-service skickar e-post

**Testmiljö:** Stripe testläge körs i staging-branch. Aldrig testa med riktiga kort i dev.`,
      },
      {
        title: 'Budget & Kostnadskontroll',
        duration: 5,
        content: `Wavult Group har en lean kostnadsstruktur. Varje SEK räknas i early stage.

**Månatliga fasta kostnader (uppskattning, 2026-Q2):**

**Infrastruktur:**
• AWS ECS (4 services): ~$150/mån
• Supabase Pro: $25/mån × 2 projekt = $50/mån
• Cloudflare Pro: $20/mån
• GitHub: $19/mån (Team)
• Totalt: ~$240/mån (~2 500 SEK)

**Verktyg:**
• OpenClaw (Bernt): ~$100/mån
• n8n Cloud: $24/mån
• DocuSign: $25/mån
• Totalt: ~$150/mån (~1 500 SEK)

**Rörliga kostnader:**
• AWS S3 + CloudFront: $0.05/GB (variabel)
• Stripe fees: 1,4% + 0,25 EUR per transaktion (EU)
• Zoomer-utbetalningar: Stripe Connect-avgift (~0,25%)

**Bootstrapping-budget (fas 1):**
• Zoomer-rekrytering (Sverige): 75 000 SEK
• Marketing (Instagram/TikTok): 15 000 SEK
• Juridik (bolagsregistreringar): 50 000 SEK
• Totalt fas 1: ~140 000 SEK

**Runway:**
Med nuvarande kostnadsbas (~30 000 SEK/mån drift) och 500 000 SEK i kassa → ~16 månaders runway utan intäkter.

**Break-even beräkning:**
Med 10 Landvex-kunder à 9 000 SEK/mån = 90 000 SEK/mån → lönsamt från dag 1 med den basen.`,
      },
      {
        title: 'Transfer Pricing — Compliance i Praktiken',
        duration: 6,
        content: `Transfer pricing är reglerna som styr hur Wavult Groups intercompany-transaktioner prissätts. Det är kritiskt att göra rätt — fel kan kosta mångmiljonbelopp i skattetillägg.

**OECD Arm's Length Principen:**
Alla transaktioner mellan Wavult-bolag måste prissättas som om de vore mellan oberoende parter (arm's length). Du kan inte sätta ett löjligt lågt pris på IP-licensen bara för att optimera skatt.

**De tre accepterade metoderna vi använder:**

1. Comparable Uncontrolled Transaction (CUT)
Jämför vår royalty-rate med liknande licensavtal på marknaden.
Ex: "SaaS-plattformar licensieras vanligen på 8–15% av omsättning" → vi sätter 10%.

2. Cost Plus
Management fees beräknas som Wavult DevOps faktiska kostnader + 10–15% marknadsmässig markup.
Ex: Tech-kostnad 200 000 SEK/mån + 15% = 230 000 SEK faktura till Landvex AB.

3. Profit Split
Om det är svårt att hitta jämförbara transaktioner → dela vinsten proportionellt baserat på värdeskapande.

**Dokumentationskrav (KRITISKT):**

Winston ansvarar för:
☐ Master File: Koncernöversikt, IP-beskrivning, finansiell sammandrag
☐ Local File per entitet: Specifika intercompany-transaktioner, benchmarking
☐ Intercompany-avtal: Skriftliga avtal för varje transaktion-typ
☐ Uppdatering: Minst en gång per år, eller vid väsentlig förändring

**Vad som händer vid brister:**
Sverige: Skattetillägg 10–40%, retroaktiv omprövning 5 år
USA: IRS §482 — 20–40% penalty på underprisade transaktioner
EU (Litauen): Nationell skattemyndighet granskar, EU Anti-BEPS direktiv

**Vår skyddsåtgärd:** Winston håller löpande dokumentation. Dennis granskar avtalen. Extern revisor certifierar en gång per år.`,
      },
    ],
  },

  // ── Sälj & GTM ────────────────────────────────────────────────────────────
  {
    id: 'salj-gtm',
    title: 'Sälj & Go-to-Market',
    description: 'Hela säljprocessen: pitchar, CRM, B2G-upphandling, invändningshantering och demos.',
    icon: '🎯',
    color: '#F97316',
    lessons: [
      {
        title: 'Wavults försäljningsstrategi — en översikt',
        duration: 4,
        content: `Wavult Group har tre parallella säljrörelser, var och en med olika köpare, säljcykler och taktiker.

**Rörelse 1: QuiXzoom — Zoomer-rekrytering (B2C)**
Köpare: Privatpersoner (zoomers)
Säljcykel: 1–7 dagar (ladda ner appen → onboarding → första uppdraget)
Kanal: Social media (Instagram, TikTok), word-of-mouth
Konverteringsmål: < 300 SEK per aktiv zoomer
Ansvar: Leon Russo

**Rörelse 2: QuiXzoom — B2B-kunder (B2B)**
Köpare: Fastighetsbolag, försäkringsbolag, franchise
Säljcykel: 2–8 veckor
Kanal: Direktförsäljning, partnerships
Konverteringsmål: < 5 000 SEK CAC
Ansvar: Leon Russo

**Rörelse 3: Landvex — Kommuner & Myndigheter (B2G)**
Köpare: Teknisk chef, ekonomichef, nämnd
Säljcykel: 6–18 månader
Kanal: Cold outreach, demos, LOU-upphandling
Konverteringsmål: < 30 000 SEK CAC (motiverat av 3-åriga avtal = 150 000+ SEK LTV)
Ansvar: Leon + Dennis

**Regel:** Blanda ALDRIG ihop varumärkena i säljkommunikation.
• Mot zoomers: QuiXzoom
• Mot B2B-kunder: QuiXzoom / Quixom Ads
• Mot kommuner: Landvex (nämn INTE QuiXzoom)`,
      },
      {
        title: 'Landvex B2G Säljprocess — Steg för Steg',
        duration: 6,
        content: `Att sälja till kommuner är annorlunda från allt annat. Det kräver tålamod, trovärdighet och en noggrann process.

**Steg 1 — Research & Identifiering**
Hitta kommuner med hög infrastrukturkostnad och inspektionsansvar:
• Källa 1: Kommuners årsredovisningar (skl.se → ekonomidata)
• Källa 2: SKR:s infrastruktur-rapporter
• Källa 3: Mediebevakning ("brygga rasade", "väg skadad")
• Källa 4: LinkedIn (tekniska chefer på kommuner)

Prioritera: Skärgårdskommuner (hög bryggtäthet), städer med upprustningsplaner.

**Steg 2 — Kontakt (Cold)**
E-post till teknisk chef + kopia till stadsmiljöchef.
Ämne: "Halvera inspektionskostnaderna — 10 min av er tid?"
Body: 3 meningar (problem → lösning → CTA). Ingen bilaga.

Telefonuppföljning: Ring 3 dagar efter e-post om inget svar.
Voicemail är OK — kort, konkret, lägg till namn och direktnummer.

**Steg 3 — Kvalificering (Discovery Call)**
15–20 min Zoom/telefon. Frågor att ställa:
• "Hur inspekterar ni er infrastruktur idag?"
• "Hur många objekt har ni ansvar för?"
• "Vad kostar er inspektion ungefär per år?"
• "Har ni haft problem med försenat underhåll pga missade skador?"

Lyssna — anpassa demos och ROI-kalkyl baserat på svaren.

**Steg 4 — Demo (30–45 min)**
Se separat lektion: "Demo-flödet i detalj"

**Steg 5 — Pilot-erbjudandet**
"90 dagar gratis, 20 objekt, inga bindningstider."
Krav (intern): Case study + 30 min intervju efter pilot.

**Steg 6 — Avtal**
Under 700 000 SEK/år → direktupphandling möjlig (snabb!)
Över 700 000 SEK/år → LOU-upphandling (längre)
Strukturera initial deal under gränsen vid behov.`,
      },
      {
        title: 'Demo-flödet i detalj (30 min)',
        duration: 5,
        content: `Varje Landvex-demo följer ett strukturerat flöde. Avvik inte — det fungerar.

**Förberedelse (15 min innan):**
• Research kommunens infrastruktur online — vad finns? Bryggor, vägar, parker?
• Hitta ett relevant foto (Google Maps / kommunens hemsida) på deras infrastruktur
• Öppna ROI-kalkylen redo med deras kommuns befolkningstal som startpunkt

**Intro (5 min)**
"Tack för er tid. Jag vet att kommuner har massor av säljmöten — jag lovar att inte slösa er tid. Låt mig ställa en fråga direkt: Hur inspekterar ni era bryggor och parker idag?"

*Lyssna. Notera. Det här formar resten av demon.*

**Problemet (5 min)**
Återspegla deras svar. "Ni sa att det kostar ungefär X kronor per inspektion och ni gör det 2 gånger per år — det är X SEK om ni har Y objekt. Och ni sa att ni missade [deras specifika problem] förra sommaren."

*Gör det personligt. Använd deras egna siffror.*

**Produktvisning (10 min)**
1. Visa kartan med ett aktivt uppdragsområde nära dem
2. Klicka på ett uppdrag → visa vad zoomer ser (instruktioner, ersättning)
3. Hoppa till en "completed inspection" → visa bild + GPS + analys
4. Visa ett larm: "Det här är vad ni hade fått om Landvex var igång"
5. Visa rapporten: "Det här skickas automatiskt till er varannan vecka"

**ROI-kalkyl live (5 min)**
Fyll i deras siffror:
"Ni sa Y objekt och X kr/inspektion, Z gånger per år."
Visa besparingskalkylen → "Det ger er en ROI på [X gånger] under ett avtal."

**Stäng (5 min)**
"Vad tycker ni om att testa detta med era 20 viktigaste objekt under 90 dagar, helt utan kostnad?"

*Om tveksamhet: Fråga "Vad behöver ni se/veta för att vara komfortabla med en pilot?"*`,
      },
      {
        title: 'Invändningshantering — B2G',
        duration: 4,
        content: `Kommunala säljmöten har predictabla invändningar. Lär dig dessa svar utantill.

**"Vi måste upphandla allt."**
→ "Under 700 000 SEK/år kan ni direktupphandla — ingen anbudsprocess. Basabonnemanget med 50 objekt är 58 800 SEK/år. Väldig under gränsen."

**"Vi har budget-frys just nu."**
→ "Piloten kostar ingenting — 90 dagar gratis. Om ni ser ROI kan ni söka budget inför nästa budgetcykel. Många av våra pilotkommuner har tagit beslutet om pilot i nämnd på ett möte."

**"Vi har redan ett inspektionssystem."**
→ "Det kompletterar vi, ersätter inte. Landvex tar bilderna och levererar larm — ert system hanterar arbetsorder och åtgärder. Vi har API-integration mot ServiceNow och Maximo."

**"Varifrån kommer bilderna? Är det säkert?"**
→ "Zoomers är verifierade fältpersonal — ID-verifierade, KYC-clearade, certifierade via vår Academy. Varje bild valideras automatiskt för GPS och bildkvalitet. Ni ser aldrig en bild som inte är verifierad."

**"GDPR — fotografering av kommunal infrastruktur?"**
→ "Zoomers fotograferar infrastruktur (bryggor, skyltar, vägar) — inte personer. Inga ansikten, inga privata miljöer. Data lagras i EU (Stockholm/Irland). QuiXzoom UAB är vår GDPR-personuppgiftsbiträde med DPA inkluderat i standardavtalet."

**"Vad händer om ni lägger ner?"**
→ "Avtalsmässigt: Ni äger all data från era objekt under avtalstiden — full export i standardformat (JSON/CSV) på begäran. Vi erbjuder även 12-månaders escrow-arrangemang för enterprise-kunder."`,
      },
      {
        title: 'CRM & Pipeline-hantering',
        duration: 4,
        content: `Utan ett CRM tappar vi bort leads och missar uppföljningar. Wavult OS CRM-modul är vår sanningskälla.

**Pipeline-steg:**
1. Prospekt — identifierad, ej kontaktad
2. Kontaktad — cold e-post eller call gjort
3. Intresserad — svarat positivt, bokat möte
4. Demo gjord — möte genomfört, awaiting feedback
5. Pilot — gratis 90-dagars pilot aktiv
6. Förhandling — kommersiellt avtal under förhandling
7. Kund — betalande abonnemang aktivt
8. Churnad — avslutade abonnemanget

**Viktiga fält att fylla i per kontakt:**
• Kontaktperson + roll (Teknisk chef / Ekonomichef / Nämndpolitiker)
• Kommunens storlek (invånare)
• Uppskattad infrastrukturbudget
• Antal objekt de ansvarar för
• Nästa åtgärd + datum
• Senaste interaktion

**Uppföljningsregler:**
• Inget svar på e-post → Ring efter 3 dagar
• Ingen respons efter ring → E-post dag 7 med ny infopunkt (en ny ROI-siffra eller referenskund)
• Inget svar på 14 dagar → Lägg i "Vilande" — återkontakta om 3 månader
• Aldrig ge upp på ett prospekt under 6 månader (kommunala beslutsprocesser tar tid)

**Målet vid Thailand Workcamp:**
Kontaktlista med 20 kommuner identifierade.
3 demos bokade (gärna fler).
2 piloter klara att starta juni 2026.`,
      },
    ],
  },

  // ── HR & Team ─────────────────────────────────────────────────────────────
  {
    id: 'hr-team',
    title: 'HR & Teamkultur',
    description: 'Rekrytering, onboarding, roller, beslutsmandat och hur teamet jobbar.',
    icon: '👥',
    color: '#EC4899',
    lessons: [
      {
        title: 'Wavults arbetskultur — vad vi tror på',
        duration: 4,
        content: `Wavult Group är ett litet team med höga ambitioner. Kulturen är inte något vi skriver på en vägg — den syns i hur vi fattar beslut.

**Vad vi tror på:**

Ägandeskap, inte uppgifter
Varje person äger sitt område. Johan äger tech-infrastrukturen, inte bara "sin lista med tickets". Dennis äger juridiken, inte bara "de avtal han fått sig tilldelade". Ägandeskap innebär att du förutser problem, proaktivt löser dem och kommunicerar status utan att bli tillfrågad.

Tydlighet framför artighet
Om du inte förstår en instruktion → fråga. Om du tycker en plan är fel → säg det, och varför. Vi värdesätter intellektuell ärlighet mer än att alla ska vara nöjda hela tiden.

Snabbhet med kvalitet
Vi är ett startup. Vi rör oss snabbt. Men snabbhet utan kvalitet skapar teknisk skuld, juridiska problem och missnöjda kunder. Hitta balansen.

Skriftlig kommunikation
Det viktigaste dokumenteras. Muntliga beslut som inte skrivs ner finns inte. Bernt och Wavult OS är verktygen — använd dem.

**Kommunikationskanaler:**
• Telegram (teamgrupp): Dag-till-dag kommunikation, snabba frågor
• Wavult OS: Dokumentation, beslut, CRM, finance
• GitHub: Kod, tekniska issues, pull requests
• E-post: Extern kommunikation (kunder, partner, myndigheter)

**Möteskultur:**
Vi har inga möten för mötes skull. Varje möte har en agenda, ett beslut att fatta eller ett problem att lösa. Default är asynkron kommunikation.`,
      },
      {
        title: 'Beslutsnivåer: L1–L3',
        duration: 4,
        content: `Wavult Group har ett tydligt beslutssystem. Fel beslut på fel nivå skapar problem — för bolaget och den personen.

**L1 — Autonomt (valfri teammedlem)**
Beslut under 1 000 SEK och utan juridiska konsekvenser.
Exempel: Köpa ett verktyg, boka en resa under budget, fixa en bugg, skicka ett e-post till en kund.
Dokumentation: Slacka/Telegram-notering räcker.

**L2 — Godkänns av CEO (Erik eller Leon)**
Avtal under 50 000 SEK, anställning av konsulter, partnerskap, prisförändringar.
Process: Beskriv i kort memo → skicka till Erik/Leon → svar inom 24h.
Dokumentation: E-post-godkännande + notering i Wavult OS.

**L3 — Board-beslut (Erik + Dennis)**
Bolagsavtal, IP-avtal, investeringar, anställning av fast personal, beslut > 50 000 SEK.
Process: Formellt memo → styrelsemöte (kan vara Zoom) → protokoll signerat.
Dokumentation: Styrelseprotokoll arkiverat i Legal-modulen.

**Signaturrätt per bolag:**
Landvex AB: Erik Svensson + Dennis Bjarnemark (gemensam)
QuiXzoom UAB: Kräver lokal representant (via agent) + Erik
Landvex Inc (TX LLC): Erik Svensson (ensam för LLC)

**Vad som INTE kräver godkännande:**
• Interna diskussioner och förslag
• Research och analys
• Läsa och dela information
• Kommunicera med teamet
• Köra tester i staging-miljö

Princip: Fråga hellre en gång för mycket än en gång för lite på L2/L3-nivå.`,
      },
      {
        title: 'Rekrytering — Wavults process',
        duration: 5,
        content: `Wavult Group rekryterar selektivt. Varje person vi lägger till är en investering vi tar på allvar.

**Rekryteringsprinciper:**

Kompetens och driv, inte meriter
Vi anställer inte per CV. Vi rekryterar per kapacitet och potential. En driven 23-åring utan examen slår en lat 30-åring med MBA.

Kulturpassning är lika viktigt som kompetens
En tekniskt brilliant person som inte kommunicerar, inte äger sina uppgifter eller inte är transparent skapar mer problem än hen löser.

Startläge: Konsult → Fastanställd
Första 3 månader: konsultrelation (per timme eller project). Därefter: utvärdering → fast anställning om match.

**Rekryteringsprocessen:**

Steg 1: Behovet identifieras
Leon och Erik diskuterar → beslut om att rekrytera → L2-godkännande (Erik)

Steg 2: Jobbbeskrivning
Konkret, ärlig, inte corporate-speak. "Vi söker en person som kan X för att lösa Y" — inte "Vi söker en driven medarbetare med passion för..."

Steg 3: Screening
CV-granskning → 15 min screeningsamtal → tekniskt test (om tech-roll)

Steg 4: Intervju
1 timme med Leon (operations-fit) + 30 min med Erik (vision + kultur-fit)

Steg 5: Decision
Erik + Leon fattar beslut gemensamt → L2-godkännande

Steg 6: Onboarding
Dag-1-dokument + Wavult OS Access + Academy + parad med befintlig teammedlem

**Ersättning:**
Baserat på marknadssalär för rollen och geografin.
Dubai-entiteter: AED-löner konkurrenskraftiga med UAE-marknad.
Sverige: Kollektivavtal-liknande ersättning + optionsprogram (framtida).`,
      },
      {
        title: 'Optionsprogram & Equity',
        duration: 4,
        content: `Wavult Group planerar ett optionsprogram för teamet. Här är principtänkandet.

**Varför Options/Equity?**
Early-stage startups kan inte alltid betala marknadslöner. Equity kompenserar för lägre lön + risk + lojalitet. Det skapar ägarskap — i ordets rätta mening.

**Strukturen (planerad):**
Option pool: 10–15% av Wavult Group FZCO
Vesting: 4 år total, 1 år cliff (inget om du slutar innan 1 år)
Strike price: Satt vid tilldelningstillfället (tidigt = lågt = bra för dig)

**Per roll (riktlinje):**
C-suite (CTO, CFO, CLO): 1–3%
Senior individual contributor: 0,25–0,5%
Konsult → fast anställd: 0,1–0,25%

**Skatteaspekter:**
Sverige: Personaloptioner → förmånsbeskattning vid inlösen (QESO-reglerna ger viss lättnad för startups)
Dubai-entitet: UAE har ingen inkomstskatt → 0% skatt på option-gains
Dennis + Winston hanterar strukturen

**Tidlinje:**
Optionsprogrammet upprättas när Wavult Group FZCO är bildat.
Befintliga teammedlemmar retroaktivt inkluderade från start-datum.

**VIKTIGT:** Diskutera aldrig equity-erbjudanden publikt eller med externa. Det kräver L3-beslut innan något lovas.`,
      },
      {
        title: 'Thailand Workcamp — vad förväntas av dig',
        duration: 3,
        content: `Thailand Workcamp 11 april 2026 är Wavult Groups officiella projektstart. Alla i teamet förväntas leverera.

**Förberedelse inför avresa:**
• Klara minst 2 Academy-kurser (helst din roll-specifika)
• Ta Zoomer-certifieringen i ZoomerCert-fliken
• Läs igenom doc-wg-003 (Thailand Workcamp) — fullständig agenda
• Ha ett specifikt bidrag klart för sprint-planeringen

**Dag 1–2 (ankomst och kickoff):**
Öppet sinne. Vi är 5 personer som ska jobba intensivt i minst 1 månad.

**Vecka 1 (utbildning):**
Du förväntas vara aktivt deltagande. Inte sitta med telefonen. Inte svara på e-post under sessions.

**Vecka 2+ (byggfas):**
Tydliga deliverables per person — sätts i sprint-planeringen lördag/söndag vecka 1.

**Kommunikation under workcamp:**
Leon hanterar logistik (hotell, mat, utflykter).
Erik hanterar investerarmöten / externa möten.
Johan hanterar tekniska deployments.
Dennis hanterar juridik (fortsätter löpande).
Winston hanterar löpande ekonomi.

**Förväntad output:**
Varje person lämnar workcamp med ett tydligt ägandeskap av sin del av produkten — redo att köra självständigt.`,
      },
    ],
  },

  // ── Compliance & GDPR ─────────────────────────────────────────────────────
  {
    id: 'compliance',
    title: 'Compliance & GDPR',
    description: 'GDPR, LOU-upphandling, dataskydd, KYC för zoomers och internationell compliance.',
    icon: '⚖️',
    color: '#EF4444',
    lessons: [
      {
        title: 'GDPR — grunden för alla som hanterar data',
        duration: 6,
        content: `GDPR (General Data Protection Regulation) är EU-lagen som reglerar hur personuppgifter hanteras. Den gäller Wavult Group i tre sammanhang: som zoomer-plattform, som B2B SaaS-leverantör och som arbetsgivare.

**De sex grundprinciperna (förenklade):**

1. Laglighet, korrekthet, öppenhet
Vi samlar bara data med rättslig grund: samtycke, avtal, eller berättigat intresse.
Zoomers samtycker explicit vid registrering.

2. Ändamålsbegränsning
Data samlas för ett specifikt syfte och används bara för det. Zoomer-GPS-data används för att validera uppdrag — inte för reklam utan samtycke.

3. Dataminimering
Samla bara vad som behövs. Vi behöver zoomer-ID för KYC. Vi behöver inte zoomer-ålder.

4. Korrekthet
Data ska vara korrekt. Zoomers kan uppdatera sina uppgifter i appen.

5. Lagringsbegränsning
Data sparas inte längre än nödvändigt. Inaktiva zoomer-konton: data raderas efter 3 år.

6. Integritet och konfidentialitet
Data skyddas mot obehörig access. Vi krypterar, använder RLS i Supabase, och begränsar access.

**Wavults roller:**
• QuiXzoom → Personuppgiftsansvarig (Controller) för zoomer-data
• Landvex → Personuppgiftsbiträde (Processor) för kommuners objektdata
• Som arbetsgivare → Controller för personaldata

**Viktigt:** Dennis och Johan ansvarar gemensamt för GDPR-compliance. Alla nya features som hanterar persondata måste Privacy Impact Assessment (PIA) genomföras för.`,
      },
      {
        title: 'Vad som kräver samtycke vs inte',
        duration: 4,
        content: `GDPR tillåter behandling av personuppgifter med sex rättsliga grunder. Samtycke är bara en av dem — och ofta inte den bästa.

**Grund 1: Samtycke (Art. 6(1)(a))**
Kräver: Frivilligt, specifikt, informerat, otvetydigt.
Används för: Marknadsföring, tracking-cookies, analys.
OBS: Samtycke kan återkallas — ha alltid en opt-out.

**Grund 2: Avtal (Art. 6(1)(b))**
Kräver: Behandlingen är nödvändig för att fullgöra ett avtal.
Används för: Zoomer-registration, utbetalningar, kunddata i Landvex.
Fördel: Inget separat samtycke krävs — registreringen är avtalet.

**Grund 3: Rättslig förpliktelse (Art. 6(1)(c))**
Används för: Bokföring (behåll fakturor 7 år), skatteuppgifter, AML-rapportering.

**Grund 4: Berättigat intresse (Art. 6(1)(f))**
Kräver: Intresset väger tyngre än personens intressen.
Används för: Loggar för säkerhet, fraud detection.
OBS: Kräver en intresseavvägning dokumenterad.

**Praktisk guide för vår verksamhet:**
• Zoomer-kontodata: Avtal ✅
• Zoomer-GPS under uppdrag: Avtal ✅
• Marknadsförings-e-post: Samtycke ✅
• Cookies: Samtycke ✅
• AWS-loggar: Berättigat intresse ✅
• Bokföringsdata: Rättslig förpliktelse ✅

**När är du osäker?** Fråga Dennis. Gör inget med persondata du är osäker på rättslig grund för.`,
      },
      {
        title: 'KYC — Know Your Customer (Zoomers)',
        duration: 4,
        content: `Know Your Customer (KYC) är processen för att verifiera zoomers identitet. Det krävs för betalningsreglering (AML-lagen) och skyddar plattformen mot missbruk.

**Varför KYC för zoomers?**
Zoomers tar emot betalningar → vi är en payment platform → AML-lagen (Anti Money Laundering) kräver att vi vet vem vi betalar.

Utan KYC: Vi kan bli ansvariga för finansiell brottslighet om en zoomer använder plattformen för pengatvätt.

**KYC-processen (Standard Zoomer):**

Steg 1: ID-verifiering
Zoomer laddar upp nationellt ID, pass eller körkort.
System: Sumsub (planerat) — automatisk OCR + face match.
Tid: 2–5 minuter.

Steg 2: Face Match
Selfie jämförs med ID-kortet.
Sumsub-AI gör jämförelsen automatiskt.

Steg 3: Sanctions Screening
Zoomer matchas mot sanktionslistor (EU, US OFAC, UN).
Automatiskt i bakgrunden.

Steg 4: Godkännande
Godkänd → KYC-flagga satt i Supabase → zoomer kan ta uppdrag och ta emot betalningar.
Underkänd → Zoomer meddelas med orsak → kan överklag till support.

**KYC-data:**
Lagras krypterat. Dennis ansvarar för policy. Sumsub ansvarar för verifieringsprocessen (DPA med Sumsub krävs).

Radering: KYC-data behålls 5 år efter kontoavslutning (AML-krav, kortare kan strida mot lag).`,
      },
      {
        title: 'LOU — Lagen om Offentlig Upphandling',
        duration: 5,
        content: `LOU är det regelverk som styr hur kommuner och myndigheter köper in varor och tjänster. För Landvex att förstå LOU är affärskritiskt.

**Grundprincipen:**
Offentliga medel ska användas effektivt och rättvist. Alla leverantörer ska ha lika chans att vinna offentliga kontrakt.

**Upphandlingstyper:**

Direktupphandling (< 700 000 SEK / år)
Kommunen kan köpa direkt utan anbudsprocess.
Krav: Dokumentera varför just du valdes (priset, erfarenhet, etc.)
Vår strategi: Strukturera initialt avtal under tröskeln.

Förenklad upphandling (700 000 – 6 MSEK)
Kommunen annonserar på e-avrop.se.
Leverantörer lämnar anbud inom 10 dagar.
Utvärdering: Lägst pris eller bästa förhållande pris/kvalitet.
Vi behöver en formell anbudsmall redo.

Öppen upphandling (> 6 MSEK)
EU-direktiv, annons i TED (Tender Electronic Daily).
Längre process (40+ dagar anbudstid).
Relevant för Trafikverket och stora kommuner.

**Vanliga utvärderingskriterier:**
• Pris (30–50% av totalpoäng)
• Funktionalitet och teknik (30–40%)
• Leverantörens stabilitet (finansiell styrka, referenskunder)
• Supportkvalitet och SLA
• GDPR-compliance

**Ramavtal (ambition 2027):**
SKR Kommentus upphandlar ramavtal för digitala tjänster.
Om Landvex finns på ett ramavtal → 290 kommuner kan köpa utan individuell upphandling.
Dennis ansvarar för att undersöka processen.

**Vår skyddsåtgärd:** Prissätt Bas-abonnemanget (4 900 SEK/mån = 58 800 SEK/år) under direktupphandlingsgränsen. Enkelt, snabbt, inga advokater krävs.`,
      },
      {
        title: 'Data Security & Access Control',
        duration: 5,
        content: `Dataskydd är inte en GDPR-fråga — det är en affärs-survival-fråga. Ett dataintrång kan förstöra Wavults trovärdighet mot kommuner i ett slag.

**Säkerhetslager:**

Layer 1 — Nätverkssäkerhet
Cloudflare WAF framför alla publika endpoints.
DDoS-skydd: Cloudflare absorber och filtrerar attacker.
SSL/TLS: All trafik krypteras (HTTPS, TLS 1.3 minimum).

Layer 2 — API-säkerhet
Autentisering: JWT Bearer tokens på alla endpoints.
Rate limiting: Max 100 requests/minut per IP (Cloudflare Workers).
Input validation: Zod-schema på alla API-inpus (rejects malformed data).
CORS: Explicit whitelist av tillåtna origins.

Layer 3 — Databasäkerhet
Supabase Row Level Security: Varje rad har en organization_id.
RLS-policy: "Du ser bara din data" — implementerat på databasnivå.
Service key vs Anon key: Service key (admin) aldrig exponerat i frontend.

Layer 4 — Applikationssäkerhet
Miljövariabler: Aldrig i kod, aldrig i GitHub.
Secrets: GitHub Secrets för CI/CD, AWS Parameter Store för produktion.
Dependency scanning: Dependabot i GitHub skapar PRs för sårbarhetsfixar.

**Access control (Principle of Least Privilege):**
Varje person har minimal access de behöver för sin roll.
Johan: Full AWS access (CTO)
Winston: Revolut Business + Stripe Dashboard (CFO)
Dennis: DocuSign + bolagsregistrerings-portaler (CLO)
Leon: CRM + Communications i Wavult OS (CEO Ops)

**Incidentrespons:**
P0-incident (dataintrång): Erik + Johan informeras omedelbart.
GDPR-anmälan till Datainspektionen: Inom 72 timmar om persondata läckt.
Kundkommunikation: Dennis + Erik koordinerar.`,
      },
    ],
  },

  // ── Techstack Deep Dive ───────────────────────────────────────────────────
  {
    id: 'techstack',
    title: 'Techstack Deep Dive',
    description: 'Detaljerad genomgång av Wavults hela teknikstack: n8n, Supabase, GitHub, Docker och mer.',
    icon: '🔧',
    color: '#6366F1',
    lessons: [
      {
        title: 'n8n — Automation Hub',
        duration: 5,
        content: `n8n är Wavults automation-plattform. Det är "Make/Zapier för självhostat" — ett visuellt workflow-verktyg som kopplar ihop alla system.

**Var körs n8n?**
ECS Fargate, cluster hypbit (eu-north-1), task: n8n-task:latest.
Access: Via ALB-path /n8n (intern URL, ej publik).
Port: 5678.

**Befintliga workflows:**

Morning Brief (kl 08:00 varje dag)
Trigger: Cron
1. Hämtar nyheter (RSS, web scraping)
2. Frågar Claude (via OpenClaw API) om sammanfattning
3. Formaterar nyhetsbrev (HTML-template)
4. Skickar via AWS SES till teamet (5 mottagare + BCC till erik@hypbit.com)
Output: 08:00 varje dag i inkorgen.

Supabase → Notifikation (webhook-trigger)
Trigger: Supabase webhook vid ny row i "missions" tabell
1. Formaterar push-notification
2. Skickar via Expo Push API
3. Loggar i Supabase.

**Planerade workflows:**
• Zoomer-payout automation (Stripe Connect → Supabase → utbetalning)
• Landvex inspection cycle trigger (kör dagliga/veckovisa inspektioner)
• Slack/Telegram-alert när ECS-service unhealthy
• Monthly invoice generation (Landvex-kunder)

**n8n Credentials-hantering:**
Alla API-keys sparas som n8n Credentials (krypterade i n8n-databasen).
Aldrig hårdkodade i workflow-noder.

**Backup:**
n8n-exporterar workflow-JSON automatiskt till S3 dagligen.`,
      },
      {
        title: 'Supabase — Djupdykning',
        duration: 6,
        content: `Supabase är Wavults databaslager. Det är mer än en databas — det är en komplett backend-as-a-service.

**Supabase-projekt:**

quixzoom-v2 (eu-west-1): QuiXzoom-plattformens databas.
• 13 migrationer live
• Tabeller: missions, assignments, submissions, users, organizations, payouts...
• RLS aktiverat på alla publika tabeller

wavult-os (eu-west-1): Interna Wavult OS-datan.
• Tabeller: decisions, milestones, contacts, finance_entries...
• Används av command-center-appen

**Tre sätt att prata med Supabase:**

1. Supabase JS Client (frontend)
const { data } = await supabase.from('missions').select('*').eq('status', 'published')
Kräver: anon key (publik) + RLS-policies
Säkerhet: RLS säkerställer att du bara ser din data

2. REST API (bakifrån)
Supabase exponerar automatiskt ett REST API från databasen.
Auth: Service key (SECRET — aldrig i frontend!)
Används av ECS-services för admin-operationer.

3. Realtime Subscriptions
supabase.channel('missions').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'missions' }, callback).subscribe()
Zoomer-appen prenumererar på nya uppdrag i närheten → kartan uppdateras automatiskt.

**Row Level Security (RLS) — exempel:**
CREATE POLICY "Users can see own assignments" ON assignments FOR SELECT USING (auth.uid() = user_id);
Denna policy körs på VARJE select mot assignments-tabellen. Ingen kod behövs i applikationslagret.

**Supabase Edge Functions (planerat):**
Serverless TypeScript-funktioner som körs på Supabase-infrastrukturen.
Användning: Webhook handlers, schemalagda jobs, tung bildanalys.`,
      },
      {
        title: 'GitHub Actions — CI/CD i Detalj',
        duration: 5,
        content: `GitHub Actions är Wavults automatiserade deploy-pipeline. Varje push till main kan resultera i ett nytt deployment på minuter.

**Repo-struktur:**
wolfoftyreso-debug/hypbit (monorepo)
apps/
  api/ — Wavult OS API
  quixzoom-api/ — QuiXzoom backend
  command-center/ — Wavult OS frontend
  wavult-mobile/ — Expo React Native-app
.github/
  workflows/
    deploy-api.yml
    deploy-quixzoom.yml
    deploy-pages.yml

**deploy-api.yml — Komplett flöde:**
name: Deploy Wavult OS API
on:
  push:
    branches: [main]
    paths: ['apps/api/**']
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: eu-north-1
      - run: aws ecr get-login-password | docker login --username AWS --password-stdin \$ECR_REGISTRY
      - run: docker build -t wavult-os-api ./apps/api
      - run: docker push \$ECR_REGISTRY/wavult-os-api:\$GITHUB_SHA
      - run: aws ecs update-service --cluster hypbit --service wavult-os-api --force-new-deployment

**Path-filter (VIKTIGT):**
paths: ['apps/api/**'] — Deploy triggas BARA om filer i api/-mappen ändrats.
Utan path-filter → varje push deployer ALLA services = onödig tid + risk.

**GitHub Secrets (konfigurerade):**
AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY — IAM-user med ECS+ECR access
CLOUDFLARE_API_TOKEN — CF Pages deploy
CLOUDFLARE_ACCOUNT_ID — CF account
SUPABASE_SERVICE_KEY — Supabase admin key (lades till 2026-03-27)

**Vanliga fel och lösningar:**
"unauthorized" på ECR → AWS credentials saknas eller utgångna
"task definition invalid" → Ny env var adderad men ej i task definition
"health check failed" → App-crashar vid startup, kolla CloudWatch logs`,
      },
      {
        title: 'Docker — Hur våra containers byggs',
        duration: 5,
        content: `Docker är fundamentet för vår deploy-process. Varje service har en Dockerfile som definierar exakt hur applikationen paketeras.

**Wavult OS API Dockerfile (apps/api/Dockerfile):**
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=10s CMD wget -qO- http://localhost:3001/health || exit 1
CMD ["node", "dist/index.js"]

**Multi-stage build — varför:**
Byggstadiet (builder) innehåller devDependencies och TypeScript-kompilatorn.
Produktionsstadiet (production) innehåller bara det som behövs för att köra.
Resultat: Image-storlek minskar med 60–70% — snabbare deploy, lägre kostnad.

**HEALTHCHECK:**
ECS använder HEALTHCHECK för att veta om containern är frisk.
Om /health svarar med != 200 tre gånger → ECS startar om containern automatiskt.
Vår /health endpoint returnerar: { status: "ok", version: "1.2.3", uptime: 3600 }

**ECR (Elastic Container Registry):**
Privat Docker registry på AWS. Varje image pushas hit innan ECS startar den.
Format: 155407238699.dkr.ecr.eu-north-1.amazonaws.com/[image-name]:[tag]
Tag: Vi använder GITHUB_SHA (commit-hash) för att kunna rollbacka exakt.

**Lokal debug:**
docker build -t wavult-api ./apps/api
docker run -p 3001:3001 --env-file .env wavult-api
Testar exakt samma container som körs i produktion.`,
      },
      {
        title: 'Wavult Mobile — React Native + Expo',
        duration: 5,
        content: `Wavult Mobile är teamets interna app för mobil access till Wavult OS och för Bernt-röstinteraktion.

**Teknologier:**
React Native: Cross-platform (iOS + Android) med en kodbas.
Expo: Build-infrastruktur, OTA-updates, native modules.
Expo Router: File-baserad navigation (som Next.js App Router, fast för mobile).
NativeWind: Tailwind CSS för React Native.

**Projektstruktur:**
apps/wavult-mobile/
  app/ — Expo Router screens
    _layout.tsx — Root layout, deep link handler
    (tabs)/ — Tab-navigering
      index.tsx — Dashboard
      chat.tsx — Bernt-chat
  components/
    chat/
      VoiceButton.tsx — Röstknapp (håll inne → spela in)
      ChatInterface.tsx
  lib/
    bernt.ts — OpenClaw webhook-integration
    whisper.ts — OpenAI Whisper transcription

**Röstflödet (Siri → Bernt):**
1. "Hey Siri, Bernt" → iOS Shortcut-app
2. Shortcut öppnar deep link: wavult://chat
3. Wavult Mobile öppnas automatiskt
4. VoiceButton aktiveras (håll inne för att tala)
5. Expo Audio spelar in → Whisper transkriberar
6. Text skickas till OpenClaw (Bernt)
7. Svar visas i chat + TTS-läses upp (valfritt)

**Build-process:**
eas build --platform ios → Expo Application Services bygger
eas submit → Laddar upp till App Store Connect
TestFlight: Interna testers (teamet) testar innan release

**Status 2026-03-27:**
Röstintegration-kod klar (VoiceButton + bernt.ts + _layout.tsx).
Nästa steg: eas build + TestFlight-distribution till teamet.
Kräver: Apple Developer Account aktiv (Erik eller Johan ansvarar).`,
      },
      {
        title: 'Monitoring & Observability',
        duration: 4,
        content: `Wavult Group behöver veta när saker går fel — innan kunderna vet det.

**Nuvarande monitoring:**

ECS Health Checks
Varje container kör HEALTHCHECK mot /health endpoint.
Om tre på varann checks misslyckas → ECS stoppar och startar om containern.
Logg finns i AWS CloudWatch Logs.

Bernt Morning/Evening Check
Bernt kör dagliga statusrapporter kl 08:00 och 20:00.
Kontrollerar: URL-status (api.quixzoom.com, api.hypbit.com), ECS tasks räkning, GitHub Actions senaste status.
Mail skickas om något är rött.

Cloudflare Analytics
Inbyggd i Cloudflare — trafikvolym, error rates, blocked attacks.
Gratis, ingen konfiguration.

**Planerad monitoring (nästa sprint):**

Sentry — Error Tracking
Frontend och backend skickar uncaught exceptions till Sentry.
Varje error: stack trace, user context, repro-steg.
Kostar: $0 för Sentry Community-plan.

Datadog / AWS CloudWatch Dashboards
CPU, minne, request latency per ECS service.
Alert: Slack-notis om CPU > 80% i mer än 5 min.

Uptime Robot / check-host.net
External monitoring — pinga våra publika endpoints var 5:e minut.
Alert om endpoint ej nås inom 10s.

**Incident Response:**
P0: Johan + Erik på Telegram omedelbart.
P1: Johan åtgärdar inom 1 timme, rapporterar till Erik.
P2: Löses i nästa arbetspass, dokumenteras i Wavult OS Incidents.
Post-mortem: Alla P0-incidents får ett skrivet post-mortem (vad hände, varför, åtgärd).`,
      },
    ],
  },
]

type ProgressMap = Record<string, number> // courseId → lessons completed

function getProgress(): ProgressMap {
  try {
    return JSON.parse(localStorage.getItem('wavult_academy_progress_v2') ?? '{}')
  } catch {
    return {}
  }
}

function saveProgress(p: ProgressMap) {
  localStorage.setItem('wavult_academy_progress_v2', JSON.stringify(p))
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100)
  return (
    <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  )
}

function LessonModal({ course, lessonIndex, progress, onUpdate, onClose }: {
  course: Course
  lessonIndex: number
  progress: number
  onUpdate: (lessons: number) => void
  onClose: () => void
}) {
  const [currentLesson, setCurrentLesson] = useState(lessonIndex)
  const lesson = course.lessons[currentLesson]
  const isCompleted = currentLesson < progress
  const isNextUp = currentLesson === progress

  function markAndNext() {
    const newProgress = Math.max(progress, currentLesson + 1)
    onUpdate(newProgress)
    if (currentLesson < course.lessons.length - 1) {
      setCurrentLesson(currentLesson + 1)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#0D0F1A] border border-surface-border rounded-xl w-full max-w-2xl mx-4 flex flex-col"
        style={{ maxHeight: '88vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-5 pb-3 border-b border-white/[0.05]">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">{course.icon}</span>
            <div className="flex-1">
              <p className="text-xs text-gray-600 font-mono uppercase">{course.title}</p>
              <h2 className="text-sm font-semibold text-white">{lesson.title}</h2>
            </div>
            <button onClick={onClose} className="text-gray-600 hover:text-gray-300 text-xl leading-none">×</button>
          </div>

          {/* Lesson selector */}
          <div className="flex gap-1.5 flex-wrap">
            {course.lessons.map((l, i) => (
              <button
                key={i}
                onClick={() => setCurrentLesson(i)}
                className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                  i === currentLesson
                    ? 'text-white'
                    : i < progress
                    ? 'text-green-500 bg-green-500/10'
                    : 'text-gray-600 bg-white/[0.03] hover:text-gray-400'
                }`}
                style={i === currentLesson ? { background: course.color + '25', color: course.color } : {}}
              >
                {i < progress ? '✓' : i + 1}. {l.title.length > 20 ? l.title.slice(0, 18) + '…' : l.title}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 min-h-0">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="text-xs font-mono px-2 py-0.5 rounded"
              style={{ background: course.color + '20', color: course.color }}
            >
              Lektion {currentLesson + 1} av {course.lessons.length}
            </div>
            <span className="text-xs text-gray-600 font-mono">~{lesson.duration} min</span>
            {isCompleted && (
              <span className="text-xs text-green-500 font-mono ml-auto">✓ Avklarad</span>
            )}
          </div>

          {/* Lesson text rendered */}
          <div className="space-y-2">
            {lesson.content.split('\n').map((line, i) => {
              if (line.startsWith('**') && line.endsWith('**')) {
                return (
                  <h3 key={i} className="text-sm font-semibold text-white mt-4 mb-1">
                    {line.replace(/\*\*/g, '')}
                  </h3>
                )
              }
              if (line.startsWith('• ')) {
                return (
                  <div key={i} className="flex gap-2 text-xs text-gray-300 leading-relaxed pl-2">
                    <span className="text-gray-600 flex-shrink-0">•</span>
                    <span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>') }} />
                  </div>
                )
              }
              if (line.trim() === '') return <div key={i} className="h-1.5" />
              return (
                <p key={i} className="text-xs text-gray-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>') }}
                />
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-white/[0.05]">
          <ProgressBar value={progress} max={course.lessons.length} color={course.color} />
          <p className="text-xs text-gray-600 font-mono mt-1 mb-3">
            {progress}/{course.lessons.length} lektioner avklarade
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentLesson(Math.max(0, currentLesson - 1))}
              disabled={currentLesson === 0}
              className="px-3 py-1.5 rounded-lg text-xs text-gray-500 border border-surface-border hover:text-gray-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Föregående
            </button>

            <div className="flex-1" />

            <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs text-gray-500 border border-surface-border hover:text-gray-300 transition-colors">
              Stäng
            </button>

            {currentLesson < course.lessons.length - 1 ? (
              <button
                onClick={markAndNext}
                className="px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
                style={{ background: course.color }}
              >
                {isCompleted || isNextUp ? 'Markera & Nästa →' : 'Nästa →'}
              </button>
            ) : (
              <button
                onClick={() => {
                  onUpdate(Math.max(progress, currentLesson + 1))
                  onClose()
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
                style={{ background: '#10B981' }}
              >
                🎓 Avsluta kurs
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Rekommenderad kursordning för nybörjare — visas tills 2 kurser är klara
const ONBOARDING_ORDER: { courseId: string; reason: string }[] = [
  { courseId: 'dag-1', reason: 'Börja här — 12 min' },
  { courseId: 'wavult-os', reason: 'Förstå verktyget du jobbar i' },
  { courseId: 'quixzoom', reason: 'Kärnprodukten — 7 lektioner' },
  { courseId: 'landvex', reason: 'B2G-armen och intäktsmodellen' },
  { courseId: 'dubai', reason: 'Juridisk struktur och skatteoptimering' },
  { courseId: 'finance', reason: 'Ekonomimodell och cashflow' },
  { courseId: 'salj-gtm', reason: 'Sälj, pitch och demo-flödet' },
  { courseId: 'compliance', reason: 'GDPR, LOU och dataskydd' },
  { courseId: 'techstack', reason: 'n8n, Docker, GitHub och mer' },
]

export function AcademyView() {
  const [progress, setProgress] = useState<ProgressMap>(getProgress)
  const [openCourse, setOpenCourse] = useState<{ course: Course; lesson: number } | null>(null)

  const totalLessons = COURSES.reduce((sum, c) => sum + c.lessons.length, 0)
  const completedLessons = COURSES.reduce((sum, c) => sum + Math.min(progress[c.id] ?? 0, c.lessons.length), 0)
  const overallPct = Math.round((completedLessons / totalLessons) * 100)
  const completedCourses = COURSES.filter(c => (progress[c.id] ?? 0) >= c.lessons.length).length

  // Visa onboarding-guide tills minst 2 kurser är avklarade
  const showOnboarding = completedCourses < 2

  function handleUpdate(courseId: string, lessons: number) {
    const next = { ...progress, [courseId]: lessons }
    setProgress(next)
    saveProgress(next)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Onboarding "Var börjar jag?" — visas tills 2 kurser är klara */}
      {showOnboarding && (
        <div className="mb-4 bg-[#0D0F1A] border border-brand-accent/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">🧭</span>
            <h3 className="text-sm font-semibold text-white">Ny här? Börja i den här ordningen</h3>
            <span className="ml-auto text-xs text-gray-600 font-mono">Försvinner när 2 kurser är klara</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {ONBOARDING_ORDER.map((item, idx) => {
              const course = COURSES.find(c => c.id === item.courseId)
              if (!course) return null
              const done = (progress[course.id] ?? 0) >= course.lessons.length
              return (
                <button
                  key={item.courseId}
                  onClick={() => {
                    const nextLesson = Math.min(progress[course.id] ?? 0, course.lessons.length - 1)
                    setOpenCourse({ course, lesson: nextLesson })
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border transition-all ${
                    done
                      ? 'border-green-500/20 bg-green-500/5 text-green-400'
                      : 'border-brand-accent/20 bg-brand-accent/5 text-gray-300 hover:text-white hover:border-brand-accent/40'
                  }`}
                >
                  <span className="font-mono text-gray-600">{idx + 1}.</span>
                  <span>{course.icon}</span>
                  <span>{course.title}</span>
                  {done && <span className="text-green-500">✓</span>}
                  {!done && <span className="text-gray-600 text-xs">— {item.reason}</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Header stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-[#0D0F1A] border border-surface-border rounded-xl p-4">
          <p className="text-xs text-gray-600 font-mono mb-1">TOTAL PROGRESS</p>
          <p className="text-2xl font-bold text-white">{overallPct}%</p>
          <div className="mt-2">
            <ProgressBar value={completedLessons} max={totalLessons} color="#8B5CF6" />
          </div>
        </div>
        <div className="bg-[#0D0F1A] border border-surface-border rounded-xl p-4">
          <p className="text-xs text-gray-600 font-mono mb-1">KURSER KLARA</p>
          <p className="text-2xl font-bold text-white">
            {COURSES.filter(c => (progress[c.id] ?? 0) >= c.lessons.length).length}
            <span className="text-base text-gray-600">/{COURSES.length}</span>
          </p>
        </div>
        <div className="bg-[#0D0F1A] border border-surface-border rounded-xl p-4">
          <p className="text-xs text-gray-600 font-mono mb-1">LEKTIONER KLARA</p>
          <p className="text-2xl font-bold text-white">
            {completedLessons}
            <span className="text-base text-gray-600">/{totalLessons}</span>
          </p>
        </div>
      </div>

      {/* Course grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 flex-1 overflow-y-auto">
        {COURSES.map(course => {
          const done = progress[course.id] ?? 0
          const total = course.lessons.length
          const pct = Math.round((done / total) * 100)
          const isComplete = done >= total
          const nextLessonIndex = Math.min(done, total - 1)

          return (
            <button
              key={course.id}
              onClick={() => setOpenCourse({ course, lesson: nextLessonIndex })}
              className="text-left p-5 bg-[#0D0F1A] border border-surface-border rounded-xl hover:border-white/20 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{course.icon}</span>
                <div className="flex flex-col items-end gap-1">
                  {isComplete && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-mono border border-green-500/20">
                      ✓ Klar
                    </span>
                  )}
                  {!isComplete && done > 0 && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-mono"
                      style={{ background: course.color + '15', color: course.color, border: `1px solid ${course.color}30` }}
                    >
                      {pct}%
                    </span>
                  )}
                  <span className="text-xs text-gray-700 font-mono">
                    {total} lektioner
                  </span>
                </div>
              </div>

              <h3 className="text-sm font-semibold text-white mb-1.5 group-hover:text-brand-accent transition-colors">
                {course.title}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">{course.description}</p>

              {/* Next lesson preview */}
              {!isComplete && (
                <div
                  className="text-xs font-mono px-2 py-1 rounded mb-3 text-left truncate"
                  style={{ background: course.color + '10', color: course.color + 'cc' }}
                >
                  ▶ {course.lessons[nextLessonIndex]?.title}
                </div>
              )}

              <div className="space-y-2">
                <ProgressBar value={done} max={total} color={course.color} />
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-gray-600">{done}/{total} lektioner</span>
                  <span className="text-gray-600">
                    ~{course.lessons.reduce((s, l) => s + l.duration, 0)} min totalt
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {openCourse && (
        <LessonModal
          course={openCourse.course}
          lessonIndex={openCourse.lesson}
          progress={progress[openCourse.course.id] ?? 0}
          onUpdate={n => handleUpdate(openCourse.course.id, n)}
          onClose={() => setOpenCourse(null)}
        />
      )}
    </div>
  )
}
