import { aiOptimizer } from './optimization/aiOptimizer.js';
import { platformMetrics } from './metrics/platformMetrics.js';
import { systemMonitor } from './monitoring/systemMonitor.js';
import type { LlmMeteringContext } from '../ai/llmService.js';

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

  async analyzeLeadConversion(metering?: LlmMeteringContext) {
    return aiOptimizer.analyzeLeadConversion(metering);
  },

  async suggestBetterNiches(metering?: LlmMeteringContext) {
    return aiOptimizer.suggestBetterNiches(metering);
  },

  async optimizeAgentTasks(metering?: LlmMeteringContext) {
    return aiOptimizer.optimizeAgentTasks(metering);
  },
};
