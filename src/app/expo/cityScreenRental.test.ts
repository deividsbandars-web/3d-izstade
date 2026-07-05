import assert from 'node:assert/strict';
import {
  buildCityScreenAdminPath,
  getCityScreenAvailabilityLabel,
  getCityScreenBuyerSteps,
  getCityScreenMapPins,
  getCityScreenWindowPreview,
  getRentableCityScreenSlots,
} from './cityScreenRental.js';

const slots = getRentableCityScreenSlots();
assert.ok(slots.length >= 4);
assert.ok(slots.every((slot) => slot.scope === 'city'));
assert.ok(slots.every((slot) => Boolean(slot.runtimeAssignmentId)));
assert.ok(slots.every((slot) => slot.monthlyPriceHintEur > 0));

const selected = slots[0];
assert.equal(
  buildCityScreenAdminPath(selected.id),
  `/expo/admin?screen=${encodeURIComponent(selected.id)}&task=city-screen`,
);
assert.equal(buildCityScreenAdminPath('booth-sponsor-concierge-main-screen'), '/expo/admin?task=city-screen');
assert.equal(getCityScreenAvailabilityLabel(selected), 'Available');

const buyerSteps = getCityScreenBuyerSteps();
assert.equal(buyerSteps.length, 3);
assert.ok(buyerSteps.some((step) => step.title.toLowerCase().includes('exact city screen')));
assert.ok(buyerSteps.some((step) => step.body.toLowerCase().includes('publishes')));
assert.ok(!buyerSteps.map((step) => `${step.title} ${step.body}`).join(' ').toLowerCase().match(/\b(operator|slot|internal)\b/));

const mapPins = getCityScreenMapPins();
assert.equal(mapPins.length, slots.length);
assert.ok(mapPins.every((pin) => pin.mapXPercent >= 0 && pin.mapXPercent <= 100));
assert.ok(mapPins.every((pin) => pin.mapYPercent >= 0 && pin.mapYPercent <= 100));
assert.ok(mapPins.every((pin) => pin.routeHint.length > 20 && pin.viewHint.length > 20));
assert.ok(mapPins.some((pin) => pin.id === 'city-center-spine-hero-wall' && pin.mapXPercent === 50));

const previews = slots.map((slot) => ({ preview: getCityScreenWindowPreview(slot), slot }));
assert.equal(previews.length, slots.length);
assert.ok(previews.every(({ preview }) => preview.screenFrame.leftPercent >= 0 && preview.screenFrame.leftPercent <= 100));
assert.ok(previews.every(({ preview }) => preview.screenFrame.topPercent >= 0 && preview.screenFrame.topPercent <= 100));
assert.ok(previews.every(({ preview }) => preview.screenFrame.widthPercent >= 20 && preview.screenFrame.widthPercent <= 45));
assert.ok(previews.every(({ preview }) => preview.screenFrame.heightPercent >= 18 && preview.screenFrame.heightPercent <= 38));
assert.ok(previews.every(({ preview }) => preview.viewLabel.length > 12 && preview.windowCaption.length > 24));
assert.ok(
  getCityScreenWindowPreview(slots.find((slot) => slot.id === 'city-center-spine-hero-wall')!).viewerDistanceLabel
    .toLowerCase()
    .includes('first'),
);

console.log('city screen rental tests passed');
