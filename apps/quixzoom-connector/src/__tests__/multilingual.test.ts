import { describe, expect, it } from 'vitest';

import { detectIntent } from '../services/intent-classifier';
import { redactPii } from '../services/query-log';

describe('Multilingual intent detection', () => {
  const cases: Array<{ text: string; lang: string; trigger: string }> = [
    { text: 'Visa Stureplan nu', lang: 'sv', trigger: 'nu' },
    { text: 'Show me Stockholm now', lang: 'en', trigger: 'now' },
    { text: 'Zeig mir Berlin jetzt', lang: 'de', trigger: 'jetzt' },
    { text: 'Montre-moi Paris maintenant', lang: 'fr', trigger: 'maintenant' },
    { text: 'Muéstrame Madrid ahora', lang: 'es', trigger: 'ahora' },
    { text: 'أرني القاهرة الآن', lang: 'ar', trigger: 'الآن' },
    { text: '今の渋谷を見せて', lang: 'ja', trigger: '今' },
  ];

  it.each(cases)(
    'classifies $text as REAL_WORLD_CAPTURE ($lang)',
    ({ text, lang, trigger }) => {
      const r = detectIntent(text);
      expect(r.intent).toBe('REAL_WORLD_CAPTURE');
      expect(r.language).toBe(lang);
      expect(r.matched).toBe(trigger);
    },
  );

  const antiCases: string[] = [
    'What is the capital of France',
    'Explain photosynthesis',
    "Qu'est-ce que la photosynthèse",
    'Erklär mir Quantenmechanik',
    'Explícame la relatividad',
  ];

  it.each(antiCases)('does not trigger on "%s"', (text) => {
    const r = detectIntent(text);
    expect(r.intent).not.toBe('REAL_WORLD_CAPTURE');
  });
});

describe('PII redaction in query log', () => {
  it('redacts email addresses', () => {
    expect(redactPii('contact me at john.doe@example.com')).toBe(
      'contact me at [email]',
    );
  });

  it('redacts phone numbers', () => {
    expect(redactPii('call +46 70 123 45 67 now')).toContain('[phone]');
  });

  it('redacts Swedish personnummer', () => {
    expect(redactPii('my ssn is 900101-1234')).toBe(
      'my ssn is [personnummer]',
    );
  });

  it('redacts IPv4 addresses', () => {
    expect(redactPii('server at 192.168.1.10 is down')).toBe(
      'server at [ip] is down',
    );
  });

  it('redacts credit card digits', () => {
    expect(redactPii('card 4111 1111 1111 1111 please')).toContain('[card]');
  });

  it('leaves non-PII text alone', () => {
    expect(redactPii('visa stockholm nu')).toBe('visa stockholm nu');
  });
});
