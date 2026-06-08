import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import express, { type Response } from 'express';
import { adminOnly, authMiddleware, type AuthRequest } from '../../middleware/authMiddleware.js';

function createResponseCapture() {
  const state: { body: unknown; statusCode: number | null } = {
    body: null,
    statusCode: null,
  };

  const response = {
    json(payload: unknown) {
      state.body = payload;
      return response;
    },
    status(code: number) {
      state.statusCode = code;
      return response;
    },
  } as unknown as Response;

  return { response, state };
}

async function fetchApi(path: string, init?: Parameters<typeof fetch>[1]) {
  const app = express();
  app.use(express.json());

  const protectedRouter = express.Router();
  protectedRouter.use(authMiddleware);
  protectedRouter.get('/modular-home/quotes', adminOnly, (_req, res) => res.json({ success: true }));
  protectedRouter.get('/modular-home/quotes/export', adminOnly, (_req, res) => res.json({ success: true }));
  protectedRouter.get('/modular-home/quotes/:quoteId', adminOnly, (_req, res) => res.json({ success: true }));
  protectedRouter.patch('/modular-home/quotes/:quoteId/status', adminOnly, (_req, res) => res.json({ success: true }));
  app.use('/api', protectedRouter);

  const server = app.listen(0);
  const address = server.address() as AddressInfo;

  try {
    return await fetch(`http://127.0.0.1:${address.port}${path}`, init);
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
}

const unauthenticatedList = await fetchApi('/api/modular-home/quotes');
assert.equal(unauthenticatedList.status, 401);
assert.deepEqual(await unauthenticatedList.json(), { error: 'Authentication required' });

const unauthenticatedDetail = await fetchApi('/api/modular-home/quotes/quote_123456');
assert.equal(unauthenticatedDetail.status, 401);

const unauthenticatedStatusUpdate = await fetchApi('/api/modular-home/quotes/quote_123456/status', {
  body: JSON.stringify({ status: 'won' }),
  headers: { 'content-type': 'application/json' },
  method: 'PATCH',
});
assert.equal(unauthenticatedStatusUpdate.status, 401);

const unauthenticatedExport = await fetchApi('/api/modular-home/quotes/export?format=csv');
assert.equal(unauthenticatedExport.status, 401);

const nonAdmin = createResponseCapture();
let nonAdminNextCalled = false;
adminOnly(
  { user: { id: 'user-1', role: 'user' } } as AuthRequest,
  nonAdmin.response,
  () => {
    nonAdminNextCalled = true;
  },
);
assert.equal(nonAdmin.state.statusCode, 403);
assert.deepEqual(nonAdmin.state.body, { error: 'Admin access required' });
assert.equal(nonAdminNextCalled, false);

const admin = createResponseCapture();
let adminNextCalled = false;
adminOnly(
  { user: { id: 'admin-1', role: 'admin' } } as AuthRequest,
  admin.response,
  () => {
    adminNextCalled = true;
  },
);
assert.equal(admin.state.statusCode, null);
assert.equal(adminNextCalled, true);
