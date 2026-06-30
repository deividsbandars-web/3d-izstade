import Stripe from 'stripe';
import { logger } from '../../logging/logger.js';
import { getSupabaseAdminClient } from '../../lib/supabaseAdmin.js';
import { PlatformEvent } from '../../events/eventTypes.js';
import { PLANS } from '../plans/planService.js';

export type CheckoutKind = 'plan' | 'credits' | 'booth-slot';

type PaymentServiceError = {
  code: string;
  message: string;
  status: number;
};

type PaymentServiceResult<T> = {
  data: T | null;
  error: PaymentServiceError | null;
};

type CheckoutProduct = {
  amountCents: number;
  creditAmount?: number;
  currency: string;
  metadata?: Record<string, string>;
  mode: Stripe.Checkout.SessionCreateParams.Mode;
  name: string;
  planName?: string;
  productId: string;
};

type StripeBillingConfig = {
  cancelUrl: string;
  publishableKey: string | null;
  secretKey: string;
  successUrl: string;
  webhookSecret: string | null;
};

type StripeClientLike = {
  checkout: {
    sessions: {
      create(params: Stripe.Checkout.SessionCreateParams): Promise<Stripe.Checkout.Session>;
    };
  };
  webhooks: {
    constructEvent(payload: string | Buffer, header: string, secret: string): Stripe.Event;
  };
};

type SupabaseStorageClient = {
  from(table: string): any;
};

type CreditServiceLike = {
  addCredits(userId: string, amount: number): Promise<{ data: unknown; error: string | null }>;
};

type EventPublisherLike = {
  publish(eventType: PlatformEvent, data: Record<string, unknown>): Promise<unknown>;
};

type PaymentServiceDependencies = {
  env?: NodeJS.ProcessEnv;
  finalizePaidBoothSlotReservation?: BoothSlotCheckoutHandlers['finalizePaidBoothSlotReservation'];
  getBoothSlotCheckoutProduct?: BoothSlotCheckoutHandlers['getBoothSlotCheckoutProduct'];
  getCreditService?: () => CreditServiceLike | Promise<CreditServiceLike>;
  getEventPublisher?: () => EventPublisherLike | Promise<EventPublisherLike>;
  markBoothSlotCheckoutStarted?: BoothSlotCheckoutHandlers['markBoothSlotCheckoutStarted'];
  getStorageClient?: () => SupabaseStorageClient;
  getStripeClient?: (secretKey: string) => StripeClientLike;
};

export type BoothSlotCheckoutHandlers = {
  finalizePaidBoothSlotReservation(payload: {
    amountCents: number | null;
    currency: string | null;
    reservationId: string;
    stripeSessionId: string;
  }, options: { storage: SupabaseStorageClient }): Promise<unknown>;
  getBoothSlotCheckoutProduct(reservationId: string, options: { storage: SupabaseStorageClient }): Promise<CheckoutProduct>;
  markBoothSlotCheckoutStarted(reservationId: string, stripeSessionId: string, options: { storage: SupabaseStorageClient }): Promise<unknown>;
};

const DEFAULT_CURRENCY = 'eur';
const CREDIT_PACKAGES: Record<string, { amountCents: number; credits: number; name: string }> = {
  '100': { amountCents: 1900, credits: 100, name: '100 AI credits' },
  '500': { amountCents: 7900, credits: 500, name: '500 AI credits' },
  '1000': { amountCents: 14900, credits: 1000, name: '1000 AI credits' },
  credits_100: { amountCents: 1900, credits: 100, name: '100 AI credits' },
  credits_500: { amountCents: 7900, credits: 500, name: '500 AI credits' },
  credits_1000: { amountCents: 14900, credits: 1000, name: '1000 AI credits' },
};

let cachedStripeClient: StripeClientLike | null = null;
let cachedStripeSecretKey: string | null = null;
let registeredBoothSlotCheckoutHandlers: BoothSlotCheckoutHandlers | null = null;

function createError(code: string, message: string, status = 500): PaymentServiceError {
  return { code, message, status };
}

function normalizeOptionalString(value: string | undefined) {
  return value?.trim() || null;
}

function normalizeCheckoutUrl(value: string | null, key: string) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  try {
    const parsed = new URL(trimmed.replace('{CHECKOUT_SESSION_ID}', 'checkout_session_id'));
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return trimmed;
  } catch {
    logger.warn('PaymentService', `Invalid ${key}; Stripe checkout is disabled until it is fixed.`);
    return null;
  }
}

function deriveCheckoutUrl(env: NodeJS.ProcessEnv, explicitKey: string, fallbackPath: string) {
  const explicit = normalizeCheckoutUrl(normalizeOptionalString(env[explicitKey]), explicitKey);
  if (explicit) {
    return explicit;
  }

  const publicAppUrl = normalizeOptionalString(env.BILLING_PUBLIC_APP_URL)
    ?? normalizeOptionalString(env.VITE_PUBLIC_APP_URL)
    ?? normalizeOptionalString(env.PUBLIC_APP_URL);
  const normalizedPublicAppUrl = normalizeCheckoutUrl(publicAppUrl, 'BILLING_PUBLIC_APP_URL');
  if (!normalizedPublicAppUrl) {
    return null;
  }

  return `${new URL(normalizedPublicAppUrl).origin}${fallbackPath}`;
}

export function resolveStripeBillingConfig(env: NodeJS.ProcessEnv = process.env): PaymentServiceResult<StripeBillingConfig> {
  const secretKey = normalizeOptionalString(env.STRIPE_SECRET_KEY);
  if (!secretKey) {
    return {
      data: null,
      error: createError(
        'BILLING_STRIPE_NOT_CONFIGURED',
        'Stripe checkout is not configured. Set STRIPE_SECRET_KEY before creating checkout sessions.',
        503,
      ),
    };
  }

  const successUrl = deriveCheckoutUrl(env, 'BILLING_CHECKOUT_SUCCESS_URL', '/billing/success?session_id={CHECKOUT_SESSION_ID}');
  const cancelUrl = deriveCheckoutUrl(env, 'BILLING_CHECKOUT_CANCEL_URL', '/billing/cancel');
  if (!successUrl || !cancelUrl) {
    return {
      data: null,
      error: createError(
        'BILLING_STRIPE_CHECKOUT_URLS_MISSING',
        'Stripe checkout URLs are not configured. Set BILLING_CHECKOUT_SUCCESS_URL and BILLING_CHECKOUT_CANCEL_URL, or BILLING_PUBLIC_APP_URL.',
        503,
      ),
    };
  }

  return {
    data: {
      cancelUrl,
      publishableKey: normalizeOptionalString(env.STRIPE_PUBLISHABLE_KEY),
      secretKey,
      successUrl,
      webhookSecret: normalizeOptionalString(env.STRIPE_WEBHOOK_SECRET),
    },
    error: null,
  };
}

export function resolveCheckoutProduct(productId: string, kind: CheckoutKind): PaymentServiceResult<CheckoutProduct> {
  const normalizedProductId = productId.trim().toLowerCase();
  if (!normalizedProductId) {
    return {
      data: null,
      error: createError('BILLING_PRODUCT_REQUIRED', 'A billing product id is required.', 400),
    };
  }

  if (kind === 'booth-slot') {
    return {
      data: null,
      error: createError('BILLING_BOOTH_SLOT_LOOKUP_REQUIRED', 'Booth slot checkout products must be resolved from an active reservation.', 400),
    };
  }

  if (kind === 'plan') {
    const plan = PLANS[normalizedProductId as keyof typeof PLANS];
    if (!plan || plan.monthly_price <= 0) {
      return {
        data: null,
        error: createError('BILLING_PLAN_NOT_FOUND', 'The requested billing plan is not available for checkout.', 400),
      };
    }

    return {
      data: {
        amountCents: Math.round(plan.monthly_price * 100),
        currency: DEFAULT_CURRENCY,
        mode: 'subscription',
        name: `${plan.name} plan`,
        planName: normalizedProductId,
        productId: normalizedProductId,
      },
      error: null,
    };
  }

  const creditPackage = CREDIT_PACKAGES[normalizedProductId];
  if (!creditPackage) {
    return {
      data: null,
      error: createError('BILLING_CREDIT_PACKAGE_NOT_FOUND', 'The requested credit package is not available for checkout.', 400),
    };
  }

  return {
    data: {
      amountCents: creditPackage.amountCents,
      creditAmount: creditPackage.credits,
      currency: DEFAULT_CURRENCY,
      mode: 'payment',
      name: creditPackage.name,
      productId: normalizedProductId,
    },
    error: null,
  };
}

function getDefaultStripeClient(secretKey: string): StripeClientLike {
  if (!cachedStripeClient || cachedStripeSecretKey !== secretKey) {
    cachedStripeClient = new Stripe(secretKey);
    cachedStripeSecretKey = secretKey;
  }

  return cachedStripeClient;
}

function getDefaultStorageClient() {
  return getSupabaseAdminClient();
}

async function getDefaultCreditService() {
  const module = await import('../credits/creditService.js');
  return module.creditService;
}

async function getDefaultEventPublisher() {
  const module = await import('../../events/eventPublisher.js');
  return module.eventPublisher;
}

export function configureBoothSlotCheckoutHandlers(handlers: BoothSlotCheckoutHandlers) {
  registeredBoothSlotCheckoutHandlers = handlers;
}

function getPaymentStorage(dependencies: PaymentServiceDependencies) {
  return dependencies.getStorageClient?.() ?? getDefaultStorageClient();
}

async function getPaymentCreditService(dependencies: PaymentServiceDependencies) {
  return dependencies.getCreditService?.() ?? getDefaultCreditService();
}

async function getPaymentEventPublisher(dependencies: PaymentServiceDependencies) {
  return dependencies.getEventPublisher?.() ?? getDefaultEventPublisher();
}

function coercePaymentServiceError(error: unknown): PaymentServiceError {
  if (typeof error === 'object' && error) {
    const candidate = error as Partial<PaymentServiceError>;
    if (candidate.code && candidate.message) {
      return createError(candidate.code, candidate.message, candidate.status ?? 500);
    }
  }

  return createError(
    'BILLING_PRODUCT_LOOKUP_FAILED',
    error instanceof Error ? error.message : 'Failed to resolve billing product.',
    500,
  );
}

async function resolveCheckoutProductForCheckout(
  productId: string,
  kind: CheckoutKind,
  dependencies: PaymentServiceDependencies,
): Promise<PaymentServiceResult<CheckoutProduct>> {
  if (kind !== 'booth-slot') {
    return resolveCheckoutProduct(productId, kind);
  }

  try {
    const storage = getPaymentStorage(dependencies);
    const resolver = dependencies.getBoothSlotCheckoutProduct ?? registeredBoothSlotCheckoutHandlers?.getBoothSlotCheckoutProduct;
    if (!resolver) {
      return {
        data: null,
        error: createError(
          'BILLING_BOOTH_SLOT_CHECKOUT_NOT_CONFIGURED',
          'Booth slot checkout is not configured in this backend process.',
          503,
        ),
      };
    }

    return {
      data: await resolver(productId, { storage }),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: coercePaymentServiceError(error),
    };
  }
}

async function upsertPayment(storage: SupabaseStorageClient, values: Record<string, unknown>) {
  const { error } = await storage
    .from('billing_payments')
    .upsert(values, { onConflict: 'stripe_session_id' });

  if (error) {
    throw new Error(error.message || String(error));
  }
}

async function findCompletedPayment(storage: SupabaseStorageClient, stripeSessionId: string) {
  const { data, error } = await storage
    .from('billing_payments')
    .select('id,status')
    .eq('stripe_session_id', stripeSessionId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || String(error));
  }

  return data?.status === 'payment_completed';
}

export function createPaymentService(dependencies: PaymentServiceDependencies = {}) {
  const env = dependencies.env ?? process.env;
  const getStripeClient = dependencies.getStripeClient ?? getDefaultStripeClient;

  return {
    async createCheckoutSession(userId: string, productId: string, kind: CheckoutKind) {
      try {
        const config = resolveStripeBillingConfig(env);
        if (config.error || !config.data) {
          return { data: null, error: config.error };
        }

        const product = await resolveCheckoutProductForCheckout(productId, kind, dependencies);
        if (product.error || !product.data) {
          return { data: null, error: product.error };
        }

        const stripe = getStripeClient(config.data.secretKey);
        const metadata: Record<string, string> = {
          ...(product.data.metadata ?? {}),
          kind,
          product_id: product.data.productId,
          user_id: userId,
        };
        if (product.data.planName) {
          metadata.plan_name = product.data.planName;
        }
        if (typeof product.data.creditAmount === 'number') {
          metadata.credit_amount = String(product.data.creditAmount);
        }

        const session = await stripe.checkout.sessions.create({
          allow_promotion_codes: true,
          client_reference_id: userId,
          line_items: [{
            price_data: {
              currency: product.data.currency,
              product_data: {
                name: product.data.name,
              },
              recurring: product.data.mode === 'subscription' ? { interval: 'month' } : undefined,
              unit_amount: product.data.amountCents,
            },
            quantity: 1,
          }],
          metadata,
          mode: product.data.mode,
          payment_method_types: ['card'],
          success_url: config.data.successUrl,
          cancel_url: config.data.cancelUrl,
          ...(product.data.mode === 'subscription' ? { subscription_data: { metadata } } : {}),
        });

        const storage = getPaymentStorage(dependencies);
        await upsertPayment(storage, {
          amount_cents: product.data.amountCents,
          currency: product.data.currency,
          metadata,
          product_id: product.data.productId,
          product_kind: kind,
          status: 'checkout_started',
          stripe_session_id: session.id,
          stripe_checkout_url: session.url,
          user_id: userId,
        });

        if (kind === 'booth-slot') {
          const marker = dependencies.markBoothSlotCheckoutStarted ?? registeredBoothSlotCheckoutHandlers?.markBoothSlotCheckoutStarted;
          if (!marker) {
            return {
              data: null,
              error: createError(
                'BILLING_BOOTH_SLOT_CHECKOUT_NOT_CONFIGURED',
                'Booth slot checkout is not configured in this backend process.',
                503,
              ),
            };
          }
          await marker(product.data.productId, session.id, { storage });
        }

        return {
          data: {
            publishableKey: config.data.publishableKey,
            session_id: session.id,
            url: session.url,
          },
          error: null,
        };
      } catch (error) {
        logger.error('PaymentService', 'Failed to create checkout session', error);
        return {
          data: null,
          error: createError('BILLING_CHECKOUT_CREATE_FAILED', 'Failed to create Stripe checkout session.'),
        };
      }
    },

    async upgradePlan(userId: string, newPlan: string) {
      try {
        logger.info('PaymentService', `Upgrading user ${userId} to plan ${newPlan}`);

        const { data, error } = await getPaymentStorage(dependencies)
          .from('users')
          .update({ plan: newPlan.toLowerCase(), subscription_status: 'active' })
          .eq('id', userId)
          .select()
          .single();

        if (error) {
          throw error;
        }

        const publisher = await getPaymentEventPublisher(dependencies);
        await publisher.publish(PlatformEvent.SUBSCRIPTION_CREATED, { userId, plan: newPlan });

        return { data, error: null };
      } catch (error) {
        logger.error('PaymentService', `Failed to upgrade plan for user ${userId}`, error);
        return { data: null, error: createError('BILLING_PLAN_UPGRADE_FAILED', 'Failed to upgrade plan.') };
      }
    },

    async handleWebhook(payload: string | Buffer, signature: string | undefined) {
      try {
        const config = resolveStripeBillingConfig(env);
        if (config.error || !config.data) {
          return { success: false, error: config.error };
        }
        if (!config.data.webhookSecret) {
          return {
            success: false,
            error: createError(
              'BILLING_STRIPE_WEBHOOK_NOT_CONFIGURED',
              'Stripe webhook verification is not configured. Set STRIPE_WEBHOOK_SECRET.',
              503,
            ),
          };
        }
        if (!signature) {
          return {
            success: false,
            error: createError('BILLING_STRIPE_SIGNATURE_MISSING', 'Stripe signature header is required.', 400),
          };
        }

        const stripe = getStripeClient(config.data.secretKey);
        const event = stripe.webhooks.constructEvent(payload, signature, config.data.webhookSecret);
        logger.info('PaymentService', 'Processing payment webhook', { eventType: event.type });

        if (event.type === 'checkout.session.completed') {
          await this.processCompletedCheckoutSession(event.data.object as Stripe.Checkout.Session);
        } else if (event.type === 'invoice.payment_failed') {
          logger.warn('PaymentService', 'Stripe invoice payment failed', {
            stripeObjectId: (event.data.object as { id?: string }).id ?? null,
          });
        }

        return { success: true, error: null };
      } catch (error) {
        logger.error('PaymentService', 'Webhook processing failed', error);
        return {
          success: false,
          error: createError('BILLING_STRIPE_WEBHOOK_INVALID', 'Stripe webhook verification or processing failed.', 400),
        };
      }
    },

    async processCompletedCheckoutSession(session: Stripe.Checkout.Session) {
      const stripeSessionId = session.id;
      const userId = session.metadata?.user_id?.trim();
      const kind = session.metadata?.kind?.trim() as CheckoutKind | undefined;
      const productId = session.metadata?.product_id?.trim();
      const storage = getPaymentStorage(dependencies);

      if (!stripeSessionId || !userId || !kind || !productId) {
        throw new Error('Stripe checkout session is missing required billing metadata.');
      }

      if (await findCompletedPayment(storage, stripeSessionId)) {
        logger.info('PaymentService', 'Ignoring duplicate completed checkout session', { stripeSessionId });
        return;
      }

      const publisher = await getPaymentEventPublisher(dependencies);
      await publisher.publish(PlatformEvent.PAYMENT_RECEIVED, {
        amount: session.amount_total ?? null,
        productType: kind,
        userId,
      });

      if (kind === 'plan') {
        const planName = session.metadata?.plan_name?.trim();
        if (!planName) {
          throw new Error('Stripe plan checkout session is missing plan_name metadata.');
        }
        await this.upgradePlan(userId, planName);
      } else if (kind === 'credits') {
        const creditAmount = Number.parseInt(session.metadata?.credit_amount ?? '', 10);
        if (!Number.isInteger(creditAmount) || creditAmount <= 0) {
          throw new Error('Stripe credit checkout session is missing valid credit_amount metadata.');
        }
        const credits = await getPaymentCreditService(dependencies);
        const result = await credits.addCredits(userId, creditAmount);
        if (result.error) {
          throw new Error(result.error);
        }
      } else if (kind === 'booth-slot') {
        const finalizer = dependencies.finalizePaidBoothSlotReservation ?? registeredBoothSlotCheckoutHandlers?.finalizePaidBoothSlotReservation;
        if (!finalizer) {
          throw new Error('Booth slot checkout is not configured in this backend process.');
        }
        await finalizer({
          amountCents: session.amount_total ?? null,
          currency: session.currency ?? DEFAULT_CURRENCY,
          reservationId: productId,
          stripeSessionId,
        }, { storage });
      } else {
        throw new Error(`Unsupported checkout kind: ${kind}`);
      }

      await upsertPayment(storage, {
        amount_cents: session.amount_total ?? null,
        currency: session.currency ?? DEFAULT_CURRENCY,
        metadata: session.metadata ?? {},
        product_id: productId,
        product_kind: kind,
        status: 'payment_completed',
        stripe_customer_id: typeof session.customer === 'string' ? session.customer : null,
        stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
        stripe_session_id: stripeSessionId,
        user_id: userId,
      });
    },
  };
}

export const paymentService = createPaymentService();
