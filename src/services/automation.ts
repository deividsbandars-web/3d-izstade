import { serverApiPost } from './serverApi.js';

export const AutomationAPI = {
  startBusinessWorkflow: async (projectId: string, workflowBrief: string) =>
    serverApiPost('/api/automation/business-workflow', { projectId, workflowBrief }),
};
