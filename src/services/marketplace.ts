import { serverApiGet, serverApiPost } from './serverApi';

export const MarketplaceAPI = {
  getAgents: async (): Promise<{ data: any[]; error: null }> => ({ data: await serverApiGet<any[]>('/api/marketplace/agents'), error: null }),
  getWorkflows: async (): Promise<{ data: any[]; error: null }> => ({ data: await serverApiGet<any[]>('/api/marketplace/workflows'), error: null }),
  getTemplates: async (): Promise<{ data: any[]; error: null }> => ({ data: await serverApiGet<any[]>('/api/marketplace/templates'), error: null }),
  installAgent: async (userId: string, agentId: string) => ({ success: true, data: await serverApiPost('/api/marketplace/install/agent', { userId, agentId }), error: null }),
  installWorkflow: async (userId: string, workflowId: string) => ({ success: true, data: await serverApiPost('/api/marketplace/install/workflow', { userId, workflowId }), error: null }),
  installTemplate: async (userId: string, templateId: string) => ({ success: true, data: await serverApiPost('/api/marketplace/install/template', { userId, templateId }), error: null }),
};
