import assert from 'node:assert/strict';
import {
  createExpoAnalyticsDetail,
  trackExpoAnalyticsEvent,
  trackExpoBookingClicked,
  trackExpoBoothClicked,
  trackExpoBoothViewed,
  trackExpoDemoRoomEntered,
  trackExpoSceneLoaded,
  trackExpoScreenRouteClicked,
  trackExpoSectorEntered,
  trackExpoWebsiteOpened,
} from '../lib/expoAnalytics.js';

const company = {
  id: 'company-1',
  slug: 'acme-industries',
  sponsorTier: 'gold',
};

const detail = createExpoAnalyticsDetail('website_opened', company, { action: 'website' });
assert.deepEqual(detail, {
  action: 'website',
  boothId: null,
  companyId: 'company-1',
  companySlug: 'acme-industries',
  eventName: 'website_opened',
  sectorId: null,
  sectorName: null,
  sessionId: null,
  sponsorTier: 'gold',
});

const pushedEvents: Array<Record<string, unknown>> = [];
const dispatchedEvents: Event[] = [];
const analyticsTrackCalls: Array<{ eventName: string; payload: Record<string, unknown> }> = [];
const gtagCalls: Array<{ eventName: string; payload: Record<string, unknown> }> = [];
const persistedEvents: Array<Record<string, unknown>> = [];
const tracked = trackExpoAnalyticsEvent(
  'demo_room_entered',
  company,
  { boothTemplate: 'premium_spine' },
  {
    analyticsTrack: (eventName, payload) => analyticsTrackCalls.push({ eventName, payload }),
    createEvent: (eventDetail) => ({ type: 'expo:analytics', detail: eventDetail } as unknown as Event),
    dataLayer: pushedEvents,
    dispatchEvent: (event) => {
      dispatchedEvents.push(event);
      return true;
    },
    gtag: (_command, eventName, payload) => gtagCalls.push({ eventName, payload }),
    persist: (detail) => persistedEvents.push(detail),
  }
);

assert.equal(tracked.eventName, 'demo_room_entered');
assert.equal(tracked.boothTemplate, 'premium_spine');
assert.equal(dispatchedEvents.length, 1);
assert.equal(persistedEvents[0]?.eventName, 'demo_room_entered');
assert.deepEqual(pushedEvents[0], {
  boothId: null,
  boothTemplate: 'premium_spine',
  companyId: 'company-1',
  companySlug: 'acme-industries',
  event: 'expo_demo_room_entered',
  eventName: 'demo_room_entered',
  sectorId: null,
  sectorName: null,
  sessionId: null,
  sponsorTier: 'gold',
});
assert.equal(analyticsTrackCalls[0]?.eventName, 'expo_demo_room_entered');
assert.equal(gtagCalls[0]?.eventName, 'expo_demo_room_entered');

assert.equal(trackExpoSceneLoaded({ boothCount: 12 }, { dataLayer: [] }).eventName, 'scene_loaded');
assert.equal(trackExpoSectorEntered(company, { sectorName: 'Infra' }, { dataLayer: [] }).eventName, 'sector_entered');
assert.equal(trackExpoBoothViewed(company, { boothId: 'booth-1' }, { dataLayer: [] }).eventName, 'booth_viewed');
assert.equal(trackExpoBoothClicked(company, { boothId: 'booth-1' }, { dataLayer: [] }).eventName, 'booth_clicked');
assert.equal(trackExpoScreenRouteClicked(company, { route: '/expo/booth/company-1', screenSourceId: 'screen-1' }, { dataLayer: [] }).eventName, 'screen_route_clicked');
assert.equal(trackExpoWebsiteOpened(company, { websiteUrl: 'https://acme.example.com' }, { dataLayer: [] }).eventName, 'website_opened');
assert.equal(trackExpoBookingClicked(company, { bookingUrl: 'https://acme.example.com/book' }, { dataLayer: [] }).eventName, 'booking_clicked');
assert.equal(trackExpoDemoRoomEntered(company, { boothId: 'booth-1' }, { dataLayer: [] }).eventName, 'demo_room_entered');
assert.deepEqual(analyticsTrackCalls[0]?.payload, {
  boothId: null,
  boothTemplate: 'premium_spine',
  companyId: 'company-1',
  companySlug: 'acme-industries',
  eventName: 'demo_room_entered',
  sectorId: null,
  sectorName: null,
  sessionId: null,
  sponsorTier: 'gold',
});
