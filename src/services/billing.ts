import { serverApiGet, serverApiPost } from './serverApi.js';

export const BillingAPI = {
  getPlanLimits: async (planId: string) => serverApiGet(`/api/billing/plans/${planId}/limits`),
  getUserPlan: async (userId: string) => serverApiGet(`/api/billing/users/${userId}/plan`),
  upgradePlan: async (userId: string, newPlan: string) =>
    serverApiPost('/api/billing/upgrade', { userId, newPlan }),
  getCreditBalance: async (userId: string) => ({ data: await serverApiGet(`/api/billing/users/${userId}/credits`), error: null }),
  buyCredits: async (userId: string, packageId: string) =>
    serverApiPost('/api/billing/credits/checkout', { userId, packageId }),
  createCheckoutSession: async (userId: string, productId: string, kind: string) =>
    serverApiPost('/api/billing/checkout', { userId, productId, kind }),
};
