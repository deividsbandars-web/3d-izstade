import assert from 'node:assert/strict';
import {
  createPaymentService,
  resolveCheckoutProduct,
  resolveStripeBillingConfig,
} from '../../src/backend/billing/payments/paymentService.js';

function createPaymentStorage({ completed = false }: { completed?: boolean } = {}) {
  const upserts: unknown[] = [];

  return {
    storage: {
      from(table: string) {
        assert.equal(table, 'billing_payments');
        return {
          upsert(values: unknown) {
            upserts.push(values);
            return Promise.resolve({ error: null });
          },
          select(columns: string) {
            assert.equal(columns, 'id,status');
            const builder = {
              eq(column: string, value: string) {
                assert.equal(column, 'stripe_session_id');
                assert.equal(value, 'cs_completed');
                return builder;
              },
              maybeSingle() {
                return Promise.resolve({
                  data: completed ? { id: 'payment-1', status: 'payment_completed' } : null,
                  error: null,
                });
              },
            };
            return builder;
          },
        };
      },
    },
    upserts,
  };
}

const missingConfig = resolveStripeBillingConfig({});
assert.equal(missingConfig.data, null);
assert.equal(missingConfig.error?.status, 503);
assert.equal(missingConfig.error?.code, 'BILLING_STRIPE_NOT_CONFIGURED');

const validConfig = resolveStripeBillingConfig({
  STRIPE_SECRET_KEY: 'sk_test_123',
  STRIPE_WEBHOOK_SECRET: 'whsec_123',
  BILLING_PUBLIC_APP_URL: 'https://example.com',
});
assert.equal(validConfig.error, null);
assert.equal(validConfig.data?.successUrl, 'https://example.com/billing/success?session_id={CHECKOUT_SESSION_ID}');
assert.equal(validConfig.data?.cancelUrl, 'https://example.com/billing/cancel');
assert.equal(validConfig.data?.webhookSecret, 'whsec_123');

const proPlan = resolveCheckoutProduct('pro', 'plan');
assert.equal(proPlan.error, null);
assert.equal(proPlan.data?.amountCents, 19900);
assert.equal(proPlan.data?.mode, 'subscription');
assert.equal(proPlan.data?.planName, 'pro');

const creditPackage = resolveCheckoutProduct('credits_100', 'credits');
assert.equal(creditPackage.error, null);
assert.equal(creditPackage.data?.amountCents, 1900);
assert.equal(creditPackage.data?.creditAmount, 100);
assert.equal(creditPackage.data?.mode, 'payment');

const boothSlotDirectLookup = resolveCheckoutProduct('reservation-1', 'booth-slot');
assert.equal(boothSlotDirectLookup.data, null);
assert.equal(boothSlotDirectLookup.error?.code, 'BILLING_BOOTH_SLOT_LOOKUP_REQUIRED');

{
  let stripeCreateCalled = false;
  const service = createPaymentService({
    env: {
      BILLING_PUBLIC_APP_URL: 'https://example.com',
    },
    getStorageClient: () => createPaymentStorage().storage,
    getStripeClient: () => {
      stripeCreateCalled = true;
      throw new Error('Stripe must not be called without STRIPE_SECRET_KEY');
    },
  });

  const result = await service.createCheckoutSession('user-1', 'pro', 'plan');
  assert.equal(result.data, null);
  assert.equal(result.error?.status, 503);
  assert.equal(result.error?.code, 'BILLING_STRIPE_NOT_CONFIGURED');
  assert.equal(stripeCreateCalled, false);
}

{
  const createdSessions: unknown[] = [];
  const paymentStorage = createPaymentStorage();
  const service = createPaymentService({
    env: {
      STRIPE_SECRET_KEY: 'sk_test_123',
      STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
      BILLING_PUBLIC_APP_URL: 'https://example.com',
    },
    getStorageClient: () => paymentStorage.storage,
    getStripeClient: () => ({
      checkout: {
        sessions: {
          async create(params: unknown) {
            createdSessions.push(params);
            return {
              id: 'cs_test_real',
              url: 'https://checkout.stripe.com/pay/cs_test_real',
            };
          },
        },
      },
      webhooks: {
        constructEvent() {
          throw new Error('not used');
        },
      },
    } as never),
  });

  const result = await service.createCheckoutSession('user-1', 'pro', 'plan');
  assert.equal(result.error, null);
  assert.equal(result.data?.session_id, 'cs_test_real');
  assert.equal(result.data?.url, 'https://checkout.stripe.com/pay/cs_test_real');
  assert.equal(createdSessions.length, 1);
  assert.equal(paymentStorage.upserts.length, 1);

  const sessionParams = createdSessions[0] as {
    line_items?: Array<{ price_data?: { unit_amount?: number; recurring?: { interval?: string } } }>;
    metadata?: Record<string, string>;
    mode?: string;
  };
  assert.equal(sessionParams.mode, 'subscription');
  assert.equal(sessionParams.line_items?.[0]?.price_data?.unit_amount, 19900);
  assert.equal(sessionParams.line_items?.[0]?.price_data?.recurring?.interval, 'month');
  assert.deepEqual(sessionParams.metadata, {
    kind: 'plan',
    plan_name: 'pro',
    product_id: 'pro',
    user_id: 'user-1',
  });

  const upsertedPayment = paymentStorage.upserts[0] as {
    amount_cents?: number;
    product_kind?: string;
    status?: string;
    stripe_session_id?: string;
  };
  assert.equal(upsertedPayment.amount_cents, 19900);
  assert.equal(upsertedPayment.product_kind, 'plan');
  assert.equal(upsertedPayment.status, 'checkout_started');
  assert.equal(upsertedPayment.stripe_session_id, 'cs_test_real');
}

{
  const createdSessions: unknown[] = [];
  const paymentStorage = createPaymentStorage();
  let checkoutMarked: { reservationId: string; stripeSessionId: string } | null = null;
  const service = createPaymentService({
    env: {
      STRIPE_SECRET_KEY: 'sk_test_123',
      STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
      BILLING_PUBLIC_APP_URL: 'https://example.com',
    },
    getBoothSlotCheckoutProduct: async (reservationId) => ({
      amountCents: 900000,
      currency: 'eur',
      metadata: {
        booth_slot_id: 'showcase-right-standard-1',
        booth_slot_reservation_id: reservationId,
      },
      mode: 'payment',
      name: 'Web3D Expo premium booth slot',
      productId: reservationId,
    }),
    getStorageClient: () => paymentStorage.storage,
    getStripeClient: () => ({
      checkout: {
        sessions: {
          async create(params: unknown) {
            createdSessions.push(params);
            return {
              id: 'cs_booth_slot',
              url: 'https://checkout.stripe.com/pay/cs_booth_slot',
            };
          },
        },
      },
      webhooks: {
        constructEvent() {
          throw new Error('not used');
        },
      },
    } as never),
    markBoothSlotCheckoutStarted: async (reservationId, stripeSessionId) => {
      checkoutMarked = { reservationId, stripeSessionId };
    },
  });

  const result = await service.createCheckoutSession('user-1', 'reservation-1', 'booth-slot');
  assert.equal(result.error, null);
  assert.equal(result.data?.session_id, 'cs_booth_slot');
  assert.equal(createdSessions.length, 1);
  assert.deepEqual(checkoutMarked, { reservationId: 'reservation-1', stripeSessionId: 'cs_booth_slot' });

  const sessionParams = createdSessions[0] as {
    line_items?: Array<{ price_data?: { unit_amount?: number; recurring?: { interval?: string } } }>;
    metadata?: Record<string, string>;
    mode?: string;
  };
  assert.equal(sessionParams.mode, 'payment');
  assert.equal(sessionParams.line_items?.[0]?.price_data?.unit_amount, 900000);
  assert.equal(sessionParams.line_items?.[0]?.price_data?.recurring, undefined);
  assert.deepEqual(sessionParams.metadata, {
    booth_slot_id: 'showcase-right-standard-1',
    booth_slot_reservation_id: 'reservation-1',
    kind: 'booth-slot',
    product_id: 'reservation-1',
    user_id: 'user-1',
  });
}

{
  const service = createPaymentService({
    env: {
      STRIPE_SECRET_KEY: 'sk_test_123',
      STRIPE_WEBHOOK_SECRET: 'whsec_123',
      BILLING_PUBLIC_APP_URL: 'https://example.com',
    },
    getStorageClient: () => createPaymentStorage().storage,
    getStripeClient: () => ({
      checkout: {
        sessions: {
          async create() {
            throw new Error('not used');
          },
        },
      },
      webhooks: {
        constructEvent() {
          throw new Error('invalid signature');
        },
      },
    } as never),
  });

  const result = await service.handleWebhook(Buffer.from('{}'), 'bad-signature');
  assert.equal(result.success, false);
  assert.equal(result.error?.status, 400);
  assert.equal(result.error?.code, 'BILLING_STRIPE_WEBHOOK_INVALID');
}

{
  const paymentStorage = createPaymentStorage();
  let finalizedReservation: unknown = null;
  const service = createPaymentService({
    env: {
      STRIPE_SECRET_KEY: 'sk_test_123',
      STRIPE_WEBHOOK_SECRET: 'whsec_123',
      BILLING_PUBLIC_APP_URL: 'https://example.com',
    },
    finalizePaidBoothSlotReservation: async (payload) => {
      finalizedReservation = payload;
    },
    getEventPublisher: async () => ({
      async publish() {
        return null;
      },
    }),
    getStorageClient: () => paymentStorage.storage,
    getStripeClient: () => ({
      checkout: {
        sessions: {
          async create() {
            throw new Error('not used');
          },
        },
      },
      webhooks: {
        constructEvent() {
          return {
            data: {
              object: {
                amount_total: 900000,
                currency: 'eur',
                id: 'cs_completed',
                metadata: {
                  booth_slot_id: 'showcase-right-standard-1',
                  kind: 'booth-slot',
                  product_id: 'reservation-1',
                  user_id: 'user-1',
                },
              },
            },
            type: 'checkout.session.completed',
          };
        },
      },
    } as never),
  });

  const result = await service.handleWebhook(Buffer.from('{}'), 'valid-signature');
  assert.equal(result.success, true);
  assert.equal(result.error, null);
  assert.deepEqual(finalizedReservation, {
    amountCents: 900000,
    currency: 'eur',
    reservationId: 'reservation-1',
    stripeSessionId: 'cs_completed',
  });
  assert.equal(paymentStorage.upserts.length, 1);
}

{
  const paymentStorage = createPaymentStorage({ completed: true });
  const service = createPaymentService({
    env: {
      STRIPE_SECRET_KEY: 'sk_test_123',
      STRIPE_WEBHOOK_SECRET: 'whsec_123',
      BILLING_PUBLIC_APP_URL: 'https://example.com',
    },
    getStorageClient: () => paymentStorage.storage,
    getStripeClient: () => ({
      checkout: {
        sessions: {
          async create() {
            throw new Error('not used');
          },
        },
      },
      webhooks: {
        constructEvent() {
          return {
            data: {
              object: {
                amount_total: 1900,
                currency: 'eur',
                id: 'cs_completed',
                metadata: {
                  credit_amount: '100',
                  kind: 'credits',
                  product_id: 'credits_100',
                  user_id: 'user-1',
                },
              },
            },
            type: 'checkout.session.completed',
          };
        },
      },
    } as never),
  });

  const result = await service.handleWebhook(Buffer.from('{}'), 'valid-signature');
  assert.equal(result.success, true);
  assert.equal(result.error, null);
  assert.equal(paymentStorage.upserts.length, 0);
}
