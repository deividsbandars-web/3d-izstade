import assert from 'node:assert/strict';

import { getPixelStreamingStatus } from '../services/pixelStreamingStatus.js';

const originalFetch = globalThis.fetch;
process.env.SUPABASE_URL = 'https://supabase.test';
process.env.SUPABASE_SERVICE_KEY = 'service-key-test';
process.env.PIXEL_STREAMING_STATUS_BASE_URL = 'http://signaling.test';
process.env.SIGNALING_STATUS_BASE_URL = 'http://signaling.test';
process.env.PIXEL_STREAMING_STATUS_TIMEOUT_MS = '2500';
process.env.UE5_SECRET_KEY = 'ue5-secret-test';

globalThis.fetch = (async (input: string | URL) => {
  const url = String(input);

  if (url.endsWith('/api/status')) {
    return {
      ok: true,
      async json() {
        return { streamer_count: 3 };
      },
    } as Response;
  }

  if (url.endsWith('/api/streamers')) {
    return {
      ok: true,
      async json() {
        return [
          { streamerId: 'shared-stream-1', streaming: true, shared: true, ready: true },
          { streamerId: 'booth-hero-one', boothId: 'booth-1', slug: 'hero-one', streaming: true, ready: true },
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

const preferred = await getPixelStreamingStatus({
  boothId: 'booth-1',
  slug: 'hero-one',
  streamingLevel: 'Level_Booth_booth-1',
});

assert.equal(preferred.session.activeStreamerId, 'level-room-1');
assert.equal(preferred.session.selectionPolicy, 'booth_preferred');
assert.equal(preferred.readiness, 'session_ready');

const fallback = await getPixelStreamingStatus({
  boothId: 'missing-booth',
  slug: 'missing-booth',
});

assert.equal(fallback.session.activeStreamerId, 'shared-stream-1');
assert.equal(fallback.session.selectionPolicy, 'first_available');
assert.ok(fallback.warnings.includes('FALLBACK_SHARED_STREAM'));

globalThis.fetch = originalFetch;
