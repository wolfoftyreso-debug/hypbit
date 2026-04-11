// ─── AI Heuristic Fallback ────────────────────────────────────────────────────
// Last-resort response när ALLA modeller i routing-matrisen har misslyckats.
//
// Principen: "Silence is failure. Degraded response is success."
//
// Detta modul returnerar NÅGOT även när hela AI-lagret är nere — en ärlig,
// task-type-medveten mall som bekräftar vad användaren bad om, summerar det
// med rent textextraktion (ingen LLM-anrop!), och ger nästa steg.
//
// Noll externa beroenden. Noll nätverksanrop. Noll LLM-calls.
// Garanterat <5 ms.

import type { AIRequest, TaskType } from './types'

const MAX_ECHO_CHARS = 240

/**
 * Extrahera den första meningen eller de första MAX_ECHO_CHARS tecknen
 * från en prompt. Deterministisk — ingen LLM-inblandning.
 */
function extractSummary(prompt: string): string {
  if (!prompt) return ''
  const trimmed = prompt.trim()
  if (trimmed.length === 0) return ''

  // Hitta första meningsslut (. ! ? följt av mellanslag/newline/slut)
  const sentenceEnd = trimmed.search(/[.!?](\s|$)/)
  if (sentenceEnd !== -1 && sentenceEnd < MAX_ECHO_CHARS) {
    return trimmed.slice(0, sentenceEnd + 1)
  }

  // Annars — första MAX_ECHO_CHARS tecknen, trunkera på ordgräns
  if (trimmed.length <= MAX_ECHO_CHARS) return trimmed
  const hardCut = trimmed.slice(0, MAX_ECHO_CHARS)
  const lastSpace = hardCut.lastIndexOf(' ')
  return (lastSpace > MAX_ECHO_CHARS / 2 ? hardCut.slice(0, lastSpace) : hardCut) + '…'
}

/**
 * Per task_type mall för degraderat svar.
 * Håller det kort, ärligt, handlingsbart.
 */
const TEMPLATES: Record<TaskType, (summary: string) => string> = {
  chat: (s) =>
    `I'm temporarily unable to reach any model to answer this properly. ` +
    `I can see you asked: "${s}". Please retry in a moment — the service is trying to recover.`,

  code: (s) =>
    `Code generation is temporarily unavailable. ` +
    `Your request was about: "${s}". ` +
    `Please retry shortly. If this persists, check the status of the AI providers or use a local model.`,

  analysis: (s) =>
    `Analysis is temporarily unavailable. ` +
    `Your request: "${s}". ` +
    `Please retry in a moment. For urgent needs, consider running the analysis against a cached previous result.`,

  embedding: (_s) =>
    `Embedding generation is temporarily unavailable. No partial result can be produced. ` +
    `Please retry in a moment.`,

  stt: (_s) =>
    `Speech-to-text is temporarily unavailable. No transcription can be produced without a working model. ` +
    `Please retry when the service recovers.`,

  classification: (s) =>
    `Classification is temporarily unavailable. Your input: "${s}". ` +
    `Defaulting to "unknown" — please retry for a real classification when the service recovers.`,

  document: (s) =>
    `Document processing is temporarily unavailable. Your request: "${s}". ` +
    `The document has been received but cannot be processed until a model is available. Please retry shortly.`,

  reasoning: (s) =>
    `Complex reasoning is temporarily unavailable. ` +
    `Your question: "${s}". ` +
    `Please retry in a moment. For urgent needs, the question can be broken down into smaller parts that may be easier to answer.`,

  creative: (s) =>
    `Creative generation is temporarily unavailable. Your prompt: "${s}". ` +
    `Please retry shortly.`,
}

/**
 * Bygg ett heuristiskt sista-ditt-svar när alla LLM-anrop misslyckas.
 *
 * Detta svar är ÄRLIGT — det säger explicit att systemet är degraderat och
 * att användaren bör försöka igen. Det försöker ALDRIG låtsas vara ett
 * riktigt LLM-svar. Det är det enda sättet att hålla "silence is failure"
 * samtidigt som man inte lurar användaren.
 *
 * Returnerar alltid en sträng. Kastar aldrig exception.
 */
export function heuristicFallback(req: AIRequest, lastError?: string): string {
  const summary = extractSummary(req.prompt || '')
  const template = TEMPLATES[req.task_type] || TEMPLATES.chat
  let body = template(summary || '(no prompt provided)')

  if (lastError) {
    // Lägg till en kompakt felkod för support/debugging — inte hela stacktrace
    const errCode = lastError.slice(0, 80).replace(/[\r\n]+/g, ' ')
    body += `\n\n[degraded-mode: ${errCode}]`
  }

  return body
}

/**
 * Bekräftelse att ett svar är ett heuristiskt fallback, inte från en modell.
 * Används av orchestrator för att markera AIResponse.model_used = 'heuristic'
 * och sätta cost_usd = 0 och cached = false.
 */
export const HEURISTIC_MODEL_MARKER = 'heuristic-fallback' as const
