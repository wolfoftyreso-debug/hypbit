/**
 * Voice Agent Route — Bernt röst-agent
 *
 * Inkommande: 46elks → /voice/inbound → Whisper STT → Bernt → ElevenLabs TTS → 46elks
 * Utgående:   /voice/call → 46elks → /voice/gather → Bernt → ElevenLabs → 46elks
 */

import { Router, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'

const router = Router()

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const ELEVEN_KEY      = process.env.ELEVENLABS_API_KEY || ''
const ELEVEN_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'
const OPENAI_KEY      = process.env.OPENAI_API_KEY || ''
const ELKS_USER       = process.env.FORTYSIX_ELKS_USERNAME || ''
const ELKS_PASS       = process.env.FORTYSIX_ELKS_PASSWORD || ''
const ELKS_NUMBER     = process.env.FORTYSIX_ELKS_NUMBER || ''
const BERNT_URL       = process.env.BERNT_WEBHOOK_URL || ''
const PUBLIC_BASE     = process.env.PUBLIC_BASE_URL || 'https://api.wavult.com'

// ─── SESSION STATE (Redis i prod) ─────────────────────────────────────────────
interface CallSession {
  callId: string
  callerNumber: string
  history: Array<{ role: 'user' | 'assistant'; content: string }>
  createdAt: Date
}

const callSessions = new Map<string, CallSession>()

// Rensa gamla sessioner (äldre än 2h) var 30:e minut
setInterval(() => {
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000
  for (const [id, session] of callSessions.entries()) {
    if (session.createdAt.getTime() < twoHoursAgo) {
      callSessions.delete(id)
    }
  }
}, 30 * 60 * 1000)

// ─── HELPERS ─────────────────────────────────────────────────────────────────

async function tts(text: string): Promise<Buffer> {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE_ID}/stream`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVEN_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.8, speed: 1.0 },
      }),
    }
  )
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`ElevenLabs TTS error ${res.status}: ${errText}`)
  }
  return Buffer.from(await res.arrayBuffer())
}

async function stt(audioBuffer: Buffer, filename = 'audio.wav'): Promise<string> {
  const blob = new Blob([audioBuffer], { type: 'audio/wav' })
  const form = new FormData()
  form.append('file', blob, filename)
  form.append('model', 'whisper-1')
  form.append('language', 'sv')

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_KEY}` },
    body: form,
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Whisper STT error ${res.status}: ${errText}`)
  }
  const data = (await res.json()) as { text: string }
  return data.text
}

async function berntReply(
  message: string,
  history: Array<{ role: string; content: string }>
): Promise<string> {
  // Försök via OpenClaw/Bernt intern URL
  if (BERNT_URL) {
    try {
      const res = await fetch(`${BERNT_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history, context: 'voice_call' }),
      })
      if (res.ok) {
        const d = (await res.json()) as { reply: string }
        return d.reply
      }
    } catch {
      // Fallthrough till Claude
    }
  }

  // Fallback: direkt Claude Haiku
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY || '',
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: `Du är Bernt, Wavult Groups AI-agent. Du pratar i telefon.
Var kortfattad (max 2–3 meningar), naturlig och professionell.
Prata alltid svenska om inte den som ringer pratar engelska.
Avsluta aldrig ett samtal utan att fråga om det är något mer du kan hjälpa till med.`,
      messages: [
        ...history.map((h) => ({ role: h.role, content: h.content })),
        { role: 'user', content: message },
      ],
    }),
  })

  if (!res.ok) {
    throw new Error(`Claude API error ${res.status}`)
  }
  const d = (await res.json()) as { content?: Array<{ text: string }> }
  return d.content?.[0]?.text || 'Förlåt, jag hörde inte det. Kan du upprepa?'
}

async function serveAudio(text: string, callId: string): Promise<string> {
  const audio = await tts(text)
  const filename = `voice-${callId}-${Date.now()}.mp3`
  const filepath = path.join('/tmp', filename)
  fs.writeFileSync(filepath, audio)
  return `${PUBLIC_BASE}/voice/audio/${filename}`
}

function elksAuth(): string {
  return 'Basic ' + Buffer.from(`${ELKS_USER}:${ELKS_PASS}`).toString('base64')
}

// ─── ROUTES ──────────────────────────────────────────────────────────────────

// Servera temporära ljudfiler
router.get('/audio/:filename', (req: Request, res: Response) => {
  // Säkerhetskontroll: inga path traversal
  const filename = path.basename(req.params.filename)
  if (!filename.startsWith('voice-') || !filename.endsWith('.mp3')) {
    res.status(400).send('Invalid filename')
    return
  }
  const filepath = path.join('/tmp', filename)
  if (!fs.existsSync(filepath)) {
    res.status(404).send('Not found')
    return
  }
  res.setHeader('Content-Type', 'audio/mpeg')
  res.sendFile(filepath)
})

// ── INKOMMANDE SAMTAL ────────────────────────────────────────────────────────
router.post('/inbound', async (req: Request, res: Response) => {
  const { callid, from, to } = req.body as {
    callid?: string
    from?: string
    to?: string
  }

  if (!callid || !from) {
    res.status(400).json({ error: 'callid and from required' })
    return
  }

  console.log(`[voice] Inkommande samtal: ${from} → ${to} (callId: ${callid})`)

  callSessions.set(callid, {
    callId: callid,
    callerNumber: from,
    history: [],
    createdAt: new Date(),
  })

  try {
    const greeting = `Hej! Du har nått Wavult Group och pratar med Bernt. Hur kan jag hjälpa dig?`
    const audioUrl = await serveAudio(greeting, callid)

    res.json({
      play: audioUrl,
      next: `${PUBLIC_BASE}/voice/gather/${callid}`,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'unknown error'
    console.error(`[voice] inbound error: ${msg}`)
    res.json({ hangup: '' })
  }
})

// ── GATHER (lyssna på svar) ──────────────────────────────────────────────────
router.post('/gather/:callId', async (req: Request, res: Response) => {
  const { callId } = req.params
  const session = callSessions.get(callId)

  const { recording, result } = req.body as {
    recording?: string
    result?: string
  }

  try {
    let userText = result || ''

    // Om vi fick en inspelnings-URL — ladda ned och transkribera
    if (recording && !userText) {
      const audioRes = await fetch(recording, {
        headers: { Authorization: elksAuth() },
      })
      if (!audioRes.ok) throw new Error(`Failed to fetch recording: ${audioRes.status}`)
      const audioBuffer = Buffer.from(await audioRes.arrayBuffer())
      userText = await stt(audioBuffer)
    }

    if (!userText.trim()) {
      const audioUrl = await serveAudio(
        'Förlåt, jag hörde ingenting. Kan du upprepa?',
        callId
      )
      res.json({ play: audioUrl, next: `${PUBLIC_BASE}/voice/gather/${callId}` })
      return
    }

    console.log(`[voice] ${callId} user: "${userText}"`)

    const history = session?.history || []
    history.push({ role: 'user', content: userText })

    const reply = await berntReply(userText, history)
    history.push({ role: 'assistant', content: reply })

    if (session) {
      session.history = history.slice(-10) // max 10 vändor
    }

    console.log(`[voice] ${callId} bernt: "${reply}"`)

    const audioUrl = await serveAudio(reply, callId)

    const isEnd = /hej då|avslutar|tack och hej|goodbye|adjö/i.test(reply)
    if (isEnd) {
      res.json({ play: audioUrl, hangup: '' })
      return
    }

    res.json({
      play: audioUrl,
      next: `${PUBLIC_BASE}/voice/gather/${callId}`,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'unknown error'
    console.error(`[voice] gather error (${callId}): ${msg}`)
    try {
      const audioUrl = await serveAudio('Tekniskt fel. Försök igen.', callId)
      res.json({ play: audioUrl, hangup: '' })
    } catch {
      res.json({ hangup: '' })
    }
  }
})

// ── UTGÅENDE SAMTAL ──────────────────────────────────────────────────────────
router.post('/call', async (req: Request, res: Response) => {
  const { to, message, from_number } = req.body as {
    to?: string
    message?: string
    from_number?: string
  }

  if (!to) {
    res.status(400).json({ error: 'to number required' })
    return
  }

  const fromNumber = from_number || ELKS_NUMBER
  if (!fromNumber) {
    res.status(400).json({ error: 'No 46elks number configured' })
    return
  }

  try {
    const intro =
      message ||
      `Hej, det här är Bernt på Wavult Group. Jag ringer angående ett ärende.`
    const callId = `out-${Date.now()}`
    const audioUrl = await serveAudio(intro, callId)

    const form = new URLSearchParams({
      from: fromNumber,
      to: to,
      voice: audioUrl,
      whenhungup: `${PUBLIC_BASE}/voice/hangup/${callId}`,
      next: `${PUBLIC_BASE}/voice/gather/${callId}`,
    })

    const elksRes = await fetch('https://api.46elks.com/a1/calls', {
      method: 'POST',
      headers: {
        Authorization: elksAuth(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    })

    const data = (await elksRes.json()) as Record<string, unknown>

    if (!elksRes.ok) {
      console.error(`[voice] 46elks call error:`, data)
      res.status(502).json({ error: '46elks call failed', details: data })
      return
    }

    console.log(`[voice] Utgående samtal initierat till ${to}:`, data)

    callSessions.set(callId, {
      callId,
      callerNumber: to,
      history: [{ role: 'assistant', content: intro }],
      createdAt: new Date(),
    })

    res.json({ success: true, callId, elks: data })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'unknown error'
    console.error(`[voice] outbound error: ${msg}`)
    res.status(500).json({ error: msg })
  }
})

// ── HANGUP ───────────────────────────────────────────────────────────────────
router.post('/hangup/:callId', (req: Request, res: Response) => {
  const { callId } = req.params
  console.log(`[voice] Samtal avslutat: ${callId}`)
  callSessions.delete(callId)
  res.json({ ok: true })
})

// ── STATUS ───────────────────────────────────────────────────────────────────
router.get('/status', (_req: Request, res: Response) => {
  res.json({
    activeCalls: callSessions.size,
    calls: Array.from(callSessions.values()).map((s) => ({
      callId: s.callId,
      turns: s.history.length,
      ageSeconds: Math.round((Date.now() - s.createdAt.getTime()) / 1000),
    })),
  })
})

export default router
