import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { createBackendCorsMiddleware } from '../middleware/corsPolicy.js';

const allowedOrigin = 'https://staging.30sek24.com';
let routeCalls = 0;

const app = express();
app.use(createBackendCorsMiddleware([
  'https://www.30sek24.com',
  allowedOrigin,
]));
app.get('/probe', (_req, res) => {
  routeCalls += 1;
  res.json({ ok: true });
});

const server = app.listen(0);
const address = server.address() as AddressInfo;
const baseUrl = `http://127.0.0.1:${address.port}`;

try {
  {
    const response = await fetch(`${baseUrl}/probe`, {
      headers: { Origin: allowedOrigin },
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('access-control-allow-origin'), allowedOrigin);
    assert.match(response.headers.get('vary') || '', /Origin/i);
    assert.equal(routeCalls, 1);
  }

  {
    const response = await fetch(`${baseUrl}/probe`, {
      headers: { Origin: 'https://attacker.example' },
    });
    assert.equal(response.status, 403);
    assert.equal(response.headers.get('access-control-allow-origin'), null);
    assert.match(response.headers.get('vary') || '', /Origin/i);
    assert.deepEqual(await response.json(), {
      code: 'CORS_ORIGIN_DENIED',
      error: 'Origin is not allowed',
    });
    assert.equal(routeCalls, 1);
  }

  {
    const response = await fetch(`${baseUrl}/probe`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('access-control-allow-origin'), null);
    assert.match(response.headers.get('vary') || '', /Origin/i);
    assert.equal(routeCalls, 2);
  }

  {
    const response = await fetch(`${baseUrl}/probe`, {
      headers: {
        'Access-Control-Request-Headers': 'authorization,content-type',
        'Access-Control-Request-Method': 'GET',
        Origin: allowedOrigin,
      },
      method: 'OPTIONS',
    });
    assert.equal(response.status, 204);
    assert.equal(response.headers.get('access-control-allow-origin'), allowedOrigin);
    assert.match(response.headers.get('access-control-allow-methods') || '', /GET/);
    assert.match(response.headers.get('access-control-allow-headers') || '', /authorization/i);
    assert.match(response.headers.get('vary') || '', /Origin/i);
    assert.equal(routeCalls, 2);
  }

  {
    const response = await fetch(`${baseUrl}/probe`, {
      headers: {
        'Access-Control-Request-Method': 'GET',
        Origin: 'https://attacker.example',
      },
      method: 'OPTIONS',
    });
    assert.equal(response.status, 403);
    assert.equal(response.headers.get('access-control-allow-origin'), null);
    assert.equal(routeCalls, 2);
  }
} finally {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}
