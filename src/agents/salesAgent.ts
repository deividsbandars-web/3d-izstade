import { BaseAgent } from './baseAgent.js';
import { revenueApplicationService } from '../backend/revenue/revenueApplicationService.js';

export class SalesAgent extends BaseAgent {
  constructor() {
    super(
      'SalesAgent',
      'You are a Senior Account Executive. You craft high-converting cold outreach sequences, handle objections, and close deals.'
    );
  }

  generatePrompt(taskData: any): string {
    const prospect = taskData.prospect_name || 'Target Company';
    const product = taskData.product || taskData.brief || 'Our platform';
    return `Write a highly personalized, 3-step cold email sequence targeting ${prospect} to sell ${product}. 
    Focus on value, keep it concise, and include a strong call-to-action (CTA) in each step.`;
  }

  // Override to include actual outreach firing
  async executeTask(taskId: string, agentId: string, taskData: any): Promise<any> {
    const baseResult = await super.executeTask(taskId, agentId, taskData);
    
    // If real outreach is requested and we have prospect/offer IDs
    if (baseResult && taskData.prospect_id && taskData.offer_id) {
      await revenueApplicationService.startProspectOutreach(taskData.prospect_id, taskData.offer_id);
      baseResult.outreach_started = true;
      await this.storeResults(taskId, baseResult);
    }
    
    return baseResult;
  }
}

export const salesAgent = new SalesAgent();
