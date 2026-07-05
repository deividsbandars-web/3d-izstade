import { serverApiPost } from './serverApi.js';

type CheckoutSessionResponse = {
  publishableKey?: string | null;
  session_id: string;
  url: string;
};

export const stripeService = {
  async createCheckoutSession(productIdOrAmount: string | number, projectNameOrKind: string = 'plan') {
    if (typeof productIdOrAmount === 'number') {
      throw new Error(
        `STRIPE_LEGACY_AMOUNT_CHECKOUT_DISABLED:${projectNameOrKind}. Use a server-authored billing product id instead of a client-provided amount.`,
      );
    }

    const kind = projectNameOrKind === 'credits' ? 'credits' : 'plan';
    const data = await serverApiPost<CheckoutSessionResponse>('/api/billing/checkout-session', {
      kind,
      productId: productIdOrAmount,
    });

    return {
      invoiceId: data.session_id,
      sessionId: data.session_id,
      url: data.url,
    };
  },

  async checkPaymentStatus(_invoiceId: string) {
    throw new Error('STRIPE_PAYMENT_STATUS_CHECK_MOVED_TO_BACKEND');
  },
};
