import assert from 'node:assert/strict';
import {
  findExpoCityScreenCampaignConflict,
  isExpoCityScreenCampaignActive,
  normalizeExpoCityScreenCampaign,
} from './cityScreenCampaign.js';

const valid = normalizeExpoCityScreenCampaign({
  campaignEndDate: '2026-09-28',
  campaignStartDate: '2026-08-30',
  campaignStatus: 'submitted',
  screenSlotId: 'city-right-marquee-hero',
}, { today: '2026-07-03' });

assert.equal(valid.ok, true);
assert.equal(valid.durationDays, 30);
assert.equal(valid.billingMonths, 1);
assert.equal(valid.estimatedPriceEur, 720);

const invalid = normalizeExpoCityScreenCampaign({
  campaignEndDate: '2026-06-01',
  campaignStartDate: '2026-07-01',
  campaignStatus: 'submitted',
  screenSlotId: 'booth-sponsor-concierge-main-screen',
}, { today: '2026-07-03' });

assert.equal(invalid.ok, false);
assert.match(invalid.issues.map((issue) => issue.message).join(' '), /valid city advertising screen/i);
assert.match(invalid.issues.map((issue) => issue.message).join(' '), /end date/i);

const conflict = findExpoCityScreenCampaignConflict({
  boothId: 'requesting-booth',
  campaignEndDate: '2026-08-31',
  campaignStartDate: '2026-08-01',
  campaignStatus: 'submitted',
  screenSlotId: 'city-center-spine-hero-wall',
}, [{
  boothId: 'existing-booth',
  campaignEndDate: '2026-08-15',
  campaignStartDate: '2026-07-15',
  campaignStatus: 'approved',
  screenSlotId: 'city-center-spine-hero-wall',
}]);

assert.equal(conflict?.boothId, 'existing-booth');

const nonBlockingDraft = findExpoCityScreenCampaignConflict({
  boothId: 'requesting-booth',
  campaignEndDate: '2026-08-31',
  campaignStartDate: '2026-08-01',
  campaignStatus: 'draft',
  screenSlotId: 'city-center-spine-hero-wall',
}, [{
  boothId: 'existing-booth',
  campaignEndDate: '2026-08-31',
  campaignStartDate: '2026-08-01',
  campaignStatus: 'live',
  screenSlotId: 'city-center-spine-hero-wall',
}]);

assert.equal(nonBlockingDraft, null);

assert.equal(isExpoCityScreenCampaignActive({
  campaignEndDate: '2026-08-31',
  campaignStartDate: '2026-08-01',
  campaignStatus: 'live',
  screenSlotId: 'city-center-spine-hero-wall',
}, '2026-08-15'), true);
assert.equal(isExpoCityScreenCampaignActive({
  campaignEndDate: '2026-08-31',
  campaignStartDate: '2026-08-01',
  campaignStatus: 'live',
  screenSlotId: 'city-center-spine-hero-wall',
}, '2026-09-01'), false);

console.log('city screen campaign tests passed');
