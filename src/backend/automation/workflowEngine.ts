import { supabaseClient, handleSupabaseError } from '../../lib/supabaseClient.js';
import { agentScheduler } from '../../agents/system/scheduler/agentScheduler.js';

export const workflowEngine = {
  /**
   * Triggers a full automated business pipeline for a specific project.
   * Workflow sequence: CEO -> Marketing -> SEO -> Lead -> Sales
   */
  async startBusinessWorkflow(projectId: string, projectBrief: string) {
    try {
      console.log(`[WorkflowEngine] Starting business workflow for project: ${projectId}`);

      // 0. Fetch Project to get user_id for governance
      const { data: project } = await supabaseClient
        .from('projects')
        .select('user_id')
        .eq('id', projectId)
        .single();
        
      const userId = project?.user_id;

      // 1. Fetch all available system agents
      const { data: agents, error } = await supabaseClient
        .from('agents')
        .select('id, role, status');

      if (error) throw error;
      if (!agents || agents.length === 0) {
        throw new Error("No active agents found in the system. Please initialize agents first.");
      }

      // Map agents by their roles for easy access
      const agentMap = agents.reduce((acc, agent) => {
        acc[agent.role.toLowerCase()] = agent.id;
        return acc;
      }, {} as Record<string, string>);

      // 2. Define the automation pipeline steps
      const workflowSteps = [
        { role: 'ceo', action: 'Create high-level project strategy and OKRs' },
        { role: 'marketing', action: 'Draft go-to-market plan and ad copy' },
        { role: 'seo', action: 'Perform keyword research and define content clusters' },
        { role: 'lead', action: 'Identify target B2B audiences and setup scraping parameters' },
        { role: 'sales', action: 'Draft outreach templates and define conversion pipeline' }
      ];

      const createdTasks = [];

      // 3. Dispatch tasks into the agent_tasks table
      // Currently runs concurrently, but the Brain/Memory can read context to sequence them
      for (const [index, step] of workflowSteps.entries()) {
        const agentId = agentMap[step.role] || agentMap['general']; // fallback if specific role doesn't exist
        
        if (!agentId) {
          console.warn(`[WorkflowEngine] Skipping step ${index + 1}: No agent found for role '${step.role}'`);
          continue;
        }

        const taskResult = await agentScheduler.dispatchTask({
          agent_id: agentId,
          project_id: projectId,
          status: 'pending',
          task_data: {
            step_number: index + 1,
            workflow_type: 'business_kickoff',
            action: step.action,
            brief: projectBrief,
            user_id: userId,
            depth: 1
          }
        });

        if (taskResult.data) {
          createdTasks.push(taskResult.data);
        }
      }

      console.log(`[WorkflowEngine] Successfully dispatched ${createdTasks.length} workflow tasks.`);
      return { data: createdTasks, error: null };

    } catch (error) {
      return handleSupabaseError(error, 'workflowEngine.startBusinessWorkflow');
    }
  }
};
