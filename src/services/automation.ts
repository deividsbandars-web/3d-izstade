import { serverApiPost } from './serverApi';

export const AutomationAPI = {
  startBusinessWorkflow: async (projectId: string, workflowBrief: string) =>
    serverApiPost('/api/automation/business-workflow', { projectId, workflowBrief }),
};
