import assert from 'node:assert/strict';
import { derivePixelStreamingAvailability, type PixelStreamingRuntimeStatus } from '../services/pixelStreamingConfig.js';

const readyStatus: PixelStreamingRuntimeStatus = {
  checkedAt: '2026-03-28T00:00:00.000Z',
  gatewayReachable: true,
  readiness: 'session_ready',
  session: { activeStreamerId: 'streamer-1', selectionPolicy: 'first_available', sessionMode: 'single_instance' },
  signaling: 'signaling_up',
  streamer: 'streamer_available',
  streamerCount: 1,
  turn_ice: 'turn_configured',
  warnings: [],
};

assert.equal(derivePixelStreamingAvailability(readyStatus), 'available');
assert.equal(derivePixelStreamingAvailability({ ...readyStatus, readiness: 'session_not_ready' }), 'degraded');
assert.equal(derivePixelStreamingAvailability({ ...readyStatus, signaling: 'signaling_down', gatewayReachable: false, readiness: 'unknown', streamer: 'unknown' }), 'unavailable');
