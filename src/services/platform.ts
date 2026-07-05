import { serverApiGet, serverApiPost } from './serverApi.js';

export const PlatformAPI = {
  getPlatformMetrics: async (): Promise<any> => serverApiGet('/api/platform/metrics'),
  getSystemHealth: async (): Promise<any> => serverApiGet('/api/platform/health'),
  getOptimizationInsights: async () => ({
    analyzeLeadConversion: (payload: unknown) => serverApiPost('/api/platform/optimization/lead-conversion', payload),
    suggestBetterNiches: (payload: unknown) => serverApiPost('/api/platform/optimization/niches', payload),
    optimizeAgentTasks: (payload: unknown) => serverApiPost('/api/platform/optimization/agent-tasks', payload),
  }),
};
