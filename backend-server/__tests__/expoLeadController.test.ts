import assert from 'node:assert/strict';
import { validateExpoLeadRequest } from '../controllers/expoLeadController.js';

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
