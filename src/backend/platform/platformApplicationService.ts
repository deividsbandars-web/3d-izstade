import { aiOptimizer } from './optimization/aiOptimizer.js';
import { platformMetrics } from './metrics/platformMetrics.js';
import { systemMonitor } from './monitoring/systemMonitor.js';

export const platformApplicationService = {
  async getPlatformMetricsSnapshot() {
    const [agents, leads, business, expo] = await Promise.all([
      platformMetrics.getAgentStats(),
      platformMetrics.getLeadStats(),
      platformMetrics.getBusinessStats(),
      platformMetrics.getExpoStats(),
    ]);

    return {
      agents: agents.data,
      business: business.data,
      expo: expo.data,
      leads: leads.data,
    };
  },

  async getPlatformHealthSnapshot() {
    const [queue, agents, llm] = await Promise.all([
      systemMonitor.getQueueStatus(),
      systemMonitor.getAgentHealth(),
      systemMonitor.getLLMUsage(),
    ]);

    return {
      agents: agents.data,
      llm: llm.data,
      queue: queue.data,
    };
  },

  async getDashboardSnapshot() {
    const [metrics, health] = await Promise.all([
      this.getPlatformMetricsSnapshot(),
      systemMonitor.getQueueStatus(),
    ]);

    return {
      metrics,
      system: health.data,
    };
  },

  async analyzeLeadConversion() {
    return aiOptimizer.analyzeLeadConversion();
  },

  async suggestBetterNiches() {
    return aiOptimizer.suggestBetterNiches();
  },

  async optimizeAgentTasks() {
    return aiOptimizer.optimizeAgentTasks();
  },
};
