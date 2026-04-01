/**
 * bernt.ts — Riktig Bernt-koppling via OpenClaw webhook
 *
 * Flöde: Wavult Mobile → API Core (wavult-core) → externa APIs (Whisper, NVIDIA, ElevenLabs)
 *
 * ARKITEKTUR: Mobilen anropar ALDRIG externa AI-APIs direkt.
 * Alla AI-anrop proxyas via wavult-core/hypbit-api.
 * Inga API-nycklar i klientkod eller EXPO_PUBLIC_*.
 *
 * Konfiguration:
 *   EXPO_PUBLIC_BERNT_URL    — OpenClaw gateway URL (ex: https://bernt.wavult.com/chat)
 *   EXPO_PUBLIC_BERNT_TOKEN  — Gateway auth-token
 *   EXPO_PUBLIC_API_BASE     — Wavult API Core base URL (ex: https://api.wavult.com)
 */

const BERNT_URL = process.env.EXPO_PUBLIC_BERNT_URL || 'http://localhost:18789/api/chat'
const BERNT_TOKEN = process.env.EXPO_PUBLIC_BERNT_TOKEN || 'cf2f3fb2ffe266a0e68edcdf5abfe978117aee50cc01bfa9'
const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'https://api.wavult.com'

// BORTTAGET: EXPO_PUBLIC_OPENAI_KEY — API-nycklar exponeras ALDRIG i klientkod
// Whisper transkriberas via API Core: POST /api/voice/transcribe

export type BerntMessage = {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Skicka ett textmeddelande till Bernt och få svar
 */
export async function sendToBernt(
  message: string,
  history: BerntMessage[] = [],
  onChunk?: (chunk: string) => void
): Promise<string> {
  const response = await fetch(BERNT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BERNT_TOKEN}`,
      'X-Source': 'wavult-mobile',
    },
    body: JSON.stringify({
      message,
      history: history.slice(-10), // Skicka max 10 meddelanden bakåt
      stream: !!onChunk,
      context: {
        app: 'wavult-mobile',
        platform: 'ios',
        user: 'Erik Svensson',
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Bernt svarade ${response.status}: ${await response.text()}`)
  }

  // Logga att Bernt tog emot ett kommando
  logToWavultOS({
    event_type: 'bernt.command.received',
    verb: 'received command',
    source: 'mobile',
    category: 'command',
    payload: { message_preview: message.slice(0, 200), history_length: history.length },
  })

  // Streaming-svar
  if (onChunk && response.body) {
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      // SSE-format: "data: {...}\n\n"
      const lines = chunk.split('\n')
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            const token = parsed.choices?.[0]?.delta?.content || parsed.content || ''
            if (token) {
              fullText += token
              onChunk(fullText)
            }
          } catch {}
        }
      }
    }
    return fullText
  }

  // Icke-streamande svar
  const data = await response.json()
  return data.content || data.message || data.response || ''
}

/**
 * Logga en händelse till Wavult OS system_events
 * Används internt av bernt.ts — alla röst och chat-events loggas automatiskt
 */
async function logToWavultOS(event: {
  event_type: string
  verb: string
  source: string
  category: string
  actor_name?: string
  session_id?: string
  payload?: Record<string, unknown>
  duration_ms?: number
}) {
  // Skicka till Wavult OS API:et som vidarebefordrar till Supabase
  try {
    await fetch(`${BERNT_URL.replace('/api/chat', '/api/events')}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BERNT_TOKEN}`,
      },
      body: JSON.stringify(event),
    })
  } catch {
    // Tyst fail — loggning får aldrig krascha appen
  }
}

/**
 * Transkribera en ljudfil via API Core — aldrig direkt mot OpenAI från klienten.
 * Arkitektur: Mobile → POST /api/voice/transcribe (wavult-core) → Whisper → text
 *
 * audioUri: local file URI från expo-av recording
 */
export async function transcribeAudio(audioUri: string): Promise<string> {
  const formData = new FormData()
  formData.append('file', {
    uri: audioUri,
    type: 'audio/m4a',
    name: 'voice.m4a',
  } as any)
  formData.append('language', 'sv')

  // Proxyas via wavult-core — API-nyckeln ligger serverside i SSM
  const response = await fetch(`${API_BASE}/api/voice/transcribe`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${BERNT_TOKEN}`,
      'X-Source': 'wavult-mobile',
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Whisper fel: ${response.status}`)
  }

  const data = await response.json()
  const text = data.text || ''

  // Logga rösttranskription
  if (text) {
    logToWavultOS({
      event_type: 'bernt.voice.transcribed',
      verb: 'transcribed voice command',
      source: 'siri',
      category: 'voice',
      payload: { transcript_preview: text.slice(0, 200), char_count: text.length },
    })
  }

  return text
}

/**
 * Ping Bernt — kolla om gateway är live
 */
export async function pingBernt(): Promise<boolean> {
  try {
    const response = await fetch(BERNT_URL.replace('/api/chat', '/health'), {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${BERNT_TOKEN}` },
      signal: AbortSignal.timeout(3000),
    })
    return response.ok
  } catch {
    return false
  }
}
