import { CORP_ENTITIES, BRAND_GROUPS } from '../../shared/data/systemData'

export { CORP_ENTITIES, BRAND_GROUPS }

export interface Competitor {
  id: string
  name: string
  productId: string        // quixzoom | landvex
  category: string         // vad de egentligen är
  founded?: string
  hq?: string
  fundingStage?: string
  employees?: string

  // Ärlig analys
  whatTheyDo: string       // en mening: vad de faktiskt gör
  theirStrength: string    // deras starkaste sida
  theirWeakness: string    // deras svagaste sida (vår möjlighet)
  ourAdvantage: string     // exakt vad vi har som de inte har
  ourStrategy: string      // hur vi vinner mot just dem

  // Status
  threat: 'hög' | 'medel' | 'låg' | 'inaktivt'
  websiteUrl?: string
}

export const COMPETITORS: Competitor[] = [
  // ── quiXzoom konkurrenter ────────────────────────────────────────────────────
  {
    id: 'getty',
    name: 'Getty Images / Shutterstock',
    productId: 'quixzoom',
    category: 'Bildbank (passiv)',
    founded: '1995',
    hq: 'Seattle, USA',
    fundingStage: 'Börsnoterat',
    employees: '1 000+',
    whatTheyDo: 'Säljer licensierade stillbilder tagna av professionella fotografer — passiv bildbank, ingen realtid.',
    theirStrength: 'Enormt bildbibliotek, etablerade kundrelationer, starkt varumärke.',
    theirWeakness: 'Historisk data, aldrig realtid, inte geospatialt, inte crowdsourcad, dyr per bild.',
    ourAdvantage: 'quiXzoom är live — vi fångar världen NU. Getty säljer bilder från förr.',
    ourStrategy: 'Vi konkurrerar inte om bildbanksmarknaden. Vi tar realtids-intelligence-marknaden som inte finns idag.',
    threat: 'låg',
    websiteUrl: 'https://gettyimages.com',
  },
  {
    id: 'mapillary',
    name: 'Mapillary (Meta)',
    productId: 'quixzoom',
    category: 'Street-level imagery',
    founded: '2013',
    hq: 'Malmö, Sverige',
    fundingStage: 'Förvärvad av Meta 2020',
    employees: '50+',
    whatTheyDo: 'Crowdsourcad gatuvy för kartor — fokus på mapping, inte intelligence.',
    theirStrength: 'Mäktig ägare (Meta), etablerat API, integrerat med OpenStreetMap.',
    theirWeakness: 'Fokus på mapping, inte analys. Inga zoomers betalar sig. Ingen alert-funktion. Ingen affärsmodell mot kommuner.',
    ourAdvantage: 'quiXzoom betalar zoomers och fokuserar på intelligent analys — inte kartläggning.',
    ourStrategy: 'Positionera oss mot samma insamlingsmodell men med bättre incitament och tydligare B2B-köpare.',
    threat: 'medel',
    websiteUrl: 'https://mapillary.com',
  },
  {
    id: 'google-sv',
    name: 'Google Street View',
    productId: 'quixzoom',
    category: 'Street-level imagery (statisk)',
    hq: 'Mountain View, USA',
    whatTheyDo: 'Historiska gaturubilder via Google Maps — uppdateras sällan, inga alerts, inte kommersiellt API.',
    theirStrength: 'Gigantisk täckning globalt, integrerat i Google Maps-ekosystemet.',
    theirWeakness: 'Uppdateras 1-3 ggr per år. Ingen realtid. Inget B2B-erbjudande. Kan inte anpassas per kund.',
    ourAdvantage: 'quiXzoom ger realtidsdata på begäran. Vi fyller det gap Google aldrig kan fylla.',
    ourStrategy: 'Sälja oss som "Google Street View men live och analyserat" — det förstår kommuner direkt.',
    threat: 'låg',
  },

  // ── LandveX konkurrenter ─────────────────────────────────────────────────────
  {
    id: 'manual-inspection',
    name: 'Manuell inspektion (kommuner)',
    productId: 'landvex',
    category: 'Traditionell process (inget bolag)',
    whatTheyDo: 'Kommuner skickar ut inspektörer fysiskt för att kontrollera vägar, park och infrastruktur.',
    theirStrength: 'Juridiskt etablerat. Inspektörer vet lokala förhållanden. Inga IT-kostnader.',
    theirWeakness: 'Extremt dyrt (800-1200 kr/tim), sker sällan, subjektivt, inget arkiv, ingen AI.',
    ourAdvantage: 'LandveX ger kontinuerlig övervakning till 10-20% av kostnaden för manuell inspektion.',
    ourStrategy: 'ROI-kalkyl är vår starkaste säljpitch. "Ditt alternativ kostar X per år. Vi kostar Y."',
    threat: 'låg',
  },
  {
    id: 'cctv-systems',
    name: 'Traditionella CCTV-system',
    productId: 'landvex',
    category: 'Kamerainfrastruktur',
    hq: 'Globalt',
    whatTheyDo: 'Fast kamerainfrastruktur för säkerhetsövervakning — inte designad för infrastrukturanalys.',
    theirStrength: 'Etablerad teknik, välkänd för kommuner, upphandlingsbar.',
    theirWeakness: 'Fast placering, kräver driftsättning, ingen AI-analys, inget helhetsperspektiv.',
    ourAdvantage: 'quiXzoom-nätverket är rörligt, täcker allt, kräver noll installation.',
    ourStrategy: 'Inte konkurrera om kameror — erbjuda intelligence som komplement till befintlig CCTV.',
    threat: 'medel',
  },
  {
    id: 'excel-reports',
    name: 'Excel-baserade tillsynsrapporter',
    productId: 'landvex',
    category: 'Manuell rapportering',
    whatTheyDo: 'Kommuner dokumenterar tillstånd i Excel/PDF — inget system, ingen analys, ingen automatik.',
    theirStrength: 'Noll IT-kostnad, känd process, inget upphandlingskrav under tröskelvärdena.',
    theirWeakness: 'Inget realtid, ingen AI, ingen historik, ingen visualisering, mänskliga fel.',
    ourAdvantage: 'LandveX ersätter Excel med ett levande system som automatiserar hela rapportkedjan.',
    ourStrategy: 'Demo är vår starkaste pitch. Visa hur det ser ut. "Varje timme du lägger på Excel är slöseri."',
    threat: 'inaktivt',
  }]

// ── MARKNAD ────────────────────────────────────────────────────────────────────

export interface MarketMetric {
  id: string
  productId: string
  label: string
  value: string
  detail: string
  source: string
  asOf: string
}

export const MARKET_METRICS: MarketMetric[] = [
  // quiXzoom
  { id: 'm1', productId: 'quixzoom', label: 'TAM (Total Addressable Market)', value: '~$12 Mdr', detail: 'Global geospatial intelligence + crowdsourced imagery market', source: 'MarketsandMarkets 2024', asOf: '2024' },
  { id: 'm2', productId: 'quixzoom', label: 'SAM (Serviceable Addressable Market)', value: '~$800 Mdr', detail: 'EU + US municipal + infrastructure markets vi adresserar fas 1', source: 'Intern uppskattning', asOf: '2026' },
  { id: 'm3', productId: 'quixzoom', label: 'SOM (Serviceable Obtainable Market)', value: '~$20 Mdr', detail: 'Realistisk marknadsandel år 3 (Sverige + 2 EU-länder)', source: 'Intern uppskattning', asOf: '2026' },
  { id: 'm4', productId: 'quixzoom', label: 'Go-to-market fas 1', value: 'Sverige', detail: 'Marknadslansering Sverige juni 2026. Skärgårdstest april-maj.', source: 'Strategidokument', asOf: '2026' },
  { id: 'm5', productId: 'quixzoom', label: 'Go-to-market fas 2', value: 'Nederländerna', detail: 'Q1 2027. Högtäthets-infrastruktur, stark digital mognad.', source: 'Strategidokument', asOf: '2026' },

  // LandveX
  { id: 'm6', productId: 'landvex', label: 'TAM (Total Addressable Market)', value: '~$45 Mdr', detail: 'Global infrastructure monitoring + smart city market', source: 'IDC 2024', asOf: '2024' },
  { id: 'm7', productId: 'landvex', label: 'SAM (Serviceable Addressable Market)', value: '~$2 Mdr', detail: 'Nordisk + UAE kommunal infrastrukturtillsyn', source: 'Intern uppskattning', asOf: '2026' },
  { id: 'm8', productId: 'landvex', label: 'Target: Sverige', value: '290 kommuner', detail: 'Alla svenska kommuner är potentiella kunder via LOU-upphandling', source: 'SKR 2024', asOf: '2024' },
  { id: 'm9', productId: 'landvex', label: 'ACV per kund (est.)', value: '250-500 TSEK', detail: 'Abonnemang per kommunkontrakt, beroende på geografi och volym', source: 'Intern uppskattning', asOf: '2026' },
  // Expansion marknader
  { id: 'm10', productId: 'quixzoom', label: 'UK — CCS Gateway', value: '333 kommuner', detail: 'Crown Commercial Service-ramavtal öppnar alla brittiska kommuner simultant. Engelska — noll anpassningskostnad.', source: 'HM Government 2024', asOf: '2024' },
  { id: 'm11', productId: 'quixzoom', label: 'NRW, Tyskland', value: '396 kommuner', detail: 'Nordrhein-Westfalen: €2,4 Mdr/år infrastrukturbudget. NIS2-compliance driver adoption. Störst kommunaltäthet i EU.', source: 'Innenministerium NRW 2024', asOf: '2024' },
  { id: 'm12', productId: 'landvex', label: 'UAE/GCC marknad', value: 'Obegränsad budget', detail: 'Dubai RTA + DEWA har praktiskt obegränsade infrastrukturbudgetar. LandveX ger direktaccess via Dubai-etableringen.', source: 'Dubai Smart City Initiative', asOf: '2024' },
  { id: 'm13', productId: 'quixzoom', label: 'OZ-LT — EU Hävstång', value: '27 EU-länder', detail: 'Litauen-entiteten ger omedelbar juridisk närvaro i hela EU. Noll nya bolagsregistreringar behövs för NL, DE, FR, BE, SE.', source: 'Intern strategi', asOf: '2026' }]

// ── MISSION per bolag ──────────────────────────────────────────────────────────

export const MISSIONS: Record<string, { mission: string; vision: string; tagline: string }> = {
  'wavult-group': {
    mission: 'Bygga det optiska intelligenslagret i världen.',
    vision: 'En värld där infrastruktur övervakar sig själv — och där varje förändring i den fysiska världen omedelbart förvandlas till handlingsbara insikter.',
    tagline: 'See more. Know more. Act faster.',
  },
  'quixzoom': {
    mission: 'Förvandla världens kameror till ett realtidsintelligens-nätverk.',
    vision: 'Varje zoomer bidrar till att göra världen säkrare och mer välskött.',
    tagline: 'Last mile intelligence capture.',
  },
  'landvex': {
    mission: 'Rätt kontroll, rätt kostnad, rätt intervall.',
    vision: 'En värld där ingen infrastruktur försämras utan att någon vet om det — och ingen krona läggs på onödig inspektion.',
    tagline: 'Intelligent infrastructure oversight.',
  },
}
