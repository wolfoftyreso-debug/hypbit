import { describe, expect, it } from 'vitest';
import { buildQVL } from '../services/qvl-builder';
import { validateQVL } from '../models/qvl';

describe('buildQVL', () => {
  const cases: { text: string; expectSubject: string }[] = [
    { text: 'Show me the entrance of the library', expectSubject: 'entrance' },
    { text: 'visa parken just nu', expectSubject: 'park' },
    { text: 'how is the street right now', expectSubject: 'street' },
    { text: 'photo of the building', expectSubject: 'building' },
    { text: 'what is happening in the crowd', expectSubject: 'crowd' },
  ];

  it.each(cases)(
    'maps "$text" to subject $expectSubject and produces a valid QVL',
    ({ text, expectSubject }) => {
      const qvl = buildQVL({
        text,
        location: { lat: 0, lon: 0 },
      });
      expect(qvl.subject.type).toBe(expectSubject);
      expect(qvl.constraints.must_be_live).toBe(true);
      expect(qvl.constraints.min_resolution).toBe('1080p');
      expect(validateQVL(qvl)).toEqual([]);
    },
  );
});
