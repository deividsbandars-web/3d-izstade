#!/usr/bin/env node

const DEFAULT_API_ORIGIN = process.env.VITE_PUBLIC_API_BASE_URL || 'https://api.30sek24.com';
const STATUS_URL = process.env.PIXEL_STREAMING_STATUS_URL || `${DEFAULT_API_ORIGIN.replace(/\/$/, '')}/api/pixel-streaming/status`;
const SIGNALING_STATUS_URL = process.env.PIXEL_STREAMING_SIGNALING_STATUS_URL;
const SIGNALING_STREAMERS_URL = process.env.PIXEL_STREAMING_SIGNALING_STREAMERS_URL;
const SIGNALING_CONFIG_URL = process.env.PIXEL_STREAMING_SIGNALING_CONFIG_URL;
const REQUEST_TIMEOUT_MS = Number(process.env.PIXEL_STREAMING_SMOKE_TIMEOUT_MS || 4000);
const DEFAULT_MODE = 'baseline';

function parseMode(argv) {
  const modeArg = argv.find((arg) => arg.startsWith('--mode='));
  const positionalModeIndex = argv.findIndex((arg) => arg === '--mode');
  const rawMode = modeArg
    ? modeArg.slice('--mode='.length)
    : positionalModeIndex >= 0
      ? argv[positionalModeIndex + 1]
      : DEFAULT_MODE;
  const normalizedMode = String(rawMode || DEFAULT_MODE).trim().toLowerCase();

  if (normalizedMode === 'baseline' || normalizedMode === 'strict') {
    return normalizedMode;
  }

  throw new Error(`INVALID_MODE:${rawMode}`);
}

const MODE = parseMode(process.argv.slice(2));

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

function formatWarn(label, details) {
  return `[WARN] ${label}: ${details}`;
}

function printHelp() {
  console.log(`Warpala legacy runtime smoke check

Environment overrides:
  PIXEL_STREAMING_STATUS_URL
  PIXEL_STREAMING_SIGNALING_STATUS_URL
  PIXEL_STREAMING_SIGNALING_STREAMERS_URL
  PIXEL_STREAMING_SIGNALING_CONFIG_URL
  PIXEL_STREAMING_SMOKE_TIMEOUT_MS

Modes:
  --mode baseline   Release-safe default. Requires backend status, signaling gateway, and TURN to be healthy.
                    Missing active streamer is reported as WARN and does not fail the script.
  --mode strict     Optional operator gate. Requires active streamer and session_ready.

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
        'turn-status',
        statusPayload?.turn_ice === 'turn_configured',
        `turn=${statusPayload?.turn_ice}`
      )
    );

    if (statusPayload?.signaling !== 'signaling_up' || statusPayload?.turn_ice !== 'turn_configured') {
      exitCode = 1;
    }

    if (MODE === 'strict') {
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
      if (statusPayload?.streamer !== 'streamer_available') {
        exitCode = 1;
      }
      if (statusPayload?.readiness !== 'session_ready') {
        exitCode = 1;
      }
    } else {
      if (statusPayload?.streamer !== 'streamer_available') {
        checks.push(
          formatWarn(
            'streamer-status',
            `streamer=${statusPayload?.streamer}, activeStreamerId=${statusPayload?.session?.activeStreamerId ?? 'none'}`
          )
        );
      }
      if (statusPayload?.readiness !== 'session_ready') {
        checks.push(
          formatWarn(
            'session-readiness',
            `readiness=${statusPayload?.readiness}`
          )
        );
      }
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
      const signalingStreamerOk = Boolean(activeStreamer);
      if (MODE === 'strict') {
        checks.push(
          formatResult(
            'signaling-streamer-readiness',
            signalingStreamerOk,
            activeStreamer ? `activeStreamerId=${activeStreamer.streamerId}` : 'no active streamer'
          )
        );
      } else {
        checks.push(
          signalingStreamerOk
            ? formatResult('signaling-streamer-readiness', true, `activeStreamerId=${activeStreamer.streamerId}`)
            : formatWarn('signaling-streamer-readiness', 'no active streamer')
        );
      }

      if (MODE === 'strict' && !activeStreamer) {
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
