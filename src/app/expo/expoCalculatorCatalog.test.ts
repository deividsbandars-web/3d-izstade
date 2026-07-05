import assert from 'node:assert/strict';
import {
  getExpoCalculatorCatalog,
  getExpoCalculatorMapPins,
  getRecommendedExpoCalculatorsForBooth,
} from './expoCalculatorCatalog.js';
import type { BoothSlotAvailabilityRecord } from './boothSlotAvailability.js';

const catalog = getExpoCalculatorCatalog();

assert.ok(catalog.length >= 8);
assert.equal(new Set(catalog.map((item) => item.id)).size, catalog.length);
assert.ok(catalog.every((item) => item.route.startsWith('/')));
assert.ok(catalog.every((item) => item.summary.length > 40));
assert.ok(catalog.every((item) => item.kioskPosition.every(Number.isFinite)));
assert.ok(catalog.some((item) => item.id === 'visuals' && item.industry === 'visual-sales'));
assert.ok(catalog.some((item) => item.id === 'roof' && item.boothFit.bands.includes('showcase')));

const heroSlot: BoothSlotAvailabilityRecord = {
  band: 'media',
  boothType: 'hero',
  heldUntil: null,
  kind: 'hero',
  lane: 'center',
  nodeType: 'hero-node',
  priceCents: 250000,
  priceLabel: '2500 EUR/mo',
  reservationId: null,
  rotationY: 0,
  screenClass: 'landmark',
  slotId: 'test-hero',
  sponsorTier: 'hero',
  status: 'available',
  tier: 'hero',
  xOffset: 0,
  zOffset: -80,
};

const heroRecommendations = getRecommendedExpoCalculatorsForBooth(heroSlot);
assert.ok(heroRecommendations.length > 0);
assert.ok(heroRecommendations.length <= 5);
assert.equal(heroRecommendations[0]?.id, 'visuals');

const outdoorSlot: BoothSlotAvailabilityRecord = {
  ...heroSlot,
  band: 'discovery',
  boothType: 'standard',
  kind: 'standard',
  lane: 'right',
  screenClass: 'support',
  slotId: 'test-outdoor',
  sponsorTier: 'standard',
  tier: 'common',
};

const outdoorRecommendations = getRecommendedExpoCalculatorsForBooth(outdoorSlot);
assert.ok(outdoorRecommendations.some((item) => item.id === 'paving'));
assert.ok(outdoorRecommendations.some((item) => item.id === 'fence'));

const mapPins = getExpoCalculatorMapPins();
assert.equal(mapPins.length, catalog.length);
assert.ok(mapPins.every((pin) => pin.mapXPercent >= 5 && pin.mapXPercent <= 95));
assert.ok(mapPins.every((pin) => pin.mapYPercent >= 5 && pin.mapYPercent <= 95));
assert.ok(mapPins.every((pin) => pin.zoneLabel.length > 4));

console.log('expo calculator catalog tests passed');
