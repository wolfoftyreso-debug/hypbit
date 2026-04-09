import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  appendStreamEvent,
  readStreamEntries,
  __resetStreamStore,
} from '../services/stream-store';

describe('stream-store — in-memory Last-Event-ID replay', () => {
  beforeEach(() => {
    __resetStreamStore();
  });

  afterEach(() => {
    __resetStreamStore();
  });

  it('returns full history when lastId is empty', async () => {
    await appendStreamEvent('t1', 'ACK', { msg: 'hi' });
    await appendStreamEvent('t1', 'STATUS', { step: 'dispatch' });
    await appendStreamEvent('t1', 'IMAGE_ADDED', { url: 'u' });
    const all = await readStreamEntries('t1', '');
    expect(all.length).toBe(3);
    expect(all[0].event).toBe('ACK');
    expect(all[2].event).toBe('IMAGE_ADDED');
  });

  it('returns only entries newer than lastId', async () => {
    const e1 = await appendStreamEvent('t2', 'ACK', {});
    const e2 = await appendStreamEvent('t2', 'STATUS', {});
    await appendStreamEvent('t2', 'IMAGE_ADDED', { url: 'x' });
    const replay = await readStreamEntries('t2', e1.id);
    expect(replay.length).toBe(2);
    expect(replay[0].id).toBe(e2.id);
  });

  it('returns empty array when lastId is at the tip', async () => {
    const e1 = await appendStreamEvent('t3', 'ACK', {});
    const replay = await readStreamEntries('t3', e1.id);
    expect(replay.length).toBe(0);
  });

  it('isolates per-task streams', async () => {
    await appendStreamEvent('a', 'ACK', {});
    await appendStreamEvent('b', 'ACK', {});
    await appendStreamEvent('a', 'STATUS', {});
    const a = await readStreamEntries('a', '');
    const b = await readStreamEntries('b', '');
    expect(a.length).toBe(2);
    expect(b.length).toBe(1);
  });
});
