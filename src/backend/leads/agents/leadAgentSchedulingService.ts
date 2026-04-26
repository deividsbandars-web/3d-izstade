import { agentScheduler } from '../../../agents/system/scheduler/agentScheduler.js';

export const leadAgentSchedulingService = {
  async scheduleLeadOutreach(leadId: string, salesAgentId: string) {
    return agentScheduler.dispatchTask({
      agent_id: salesAgentId,
      status: 'pending',
      task_data: {
        action: 'Perform Outreach',
        lead_id: leadId,
      },
    });
  },
};
