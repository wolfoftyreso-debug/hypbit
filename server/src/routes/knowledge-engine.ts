// ─── Knowledge Engine ──────────────────────────────────────────────────────────
// Reaktivt AI-drivet kunskapssystem — genererar och uppdaterar utbildningsartiklar
// automatiskt när systemet förändras (nya bolag, API-integrationer, ECS-tjänster, domäner).
//
// Routes:
//   POST /api/knowledge/event              — ta emot systemevent → trigga AI-generering
//   GET  /api/knowledge/articles           — lista alla artiklar
//   GET  /api/knowledge/articles/:slug     — hämta specifik artikel
//   GET  /api/knowledge/articles/category/:category — filtrera per kategori
//   POST /api/knowledge/generate           — manuellt trigga generering

import { Router, Request, Response } from 'express'
import { supabase } from '../supabase'

export const knowledgeEngineRouter = Router()

// ─── AI Content Generator ──────────────────────────────────────────────────────

async function generateArticle(eventType: string, entity: Record<string, unknown>): Promise<string> {
  const perplexityKey = process.env.PERPLEXITY_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY

  const prompt = buildPrompt(eventType, entity)

  // Försök med Perplexity först, fallback till OpenAI
  if (perplexityKey) {
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [
            {
              role: 'system',
              content: 'Du är en pedagogisk skribent för Wavult Group. Skriv alltid på svenska. Håll artiklarna kortfattade (max 400 ord), konkreta och kopplade till Wavult-verksamheten. Ton: klar och pedagogisk, inte akademisk.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      })

      if (response.ok) {
        const data = await response.json() as { choices: Array<{ message: { content: string } }> }
        return data.choices[0].message.content
      }
    } catch (err) {
      console.error('[knowledge-engine] Perplexity fel:', err)
    }
  }

  // Fallback: OpenAI
  if (openaiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Du är en pedagogisk skribent för Wavult Group. Skriv alltid på svenska. Håll artiklarna kortfattade (max 400 ord), konkreta och kopplade till Wavult-verksamheten. Ton: klar och pedagogisk, inte akademisk.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      })

      if (response.ok) {
        const data = await response.json() as { choices: Array<{ message: { content: string } }> }
        return data.choices[0].message.content
      }
    } catch (err) {
      console.error('[knowledge-engine] OpenAI fel:', err)
    }
  }

  // Sista fallback: statisk artikel
  return `# ${String((entity as Record<string, unknown>).name ?? eventType)}

*Artikel genereras automatiskt av Wavult Knowledge Engine.*

Det här är ett ${eventType}-event för ${String((entity as Record<string, unknown>).name ?? 'okänd entitet')}.

Artikeln genererades inte korrekt — kontrollera PERPLEXITY_API_KEY eller OPENAI_API_KEY i miljön.
`
}

function buildPrompt(eventType: string, entity: Record<string, unknown>): string {
  const prompts: Record<string, string> = {
    'company.added': `
Vi har precis registrerat ett nytt bolag: ${entity.name} (${entity.type}) i ${entity.jurisdiction}.

Skriv en utbildningsartikel (300-400 ord, markdown) som lär vårt team om:
1. Vad denna bolagsform är (${entity.type}) och varför vi valde den
2. Hur jurisdiktionen (${entity.jurisdiction}) gynnar vår struktur
3. Praktiska konsekvenser för teamet (skatter, bankering, compliance)
4. Hur detta passar in i Wavult Groups övergripande bolagsstruktur

Skriv på svenska. Klar, pedagogisk stil. Börja med en # rubrik med bolagets namn.
`,
    'api.integrated': `
Vi har precis integrerat ${entity.name} API i vårt system.

Skriv en utbildningsartikel (300-400 ord, markdown) som lär teamet:
1. Vad ${entity.name} gör och varför vi använder det
2. Hur det fungerar tekniskt (nyckelkoncept, autentisering, viktiga endpoints)
3. Hur det passar in i Wavults tech stack
4. Vanliga fallgropar och best practices

Skriv på svenska. För en teknisk målgrupp. Inkludera kodexempel om det hjälper.
`,
    'ecs.deployed': `
Vi har precis driftsatt en ny tjänst: ${entity.name} på AWS ECS (region eu-north-1).

Skriv en utbildningsartikel (250-350 ord, markdown) som förklarar:
1. Vad ${entity.name} gör i vår arkitektur
2. Hur den kopplar till andra tjänster
3. Viktiga mätvärden att bevaka och hur man felsöker
4. Vilken affärslogik den hanterar

Skriv på svenska.
`,
    'domain.added': `
Vi har precis lagt till domänen ${entity.name} i vår infrastruktur.

Skriv en utbildningsartikel (200-300 ord, markdown) som förklarar:
1. Vad denna domän är till för och vilken produkt/tjänst den servar
2. Hur DNS och Cloudflare-routing fungerar för den
3. Skillnaden mellan pending och active-status
4. Hur nameservers fungerar och varför vi använder Cloudflare

Skriv på svenska.
`,
  }

  return prompts[eventType] ?? `Skriv en kort utbildningsartikel på svenska om: ${JSON.stringify(entity)}`
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function entityTypeFromEvent(eventType: string): string {
  const map: Record<string, string> = {
    'company.added': 'company',
    'api.integrated': 'api',
    'ecs.deployed': 'infrastructure',
    'domain.added': 'infrastructure',
  }
  return map[eventType] ?? 'process'
}

function categoryFromEvent(eventType: string): string {
  const map: Record<string, string> = {
    'company.added': 'company',
    'api.integrated': 'api',
    'ecs.deployed': 'infrastructure',
    'domain.added': 'infrastructure',
  }
  return map[eventType] ?? 'process'
}

// ─── POST /api/knowledge/event ────────────────────────────────────────────────
// Ta emot systemevent och trigga AI-generering

knowledgeEngineRouter.post('/event', async (req: Request, res: Response) => {
  try {
    const { event_type, entity } = req.body as { event_type: string; entity: Record<string, unknown> }

    if (!event_type || !entity) {
      return res.status(400).json({ error: 'event_type och entity krävs' })
    }

    // 1. Spara event
    const { data: eventData, error: eventError } = await supabase
      .from('knowledge_events')
      .insert({
        event_type,
        entity_type: entityTypeFromEvent(event_type),
        entity_id: String(entity.id ?? entity.name ?? ''),
        entity_name: String(entity.name ?? ''),
        payload: entity,
      })
      .select()
      .single()

    if (eventError) {
      console.error('[knowledge-engine] Kunde inte spara event:', eventError.message)
    }

    // 2. Generera artikel via AI
    console.log(`[knowledge-engine] Genererar artikel för ${event_type}: ${entity.name}`)
    const contentMarkdown = await generateArticle(event_type, entity)

    const slug = slugify(`${categoryFromEvent(event_type)}-${String(entity.name ?? event_type)}`)
    const title = String(entity.name ?? event_type)
    const category = categoryFromEvent(event_type)

    // 3. Upsert artikel (uppdatera om slug redan finns)
    const { data: article, error: articleError } = await supabase
      .from('knowledge_articles')
      .upsert(
        {
          slug,
          title,
          category,
          content_markdown: contentMarkdown,
          source_type: event_type,
          source_id: String(entity.id ?? entity.name ?? ''),
          auto_generated: true,
          last_updated: new Date().toISOString(),
          metadata: { entity, event_type, generated_at: new Date().toISOString() },
        },
        { onConflict: 'slug' }
      )
      .select()
      .single()

    if (articleError) {
      return res.status(500).json({ error: articleError.message })
    }

    // 4. Markera event som processerat
    if (eventData?.id) {
      await supabase
        .from('knowledge_events')
        .update({ processed: true })
        .eq('id', eventData.id)
    }

    return res.status(201).json({ article })
  } catch (err: unknown) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Serverfel' })
  }
})

// ─── GET /api/knowledge/articles ─────────────────────────────────────────────

knowledgeEngineRouter.get('/articles', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('knowledge_articles')
      .select('id, slug, title, category, content_markdown, source_type, auto_generated, last_updated, created_at, metadata')
      .order('last_updated', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.json(data ?? [])
  } catch (err: unknown) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Serverfel' })
  }
})

// ─── GET /api/knowledge/articles/category/:category ──────────────────────────

knowledgeEngineRouter.get('/articles/category/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params

    const { data, error } = await supabase
      .from('knowledge_articles')
      .select('id, slug, title, category, content_markdown, source_type, auto_generated, last_updated, created_at, metadata')
      .eq('category', category)
      .order('last_updated', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.json(data ?? [])
  } catch (err: unknown) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Serverfel' })
  }
})

// ─── GET /api/knowledge/articles/:slug ───────────────────────────────────────

knowledgeEngineRouter.get('/articles/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params

    const { data, error } = await supabase
      .from('knowledge_articles')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) return res.status(404).json({ error: 'Artikel hittades inte' })
    return res.json(data)
  } catch (err: unknown) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Serverfel' })
  }
})

// ─── POST /api/knowledge/generate ────────────────────────────────────────────
// Manuellt trigga generering för ett entity

knowledgeEngineRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const { event_type, entity } = req.body as { event_type: string; entity: Record<string, unknown> }

    if (!event_type || !entity) {
      return res.status(400).json({ error: 'event_type och entity krävs' })
    }

    const contentMarkdown = await generateArticle(event_type, entity)
    const slug = slugify(`${categoryFromEvent(event_type)}-${String(entity.name ?? event_type)}`)
    const title = String(entity.name ?? event_type)
    const category = categoryFromEvent(event_type)

    const { data: article, error } = await supabase
      .from('knowledge_articles')
      .upsert(
        {
          slug,
          title,
          category,
          content_markdown: contentMarkdown,
          source_type: event_type,
          source_id: String(entity.id ?? entity.name ?? ''),
          auto_generated: true,
          last_updated: new Date().toISOString(),
          metadata: { entity, event_type, generated_at: new Date().toISOString() },
        },
        { onConflict: 'slug' }
      )
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ article })
  } catch (err: unknown) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Serverfel' })
  }
})
