import assert from 'node:assert/strict';
import { buildExpoCuratedPropPlacements } from '../lib/expoCuratedPropPlacement.js';
import { buildExpoWorldContract } from '../world-contract.js';

const sponsorData = {
  companies: [
    { id: 'hero-1', name: 'Warpala Platform', sector_id: 'sector-1', sponsorTier: 'hero', boothType: 'hero', booth: { id: 'booth-1' } },
    { id: 'premium-1', name: 'Concierge', sector_id: 'sector-2', sponsorTier: 'gold', boothType: 'premium', booth: { id: 'booth-2' } },
    { id: 'standard-1', name: 'Demo Room', sector_id: 'sector-2', sponsorTier: 'silver', boothType: 'standard', booth: { id: 'booth-3' } },
  ],
  sectors: [
    { id: 'sector-1', name: 'Platform Partners', color_theme: '#2563eb', map_position: { x: 0, z: -90 } },
    { id: 'sector-2', name: 'Meetings & Demos', color_theme: '#0f766e', map_position: { x: 0, z: -180 } },
  ],
};

const { boothPlacements: placements, districtPrograms, sectorMarkers: markers } = buildExpoWorldContract(sponsorData as any);

const balancedProps = buildExpoCuratedPropPlacements(placements, markers, districtPrograms, { showcase: false });
const showcaseProps = buildExpoCuratedPropPlacements(placements, markers, districtPrograms, { showcase: true });

assert.ok(balancedProps.length > 0);
assert.ok(showcaseProps.length > balancedProps.length);
assert.ok(balancedProps.some((entry) => entry.assetKey === 'planter'));
assert.ok(balancedProps.some((entry) => entry.assetKey === 'bench'));
assert.ok(balancedProps.some((entry) => entry.assetKey === 'light_square' || entry.assetKey === 'light_square_double'));
assert.ok(balancedProps.some((entry) => entry.assetKey === 'sign_highway_wide'));
assert.ok(balancedProps.some((entry) => entry.assetKey === 'info_kiosk_base_computer_screen'));
assert.ok(balancedProps.some((entry) => entry.decorationKind === 'district-sign-wide' && entry.label === 'Platform Partners'));
assert.ok(balancedProps.some((entry) => entry.decorationKind === 'info-kiosk' && entry.label === 'Warpala Platform'));
assert.ok(balancedProps.some((entry) => entry.decorationKind === 'info-kiosk' && entry.subLabel === 'LIVE PROGRAM'));
assert.ok(showcaseProps.some((entry) => entry.assetKey === 'light_curved'));
assert.equal(new Set(showcaseProps.map((entry) => entry.id)).size, showcaseProps.length);
