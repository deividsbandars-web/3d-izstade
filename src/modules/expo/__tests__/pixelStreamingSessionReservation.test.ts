import assert from 'node:assert/strict';

import { reservePixelStreamingSession, type PixelStreamingRuntimeConfig } from '../services/pixelStreamingConfig.js';

const originalFetch = globalThis.fetch;

globalThis.fetch = (async (input: string | URL, init?: RequestInit) => {
  const url = String(input);

  if (url.endsWith('/api/pixel-streaming/session')) {
    const body = JSON.parse(String(init?.body || '{}'));
    return {
      ok: true,
      async json() {
        return {
          boothId: body.boothId ?? null,
          sessionId: body.sessionId ?? null,
          streamerId: 'level-room-1',
          status: 'ready',
          selectionPolicy: 'booth_preferred',
          expiresAt: '2026-04-04T00:05:00.000Z',
          warnings: [],
          runtimeStatus: {
            signaling: 'signaling_up',
            streamer: 'streamer_available',
            turn_ice: 'turn_configured',
            readiness: 'session_ready',
            checkedAt: '2026-04-04T00:00:00.000Z',
            warnings: [],
            streamerCount: 2,
            gatewayReachable: true,
            session: {
              sessionMode: 'single_instance',
              selectionPolicy: 'booth_preferred',
              activeStreamerId: 'level-room-1',
            },
          },
        };
      },
    } as Response;
  }

  throw new Error(`Unexpected fetch URL: ${url}`);
}) as typeof fetch;

const config: PixelStreamingRuntimeConfig = {
  boothContext: {
    boothId: 'booth-1',
    slugOrId: 'hero-one',
    streamingLevel: 'Level_Booth_booth-1',
  },
  signalingUrl: 'wss://signal.warpala.example',
  statusEndpointUrl: 'https://warpala.example/api/pixel-streaming/status?boothId=booth-1&slug=hero-one&streamingLevel=Level_Booth_booth-1',
  sessionEndpointUrl: 'https://warpala.example/api/pixel-streaming/session',
  iceServers: [],
  probeTimeoutMs: 2500,
};

const reservation = await reservePixelStreamingSession(config, {
  boothId: 'booth-1',
  slug: 'hero-one',
  streamingLevel: 'Level_Booth_booth-1',
  sessionId: 'session-1',
});

assert.equal(reservation.status, 'ready');
assert.equal(reservation.streamerId, 'level-room-1');
assert.equal(reservation.runtimeStatus.session.selectionPolicy, 'booth_preferred');

globalThis.fetch = originalFetch;
