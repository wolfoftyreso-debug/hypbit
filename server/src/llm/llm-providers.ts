// LLM Providers — Wavult Group
// Provider-abstraktioner för OpenAI och Anthropic
// Fallback-strategi: GPT-4o (gpt-4.6 när tillgänglig) → Claude Sonnet

export interface ILLMProvider {
  name: string;
  available(): boolean;
  complete(prompt: string, opts?: { system?: string }): Promise<string>;
  chat(messages: Array<{ role: string; content: string }>, opts?: any): Promise<string>;
}

// ─── OpenAI Provider ─────────────────────────────────────────────────────────

export class OpenAIProvider implements ILLMProvider {
  readonly name = 'openai';

  available(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }

  async complete(prompt: string, opts?: { system?: string }): Promise<string> {
    const messages: Array<{ role: string; content: string }> = [];

    if (opts?.system) {
      messages.push({ role: 'system', content: opts.system });
    }
    messages.push({ role: 'user', content: prompt });

    return this.chat(messages, opts);
  }

  async chat(messages: Array<{ role: string; content: string }>, _opts?: any): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OpenAI API key not configured');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        // Använder gpt-4o nu — byt till gpt-4.6 när modellen är tillgänglig via API
        model: 'gpt-4o',
        messages,
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${error}`);
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('OpenAI returned empty response');

    return content;
  }
}

// ─── Anthropic Provider ───────────────────────────────────────────────────────

export class AnthropicProvider implements ILLMProvider {
  readonly name = 'anthropic';

  available(): boolean {
    return !!process.env.ANTHROPIC_API_KEY;
  }

  async complete(prompt: string, opts?: { system?: string }): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('Anthropic API key not configured');

    const body: Record<string, unknown> = {
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    };

    if (opts?.system) {
      body.system = opts.system;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${error}`);
    }

    const data = await response.json() as {
      content: Array<{ type: string; text: string }>;
    };

    const content = data.content?.[0]?.text;
    if (!content) throw new Error('Anthropic returned empty response');

    return content;
  }

  async chat(messages: Array<{ role: string; content: string }>, _opts?: any): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('Anthropic API key not configured');

    // Anthropic separerar system-prompt från messages
    const systemMessages = messages.filter(m => m.role === 'system');
    const chatMessages = messages.filter(m => m.role !== 'system');

    const body: Record<string, unknown> = {
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      messages: chatMessages,
    };

    if (systemMessages.length > 0) {
      body.system = systemMessages.map(m => m.content).join('\n');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${error}`);
    }

    const data = await response.json() as {
      content: Array<{ type: string; text: string }>;
    };

    const content = data.content?.[0]?.text;
    if (!content) throw new Error('Anthropic returned empty response');

    return content;
  }
}

// Singleton-instanser
export const openAIProvider = new OpenAIProvider();
export const anthropicProvider = new AnthropicProvider();
