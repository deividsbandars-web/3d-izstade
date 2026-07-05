import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Request, type Response } from 'express';
import {
  createBackendLogger,
  runWithLogContext,
} from '../lib/logger.js';
import {
  createAdminOnly,
  createAuthMiddleware,
  type AuthRequest,
} from '../middleware/authMiddleware.js';
import { createHttpAccessLogMiddleware } from '../middleware/httpAccessLog.js';
import {
  requestContext,
  resolveCorrelationId,
} from '../middleware/requestContext.js';

function createCaptureSink() {
  const lines = {
    debug: [] as string[],
    error: [] as string[],
    info: [] as string[],
    warn: [] as string[],
  };
  return {
    lines,
    sink: {
      debug: (message: string) => lines.debug.push(message),
      error: (message: string) => lines.error.push(message),
      info: (message: string) => lines.info.push(message),
      warn: (message: string) => lines.warn.push(message),
    },
  };
}

const fixedNow = () => new Date('2026-07-02T12:00:00.000Z');
const requestId = '123e4567-e89b-42d3-a456-426614174000';

{
  const capture = createCaptureSink();
  const log = createBackendLogger({ mode: 'production', now: fixedNow, sink: capture.sink });
  log.debug('LoggingTest', 'Hidden production debug message');
  log.withContext({ requestId }).error('LoggingTest', 'Request failed', {
    authorization: 'Bearer should-not-appear',
    nested: {
      safe: 'visible',
      stripeSecretKey: 'sk_should-not-appear',
      turnstileToken: 'token-should-not-appear',
    },
    reason: new Error('Expected failure'),
  });

  assert.equal(capture.lines.debug.length, 0);
  assert.equal(capture.lines.error.length, 1);
  const event = JSON.parse(capture.lines.error[0]) as Record<string, any>;
  assert.equal(event.level, 'ERROR');
  assert.equal(event.module, 'LoggingTest');
  assert.equal(event.requestId, requestId);
  assert.equal(event.timestamp, '2026-07-02T12:00:00.000Z');
  assert.equal(event.data.authorization, '[redacted]');
  assert.equal(event.data.nested.stripeSecretKey, '[redacted]');
  assert.equal(event.data.nested.turnstileToken, '[redacted]');
  assert.equal(event.data.nested.safe, 'visible');
  assert.deepEqual(event.data.reason, { message: 'Expected failure', name: 'Error' });
  assert.doesNotMatch(capture.lines.error[0], /should-not-appear/);
}

{
  const capture = createCaptureSink();
  const log = createBackendLogger({ mode: 'development', now: fixedNow, sink: capture.sink });
  log.info('LoggingTest', 'Readable development message', { count: 2 });
  assert.equal(capture.lines.info.length, 1);
  assert.match(
    capture.lines.info[0],
    /^\[2026-07-02T12:00:00\.000Z\] \[INFO\] \[LoggingTest\] Readable development message \{"count":2\}$/,
  );
}

{
  const capture = createCaptureSink();
  const log = createBackendLogger({ mode: 'production', now: fixedNow, sink: capture.sink });
  await runWithLogContext({ requestId }, async () => {
    await Promise.resolve();
    log.warn('LoggingTest', 'Async warning');
  });
  assert.equal(JSON.parse(capture.lines.warn[0]).requestId, requestId);
}

assert.equal(resolveCorrelationId(requestId), requestId);
assert.equal(
  resolveCorrelationId('attacker supplied email@example.com', () => requestId),
  requestId,
);

{
  const capture = createCaptureSink();
  const log = createBackendLogger({ mode: 'production', now: fixedNow, sink: capture.sink });
  const headers: Record<string, string> = {};
  const req = { headers: { 'x-correlation-id': requestId } } as unknown as Request;
  const res = {
    setHeader(name: string, value: string) {
      headers[name.toLowerCase()] = value;
    },
  } as unknown as Response;

  requestContext(req, res, () => {
    log.info('LoggingTest', 'Inside request context');
  });
  assert.equal(headers['x-correlation-id'], requestId);
  assert.equal((req as Request & { correlationId?: string }).correlationId, requestId);
  assert.equal(JSON.parse(capture.lines.info[0]).requestId, requestId);
}

function createResponseCapture() {
  const state = { body: null as unknown, statusCode: 200 };
  const response = {
    json(body: unknown) {
      state.body = body;
      return response;
    },
    status(statusCode: number) {
      state.statusCode = statusCode;
      return response;
    },
  } as unknown as Response;
  return { response, state };
}

{
  const capture = createCaptureSink();
  const log = createBackendLogger({ mode: 'production', now: fixedNow, sink: capture.sink });
  const middleware = createAuthMiddleware({ log });
  const { response, state } = createResponseCapture();
  await middleware({
    correlationId: requestId,
    headers: {},
    method: 'GET',
    path: '/protected',
  } as unknown as AuthRequest, response, () => undefined);

  assert.equal(state.statusCode, 401);
  assert.deepEqual(state.body, { error: 'Authentication required' });
  assert.equal(capture.lines.debug.length, 0);
  assert.equal(capture.lines.warn.length, 1);
  assert.equal(JSON.parse(capture.lines.warn[0]).requestId, requestId);
}

{
  const capture = createCaptureSink();
  const log = createBackendLogger({ mode: 'production', now: fixedNow, sink: capture.sink });
  const middleware = createAuthMiddleware({
    getSupabaseClient: () => ({
      auth: {
        async getUser() {
          throw new Error('Identity provider unavailable');
        },
      },
    }) as any,
    log,
  });
  const { response, state } = createResponseCapture();
  await middleware({
    correlationId: requestId,
    headers: { authorization: 'Bearer secret-token' },
    method: 'GET',
    path: '/protected',
  } as unknown as AuthRequest, response, () => undefined);

  assert.equal(state.statusCode, 401);
  assert.equal(capture.lines.error.length, 1);
  assert.equal(JSON.parse(capture.lines.error[0]).requestId, requestId);
  assert.doesNotMatch(capture.lines.error[0], /secret-token/);
}

{
  const capture = createCaptureSink();
  const log = createBackendLogger({ mode: 'production', now: fixedNow, sink: capture.sink });
  const middleware = createAdminOnly(log);
  const { response, state } = createResponseCapture();
  middleware({
    correlationId: requestId,
    method: 'GET',
    path: '/admin',
    user: { id: 'user-1', role: 'user' },
  } as unknown as AuthRequest, response, () => undefined);
  assert.equal(state.statusCode, 403);
  assert.equal(JSON.parse(capture.lines.warn[0]).requestId, requestId);
}

{
  const capture = createCaptureSink();
  const log = createBackendLogger({ mode: 'production', now: fixedNow, sink: capture.sink });
  let clock = 1_000;
  const app = express();
  app.use(requestContext);
  app.use(createHttpAccessLogMiddleware({
    log,
    mode: 'production',
    nowMs: () => {
      clock += 5;
      return clock;
    },
  }));
  app.get('/probe', (_req, res) => res.status(204).end());
  app.get('/missing', (_req, res) => res.status(404).json({ error: 'missing' }));
  app.get('/health', (_req, res) => res.json({ ok: true }));

  const server = app.listen(0);
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    const probe = await fetch(`${baseUrl}/probe?secret=query-value`, {
      headers: { 'x-correlation-id': requestId },
    });
    assert.equal(probe.headers.get('x-correlation-id'), requestId);
    assert.equal(probe.status, 204);

    const missing = await fetch(`${baseUrl}/missing`);
    assert.equal(missing.status, 404);
    await fetch(`${baseUrl}/health`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }

  assert.equal(capture.lines.info.length, 1);
  assert.equal(capture.lines.warn.length, 1);
  const probeEvent = JSON.parse(capture.lines.info[0]) as Record<string, any>;
  assert.equal(probeEvent.requestId, requestId);
  assert.equal(probeEvent.data.method, 'GET');
  assert.equal(probeEvent.data.path, '/probe');
  assert.equal(probeEvent.data.status, 204);
  assert.doesNotMatch(capture.lines.info[0], /query-value/);
}

{
  const testDirectory = path.dirname(fileURLToPath(import.meta.url));
  const repositoryRoot = path.resolve(testDirectory, '..', '..');
  const authSource = readFileSync(path.join(repositoryRoot, 'backend-server/middleware/authMiddleware.ts'), 'utf8');
  const serverSource = readFileSync(path.join(repositoryRoot, 'backend-server/server.ts'), 'utf8');
  assert.doesNotMatch(authSource, /console\.log/);
  assert.doesNotMatch(serverSource, /morgan\s*\(/);
}
