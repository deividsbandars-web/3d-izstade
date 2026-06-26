import { agentBrain } from '../brain/agentBrain.js';
import { agentScheduler } from '../scheduler/agentScheduler.js';
import { agentMemory } from '../memory/agentMemory.js';

export type WorkflowStatus = 'idle' | 'running' | 'completed' | 'failed';

export interface WorkflowTask {
  id: string;
  name: string;
  type: 'business_creation' | 'marketing_generation' | 'lead_contact' | 'revenue_tracking' | 'full_autonomous_loop';
  payload: any;
  status: WorkflowStatus;
}

/**
 * WorkflowEngine orchestrates multi-step processes across different agent domains.
 * It manages state, routes tasks to the AgentBrain, and triggers sub-tasks.
 */
export const WorkflowEngine = {
  activeWorkflows: new Map<string, WorkflowTask>(),

  /**
   * Initializes and starts a new workflow.
   */
  async startWorkflow(task: Omit<WorkflowTask, 'id' | 'status'>) {
    const id = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const workflow: WorkflowTask = { ...task, id, status: 'running' };
    
    this.activeWorkflows.set(id, workflow);
    console.log(`[WorkflowEngine] Started workflow ${id}: ${workflow.name} [Type: ${workflow.type}]`);

    try {
      let result;
      switch (workflow.type) {
        case 'business_creation':
          result = await this._executeBusinessCreation(workflow);
          break;
        case 'marketing_generation':
          result = await this._executeMarketingGeneration(workflow);
          break;
        case 'lead_contact':
          result = await this._executeLeadContact(workflow);
          break;
        case 'revenue_tracking':
          result = await this._executeRevenueTracking(workflow);
          break;
        case 'full_autonomous_loop':
          result = await this._executeFullAutonomousLoop(workflow);
          break;
        default:
          throw new Error(`Unknown workflow type: ${workflow.type}`);
      }

      workflow.status = 'completed';
      this.activeWorkflows.set(id, workflow);
      console.log(`[WorkflowEngine] Completed workflow ${id}`);
      return result;

    } catch (error) {
      console.error(`[WorkflowEngine] Workflow ${id} failed:`, error);
      workflow.status = 'failed';
      this.activeWorkflows.set(id, workflow);
      throw error;
    }
  },

  async _executeBusinessCreation(workflow: WorkflowTask) {
    // 1. Brain defines the business model
    const taskData = {
      action: 'define_business',
      context: workflow.payload
    };
    
    // Dispatch via scheduler to allow asynchronous execution
    const { data: task } = await agentScheduler.dispatchTask({
      agent_id: 'system_architect',
      task_data: taskData,
      status: 'pending'
    });

    if (task) {
      const response = await agentBrain.processTask(task.id, task.agent_id, taskData);
      
      // Store in memory
      await agentMemory.remember(task.agent_id, `biz_model_${workflow.id}`, response);
      
      return response;
    }
    return null;
  },

  async _executeMarketingGeneration(workflow: WorkflowTask) {
    const taskData = {
      action: 'generate_marketing_campaign',
      context: workflow.payload
    };
    
    const { data: task } = await agentScheduler.dispatchTask({
      agent_id: 'marketing_agent',
      task_data: taskData,
      status: 'pending'
    });

    if (task) {
      const response = await agentBrain.processTask(task.id, task.agent_id, taskData);
      await agentMemory.remember(task.agent_id, `mkt_campaign_${workflow.id}`, response);
      return response;
    }
    return null;
  },

  async _executeLeadContact(workflow: WorkflowTask) {
    const taskData = {
      action: 'contact_leads',
      context: workflow.payload
    };
    
    const { data: task } = await agentScheduler.dispatchTask({
      agent_id: 'sales_agent',
      task_data: taskData,
      status: 'pending'
    });

    if (task) {
      const response = await agentBrain.processTask(task.id, task.agent_id, taskData);
      await agentMemory.remember(task.agent_id, `leads_contacted_${workflow.id}`, response);
      return response;
    }
    return null;
  },

  async _executeRevenueTracking(workflow: WorkflowTask) {
    const taskData = {
      action: 'track_revenue_and_metrics',
      context: workflow.payload
    };
    
    const { data: task } = await agentScheduler.dispatchTask({
      agent_id: 'finance_agent',
      task_data: taskData,
      status: 'pending'
    });

    if (task) {
      const response = await agentBrain.processTask(task.id, task.agent_id, taskData);
      await agentMemory.remember(task.agent_id, `revenue_report_${workflow.id}`, response);
      return response;
    }
    return null;
  },

  async _executeProductGeneration(workflow: WorkflowTask) {
    const taskData = {
      action: 'generate_product',
      payload: workflow.payload
    };
    
    const { data: task } = await agentScheduler.dispatchTask({
      agent_id: 'product_agent',
      task_data: taskData,
      status: 'pending'
    });

    if (task) {
      const response = await agentBrain.processTask(task.id, task.agent_id, taskData);
      await agentMemory.remember(task.agent_id, `product_line_${workflow.id}`, response);
      return response;
    }
    return null;
  },

  async _executeMarketingOptimization(workflow: WorkflowTask) {
    const taskData = {
      action: 'optimize_marketing',
      payload: workflow.payload
    };
    
    const { data: task } = await agentScheduler.dispatchTask({
      agent_id: 'analytics_agent',
      task_data: taskData,
      status: 'pending'
    });

    if (task) {
      const response = await agentBrain.processTask(task.id, task.agent_id, taskData);
      await agentMemory.remember(task.agent_id, `mkt_optimization_${workflow.id}`, response);
      return response;
    }
    return null;
  },

  async _executeFullAutonomousLoop(workflow: WorkflowTask) {
    console.log(`[WorkflowEngine] Starting Full Autonomous Loop for: ${workflow.payload.niche}`);
    
    // Step 1: Business Creation
    const bizResult = await this._executeBusinessCreation({
      ...workflow,
      id: `${workflow.id}_biz`,
      name: 'Auto-Business Creation',
      type: 'business_creation',
      payload: workflow.payload
    });

    // Step 2: Product Generation
    const productResult = await this._executeProductGeneration({
      ...workflow,
      id: `${workflow.id}_prod`,
      name: 'Auto-Product Generation',
      type: 'revenue_tracking', // Using revenue_tracking as a generic type for now or update WorkflowTask type
      payload: { businessName: (bizResult as any)?.data?.title || workflow.payload.niche, niche: workflow.payload.niche }
    } as any);

    // Step 3: Marketing Generation
    const mktResult = await this._executeMarketingGeneration({
      ...workflow,
      id: `${workflow.id}_mkt`,
      name: 'Auto-Marketing',
      type: 'marketing_generation',
      payload: { niche: workflow.payload.niche, business: bizResult, products: productResult }
    });

    // Step 4: Lead Contact
    const leadsResult = await this._executeLeadContact({
      ...workflow,
      id: `${workflow.id}_leads`,
      name: 'Auto-Lead Gen',
      type: 'lead_contact',
      payload: { niche: workflow.payload.niche, location: workflow.payload.location || 'Global' }
    });

    // Step 5: Revenue Tracking Setup
    const revResult = await this._executeRevenueTracking({
      ...workflow,
      id: `${workflow.id}_rev`,
      name: 'Auto-Revenue Setup',
      type: 'revenue_tracking',
      payload: { businessId: (bizResult as any)?.data?.id || 'unknown' }
    });

    // Step 6: Marketing Optimization (Post-Launch)
    const optResult = await this._executeMarketingOptimization({
      ...workflow,
      id: `${workflow.id}_opt`,
      name: 'Auto-Optimization',
      type: 'revenue_tracking', // Generic
      payload: { campaignId: (mktResult as any)?.data?.id || 'unknown', performanceData: { ctr: 0.05, conversions: 12 } }
    } as any);

    return {
      business: bizResult,
      products: productResult,
      marketing: mktResult,
      leads: leadsResult,
      revenue: revResult,
      optimization: optResult,
      status: 'Full autonomous loop executed and optimization initialized.'
    };
  }
};
