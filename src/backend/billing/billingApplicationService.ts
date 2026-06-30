import { planService } from './plans/planService.js';
import { creditService } from './credits/creditService.js';
import { paymentService } from './payments/paymentService.js';
import { billingQuotaService } from './usage/billingQuotaService.js';
import { billingUsageService } from './usage/billingUsageService.js';

type CheckoutKind = 'plan' | 'credits';
type BillingUsagePayload = Parameters<typeof billingUsageService.trackUsage>[0] & {
  maxDailyRequests?: number;
};

export const billingApplicationService = {
  getPlanLimits(planId: string) {
    return planService.getPlanLimits(planId);
  },

  async getUserPlan(userId: string) {
    return planService.getUserPlan(userId);
  },

  async upgradePlan(userId: string, newPlan: string) {
    return paymentService.upgradePlan(userId, newPlan);
  },

  async getCreditBalance(userId: string) {
    return creditService.getCreditBalance(userId);
  },

  async buyCredits(userId: string, packageId: string) {
    return paymentService.createCheckoutSession(userId, packageId, 'credits');
  },

  async createCheckoutSession(userId: string, productId: string, kind: CheckoutKind) {
    return paymentService.createCheckoutSession(userId, productId, kind);
  },

  async trackUsage(userId: string | undefined, usagePayload: BillingUsagePayload) {
    await billingUsageService.trackUsage({
      userId,
      provider: usagePayload.provider,
      model: usagePayload.model,
      promptTokens: usagePayload.promptTokens,
      completionTokens: usagePayload.completionTokens,
      costUsd: usagePayload.costUsd,
      metadata: usagePayload.metadata,
    });
  },

  async enforceQuota(userId: string, usagePayload: BillingUsagePayload = { provider: 'unknown' }) {
    const budgetCheck = await billingQuotaService.verifyBudget(userId);
    if (!budgetCheck.allowed) {
      return budgetCheck;
    }

    if (typeof usagePayload.maxDailyRequests === 'number') {
      const withinLimit = await billingUsageService.checkLimits(userId, usagePayload.maxDailyRequests);
      if (!withinLimit) {
        return { allowed: false, reason: 'Daily API limit reached' };
      }
    }

    return { allowed: true };
  },

  async getUsageSummary(userId: string) {
    const [creditBalance, withinDailyLimit] = await Promise.all([
      creditService.getCreditBalance(userId),
      billingUsageService.checkLimits(userId),
    ]);

    return {
      data: {
        credits: creditBalance.data,
        creditError: creditBalance.error,
        withinDailyLimit,
      },
      error: creditBalance.error,
    };
  },
};
