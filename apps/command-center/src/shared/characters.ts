/**
 * Wavult Character Bible
 * Fixed visual identities for all team members
 * Generated: 2026-04-02
 */

export const CDN = 'https://d14gf6x22fx96q.cloudfront.net'
export const CHARACTERS_BASE = `${CDN}/brief/characters`

export interface Character {
  id: string
  name: string
  title: string
  referenceUrl: string
  description: string
}

export const CHARACTERS: Record<string, Character> = {
  erik: {
    id: 'erik',
    name: 'Erik Svensson',
    title: 'Chairman & Group CEO',
    referenceUrl: `${CHARACTERS_BASE}/char_erik_reference.jpg`,
    description: '37, 2m, 110kg. Dark brown Jesus-hair. Swedish-Arab. Full beard. Navy suit, white pocket square.',
  },
  leon: {
    id: 'leon',
    name: 'Leon Russo De Cemare',
    title: 'CEO Wavult Operations',
    referenceUrl: `${CHARACTERS_BASE}/char_leon_reference.jpg`,
    description: '22, 180cm, 80kg. Fluffy brown backslick 30cm. Swedish-Italian. Athletic. Smart casual.',
  },
  winston: {
    id: 'winston',
    name: 'Winston Bjarnemark',
    title: 'CFO',
    referenceUrl: `${CHARACTERS_BASE}/char_winston_reference.jpg`,
    description: '170cm, 50kg. Blond mop-mustache. Slight hunch. Swedish. Glasses. Numbers-focused.',
  },
  dennis: {
    id: 'dennis',
    name: 'Dennis Bjarnemark',
    title: 'Board / Chief Legal & Operations',
    referenceUrl: `${CHARACTERS_BASE}/char_dennis_reference.jpg`,
    description: '57, 180cm, 90kg. Light brown backslick. Swedish. Dark suit. Old gangster energy.',
  },
  johan: {
    id: 'johan',
    name: 'Johan Berglund',
    title: 'Group CTO',
    referenceUrl: `${CHARACTERS_BASE}/char_johan_reference.jpg`,
    description: '37, 175cm, 100kg. Viking beard. Stocky build. Swedish. Casual tech. Laptop.',
  },
  bernt: {
    id: 'bernt',
    name: 'Bernt',
    title: 'AI System',
    referenceUrl: `${CHARACTERS_BASE}/char_bernt_reference.jpg`,
    description: 'Navy egg-shaped robot. Gold antenna. Notebook. ALWAYS SAME design — fixed prompt.',
  },
  sara: {
    id: 'sara',
    name: 'Sara',
    title: 'Infrastructure Analyst',
    referenceUrl: `${CHARACTERS_BASE}/char_sara_reference.jpg`,
    description: 'REFERENCE CHARACTER. Navy blazer. Dark shoulder-length hair. Dashboard focus.',
  },
  alex: {
    id: 'alex',
    name: 'Alex',
    title: 'quiXzoom Zoomer',
    referenceUrl: `${CHARACTERS_BASE}/char_alex_reference.jpg`,
    description: 'Navy blue hoodie. Young man. Smartphone for field photography.',
  },
  goran: {
    id: 'goran',
    name: 'Göran',
    title: 'Municipal Official',
    referenceUrl: `${CHARACTERS_BASE}/char_goran_reference.jpg`,
    description: 'Grey fleece. Reading glasses askew. 50s. Worried but competent.',
  },
}

export function getCharacterUrl(id: string): string {
  return CHARACTERS[id]?.referenceUrl ?? `${CHARACTERS_BASE}/char_sara_reference.jpg`
}
