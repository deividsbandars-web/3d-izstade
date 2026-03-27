import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { createGetExpoScene } from '../../controllers/expoController.js';

function createResponseCapture() {
  const state: { statusCode: number | null; body: any } = {
    body: null,
    statusCode: null,
  };

  const response = {
    json(payload: any) {
      state.body = payload;
      return response;
    },
    status(code: number) {
      state.statusCode = code;
      return response;
    },
  } as unknown as Response;

  return { response, state };
}

function createMockSupabase() {
  return {
    from(table: string) {
      if (table === 'cities') {
        return {
          eq() {
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
                  booths: [{ cta_label: 'Demo', id: 'booth-alpha', model_url: '', video_url: 'https://cdn.example.com/demo.mp4' }],
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
assert.equal(
  state.body.booths.some((booth: any) => booth.model_url === 'L_Booth_Default'),
  false,
);
