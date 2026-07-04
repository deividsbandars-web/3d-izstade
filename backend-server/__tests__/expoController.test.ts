import assert from 'node:assert/strict';
import { createGetExpoScene } from '../controllers/expoController.js';

function createMockResponse() {
  return {
    body: null as any,
    ended: false,
    headers: {} as Record<string, string>,
    statusCode: 200,
    end() {
      this.ended = true;
      return this;
    },
    set(field: string | Record<string, string>, value?: string) {
      if (typeof field === 'string') {
        this.headers[field.toLowerCase()] = String(value);
      } else {
        Object.entries(field).forEach(([key, headerValue]) => {
          this.headers[key.toLowerCase()] = String(headerValue);
        });
      }

      return this;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    }
  };
}

function createResolvedQuery(result: { data: any; error: any }) {
  return {
    eq() {
      return createResolvedQuery(result);
    },
    in() {
      return Promise.resolve(result);
    },
    limit() {
      return {
        async single() {
          return result;
        }
      };
    },
    order() {
      return Promise.resolve(result);
    },
    then(resolve: (value: { data: any; error: any }) => unknown, reject?: (reason: unknown) => unknown) {
      return Promise.resolve(result).then(resolve, reject);
    }
  };
}

const mockSupabase = {
  from(table: string) {
    if (table === 'cities') {
      return {
        select() {
          return createResolvedQuery({
            data: null,
            error: new Error('CITY_NOT_FOUND'),
          });
        }
      };
    }

    if (table === 'sectors') {
      return {
        select() {
          return createResolvedQuery({
            data: [
              { id: 'sector-b', name: 'Meetings', color_theme: '#0f766e', map_position: null },
              { id: 'sector-a', name: 'Platform', color_theme: '#2563eb', map_position: null },
            ],
            error: null,
          });
        }
      };
    }

    if (table === 'companies') {
      return {
        select() {
          return createResolvedQuery({
            data: [
              {
                id: 'company-2',
                sector_id: 'sector-b',
                name: 'Duplicate Brand',
                sponsor_tier: 'silver',
                priority: 50,
                website: 'https://example.org',
                booths: null,
              },
              {
                id: 'company-1',
                sector_id: 'sector-a',
                name: 'Duplicate Brand',
                sponsor_tier: 'gold',
                priority: 80,
                logo_url: 'https://placehold.co/200x200',
                poster_url: 'https://sample-videos.com/poster.png',
                hero_asset_url: 'https://cdn.example.com/hero.png',
                website: 'https://example.com',
                booths: {
                  id: 'booth-1',
                  booth_type: 'premium',
                  company_id: 'company-1',
                  model_url: 'https://cdn.example.com/booth.glb',
                  video_url: 'https://test-videos.co.uk/big_buck_bunny.mp4',
                  poster_url: 'https://sample-videos.com/poster.png',
                },
              }
            ],
            error: null,
          });
        }
      };
    }

    if (table === 'expo_booths') {
      return {
        select() {
          return createResolvedQuery({
            data: [],
            error: null,
          });
        }
      };
    }

    throw new Error(`Unexpected table ${table}`);
  }
};

const getExpoScene = createGetExpoScene(() => mockSupabase as any);
const response = createMockResponse();

await getExpoScene({ query: {} } as any, response as any);

assert.equal(response.statusCode, 200);
assert.equal(response.body.releaseMode, 'sponsor-boulevard');
assert.equal(response.body.sceneVersion, 'expo-scene-v2-sponsor');
assert.equal(response.body.companies[0].id, 'company-1');
assert.equal(response.body.companies[0].slug, 'duplicate-brand');
assert.match(String(response.body.companies[1].slug), /^duplicate-brand-/);
assert.equal(response.body.companies[0].posterUrl, null);
assert.equal(response.body.companies[0].logo_url, null);
assert.equal(response.body.booths[0].video_url, null);
assert.equal(response.body.booths[0].posterUrl, null);
assert.equal(response.body.companies[1].ctaLabel, null);
assert.deepEqual(
  response.body.sectors.map((sector: any) => sector.id),
  ['sector-a', 'sector-b']
);
