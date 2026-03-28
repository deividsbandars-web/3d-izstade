import assert from 'node:assert/strict';
import { validateExpoAnalyticsPayload } from '../controllers/analyticsController.js';

const valid = validateExpoAnalyticsPayload({
  boothId: 'booth-1',
  companyId: 'company-1',
  companySlug: 'hero-one',
  eventName: 'booth_viewed',
  sectorId: 'sector-1',
  sectorName: 'Platform Partners',
  sessionId: 'session-1',
  sponsorTier: 'hero',
});

assert.equal(valid.eventName, 'booth_viewed');
assert.equal(valid.companySlug, 'hero-one');
assert.equal(valid.sessionId, 'session-1');

assert.throws(() => validateExpoAnalyticsPayload(undefined), /EXPO_ANALYTICS_PAYLOAD_REQUIRED/);
assert.throws(() => validateExpoAnalyticsPayload({ eventName: 'ENTRY' }), /EXPO_ANALYTICS_EVENT_INVALID/);
