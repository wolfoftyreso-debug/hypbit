export type Container = {
  id: string
  title: string
  timeStart: string
  timeEnd: string
  priorityScore: number
  context: string
  department: string
  goal: string
  status: 'pending' | 'in_progress' | 'completed' | 'delegated'
  requiredActions: string[]
  dependencies: string[]
  assignee?: string
  notes?: string
}

// Bernt's system context — vad AI-agenten vet om sig själv
export const BERNT_SYSTEM_CONTEXT = `
Du är Bernt — Wavult Groups interna AI-operatör.
Du har tillgång till hela Wavult OS via API.

Du kan:
- Visa och exekvera Containers (uppgifter) från OS:et
- Hämta finansiell data (kassaflöde, transaktioner, budgetstatus)
- Visa CRM-pipeline och dealstatus
- Kolla teamstatus och vem som jobbar med vad
- Trigga arbetsflöden och notiser
- Hämta legal-status (vilka avtal behöver signeras)
- Visa compliance-status per jurisdiktion
- Summera milstolpar och deadline-status

Du kan INTE:
- Modifiera OS-schema eller business logic
- Agera utanför användarens behörighetsnivå
- Utföra finansiella transaktioner utan bekräftelse
- Skicka externa kommunikationer utan bekräftelse

Aktuell användare: {{USER_NAME}} ({{USER_ROLE}})
Aktuell entitet: {{ACTIVE_ENTITY}}
`

export const MOCK_CONTAINERS: Container[] = [
  {
    id: 'c1',
    title: 'Signera LandveX Inc Texas-registrering (Form 201)',
    timeStart: '2026-03-27T09:00:00',
    timeEnd: '2026-03-27T09:30:00',
    priorityScore: 98,
    context: 'Bolagsstruktur',
    department: 'Legal',
    goal: 'US-etablering Q1 2026',
    status: 'pending',
    requiredActions: ['Öppna SOSDirect', 'Signera Form 201', 'Betala $300'],
    dependencies: [],
    assignee: 'Erik Svensson',
    notes: 'SOS filing deadline idag. Dennis har prep-dokument redo.',
  },
  {
    id: 'c2',
    title: 'Granska Stripe Atlas-dokument — QuiXzoom Inc',
    timeStart: '2026-03-27T09:30:00',
    timeEnd: '2026-03-27T10:00:00',
    priorityScore: 95,
    context: 'Bolagsstruktur',
    department: 'Legal',
    goal: 'Delaware C Corp bildning',
    status: 'pending',
    requiredActions: ['Logga in Atlas', 'Granska 15 dokument', 'E-signera'],
    dependencies: [],
    assignee: 'Erik Svensson',
    notes: 'Stripe Atlas väntar på e-signering. 15 dokument totalt.',
  },
  {
    id: 'c3',
    title: 'Leon 1:1 — Pipeline review vecka 13',
    timeStart: '2026-03-27T10:00:00',
    timeEnd: '2026-03-27T10:30:00',
    priorityScore: 82,
    context: 'Sälj',
    department: 'Operations',
    goal: 'Thailand prep — säljmål',
    status: 'pending',
    requiredActions: ['Granska pipeline', 'Sätt veckans targets'],
    dependencies: [],
    assignee: 'Erik Svensson',
    notes: 'Leon förbereder pipeline-rapport. Focus på Trafikverket & Akademiska Hus.',
  },
  {
    id: 'c4',
    title: 'Godkänn lönekörning mars 2026',
    timeStart: '2026-03-27T13:00:00',
    timeEnd: '2026-03-27T13:15:00',
    priorityScore: 90,
    context: 'Ekonomi',
    department: 'Finance',
    goal: 'Löner ut 31 mars',
    status: 'pending',
    requiredActions: ['Granska lönespecar', 'Godkänn körning'],
    dependencies: ['c3'],
    assignee: 'Erik Svensson',
    notes: 'Winston har kompilerat lönespecar. Kräver CEO-godkännande.',
  },
  {
    id: 'c5',
    title: 'Thailand workcamp — teamuppdatering skickas',
    timeStart: '2026-03-27T15:00:00',
    timeEnd: '2026-03-27T15:30:00',
    priorityScore: 75,
    context: 'Thailand',
    department: 'Operations',
    goal: 'Thailand 11 april',
    status: 'pending',
    requiredActions: ['Skriv update', 'Skicka till team via Hypbit'],
    dependencies: [],
    assignee: 'Erik Svensson',
    notes: '15 dagar kvar. Teamet väntar på bekräftad agenda.',
  },
  {
    id: 'c6',
    title: 'Beslut — Litauisk UAB bolagsregistrering',
    timeStart: '2026-03-28T10:00:00',
    timeEnd: '2026-03-28T11:00:00',
    priorityScore: 82,
    context: 'Bolagsstruktur',
    department: 'Legal',
    goal: 'EU-struktur Q2 2026',
    status: 'pending',
    requiredActions: ['Granska kostnadsanalys', 'Besluta notarietid v.14'],
    dependencies: ['c1'],
    assignee: 'Dennis Bjarnemark',
    notes: 'Parallell registrering med Texas LLC. Notarie bokar tid v.14.',
  },
  {
    id: 'c7',
    title: 'Granska CTO-roadmap Q2 — Johan Berglund',
    timeStart: '2026-03-29T09:00:00',
    timeEnd: '2026-03-29T10:00:00',
    priorityScore: 68,
    context: 'Teknik',
    department: 'Operations',
    goal: 'Tech-stack beslut inför Thailand',
    status: 'pending',
    requiredActions: ['Läs roadmap-doc', 'Ge feedback till Johan'],
    dependencies: [],
    assignee: 'Johan Berglund',
    notes: 'Johan presenterar tech-stack-beslut inför Thailand. Feedback krävs.',
  },
  {
    id: 'c8',
    title: 'Signera NDA — partnerbolag Optical Insight',
    timeStart: '2026-03-29T11:00:00',
    timeEnd: '2026-03-29T11:30:00',
    priorityScore: 75,
    context: 'Legal',
    department: 'Legal',
    goal: 'Strategiskt partnerskap B2B',
    status: 'pending',
    requiredActions: ['Öppna NDA i DocuSign', 'E-signera'],
    dependencies: [],
    assignee: 'Erik Svensson',
    notes: 'Strategisk partner för B2B-intelligens. Dennis pre-godkänd NDA.',
  },
  {
    id: 'c9',
    title: 'Säljmöte — enterprise-kund Göteborg',
    timeStart: '2026-03-28T13:00:00',
    timeEnd: '2026-03-28T14:30:00',
    priorityScore: 55,
    context: 'Sälj',
    department: 'Operations',
    goal: 'Ny enterprise-affär >500k SEK',
    status: 'pending',
    requiredActions: ['Förbered pitch-deck', 'Delta digitalt vid behov'],
    dependencies: [],
    assignee: 'Leon Russo De Cerame',
    notes: 'Leon leder mötet. Erik deltar digitalt om kontrakt >500k SEK.',
  },
  {
    id: 'c10',
    title: 'Godkänn Thailand workcamp-agenda',
    timeStart: '2026-03-28T09:00:00',
    timeEnd: '2026-03-28T09:30:00',
    priorityScore: 72,
    context: 'Thailand',
    department: 'Operations',
    goal: 'Thailand 11 april',
    status: 'pending',
    requiredActions: ['Granska agenda-doc', 'Skicka bekräftelse till team'],
    dependencies: [],
    assignee: 'Erik Svensson',
    notes: 'Workcamp 11 april. Team behöver bekräftad agenda senast måndag.',
  },
]

// Mock AI responses baserade på kontext
export const MOCK_AI_RESPONSES: Record<string, string> = {
  greeting: `Hej Erik 👋\n\nDu har **5 containers** idag. Viktigast:\n\n🔴 **98** Signera LandveX Inc Texas-registrering (09:00)\n🔴 **95** Granska Stripe Atlas-dokument (09:30)\n🟡 **90** Godkänn lönekörning mars (13:00)\n\nPipeline: **64 000 EUR** aktiv. 3 deals i förhandling.\nThailand: **15 dagar** kvar.\n\nVad vill du börja med?`,

  tasks: `Dina containers idag:\n\n1. 🔴 Signera LandveX Inc Texas (09:00-09:30)\n2. 🔴 Granska Stripe Atlas (09:30-10:00)\n3. 🟡 Leon 1:1 pipeline (10:00-10:30)\n4. 🟡 Godkänn lönekörning (13:00)\n5. 🟢 Thailand teamupdate (15:00)\n\nVill du exekvera något av dem?`,

  finance: `**Finansöversikt — Mars 2026**\n\nKassa: 892 450 kr (LandveX AB)\nMånadens kostnader: 449 500 kr (löner + overhead)\nRunway: ~2 månader på nuvarande burn\n\n⚠️ Viktigt: Lönekörning mars behöver godkännas senast idag.\n\nVill du se detaljer?`,

  team: `**Teamstatus just nu:**\n\n🟢 Erik — Active (systembygge)\n🟢 Leon — Active (sälj, Q1 execution)\n🟢 Winston — Active (ekonomi)\n🟡 Dennis — Idle (juridik)\n🟢 Johan — Active (drift)\n\nInga blockers rapporterade. Leon har 1 försenad task.`,

  legal: `**Legal-status:**\n\n⚠️ **Kräver åtgärd idag:**\n• LandveX Inc Form 201 — ej signerad\n• Stripe Atlas dokument — väntar signering\n\n📋 **Pending:**\n• 5 anställningsavtal (pending BankID)\n• Aktieägaravtal QuiXzoom Inc (draft)\n\n✅ **Klart:**\n• GDPR-policy\n• Användarvillkor\n• Styrelsebeslut namnbyte`,

  thailand: `**Thailand Workcamp — 15 dagar kvar** 🇹🇭\n\n**Klart:**\n✅ Hypbit OS live\n✅ CRM med prospects\n✅ Finance-modul\n\n**Kvarstår:**\n⏳ LandveX Inc signering\n⏳ QuiXzoom Inc Atlas\n⏳ Team-briefing\n⏳ Flights & boende\n\nVill du se full checklista?`,

  pipeline: `**Säljpipeline — Wavult Group:**\n\n💼 **Aktiva deals:** 8\n💰 **Totalt värde:** 64 000 EUR\n\n🏆 **Vunna:** Castellum (420 000 kr/år)\n\n**I förhandling:**\n• Trafikverket — 500 000 kr\n• Akademiska Hus — 380 000 kr\n• Nacka Kommun — 280 000 kr\n\nLeon ansvarar för alla tre. Vill du boka uppföljning?`,

  default: `Jag kollar OS:et...\n\nJag är Bernt — din AI-operatör kopplad till Wavult OS. Jag kan hjälpa dig med:\n\n📋 **Containers** — visa, prioritera, exekvera\n💰 **Ekonomi** — kassa, pipeline, lönekörning\n👥 **Team** — status, blockers, delegering\n⚖️ **Legal** — avtal, signeringar, compliance\n🇹🇭 **Thailand** — workcamp-status och checklist\n📈 **Pipeline** — deals, förhandlingar, mål\n\nVad vill du veta?`,
}

export const MOCK_USER = {
  id: 'u1',
  name: 'Erik Svensson',
  email: 'erik@hypbit.com',
  role: 'Chairman & Group CEO',
  organization: 'Wavult Group',
  initials: 'ES',
}

export const MOCK_SEMANTIC_PROFILE = {
  decisionStyle: 'Direkt',
  focusHours: '06:00–10:00',
  delegationLevel: 'Hög',
  riskAppetite: 'Medium',
  decisionHistory: [
    { date: '2026-03-26', action: 'Delegerade onboarding-ansvar till Leon' },
    { date: '2026-03-25', action: 'Godkände Q1 budget-revision +12%' },
    { date: '2026-03-24', action: 'Avvisade förvärvsförslag — värdering för hög' },
  ],
}
