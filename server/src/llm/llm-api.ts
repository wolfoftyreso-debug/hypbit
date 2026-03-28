// LLM API — Wavult Group
// Express Router för LLM Hub
// Alla endpoints returnerar alltid 200 + LLMResult — aldrig 500 till frontend

import { Router, Request, Response } from 'express';
import { llmHub } from './llm-hub';
import type { ChatMessage } from './llm-hub';

const llmRouter = Router();

// ─── POST /llm/complete ───────────────────────────────────────────────────────
// Enkel prompt → svar
// Body: { prompt: string, system?: string }

llmRouter.post('/llm/complete', async (req: Request, res: Response) => {
  try {
    const { prompt, system } = req.body as { prompt?: string; system?: string };

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(200).json({
        text: '',
        provider: 'error',
        fallbackUsed: false,
        userMessage: 'Prompt saknas eller är tom. Ange en prompt för att fortsätta.',
      });
    }

    const result = await llmHub.complete(prompt.trim(), { system });
    return res.status(200).json(result);
  } catch (err) {
    // Detta ska aldrig hända — llmHub.complete() kastar aldrig
    // Men om det ändå händer, skyddar vi fortfarande frontend
    console.error('[LLM API] Oväntat fel i /llm/complete:', err);
    return res.status(200).json({
      text: '',
      provider: 'error',
      fallbackUsed: true,
      userMessage: 'Systemet är tillfälligt otillgängligt. Vi arbetar på det.',
    });
  }
});

// ─── POST /llm/chat ───────────────────────────────────────────────────────────
// Konversation → svar
// Body: { messages: [{role: string, content: string}][] }

llmRouter.post('/llm/chat', async (req: Request, res: Response) => {
  try {
    const { messages } = req.body as { messages?: ChatMessage[] };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(200).json({
        text: '',
        provider: 'error',
        fallbackUsed: false,
        userMessage: 'Inga meddelanden skickades. Skicka minst ett meddelande för att starta konversationen.',
      });
    }

    // Validera att varje meddelande har role och content
    const validMessages = messages.filter(
      (m): m is ChatMessage =>
        m &&
        typeof m === 'object' &&
        typeof m.role === 'string' &&
        typeof m.content === 'string' &&
        ['user', 'assistant', 'system'].includes(m.role)
    );

    if (validMessages.length === 0) {
      return res.status(200).json({
        text: '',
        provider: 'error',
        fallbackUsed: false,
        userMessage: 'Meddelandena har ogiltigt format. Varje meddelande behöver role (user/assistant/system) och content.',
      });
    }

    const result = await llmHub.chat(validMessages);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[LLM API] Oväntat fel i /llm/chat:', err);
    return res.status(200).json({
      text: '',
      provider: 'error',
      fallbackUsed: true,
      userMessage: 'Systemet är tillfälligt otillgängligt. Vi arbetar på det.',
    });
  }
});

// ─── GET /llm/status ─────────────────────────────────────────────────────────
// Visar vilka providers som är aktiva/ej konfigurerade

llmRouter.get('/llm/status', (_req: Request, res: Response) => {
  try {
    const providers = llmHub.getStatus();
    const anyAvailable = providers.some(p => p.available);

    return res.status(200).json({
      ok: anyAvailable,
      providers,
      message: anyAvailable
        ? `${providers.filter(p => p.available).length} av ${providers.length} providers aktiva`
        : 'Inga providers konfigurerade — sätt OPENAI_API_KEY eller ANTHROPIC_API_KEY',
    });
  } catch (err) {
    console.error('[LLM API] Fel i /llm/status:', err);
    return res.status(200).json({
      ok: false,
      providers: [],
      message: 'Kunde inte hämta provider-status',
    });
  }
});

export default llmRouter;
