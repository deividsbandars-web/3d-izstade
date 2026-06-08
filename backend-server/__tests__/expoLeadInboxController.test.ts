import assert from 'node:assert/strict';
import { buildExpoLeadInboxSummary } from '../controllers/expoLeadInboxController.js';

const summary = buildExpoLeadInboxSummary([
  { created_at: '2026-05-27T10:00:00.000Z', status: 'pending' },
  { created_at: '2026-05-27T11:00:00.000Z', status: 'contacted' },
  { created_at: '2026-05-27T09:00:00.000Z', status: 'closed' },
  { created_at: '2026-05-27T08:00:00.000Z', status: 'rejected' },
  { created_at: '2026-05-27T12:00:00.000Z' },
]);

assert.deepEqual(summary, {
  closed: 1,
  contacted: 1,
  latestInboundAt: '2026-05-27T12:00:00.000Z',
  needsAction: 3,
  pending: 2,
  rejected: 1,
  total: 5,
});

console.log('expo lead inbox summary test passed');
