import { serverApiGet, serverApiPost } from './serverApi.js';

export const BillingAPI = {
  getPlanLimits: async (planId: string) => serverApiGet(`/api/billing/plans/${planId}/limits`),
  getUserPlan: async (userId: string) => serverApiGet(`/api/billing/users/${userId}/plan`),
  upgradePlan: async (_userId: string, newPlan: string) =>
    serverApiPost('/api/billing/checkout-session', { kind: 'plan', productId: newPlan }),
  getCreditBalance: async (userId: string) => ({ data: await serverApiGet(`/api/billing/users/${userId}/credits`), error: null }),
  buyCredits: async (_userId: string, packageId: string) =>
    serverApiPost('/api/billing/credits/checkout', { packageId }),
  createCheckoutSession: async (_userId: string, productId: string, kind: string) =>
    serverApiPost('/api/billing/checkout-session', { productId, kind }),
};
