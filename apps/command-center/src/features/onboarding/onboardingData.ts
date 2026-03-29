export interface OnboardingStep {
  id: string
  route: string
  title: string
  description: string
  bullets?: string[]
  example?: string
  callout?: {
    type: 'info' | 'warning' | 'tip'
    text: string
  }
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
  targetSelector?: string
  icon: string
  visual?: 'entity-switcher' | 'finance' | 'mission-control' | 'system-graph' | 'knowledge'
}

export interface OnboardingTour {
  id: string
  name: string
  description: string
  estimatedMinutes: number
  steps: OnboardingStep[]
}

export const TOURS: OnboardingTour[] = [
  {
    id: 'first-run',
    name: 'Välkommen till Wavult OS',
    description: 'Ditt operativsystem för hela Wavult Group. En genomgång av allt du behöver veta — ta 3 minuter.',
    estimatedMinutes: 3,
    steps: [
      {
        id: 'welcome',
        route: '/',
        title: 'Välkommen till Wavult OS',
        description: 'Wavult OS är koncernens operativa nervsystem. Här lever allt: legal struktur, ekonomi, uppgifter, systemövervakning och kunskapsbank. Det är inte ett adminsystem — det är platsen där bolaget styrs från.',
        bullets: [
          'Wavult Group äger 6 juridiska entiteter i 4 jurisdiktioner',
          'Alla system och data är kopplade till rätt bolag',
          'Din roll avgör vad du ser och vad du kan göra',
          'Systemet kör live — ändringar slår igenom direkt',
        ],
        callout: { type: 'tip', text: 'Tryck Hoppa över om du redan känner systemet.' },
        position: 'center',
        icon: '🏛️',
      },
      {
        id: 'entity-switcher',
        route: '/',
        title: 'Bolagsväxlaren — välj entitet',
        description: 'Uppe till vänster i menyn hittar du bolagsväxlaren. Den styr vilket bolag all data visas för. "Wavult Group" visar konsoliderad data för hela koncernen. Väljer du t.ex. "Landvex AB" ser du bara det bolagets data.',
        bullets: [
          '"Wavult Group" = konsoliderad vy (alla 6 bolag)',
          '"Landvex AB" = svensk B2G-verksamhet, org.nr 559141-7042',
          '"QuiXzoom Inc" = US-bolaget (Delaware)',
          'Alla finance- och legal-vyer filtreras automatiskt',
        ],
        example: 'Prova: Klicka på bolagsnamnet uppe till vänster och byt till "Landvex AB". Finansöversikten visar nu bara Landvex-data.',
        position: 'right',
        targetSelector: '[data-tour="entity-switcher"]',
        icon: '🏢',
        visual: 'entity-switcher',
      },
      {
        id: 'mission-control',
        route: '/',
        title: 'Mission Control — systemets hjärna',
        description: 'Startsidan är Mission Control: en deterministisk lista över vad som måste göras, sorterat efter kritikalitet. Systemet beräknar automatiskt vad som är blockerat, vad som brinner och vad som kan vänta. Du behöver aldrig undra vad du ska göra härnäst.',
        bullets: [
          'CRITICAL (röd) = måste göras nu, blockerar annat',
          'HIGH (amber) = viktigt denna vecka',
          'Blockerade tasks visas nedtonade — kan inte göras förrän dependency är klar',
          'Påbörja → markerar task som IN_PROGRESS',
          'Systemet uppdateras i realtid via Supabase',
        ],
        callout: { type: 'warning', text: 'Just nu är 4 kritiska tasks aktiva — bl.a. Bilda FZCO Dubai och Välj bokföringsbyrå.' },
        position: 'center',
        icon: '🎯',
        visual: 'mission-control',
      },
      {
        id: 'navigation',
        route: '/',
        title: 'Navigation — fem sektioner',
        description: 'Wavult OS är strukturerat i fem tydliga sektioner. Varje sektion har ett tydligt ansvar och en tydlig ägare. Navigera aldrig aimlessly — systemet är uppbyggt för att du alltid vet var du är.',
        bullets: [
          'COMMAND: Mission Control, Operations Center, Min vy, Alerts',
          'MONEY: Finance, Transaktioner, Simulering (Causal OS), Inköp, Lön',
          'PEOPLE: People & Governance, Organisation, CRM',
          'OPERATIONS: Milestones, Kampanjer, Submissions, Beslut, Projekt',
          'KNOWLEDGE: Knowledge Hub, Infrastruktur, Inställningar',
        ],
        callout: { type: 'tip', text: 'Tangentbordsgenväg: Cmd+K öppnar global sökning i hela systemet.' },
        position: 'right',
        icon: '🧭',
      },
      {
        id: 'bos-tasks',
        route: '/',
        title: 'BOS — Behavioral Operating System',
        description: 'Bakom Mission Control finns BOS: ett deterministic state machine som hanterar alla tasks, beroenden och state-transitions. Varje task har exakt ett state, exakt en ägare och exakt ett validerade nästa steg. Systemet blockerar automatiskt ogiltiga övergångar.',
        bullets: [
          'REQUIRED → kan startas (inga blockers)',
          'BLOCKED → dependency måste slutföras först',
          'IN_PROGRESS → någon arbetar på detta',
          'DONE → slutfört och verifierat',
          'FAILED → deadline passerad, kräver åtgärd',
        ],
        example: 'Varje uppgift visar varför den är blockerad: "Blockerad av: Wavult Group FZCO måste bildas först"',
        position: 'center',
        icon: '⚙️',
      },
      {
        id: 'finance',
        route: '/finance',
        title: 'Finance — ekonomisk kontroll',
        description: 'Finance-modulen ger dig full ekonomisk kontroll per bolag och på koncernnivå. Här hittar du likviditetsöversikten, transaktionsflöden, intercompany-fakturering och skatteplanering. Allt är kopplat till rätt bolag via bolagsväxlaren.',
        bullets: [
          'Kassan idag: ~500 000 SEK (estimerat)',
          'Burn rate: ~45 000 SEK/mån',
          'Runway: ~333 dagar',
          'Intercompany: IP-licens (5-15%) + management fees (8-15%) till Dubai',
          'Revisor: ännu inte vald — KRITISK uppgift',
        ],
        callout: { type: 'warning', text: 'Landvex AB har noll bokföring. Personligt straffansvar. Välj revisor denna vecka.' },
        position: 'center',
        icon: '💰',
        visual: 'finance',
      },
      {
        id: 'causal-os',
        route: '/causal-os',
        title: 'Causal OS — finansiell simulering',
        description: 'Causal OS är systemets finansiella hjärna. Drag i reglage och se direkt hur beslut påverkar kassan, runway och intäkterna. Alla variabler är kausalt kopplade — ändrar du zoomer-count ser du automatiskt effekten på intäkter och runway.',
        bullets: [
          'Scenarioengine: Basfall, Optimistiskt, Pessimistiskt',
          'Dag-för-dag cashflow 365 dagar framåt',
          'Decision Impact Calculator: "Vad händer om vi anställer en säljare?"',
          'Systemvarningar: "Kassa går under 0 om X dagar"',
        ],
        example: 'Prova: Drag i "Landvex-kunder" till 5 → se hur runway ökar med ~180 dagar.',
        position: 'center',
        icon: '🧠',
      },
      {
        id: 'system-graph',
        route: '/system-graph',
        title: 'System Graph — levande infrastrukturkarta',
        description: 'System Graph är en realtids-karta över hela Wavult Groups tekniska infrastruktur. Klicka på valfri nod för att se detaljer, beroenden och ägare. I Operator Mode kan du initiera actions — restart, scale, reroute — via Command Layer.',
        bullets: [
          '17 noder: ECS-services, databaser, S3, Cloudflare, GitHub, Identity Core',
          'Live health check: kritiska tjänster uppdateras var 10s',
          'Grupperat i: Customer Experience, Core Services, Data Layer, Automation',
          'Operator Mode: initiera commands via Command & Control Layer',
          'Klicka en nod → "Vad är det här?" på vanligt språk',
        ],
        callout: { type: 'info', text: 'Identity Core visas som "parallel build" — redo för migration när Erik ger order.' },
        position: 'center',
        icon: '🌐',
        visual: 'system-graph',
      },
      {
        id: 'knowledge-hub',
        route: '/knowledge',
        title: 'Knowledge Hub — allt teamet behöver veta',
        description: 'Knowledge Hub är Wavult Groups samlade kunskapsbank. Här hittar du bolagsstruktur, GTM-strategi, juridik, policydokument och utbildningar. Alla 21 kurser i Academy är obligatoriska för Thailand Workcamp.',
        bullets: [
          '37 dokument: juridik, finans, GTM, policyer, teknisk arkitektur',
          '21 kurser i Academy: från "Dag 1" till "Code of Conduct"',
          'ZoomerCert: certifiering för QuiXzoom-fältpersonal',
          'Kunskapsgraf: visuell karta över hur entiteter hänger ihop',
          'Alla policydokument: CoC, GDPR, Travel & Expense, AUP',
        ],
        example: 'Börja med kursen "Ny teammedlem — Dag 1" (12 min) för snabbast möjlig orientering.',
        position: 'center',
        icon: '📚',
        visual: 'knowledge',
      },
      {
        id: 'people-governance',
        route: '/people-governance',
        title: 'People & Governance — performance och möten',
        description: 'People & Governance är inte ett HR-system — det är ett performance control system. Varje person är en prestationsenhet med OKR, delivery rate och en automatisk consequence engine. Låg performance triggar automatiskt uppföljningsmöten.',
        bullets: [
          'Performance Engine: delivery rate (45%) + deadline accuracy (30%) + OKR score (25%)',
          '5 nivåer: CRITICAL / LOW / MEETING / EXCEEDING / EXCEPTIONAL',
          'Q2 2026 OKR för alla 5 teammedlemmar inlagda',
          'Styrelsemöten, ledningsgruppsmöten, medarbetarsamtal — allt loggat',
          'Mandatory structure: 1:1 kan inte markeras klar utan alla 4 fält',
        ],
        callout: { type: 'info', text: 'Alla teammedlemmar ska vara certifierade i Academy senast Thailand Workcamp (11 april).' },
        position: 'center',
        icon: '👥',
      },
      {
        id: 'thailand',
        route: '/',
        title: 'Thailand Workcamp — 11 april 2026',
        description: 'Om 14 dagar samlas hela teamet i Bangkok för Wavult Groups officiella projektstart. Vecka 1: utbildning och certifiering. Vecka 2+: intensiv build-sprint för QuiXzoom MVP och Landvex beta.',
        bullets: [
          'Plats: Nysa Hotel, Bangkok — Sukhumvit 13',
          'Leon förhandlar: 3 rum + ev lokal (Arthur är kontakt)',
          'Mål: QuiXzoom redo för Sverige-lansering juni 2026',
          'Krav: Alla Academy-kurser klara + ZoomerCert tagen',
          'Du är nu inloggad och redo. Börja med Mission Control.',
        ],
        callout: { type: 'tip', text: 'Klicka på Mission Control i navigationen för att se dina kritiska uppgifter.' },
        position: 'center',
        icon: '🇹🇭',
      },
    ],
  },
]
