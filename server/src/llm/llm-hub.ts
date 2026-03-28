// LLM Hub — Wavult Group
// Fallback-strategi: GPT-4.6 → Claude Sonnet → graceful error
// Aldrig kasta tekniska felmeddelanden till anroparen
//
// Principen: "Vi gör aldrig något fel i våra system.
//             Det är alltid något annat som strular då." — Erik Svensson

import { ILLMProvider, openAIProvider, anthropicProvider } from './llm-providers';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LLMOptions {
  system?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export type LLMProviderName = 'openai' | 'anthropic' | 'error';

export interface LLMResult {
  text: string;
  provider: LLMProviderName;
  fallbackUsed: boolean;
  userMessage?: string;
}

// ─── Graceful error-resultat ──────────────────────────────────────────────────

const GRACEFUL_ERROR: LLMResult = {
  text: '',
  provider: 'error',
  fallbackUsed: true,
  userMessage: 'Systemet är tillfälligt otillgängligt. Vi arbetar på det.',
};

// ─── LLM Hub ─────────────────────────────────────────────────────────────────

export class LLMHub {
  private providers: ILLMProvider[];

  constructor(providers: ILLMProvider[] = [openAIProvider, anthropicProvider]) {
    this.providers = providers;
  }

  /**
   * Kör en enkel prompt med fallback-kedja.
   * Returnerar alltid ett LLMResult — kastar aldrig.
   */
  async complete(prompt: string, options?: LLMOptions): Promise<LLMResult> {
    const availableProviders = this.providers.filter(p => p.available());

    if (availableProviders.length === 0) {
      console.warn('[LLM Hub] Inga providers konfigurerade — returnerar graceful error');
      return GRACEFUL_ERROR;
    }

    let lastError: unknown;
    let fallbackUsed = false;

    for (let i = 0; i < availableProviders.length; i++) {
      const provider = availableProviders[i];

      if (i > 0) {
        console.warn(`[LLM Hub] Fallback till ${provider.name} (provider ${i + 1} av ${availableProviders.length})`);
        fallbackUsed = true;
      }

      try {
        const text = await provider.complete(prompt, options);
        return {
          text,
          provider: provider.name as LLMProviderName,
          fallbackUsed,
        };
      } catch (err) {
        lastError = err;
        console.warn(`[LLM Hub] ${provider.name} misslyckades:`, err instanceof Error ? err.message : String(err));
      }
    }

    console.warn('[LLM Hub] Alla providers misslyckades — returnerar graceful error. Senaste fel:', lastError instanceof Error ? lastError.message : String(lastError));
    return GRACEFUL_ERROR;
  }

  /**
   * Kör ett konversationsflöde med fallback-kedja.
   * Returnerar alltid ett LLMResult — kastar aldrig.
   */
  async chat(messages: ChatMessage[], options?: LLMOptions): Promise<LLMResult> {
    const availableProviders = this.providers.filter(p => p.available());

    if (availableProviders.length === 0) {
      console.warn('[LLM Hub] Inga providers konfigurerade — returnerar graceful error');
      return GRACEFUL_ERROR;
    }

    // Injicera system-prompt i messages om den skickas via options
    const enrichedMessages: ChatMessage[] = [...messages];
    if (options?.system && !messages.some(m => m.role === 'system')) {
      enrichedMessages.unshift({ role: 'system', content: options.system });
    }

    let lastError: unknown;
    let fallbackUsed = false;

    for (let i = 0; i < availableProviders.length; i++) {
      const provider = availableProviders[i];

      if (i > 0) {
        console.warn(`[LLM Hub] Fallback till ${provider.name} (provider ${i + 1} av ${availableProviders.length})`);
        fallbackUsed = true;
      }

      try {
        const text = await provider.chat(enrichedMessages, options);
        return {
          text,
          provider: provider.name as LLMProviderName,
          fallbackUsed,
        };
      } catch (err) {
        lastError = err;
        console.warn(`[LLM Hub] ${provider.name} misslyckades:`, err instanceof Error ? err.message : String(err));
      }
    }

    console.warn('[LLM Hub] Alla providers misslyckades — returnerar graceful error. Senaste fel:', lastError instanceof Error ? lastError.message : String(lastError));
    return GRACEFUL_ERROR;
  }

  /**
   * Returnerar status för alla konfigurerade providers.
   */
  getStatus(): Array<{ name: string; available: boolean }> {
    return this.providers.map(p => ({
      name: p.name,
      available: p.available(),
    }));
  }
}

// Singleton — importera detta i andra moduler
export const llmHub = new LLMHub();
