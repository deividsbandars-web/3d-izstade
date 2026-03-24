#!/usr/bin/env node

const STATUS_URL = process.env.PIXEL_STREAMING_STATUS_URL || 'http://127.0.0.1/api/pixel-streaming/status';
const SIGNALING_STATUS_URL = process.env.PIXEL_STREAMING_SIGNALING_STATUS_URL;
const SIGNALING_STREAMERS_URL = process.env.PIXEL_STREAMING_SIGNALING_STREAMERS_URL;
const SIGNALING_CONFIG_URL = process.env.PIXEL_STREAMING_SIGNALING_CONFIG_URL;
const REQUEST_TIMEOUT_MS = Number(process.env.PIXEL_STREAMING_SMOKE_TIMEOUT_MS || 4000);

function withTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  return fetch(url, {
    ...options,
    signal: controller.signal,
    headers: {
      Accept: 'application/json',
      ...(options.headers || {})
    }
  }).finally(() => clearTimeout(timeoutId));
}

async function fetchJson(url) {
  const response = await withTimeout(url);
  if (!response.ok) {
    throw new Error(`${url} -> HTTP_${response.status}`);
  }

  return response.json();
}

function formatResult(label, ok, details) {
  const state = ok ? 'PASS' : 'FAIL';
  return `[${state}] ${label}: ${details}`;
}

function printHelp() {
  console.log(`Warpala Pixel Streaming smoke check

Environment overrides:
  PIXEL_STREAMING_STATUS_URL
  PIXEL_STREAMING_SIGNALING_STATUS_URL
  PIXEL_STREAMING_SIGNALING_STREAMERS_URL
  PIXEL_STREAMING_SIGNALING_CONFIG_URL
  PIXEL_STREAMING_SMOKE_TIMEOUT_MS

Default mode checks only the gateway status endpoint.
Direct signaling REST checks run only when explicit signaling override URLs are provided.
`);
}

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  printHelp();
  process.exitCode = 0;
}

async function main() {
  const checks = [];
  let exitCode = 0;

  try {
    const statusPayload = await fetchJson(STATUS_URL);
    checks.push(
      formatResult(
        'backend-status-endpoint',
        true,
        `signaling=${statusPayload?.signaling}, streamer=${statusPayload?.streamer}, turn=${statusPayload?.turn_ice}, readiness=${statusPayload?.readiness}`
      )
    );

    checks.push(
      formatResult(
        'gateway-status',
        statusPayload?.signaling === 'signaling_up',
        `signaling=${statusPayload?.signaling}`
      )
    );

    checks.push(
      formatResult(
        'streamer-status',
        statusPayload?.streamer === 'streamer_available',
        `streamer=${statusPayload?.streamer}, activeStreamerId=${statusPayload?.session?.activeStreamerId ?? 'none'}`
      )
    );

    checks.push(
      formatResult(
        'session-readiness',
        statusPayload?.readiness === 'session_ready',
        `readiness=${statusPayload?.readiness}`
      )
    );

    checks.push(
      formatResult(
        'turn-status',
        statusPayload?.turn_ice === 'turn_configured',
        `turn=${statusPayload?.turn_ice}`
      )
    );

    if (statusPayload?.readiness !== 'session_ready') {
      exitCode = 1;
    }

    if (SIGNALING_STATUS_URL) {
      const signalingStatus = await fetchJson(SIGNALING_STATUS_URL);
      checks.push(
        formatResult(
          'signaling-rest-status',
          typeof signalingStatus?.streamer_count === 'number',
          `streamer_count=${signalingStatus?.streamer_count ?? 'n/a'}, player_count=${signalingStatus?.player_count ?? 'n/a'}`
        )
      );
    }

    if (SIGNALING_STREAMERS_URL) {
      const streamersPayload = await fetchJson(SIGNALING_STREAMERS_URL);
      const streamers = Array.isArray(streamersPayload) ? streamersPayload : [];
      const activeStreamer = streamers.find((streamer) => streamer?.streaming);
      checks.push(
        formatResult(
          'signaling-streamer-readiness',
          Boolean(activeStreamer),
          activeStreamer ? `activeStreamerId=${activeStreamer.streamerId}` : 'no active streamer'
        )
      );

      if (!activeStreamer) {
        exitCode = 1;
      }
    }

    if (SIGNALING_CONFIG_URL) {
      const configPayload = await fetchJson(SIGNALING_CONFIG_URL);
      const peerOptions = configPayload?.config?.peerOptions;
      const peerOptionsText = typeof peerOptions === 'string' ? peerOptions : JSON.stringify(peerOptions || {});
      const hasTurn = /turns?:/i.test(peerOptionsText);
      checks.push(
        formatResult(
          'turn-config',
          hasTurn,
          hasTurn ? 'TURN URL found in peerOptions' : 'TURN URL missing from peerOptions'
        )
      );

      if (!hasTurn) {
        exitCode = 1;
      }
    }
  } catch (error) {
    exitCode = 1;
    checks.push(formatResult('smoke-check', false, error instanceof Error ? error.message : 'unknown_error'));
  }

  for (const line of checks) {
    console.log(line);
  }

  return exitCode;
}

if (!process.argv.includes('--help') && !process.argv.includes('-h')) {
  main()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      console.error(formatResult('smoke-check', false, error instanceof Error ? error.message : 'unknown_error'));
      process.exitCode = 1;
    });
}
