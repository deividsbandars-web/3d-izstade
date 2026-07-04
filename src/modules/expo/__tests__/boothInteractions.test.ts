import assert from 'node:assert/strict';
import {
  handleBoothAction,
  openShowcaseRoom,
  trackBoothSelection,
} from '../runtime/booths/BoothInteractions.js';
import {
  isSupportedExpoInternalRoute,
  type SponsorBoothPresentation,
  type SponsorCta,
} from '../lib/sponsorBoothPresentation.js';
import type { ExpoAnalyticsDetail, ExpoAnalyticsTarget } from '../lib/expoAnalytics.js';

const company = {
  id: 'company-1',
  name: 'Acme',
};

const presentation: Pick<SponsorBoothPresentation, 'demoRoomPath' | 'template'> = {
  demoRoomPath: '/expo/booth/acme',
  template: 'premium_portal',
};

const analyticsEvents: ExpoAnalyticsDetail[] = [];
const analyticsTarget: ExpoAnalyticsTarget = {
  persist: (detail) => analyticsEvents.push(detail),
};

assert.equal(isSupportedExpoInternalRoute('/calculators'), true);
assert.equal(isSupportedExpoInternalRoute('/expo/booth/acme'), true);
assert.equal(isSupportedExpoInternalRoute('/expo/booth/acme/stream'), true);
assert.equal(isSupportedExpoInternalRoute('/expo/showroom/acme'), false);
assert.equal(isSupportedExpoInternalRoute('/admin'), false);

const navigateCalls: string[] = [];
const navigate = (path: string) => {
  navigateCalls.push(path);
};

assert.equal(openShowcaseRoom({
  analyticsEnabled: true,
  analyticsTarget,
  boothId: 'booth-1',
  company,
  navigate,
  presentation,
  sectorName: 'Infra',
}), true);
assert.deepEqual(navigateCalls, ['/expo/booth/acme']);
assert.equal(analyticsEvents.length, 1);
assert.equal(analyticsEvents[0]?.eventName, 'demo_room_entered');

analyticsEvents.length = 0;
navigateCalls.length = 0;

assert.equal(openShowcaseRoom({
  analyticsEnabled: true,
  analyticsTarget,
  boothId: 'booth-1',
  company,
  navigate,
  presentation: {
    demoRoomPath: '/expo/showroom/acme',
    template: 'premium_portal',
  },
}), false);
assert.deepEqual(navigateCalls, []);
assert.equal(analyticsEvents.length, 0);

const calculatorsAction: SponsorCta = { kind: 'calculators', label: 'Get Estimate' };
assert.equal(handleBoothAction({
  action: calculatorsAction,
  analyticsEnabled: true,
  analyticsTarget,
  boothId: 'booth-1',
  company,
  navigate,
  presentation,
}), true);
assert.deepEqual(navigateCalls, ['/calculators']);
assert.equal(analyticsEvents.length, 0);

navigateCalls.length = 0;
analyticsEvents.length = 0;

const websiteAction: SponsorCta = { kind: 'website', label: 'Visit Website', url: 'https://acme.example.com' };
const openWindowCalls: string[] = [];
assert.equal(handleBoothAction({
  action: websiteAction,
  analyticsEnabled: true,
  analyticsTarget,
  boothId: 'booth-1',
  company,
  navigate,
  openWindow: (url) => {
    openWindowCalls.push(url);
    return null;
  },
  presentation,
}), true);
assert.deepEqual(openWindowCalls, ['https://acme.example.com']);
assert.equal(analyticsEvents.length, 1);
assert.equal(analyticsEvents[0]?.eventName, 'website_opened');
assert.equal(analyticsEvents[0]?.ctaKind, 'website');

analyticsEvents.length = 0;
trackBoothSelection({
  analyticsEnabled: true,
  analyticsTarget,
  boothId: 'booth-1',
  company,
  nodeType: 'hero_left',
  presentation,
  sectorName: 'Infra',
});
assert.equal(analyticsEvents.length, 1);
assert.equal(analyticsEvents[0]?.eventName, 'booth_clicked');
