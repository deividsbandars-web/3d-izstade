import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import {
  captureExpoLeadWithDependencies,
  validateExpoLeadRequest,
} from '../controllers/expoLeadController.js';

function createMockResponse() {
  const result = {
    body: null as unknown,
    statusCode: 200,
  };
  const response = {
    json(body: unknown) {
      result.body = body;
      return response;
    },
    status(statusCode: number) {
      result.statusCode = statusCode;
      return response;
    },
  } as Response;

  return { response, result };
}

const valid = validateExpoLeadRequest({
  clientEmail: 'sponsor@example.com',
  clientName: 'Expo Buyer',
  companyId: 'company-1',
  companySlug: 'hero-one',
  message: 'Need a follow-up meeting.',
  sourcePath: '/expo/booth/hero-one',
});

assert.equal(valid.clientEmail, 'sponsor@example.com');
assert.equal(valid.clientName, 'Expo Buyer');
assert.equal(valid.companyId, 'company-1');
assert.equal(valid.companySlug, 'hero-one');

assert.throws(() => validateExpoLeadRequest({
  clientEmail: 'invalid',
  clientName: 'Expo Buyer',
  companyId: 'company-1',
}), /EXPO_LEAD_EMAIL_INVALID/);

assert.throws(() => validateExpoLeadRequest({
  clientEmail: 'sponsor@example.com',
  clientName: '',
  companyId: 'company-1',
}), /EXPO_LEAD_NAME_REQUIRED/);

assert.throws(() => validateExpoLeadRequest({
  clientEmail: 'sponsor@example.com',
  clientName: 'Expo Buyer',
  companyId: '',
}), /EXPO_LEAD_COMPANY_REQUIRED/);

{
  const insertedRows: unknown[] = [];
  const fakeSupabase = {
    from(table: string) {
      if (table === 'companies') {
        return {
          select(columns: string) {
            assert.equal(columns, 'id');
            return {
              eq(column: string, value: string) {
                assert.equal(column, 'slug');
                assert.equal(value, 'hero-one');
                return {
                  async maybeSingle() {
                    return { data: { id: 'company-uuid-1' }, error: null };
                  },
                };
              },
            };
          },
        };
      }

      if (table === 'service_requests') {
        return {
          async insert(rows: unknown[]) {
            insertedRows.push(...rows);
            return { error: null };
          },
        };
      }

      throw new Error(`Unexpected table ${table}`);
    },
  };
  const { response, result } = createMockResponse();
  await captureExpoLeadWithDependencies({
    body: {
      clientEmail: 'sponsor@example.com',
      clientName: 'Expo Buyer',
      companyId: 'hero-one',
      companySlug: 'hero-one',
      message: 'Need a follow-up meeting.',
      sourcePath: '/expo/booth/hero-one',
    },
  } as Request, response, { supabase: fakeSupabase as any });

  assert.equal(result.statusCode, 201);
  assert.deepEqual(result.body, {
    companyId: 'company-uuid-1',
    companySlug: 'hero-one',
    sourcePath: '/expo/booth/hero-one',
    success: true,
  });
  assert.equal(insertedRows.length, 1);
}
