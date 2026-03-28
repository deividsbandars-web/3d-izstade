import assert from 'node:assert/strict';
import { buildBoulevardArtPass } from '../lib/boulevardArtPass.js';
import { resolveDistrictThemeForSector } from '../lib/districtTheme.js';

const platformTheme = resolveDistrictThemeForSector({ color_theme: '#2563eb', id: 'platform', name: 'Platform Partners' });
const meetingsTheme = resolveDistrictThemeForSector({ color_theme: '#0f766e', id: 'meetings', name: 'Meetings & Demos' });

const artPass = buildBoulevardArtPass(
  [
    {
      layoutFootprint: { maxX: 120, maxZ: 12, minX: -120, minZ: -240 },
      position: [-46, 0, -44],
    },
    {
      layoutFootprint: { maxX: 120, maxZ: 12, minX: -120, minZ: -240 },
      position: [66, 0, -158],
    },
  ],
  [
    { color: '#2563eb', districtTheme: platformTheme, id: 'gateway-platform-left', position: [-92, 0, -28], side: 'left' },
    { color: '#0f766e', districtTheme: meetingsTheme, id: 'gateway-meetings-right', position: [92, 0, -166], side: 'right' },
  ],
  { showcase: true }
);

assert.ok(artPass.surfaces.some((surface) => surface.kind === 'hero_path' && surface.materialKey === 'hero_paver'));
assert.ok(artPass.surfaces.some((surface) => surface.kind === 'secondary_path' && surface.materialKey === 'light_concrete'));
assert.ok(artPass.surfaces.some((surface) => surface.kind === 'grass_band' && surface.materialKey === 'urban_grass'));
assert.ok(artPass.surfaces.some((surface) => surface.kind === 'district_plaza'));
assert.ok(artPass.surfaces.some((surface) => surface.kind === 'light_pool'));
assert.ok(artPass.surfaces.some((surface) => surface.kind === 'trim_band'));
