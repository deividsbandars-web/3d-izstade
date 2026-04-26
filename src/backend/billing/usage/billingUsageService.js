import { billingUsageStorage } from './billingUsageStorage.js';
export const billingUsageService = {
    /**
     * Canonical billing-local usage helper.
     * Billing-local storage implementation now lives under billing/usage/**.
     */
    async trackUsage(usagePayload) {
        await billingUsageStorage.logUsage(usagePayload);
    },
    async checkLimits(userId, maxDailyRequests = 50) {
        return billingUsageStorage.checkLimits(userId, maxDailyRequests);
    },
};
