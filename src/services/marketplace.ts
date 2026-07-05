import { serverApiGet, serverApiPost } from './serverApi.js';

export const MarketplaceAPI = {
  getAgents: async (): Promise<{ data: any[]; error: null }> => ({ data: await serverApiGet<any[]>('/api/marketplace/agents'), error: null }),
  getWorkflows: async (): Promise<{ data: any[]; error: null }> => ({ data: await serverApiGet<any[]>('/api/marketplace/workflows'), error: null }),
  getTemplates: async (): Promise<{ data: any[]; error: null }> => ({ data: await serverApiGet<any[]>('/api/marketplace/templates'), error: null }),
  installAgent: async (_userId: string, agentId: string) => ({ success: true, data: await serverApiPost('/api/marketplace/install/agent', { agentId }), error: null }),
  installWorkflow: async (_userId: string, workflowId: string) => ({ success: true, data: await serverApiPost('/api/marketplace/install/workflow', { workflowId }), error: null }),
  installTemplate: async (_userId: string, templateId: string) => ({ success: true, data: await serverApiPost('/api/marketplace/install/template', { templateId }), error: null }),
};
