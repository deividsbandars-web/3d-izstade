import assert from 'node:assert/strict';

import { clearPixelStreamingSessionReservations, reservePixelStreamingSession } from '../services/pixelStreamingSessionBroker.js';

const originalFetch = globalThis.fetch;
process.env.SUPABASE_URL = 'https://supabase.test';
process.env.SUPABASE_SERVICE_KEY = 'service-key-test';
process.env.SIGNALING_STATUS_BASE_URL = 'http://signaling.test';
process.env.PIXEL_STREAMING_STATUS_TIMEOUT_MS = '2500';
process.env.UE5_SECRET_KEY = 'ue5-secret-test';

globalThis.fetch = (async (input: string | URL) => {
  const url = String(input);

  if (url.endsWith('/api/status')) {
    return {
      ok: true,
      async json() {
        return { streamer_count: 2 };
      },
    } as Response;
  }

  if (url.endsWith('/api/streamers')) {
    return {
      ok: true,
      async json() {
        return [
          { streamerId: 'shared-stream-1', streaming: true, shared: true, ready: true },
          { streamerId: 'level-room-1', streamingLevel: 'Level_Booth_booth-1', streaming: true, ready: true },
        ];
      },
    } as Response;
  }

  if (url.endsWith('/api/config')) {
    return {
      ok: true,
      async json() {
        return {
          config: {
            peerOptions: [{ urls: ['turn:turn.example.com'] }],
          },
        };
      },
    } as Response;
  }

  throw new Error(`Unexpected fetch URL: ${url}`);
}) as typeof fetch;

clearPixelStreamingSessionReservations();

const firstReservation = await reservePixelStreamingSession({
  boothId: 'booth-1',
  slug: 'hero-one',
  streamingLevel: 'Level_Booth_booth-1',
  sessionId: 'session-a',
});

assert.equal(firstReservation.status, 'ready');
assert.equal(firstReservation.streamerId, 'level-room-1');
assert.equal(firstReservation.selectionPolicy, 'booth_preferred');

const conflictingReservation = await reservePixelStreamingSession({
  boothId: 'booth-1',
  slug: 'hero-one',
  streamingLevel: 'Level_Booth_booth-1',
  sessionId: 'session-b',
});

assert.equal(conflictingReservation.status, 'pending');
assert.equal(conflictingReservation.streamerId, null);
assert.ok(conflictingReservation.warnings.includes('SESSION_STREAMER_RESERVED'));

const repeatedReservation = await reservePixelStreamingSession({
  boothId: 'booth-1',
  slug: 'hero-one',
  streamingLevel: 'Level_Booth_booth-1',
  sessionId: 'session-a',
});

assert.equal(repeatedReservation.status, 'ready');
assert.equal(repeatedReservation.streamerId, 'level-room-1');

globalThis.fetch = originalFetch;
