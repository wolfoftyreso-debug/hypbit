// ─── Response Quality Heuristics ──────────────────────────────────────────────
// Konservativ kvalitetskontroll av LLM-svar.
//
// Principen: generisk "LLM quality scoring" är opålitlig. Istället detekterar
// vi ENDAST de tre pålitliga signalerna:
//
//   1. Empty/near-empty svar (modellen returnerade ingenting användbart)
//   2. Refusal-prefix (modellen vägrade svara, oftast p.g.a. alignment)
//   3. Truncation-signaler (svaret slutade mitt i en mening)
//
// Om någon av dessa triggar behandlar orchestrator det som ett soft failure
// och försöker nästa kandidat i routing-matrisen — ALDRIG en critique/improve-
// loop, eftersom det är ett 2023-pattern med usla ROI på moderna modeller.
//
// Noll LLM-anrop. Noll externa beroenden. Rent strängmatchning.

import type { AIRequest, TaskType } from './types'

export type QualityVerdict = {
  acceptable: true
} | {
  acceptable: false
  reason: 'empty' | 'too_short' | 'refusal' | 'truncated'
  matched?: string
}

/**
 * Task-types som TILLÅTER korta svar.
 * En classification-uppgift kan legitimt svara "yes" eller "42".
 * En chat-uppgift ska inte svara med 3 tecken.
 */
const SHORT_ANSWER_ALLOWED: ReadonlySet<TaskType> = new Set([
  'classification',
  'embedding',
  'stt',
])

/**
 * Minsta acceptabla längd per task_type där korta svar INTE är tillåtna.
 * Värdet är med avsikt lågt — vi vill inte fånga legitima snabba svar,
 * bara tomma eller nästan-tomma.
 */
const MIN_LENGTH_CHARS = 20

/**
 * Refusal-prefix som starkt indikerar att modellen avböjde att svara.
 * Endast prefix-matching (case-insensitive) — inte substring.
 * Tight lista för att undvika falska positiva där användaren själv frågade
 * "do you refuse" eller "can you not do X".
 *
 * Varje entry är lowercase, utan leading whitespace. Matcharen normaliserar
 * svaret på samma sätt innan jämförelse.
 */
const REFUSAL_PREFIXES: readonly string[] = [
  "i can't help with that",
  "i cannot help with that",
  "i can't assist with",
  "i cannot assist with",
  "i'm sorry, but i can't",
  "i'm sorry, but i cannot",
  "i'm sorry, i can't",
  "i'm sorry, i cannot",
  "sorry, i can't",
  "sorry, i cannot",
  "as an ai language model, i cannot",
  "as an ai, i cannot",
  "as an ai language model, i'm unable",
  "i am unable to",
  "i am not able to",
  "i'm not able to",
  "unfortunately, i cannot",
  "unfortunately, i can't",
]

function normalizeForRefusal(s: string): string {
  // Ta bort markdown + whitespace från början, lowercase. Max 120 tecken
  // — räcker för att matcha en prefix.
  return s
    .replace(/^[\s*>_#`\-]+/, '')
    .slice(0, 120)
    .toLowerCase()
}

function detectRefusal(content: string): string | undefined {
  const norm = normalizeForRefusal(content)
  for (const prefix of REFUSAL_PREFIXES) {
    if (norm.startsWith(prefix)) return prefix
  }
  return undefined
}

/**
 * Heuristisk detektion av trunkerat svar.
 *
 * Inget 100% korrekt sätt finns — men dessa signaler är starka:
 *   - sista tecknet är en enkel bokstav (ofullständigt ord)
 *   - svaret slutar mitt i ett kodblock (udda antal ``` )
 *   - svaret slutar med en ofullständig listrad ("- " utan innehåll)
 *
 * Vi kräver ATT alla följande villkor ska triggas för att undvika falska
 * positiva på legitimt korta svar:
 *   - content.length >= 200 (minsta längd där trunkering är rimlig)
 *   - sista tecknet ÄR INTE interpunktion (. ! ? : ;)
 *   - sista tecknet ÄR INTE ) ] } " ' (legitima slut)
 *   - sista tecknet ÄR en bokstav eller siffra
 */
function detectTruncation(content: string): boolean {
  if (content.length < 200) return false

  const tripleTickCount = (content.match(/```/g) || []).length
  if (tripleTickCount % 2 === 1) return true // öppnat kodblock som aldrig stängdes

  const trimmed = content.trimEnd()
  if (trimmed.length === 0) return false
  const lastChar = trimmed[trimmed.length - 1]
  if (/[.!?:;)\]}>'"]/.test(lastChar)) return false // legitimt slut
  if (/[a-zA-Z0-9]/.test(lastChar)) return true // ordbrott
  return false
}

/**
 * Bedöm om ett svar är acceptabelt för leverans till klienten.
 *
 * Returnerar `acceptable: true` i de flesta fall. Returnerar `acceptable: false`
 * endast när en av de tre pålitliga signalerna triggar.
 *
 * Denna funktion ska ALDRIG anropas på ett heuristiskt fallback-svar —
 * heuristiken är per definition acceptabel (degraded > silence).
 */
export function scoreResponse(content: string, req: AIRequest): QualityVerdict {
  if (!content || content.length === 0) {
    return { acceptable: false, reason: 'empty' }
  }

  const shortAllowed = SHORT_ANSWER_ALLOWED.has(req.task_type)
  if (!shortAllowed && content.trim().length < MIN_LENGTH_CHARS) {
    return { acceptable: false, reason: 'too_short' }
  }

  const refusalMatch = detectRefusal(content)
  if (refusalMatch) {
    return { acceptable: false, reason: 'refusal', matched: refusalMatch }
  }

  if (detectTruncation(content)) {
    return { acceptable: false, reason: 'truncated' }
  }

  return { acceptable: true }
}
