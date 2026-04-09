import { describe, expect, it } from 'vitest';
import { detectIntent } from '../services/intent-classifier';

describe('detectIntent', () => {
  const realWorldQueries: string[] = [
    'Visa hur det ser ut i Stockholm nu',
    'Hur ser det ut på Blåsut just nu',
    'Show me what Rome looks like right now',
    'Is there parking available at the mall now',
    'Take a photo of the entrance',
    'live camera feed of the street',
    'Finns det kö på ICA Maxi nu',
    'currently at the Eiffel Tower',
    'visa bilder från stranden nu',
    'what does the traffic look like right now',
  ];

  it.each(realWorldQueries)('classifies "%s" as REAL_WORLD_CAPTURE', (text) => {
    const result = detectIntent(text);
    expect(result.intent).toBe('REAL_WORLD_CAPTURE');
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  const generalQueries: string[] = [
    'What is the capital of France',
    'Explain quantum mechanics',
    'How do I install nodejs',
    'history of Rome',
  ];

  it.each(generalQueries)('classifies "%s" as non-capture', (text) => {
    const result = detectIntent(text);
    expect(result.intent).not.toBe('REAL_WORLD_CAPTURE');
  });
});
