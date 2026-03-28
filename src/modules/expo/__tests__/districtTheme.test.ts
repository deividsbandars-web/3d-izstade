import assert from 'node:assert/strict';
import { auditDistrictThemeAssignments, buildDistrictThemeMap, resolveDistrictThemeForSector } from '../lib/districtTheme.js';

const designTheme = resolveDistrictThemeForSector({ color_theme: '#3b82f6', id: 'design', name: 'Design' });
const platformTheme = resolveDistrictThemeForSector({ color_theme: '#2563eb', id: 'platform', name: 'Platform Partners' });
const meetingsTheme = resolveDistrictThemeForSector({ color_theme: '#0f766e', id: 'meetings', name: 'Meetings & Demos' });
const fallbackTheme = resolveDistrictThemeForSector({ color_theme: '#64748b', id: 'other', name: 'Other Sponsors' });
const integrationsTheme = resolveDistrictThemeForSector({ color_theme: '#2563eb', id: 'platform-integrations', name: 'Platform & Integrations' });
const suitesTheme = resolveDistrictThemeForSector({ color_theme: '#0f766e', id: 'meeting-suites', name: 'Meeting Suites' });

assert.equal(designTheme.id, 'design_district');
assert.equal(platformTheme.id, 'platform_corridor');
assert.equal(meetingsTheme.id, 'meetings_forum');
assert.equal(fallbackTheme.id, 'sponsor_gallery');
assert.equal(integrationsTheme.id, 'platform_corridor');
assert.equal(suitesTheme.id, 'meetings_forum');
assert.notEqual(designTheme.gatewayStyle, meetingsTheme.gatewayStyle);
assert.notEqual(platformTheme.boothShellFamily, meetingsTheme.boothShellFamily);

const map = buildDistrictThemeMap([
  { color_theme: '#3b82f6', id: 'design', name: 'Design' },
  { color_theme: '#2563eb', id: 'platform', name: 'Platform Partners' },
  { color_theme: '#0f766e', id: 'meetings', name: 'Meetings & Demos' },
]);

assert.equal(map.get('design')?.id, 'design_district');
assert.equal(map.get('platform')?.id, 'platform_corridor');
assert.equal(map.get('meetings')?.id, 'meetings_forum');

const audit = auditDistrictThemeAssignments([
  { color_theme: '#2563eb', id: 'platform-integrations', name: 'Platform & Integrations' },
  { color_theme: '#0f766e', id: 'meeting-suites', name: 'Meeting Suites' },
  { color_theme: '#64748b', id: 'other', name: 'Other Sponsors' },
]);

assert.equal(audit.total, 3);
assert.equal(audit.fallbackCount, 1);
assert.equal(audit.themeCounts.platform_corridor, 1);
assert.equal(audit.themeCounts.meetings_forum, 1);
assert.equal(audit.themeCounts.sponsor_gallery, 1);
