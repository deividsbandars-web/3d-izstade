import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { createGetExpoScene } from '../../controllers/expoController.js';

function createResponseCapture() {
  const state: { body: any; ended: boolean; headers: Record<string, string>; statusCode: number | null } = {
    body: null,
    ended: false,
    headers: {},
    statusCode: null,
  };

  const response = {
    end() {
      state.ended = true;
      return response;
    },
    json(payload: any) {
      state.body = payload;
      return response;
    },
    set(field: string | Record<string, string>, value?: string) {
      if (typeof field === 'string') {
        state.headers[field.toLowerCase()] = String(value);
      } else {
        Object.entries(field).forEach(([key, headerValue]) => {
          state.headers[key.toLowerCase()] = String(headerValue);
        });
      }

      return response;
    },
    status(code: number) {
      state.statusCode = code;
      return response;
    },
  } as unknown as Response;

  return { response, state };
}

function createMockSupabase(onFrom: (table: string) => void = () => undefined) {
  return {
    from(table: string) {
      onFrom(table);

      if (table === 'cities') {
        return {
          eq() {
            return {
              limit() {
                return {
                  async single() {
                    return {
                      data: {
                        architecture_style: 'futuristic',
                        global_location: null,
                        id: 'city-1',
                        name: 'Warpala Expo',
                      },
                      error: null,
                    };
                  },
                };
              },
              async single() {
                return {
                  data: {
                    architecture_style: 'futuristic',
                    global_location: null,
                    id: 'city-1',
                    name: 'Warpala Expo',
                  },
                  error: null,
                };
              },
            };
          },
          limit() {
            return {
              async single() {
                return {
                  data: {
                    architecture_style: 'futuristic',
                    global_location: null,
                    id: 'city-1',
                    name: 'Warpala Expo',
                  },
                  error: null,
                };
              },
            };
          },
          select() {
            return this;
          },
        };
      }

      if (table === 'sectors') {
        return {
          async order() {
            return { data: [], error: null };
          },
          eq() {
            return Promise.resolve({
              data: [
                { color_theme: '#0ea5e9', id: 'sector-a', map_position: { x: 0, z: 0 }, name: 'Alpha' },
                { color_theme: '#22c55e', id: 'sector-b', map_position: { x: 10, z: 0 }, name: 'Beta' },
              ],
              error: null,
            });
          },
          select() {
            return this;
          },
        };
      }

      if (table === 'companies') {
        return {
          eq() {
            return this;
          },
          in() {
            return Promise.resolve({
              data: [
                {
                  activity_score: 0.5,
                  booking_url: 'https://beta.example.com/book',
                  booths: [{ cta_label: 'Book', id: 'booth-beta', model_url: null, video_url: '' }],
                  cta_label: 'Book',
                  current_revenue: 10,
                  employee_count: 5,
                  hero_asset_url: null,
                  id: 'company-beta',
                  logo_url: 'https://cdn.example.com/beta.png',
                  name: 'Bēta Group',
                  poster_url: 'https://cdn.example.com/beta-poster.png',
                  priority: 10,
                  sector_id: 'sector-b',
                  sponsor_tier: 'gold',
                  tagline: 'Beta partner',
                  website: 'https://beta.example.com',
                },
                {
                  activity_score: 0.8,
                  booking_url: 'https://alpha.example.com/book',
                  booths: [{
                    cta_label: 'Demo',
                    hero_screen_image_url: 'https://cdn.example.com/raw-alpha-screen.webp',
                    hero_screen_title: 'Raw Alpha Screen',
                    id: 'booth-alpha',
                    model_url: '',
                    video_url: 'https://cdn.example.com/demo.mp4',
                  }],
                  cta_label: 'Demo',
                  current_revenue: 20,
                  employee_count: 8,
                  hero_asset_url: 'https://cdn.example.com/hero.glb',
                  id: 'company-alpha',
                  logo_url: 'https://cdn.example.com/alpha.png',
                  name: 'Ālfa Group',
                  poster_url: 'https://cdn.example.com/alpha-poster.png',
                  priority: 10,
                  sector_id: 'sector-a',
                  sponsor_tier: 'hero',
                  tagline: 'Alpha partner',
                  website: 'https://alpha.example.com',
                },
                {
                  activity_score: 0.3,
                  booking_url: null,
                  booths: [],
                  cta_label: null,
                  current_revenue: 5,
                  employee_count: 3,
                  hero_asset_url: null,
                  id: 'company-gamma',
                  logo_url: null,
                  name: 'Gamma Group',
                  poster_url: null,
                  priority: 2,
                  sector_id: 'sector-a',
                  sponsor_tier: 'platinum',
                  tagline: null,
                  website: null,
                },
              ],
              error: null,
            });
          },
          select() {
            return this;
          },
        };
      }

      if (table === 'expo_booths') {
        return {
          select() {
            return Promise.resolve({
              data: [
                {
                  assets_3d: {
                    city_screen_content: {
                      imageUrl: 'https://cdn.example.com/managed-alpha-city-screen.webp',
                      mode: 'image',
                      screenSlotId: 'city-left-marquee-hero',
                      status: 'published',
                      subtitle: 'Managed alpha city campaign',
                      title: 'Managed Alpha City Screen',
                    },
                    screen_content: {
                      imageUrl: 'https://cdn.example.com/managed-alpha-screen.webp',
                      mode: 'image',
                      screenSlotId: 'booth-company-alpha-main-screen',
                      status: 'published',
                      subtitle: 'Managed alpha screen content',
                      title: 'Managed Alpha Screen',
                    },
                  },
                  company_name: 'Ä€lfa Group',
                  company_id: 'company-alpha',
                  id: 'managed-alpha-row',
                },
                {
                  assets_3d: {
                    city_screen_content: {
                      campaignEndDate: '2000-02-01',
                      campaignStartDate: '2000-01-01',
                      campaignStatus: 'live',
                      ctaLabel: 'Visit Gamma',
                      mode: 'generated-card',
                      screenSlotId: 'city-right-marquee-hero',
                      status: 'published',
                      subtitle: 'Managed city advertising content',
                      title: 'Managed Gamma City Screen',
                    },
                    screen_content: {
                      ctaLabel: 'Book Screen',
                      mode: 'generated-card',
                      status: 'published',
                      subtitle: 'Managed booth screen content',
                      title: 'Managed Gamma Screen',
                    },
                  },
                  company_name: 'Gamma Group',
                  id: 'managed-gamma-row',
                },
              ],
              error: null,
            });
          },
        };
      }

      throw new Error(`Unexpected table ${table}`);
    },
  };
}

const getExpoScene = createGetExpoScene(() => createMockSupabase() as any);
const { response, state } = createResponseCapture();

await getExpoScene({ query: { cityId: '  city-1 ' } } as unknown as Request, response);

assert.equal(state.statusCode, 200);
assert.equal(state.body.authPolicy, 'public-readonly');
assert.deepEqual(
  state.body.companies.map((company: any) => company.id),
  ['company-alpha', 'company-beta', 'company-gamma'],
);
assert.equal(state.body.companies[0].slug, 'alfa-group');
assert.equal(state.body.booths[0].model_url, null);
assert.equal(state.body.booths[1].model_url, null);
assert.equal(state.body.booths[2].model_url, null);
const gammaBooth = state.body.booths.find((booth: any) => booth.companyId === 'company-gamma');
assert.equal(gammaBooth.heroScreenTitle, 'Managed Gamma Screen');
assert.equal(gammaBooth.heroScreenText, 'Managed booth screen content');
assert.equal(gammaBooth.cityScreenTitle, null);
assert.equal(gammaBooth.cityScreenText, null);
assert.equal(gammaBooth.cityScreenSlotId, null);
assert.equal(gammaBooth.cityScreenCtaLabel, null);
const alphaBooth = state.body.booths.find((booth: any) => booth.companyId === 'company-alpha');
assert.equal(alphaBooth.heroScreenTitle, 'Managed Alpha Screen');
assert.equal(alphaBooth.heroScreenImageUrl, 'https://cdn.example.com/managed-alpha-screen.webp');
assert.equal(alphaBooth.heroScreenSlotId, 'booth-company-alpha-main-screen');
assert.equal(alphaBooth.cityScreenTitle, 'Managed Alpha City Screen');
assert.equal(alphaBooth.cityScreenImageUrl, 'https://cdn.example.com/managed-alpha-city-screen.webp');
assert.equal(alphaBooth.cityScreenSlotId, 'city-left-marquee-hero');
assert.equal(
  state.body.booths.some((booth: any) => booth.model_url === 'L_Booth_Default'),
  false,
);

const cache = new Map();
let now = 1_000;
const queriedTables: string[] = [];
const getCachedExpoScene = createGetExpoScene(
  () => createMockSupabase((table) => queriedTables.push(table)) as any,
  { cache, now: () => now, ttlMs: 1_000 },
);

const first = createResponseCapture();
await getCachedExpoScene({ query: {}, headers: {} } as unknown as Request, first.response);

assert.equal(first.state.statusCode, 200);
assert.match(String(first.state.headers['cache-control']), /public, max-age=1, stale-while-revalidate=120/);
assert.match(String(first.state.headers.etag), /^".+"$/);
assert.equal(first.state.ended, false);
const etag = first.state.headers.etag;
const initialQueryCount = queriedTables.length;
assert.ok(initialQueryCount > 0);

const second = createResponseCapture();
await getCachedExpoScene({ query: {}, headers: {} } as unknown as Request, second.response);

assert.equal(second.state.statusCode, 200);
assert.deepEqual(second.state.body, first.state.body);
assert.equal(second.state.headers.etag, etag);
assert.equal(queriedTables.length, initialQueryCount);

const third = createResponseCapture();
await getCachedExpoScene({ query: {}, headers: { 'if-none-match': etag } } as unknown as Request, third.response);

assert.equal(third.state.statusCode, 304);
assert.equal(third.state.ended, true);
assert.equal(third.state.body, null);
assert.equal(third.state.headers.etag, etag);
assert.equal(queriedTables.length, initialQueryCount);

now += 1_001;
const fourth = createResponseCapture();
await getCachedExpoScene({ query: {}, headers: {} } as unknown as Request, fourth.response);

assert.equal(fourth.state.statusCode, 200);
assert.ok(queriedTables.length > initialQueryCount);
