import { Router } from 'express'

const router = Router()

// 1000 förfyllda kreativa API-kombinationsidéer
// Kategorierna: smart home, fintech, hälsa, produktivitet, underhållning, logistik, e-handel, social, miljö, utbildning
const IDEA_SEEDS = [
  // Smart Home & IoT
  "Tänk om din kaffebryggare läste din kalender och hade kaffe klart 10 min innan första mötet? ☕",
  "Kombinera väder-API + Spotify: automatisk 'regndag-playlist' när det regnar utanför! 🌧️🎵",
  "Din kylskåpskamera + OpenAI = en chef som vet vad du har hemma och föreslår recept! 🍕",
  "Smarta lampor + Calm API: rummet dimmar automatiskt 30 min innan din satta sängtid 🌙",
  "Temperatur-sensor + Uber API: din bil startar och värmer upp sig 15 min innan du brukar åka! 🚗",
  "Trädgårdsvattnare + väder-API: vattnar aldrig när det ska regna, sparar 40% vatten 💧",
  "Dörrklocka + Twilio: AI känner igen dina grannar och skickar 'din granne är här!'-notis 🔔",
  "Fitness-tracker + Uber Eats: beställer hälsosam mat när du bränt tillräckligt med kalorier 🥗",
  "Rörelsedetektor + Spotify: musik startar automatiskt i vilket rum du går in i 🎶",
  "Smart elverk + elbils-API: laddar bilen när elpriset är som lägst under natten ⚡",

  // Fintech & Ekonomi
  "Bankkonto-API + AI: 'Hej, du spenderade 23% mer på kaffe i mars. Vill du sätta ett tak?' ☕💰",
  "Kryptopriser + Slack: bot som pingar dig när Bitcoin sjunker under ditt köppris 📉",
  "Faktura-API + Google Calendar: deadline-påminnelser läggs in automatiskt i din kalender 📅",
  "Aktiekurs-API + väder-API: korrelera om börsen verkligen går ner när det är måndag och regnigt 📊",
  "Resekvitton + OCR-API: skanna alla kvitton med kameran, allt bokförs automatiskt 🧾",
  "Klarna-API + budget-app: 'Du har 3 aktiva BNPL-köp. Totalt: 4 500 kr kvar att betala' 💳",
  "Swish-API + delade boenden: dela automatiskt räkningar med din rumskamrat 🏠",
  "Skattedeklaration-API + bankdata: pre-fyll hela din deklaration automatiskt 📋",
  "Valutakurs-API + reseplanering: bästa tid att växla pengar inför utlandsresa 💱",
  "Sparkonto-API + FinTech AI: 'Om du skippar en latte per dag sparar du 12 600 kr/år' ☕→🏖️",

  // Hälsa & Wellness
  "Sömn-tracker + Spotify: analyserar vilken musik som ger bäst sömn och rekommenderar 😴",
  "Blodtrycks-API + AI: skickar rapport till din läkare automatiskt om värdet stiger ❤️",
  "Steg-räknare + restaurang-API: föreslår restauranger på lagom avstånd för promenad 🚶🍽️",
  "Meditation-app + kalender: bokar automatiskt in meditationspauser när du har back-to-back möten 🧘",
  "Pollen-API + astma-appen: varnar när pollenhalten är hög i din stad idag 🌸⚠️",
  "Mental hälsa-app + Spotify: spårar ditt humör och skapar personlig playlist baserat på känsla 🎵❤️",
  "Receptfritt läkemedel + apoteks-API: påminner när ditt lager håller på att ta slut 💊",
  "Hydrations-tracker + kalender: påminner dig att dricka vatten baserat på hur aktiv dagen är 💧",
  "UV-index API + hudvårds-app: 'Idag är UV-index 8. Ta på solkräm!' ☀️",
  "Menscykel-app + recept-API: föreslår matlagning baserat på vart i cykeln du är 🌿",

  // Produktivitet & Arbete
  "E-post + AI: sammanfattar alla olästa mail till tre bullet points varje morgon 📧✨",
  "Slack-API + kalender: 'Du har inte tagit paus på 3 timmar. 5 min stretch?' 🧘‍♂️",
  "GitHub-API + team-notiser: 'Leon har pushat kod men Johan har inte reviewat på 2 dagar' 🐛",
  "Mötes-transkription + AI: genererar action points och skickar till alla deltagare direkt 📝",
  "LinkedIn + AI: hittar gemensamma intressen med din nästa mötes-person för small talk 🤝",
  "Notion + Spotify: spelar lofi-musik automatiskt när du öppnar din 'Deep Work'-sida 🎧",
  "Tidszons-API + kalender: 'Din kund i Tokyo har klockan 23:00. Kanske byt tid på mötet?' 🌍",
  "Jira + AI: 'Det här buggen verkar ha introducerats i commit abc123 av Johan förra veckan' 🔍",
  "Zoom-API + AI: transkriberar och summerar varje möte, sparar i Notion automatiskt 📹",
  "Faktura-status + CRM: uppdaterar kundkortet automatiskt när faktura betalas 💼",

  // Underhållning & Gaming
  "Spotify + mood-tracker: om du lyssnat på sad songs i 3 timmar, frågar boten 'mår du bra?' 🎵💙",
  "Netflix + väder: rekommenderar film baserat på väder och tid på dygnet 🎬🌧️",
  "Steam + AI: 'Du har 47 ospelda spel. Här är topp 3 baserat på hur lång tid du har idag' 🎮",
  "YouTube + AI: 'Du har sett 6 YouTube Shorts och det är dags för jobbet. Avsluta?' ⏰",
  "Twitch + kalender: påminner när din favorit-streamer går live baserat på schema 🎮📺",
  "Goodreads + AI: 'Du läser i snitt 20 min/dag. Den här boken tar dig 12 dagar' 📚",
  "IMDb + Spotify: skapar soundtrack-playlist till filmer du just sett 🎬🎵",
  "Board game API + väder: föreslår brädspel för antalet spelare och hur lång tid ni har 🎲",
  "Podcasts + AI: sammanfattar 3 timmar podcast till 5 minuters läsning varje vecka 🎧",
  "Spotify + AI: 'Den här låten liknar 8 andra i din playlist. Vill jag ta bort dubbletten?' 🎵",

  // Logistik & Transport
  "Paket-API + kalender: bokar automatiskt in leveranstider när du är hemma 📦",
  "Trafikdata + kalender: skickar 'Lämna nu!' när trafiken börjar byggas upp mot mötet 🚗",
  "Bränslepris-API + GPS: hittar billigaste macken längs din planerade rutt ⛽",
  "Cykeldelningstjänst + väder: 'Regn om 20 min. Ta tunnelbanan istället!' 🚲🌧️",
  "Tåg-API + kalender: bokar automatiskt det billigaste tåget till ditt nästa möte 🚄",
  "Flygbolag-API + AI: hittar billigaste veckan att flyga baserat på dina semesterdagar ✈️",
  "Parkeringsapp + kalender: reserverar parkering automatiskt för möten i nya städer 🅿️",
  "DHL-API + Slack: notifierar hela teamet när kundleveransen är på väg 📦👥",
  "Elbils-laddning + Maps: planerar rutten med laddningsstopp inkluderade 🔋🗺️",
  "Uber-API + schemaläggning: bokar taxi automatiskt för flygavgångars morgnar 🚖✈️",

  // E-handel & Retail
  "Prissänknings-API + wishlist: notifierar när din önskelista-produkt sjunker 20% 🛍️",
  "Lagerstatus + Zapier: 'Det sista paret skor i din storlek finns nu. Köp nu!' 👟⚡",
  "Returer + AI: 'Du returnerar 40% av dina klädinköp. Vill du ha stylingtips?' 👗",
  "Rabattkoder + AI: söker automatiskt igenom internet efter bästa koden vid checkout 💰",
  "Prenumerations-API: 'Du har 14 aktiva prenumerationer. 3 av dem har du inte använt på 60 dagar' 📱",
  "Amazon-API + recept: lägger automatiskt till saknade ingredienser i varukorgen 🛒🍳",
  "Klädstorlek + AI: rekommenderar rätt storlek baserat på dina tidigare köp 👔",
  "Prishistorik-API + payday: notifierar om bra deals dagen efter löning 💸",
  "Shopify + AI: genererar produktbeskrivningar automatiskt från produktbilder 📸✍️",
  "Kundrecensioner + AI: sammanfattar 200 recensioner till 'Folk säger...' 📊",

  // Social & Community
  "LinkedIn + event-API: 'Det är en konferens om ditt ämne i din stad nästa vecka' 🎤",
  "Instagram + AI: föreslår bästa tid att posta baserat på när dina följare är aktiva 📱",
  "Twitter + sentiment-API: mäter hur folk känner om ditt varumärke i realtid 🌡️",
  "Dating-app + kalender: bokar automatiskt in en stund för dejten utan att krocka 💑",
  "Grannskaps-app + väder: 'Perfekt grill-väder idag. Vill du bjuda grannarna?' 🌞🍖",
  "Eventbrite + vänner: hittar events som alla dina vänner skulle gilla 🎉",
  "Discord + AI: 'Tre av dina vänner pratar om samma spel. Vill du gå med?' 🎮",
  "Meetup + intresse-profil: rekommenderar lokala grupper baserat på dina hobbys 🤝",
  "Reddit + AI: daglig sammanfattning av de bästa trådarna i dina favoritkategorier 📰",
  "Spotify + social: 'Din vän lyssnar på samma artist just nu. Synka?' 🎵👥",

  // Miljö & Hållbarhet
  "CO2-utsläpps-API + resebokning: 'Det här flyget är 3x mer utsläpp än tåget. Byt?' 🌍",
  "Elpriser + hushållsapparater: kör diskmaskinen automatiskt när elen är billigast och grönast ⚡🌱",
  "Matsvinn-app + recept: 'Du har ägg, ost och broccoli som snart går ut. Quiche?' 🍳",
  "Sopsortering-API + bildanalys: ta bild på sopan, AI berättar i vilken tunna den går 🗑️",
  "Transportsätt + CO2: visar koldioxidavtrycket för varje reserutt du överväger 🌱",
  "Energiförbrukning + AI: 'Din TV på standby kostar 450 kr/år. Stäng av helt?' 📺💡",
  "Lokala producenter-API + mat: hittar närmaste ekologiska alternativ till din varukorg 🥦",
  "Väder + jordbruk-API: hjälper hobbyodlare med rätt planteringsdagar 🌱📅",
  "Secondhand-API + garderob: 'Den här jackans nya pris är 2 400 kr. Begagnat: 350 kr' 👗♻️",
  "Vattenmätare + AI: analyserar vattenförbrukning och hittar läckor automatiskt 💧🔍",

  // Utbildning & Lärande
  "Kurs-API + kalender: schemalägger automatiskt 20 min lärande varje dag baserat på när du är fri 📚",
  "Flashcard-app + Spotify: 'Du är som bäst på att lära dig kl 9-11. Här är din morgonskurs' 🎓",
  "YouTube + AI: genererar quiz automatiskt från videon du just tittade på 📹❓",
  "Språk-app + Netflix: 'Den här serien finns på spanska. Perfekt för dina B2-mål!' 🌍📺",
  "Khan Academy + kalender: skapar studieplan för din examen baserat på datum och nuläge 📅🎯",
  "Böcker + AI: 'Du är 23% igenom. Baserat på din takt klart om 8 dagar' 📖⏱️",
  "Mentor-plattform + LinkedIn: matchar dig med mentorer som har exakt din karriärväg 🤝",
  "Uppgifter-API + AI: förklarar svåra matematikuppgifter steg för steg med emojis 🧮✨",
  "Certifierings-API + jobb-sajt: notifierar när du är nära en certifiering som krävs för drömjobbet 🏆",
  "Studiegrupp-app + kalender: hittar tider när alla i gruppen är lediga 📅👥",
]

// Generera ytterligare 900 via template-expansion
function generateMoreIdeas(): string[] {
  const apis = [
    "Stripe", "Twilio", "SendGrid", "OpenAI", "Google Maps", "Spotify", "Slack",
    "GitHub", "Shopify", "Klarna", "Swish", "AWS", "Firebase", "Supabase",
    "Mixpanel", "Apollo", "Perplexity", "DeepSeek", "ElevenLabs", "Mapbox"
  ]
  const contexts = [
    "din morgonrutin", "ditt arbetsflöde", "din hälsa", "din ekonomi", "ditt hem",
    "ditt företag", "dina hobbys", "din träning", "din mat", "dina vänner"
  ]
  const actions = [
    "automatiserar", "optimerar", "personaliserar", "analyserar", "förbättrar",
    "förenklar", "spårar", "notifierar om", "lär sig av", "förutser"
  ]
  const benefits = [
    "sparar du 2 timmar/vecka", "sänker kostnaden med 30%", "minskar stress",
    "ökar produktiviteten", "ger dig full kontroll", "tar bort manuellt arbete",
    "ger dig insikter du saknade", "automatiserar det tråkiga", "frigör tid för det viktiga"
  ]
  const emojis = ["🚀", "⚡", "🎯", "💡", "🔥", "✨", "🌟", "💎", "🎁", "🤖"]

  const generated: string[] = []
  for (let i = 0; i < 900; i++) {
    const api1 = apis[Math.floor(Math.random() * apis.length)]
    const api2 = apis[Math.floor(Math.random() * apis.length)]
    const ctx = contexts[Math.floor(Math.random() * contexts.length)]
    const action = actions[Math.floor(Math.random() * actions.length)]
    const benefit = benefits[Math.floor(Math.random() * benefits.length)]
    const emoji = emojis[Math.floor(Math.random() * emojis.length)]

    generated.push(`Kombinera ${api1} + ${api2}: ${action} ${ctx} automatiskt — och ${benefit}! ${emoji}`)
  }
  return generated
}

const ALL_IDEAS = [...IDEA_SEEDS, ...generateMoreIdeas()]

// POST /v1/bee/idea — hämta en kreativ API-idé
router.post('/v1/bee/idea', async (req, res) => {
  const { context = 'general', use_ai = true } = req.body

  // 30% chans att använda live AI, annars från seed-listan
  if (use_ai && Math.random() < 0.3) {
    const perpKey = process.env.PERPLEXITY_API_KEY
    const openaiKey = process.env.OPENAI_API_KEY

    const systemPrompt = `Du är Apifly Bee — en liten glad bi-maskot för en API-integrationsplattform.
Din uppgift: generera EN kreativ, rolig och konkret idé om hur man kan kombinera 2-3 APIer för att lösa ett vardagsproblem.

Regler:
- Exakt 1-3 meningar. Inte längre.
- Alltid konkret och relaterbar för en svensk användare
- Alltid ett roligt emoji i slutet
- Nämn vilka APIs som används
- Gärna lite humor och "tänk om..."-känsla
- Språk: Svenska

Exempel på bra idéer:
"Tänk om din klocka kunde känna av att du är seg och automatiskt beställa en latte? ☕"
"Med väder-API + Uber: taxi bokas automatiskt när det börjar regna! 🌧️🚗"

Generera EN ny kreativ idé nu.`

    // Prova Perplexity (web-aware, mer aktuella idéer)
    if (perpKey) {
      try {
        const r = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${perpKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'sonar',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Ge mig en kreativ API-kombinationsidé för kontexten: ${context}. Bara idén, inget annat.` }
            ],
            max_tokens: 150,
            temperature: 0.95,
          }),
          signal: AbortSignal.timeout(8000),
        })
        if (r.ok) {
          const data = await r.json() as any
          const idea = data.choices?.[0]?.message?.content?.trim()
          if (idea && idea.length > 20) {
            return res.json({ idea, source: 'perplexity' })
          }
        }
      } catch { /* fallback */ }
    }

    // Prova OpenAI som backup
    if (openaiKey) {
      try {
        const r = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Ge mig en kreativ API-kombinationsidé. Bara idén.` }
            ],
            max_tokens: 150,
            temperature: 0.95,
          }),
          signal: AbortSignal.timeout(8000),
        })
        if (r.ok) {
          const data = await r.json() as any
          const idea = data.choices?.[0]?.message?.content?.trim()
          if (idea && idea.length > 20) {
            return res.json({ idea, source: 'openai' })
          }
        }
      } catch { /* fallback */ }
    }
  }

  // Fallback: slumpmässig från 1000 seed-idéer
  const randomIdea = ALL_IDEAS[Math.floor(Math.random() * ALL_IDEAS.length)]
  res.json({ idea: randomIdea, source: 'seed' })
})

// GET /v1/bee/ideas/batch?n=10 — hämta flera idéer på en gång (för preloading)
router.get('/v1/bee/ideas/batch', (req, res) => {
  const n = Math.min(parseInt(req.query.n as string) || 10, 50)
  const shuffled = [...ALL_IDEAS].sort(() => Math.random() - 0.5).slice(0, n)
  res.json({ ideas: shuffled, total: ALL_IDEAS.length })
})

export default router
