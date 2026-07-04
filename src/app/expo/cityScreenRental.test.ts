import assert from 'node:assert/strict';
import {
  buildCityScreenAdminPath,
  getCityScreenAvailabilityLabel,
  getCityScreenBuyerSteps,
  getCityScreenMapPins,
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
