import assert from 'node:assert/strict';
import {
  flattenBoothSlotBank,
  resolveBoothSlotCommercialProfile,
} from '../../src/backend/expo/boothSlots/boothSlotMarketplaceService.js';

const syntheticSlotBank = {
  bands: {
    arrival: {
      left: {
        endcap: [
          { nodeType: 'endcap', rotationY: 1.57, slotId: 'arrival-left-endcap-0', xOffset: -298, zOffset: -26 },
        ],
        hero: [
          { nodeType: 'hero_left', rotationY: 1.57, slotId: 'arrival-left-hero-left', xOffset: -132, zOffset: -12 },
        ],
        standard: [
          { nodeType: 'standard_left', rotationY: 1.57, slotId: 'arrival-left-standard-0', xOffset: -166, zOffset: -122 },
        ],
      },
    },
    showcase: {
      right: {
        standard: [
          { nodeType: 'standard_right', rotationY: -1.57, slotId: 'showcase-right-standard-1', xOffset: 224, zOffset: -182 },
        ],
      },
    },
  },
};

const slots = flattenBoothSlotBank(syntheticSlotBank);
assert.equal(slots.length, 4);

const arrivalStandard = slots.find((slot) => slot.slotId === 'arrival-left-standard-0');
assert.equal(arrivalStandard?.tier, 'common');
assert.equal(arrivalStandard?.screenClass, 'support');
assert.equal(arrivalStandard?.priceCents, 250_000);

const showcaseStandard = slots.find((slot) => slot.slotId === 'showcase-right-standard-1');
assert.equal(showcaseStandard?.tier, 'premium');
assert.equal(showcaseStandard?.screenClass, 'presentation');
assert.equal(showcaseStandard?.priceCents, 900_000);

const endcapProfile = resolveBoothSlotCommercialProfile('arrival', 'endcap');
assert.equal(endcapProfile.tier, 'elite');
assert.equal(endcapProfile.screenClass, 'large-format');
assert.equal(endcapProfile.priceCents, 1_500_000);

const heroProfile = resolveBoothSlotCommercialProfile('media', 'hero');
assert.equal(heroProfile.tier, 'hero');
assert.equal(heroProfile.screenClass, 'landmark');
assert.equal(heroProfile.priceCents, 5_000_000);
