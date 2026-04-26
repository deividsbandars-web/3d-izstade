import { billingUsageStorage } from './billingUsageStorage.js';

export type BillingUsagePayload = {
  userId?: string;
  provider: string;
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  costUsd?: number;
  metadata?: unknown;
};

export const billingUsageService = {
  /**
   * Canonical billing-local usage helper.
   * Billing-local storage implementation now lives under billing/usage/**.
   */
  async trackUsage(usagePayload: BillingUsagePayload) {
    await billingUsageStorage.logUsage(usagePayload);
  },

  async checkLimits(userId: string, maxDailyRequests: number = 50) {
    return billingUsageStorage.checkLimits(userId, maxDailyRequests);
  },
};
