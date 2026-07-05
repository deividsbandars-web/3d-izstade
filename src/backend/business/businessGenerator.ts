import { logger } from '../logging/logger.js';
import { createSystemLlmMetering, llmService, type LlmMeteringContext } from '../ai/llmService.js';
import { supabaseClient } from '../../lib/supabaseClient.js';
import { workflowEngine } from '../automation/workflowEngine.js';

const businessGeneratorMetering = (action: string) => createSystemLlmMetering('business-generator', action);

export const businessGenerator = {
  /**
   * 1. Analyzes a raw idea or market niche and expands it into a full concept
   */
  async generateBusinessIdea(niche: string, metering: LlmMeteringContext = businessGeneratorMetering('generate-business-idea')) {
    try {
      logger.info('BusinessGenerator', `Analyzing niche: ${niche}`);
      const prompt = `Act as an expert Business Strategist. I have an idea for a niche: "${niche}". 
      Please provide a complete business brief including: Name, Target Audience, Core Value Proposition, and Monetization Strategy. Format as JSON if possible or clear text.`;
      
      const { text, error } = await llmService.generateText(prompt, { metering, temperature: 0.8 });
      if (error) throw new Error(error);

      return { data: text, error: null };
    } catch (error) {
      logger.error('BusinessGenerator', 'Failed to generate business idea', error);
      return { data: null, error: String(error) };
    }
  },

  /**
   * 2. Creates the project in the database
   */
  async createBusinessProject(title: string, description: string, userId?: string) {
    try {
      logger.info('BusinessGenerator', `Creating project in DB: ${title}`);
      
      const { data, error } = await supabaseClient
        .from('projects')
        .insert([{
          title,
          description,
          status: 'active',
          user_id: userId || null, // Will be null if triggered autonomously without user session
          metadata: { generated_by: 'ai_system' }
        }])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('BusinessGenerator', 'Failed to create project', error);
      return { data: null, error: String(error) };
    }
  },

  /**
   * 3 & 4. Orchestrates the creation and triggers the workflow engine
   */
  async launchBusinessWorkflow(
    niche: string,
    userId?: string,
    metering: LlmMeteringContext = businessGeneratorMetering('launch-business-workflow'),
  ) {
    try {
      logger.info('BusinessGenerator', `Launching full workflow for niche: ${niche}`);

      // Step 1: Generate Idea
      const ideaResponse = await this.generateBusinessIdea(niche, metering);
      if (ideaResponse.error || !ideaResponse.data) throw new Error('Idea generation failed');
      const brief = ideaResponse.data;

      // Extract a dummy title from brief (in production, use stricter JSON parsing)
      const title = `Project: ${niche.substring(0, 20)}...`;

      // Step 2: Create Project
      const projectResponse = await this.createBusinessProject(title, brief, userId);
      if (projectResponse.error || !projectResponse.data) throw new Error('Project creation failed');
      const projectId = projectResponse.data.id;

      // Step 3 & 4: Start Automation Workflow (Assigns tasks to agents)
      const workflowResponse = await workflowEngine.startBusinessWorkflow(projectId, brief);
      if (workflowResponse.error) throw new Error(workflowResponse.error);

      logger.info('BusinessGenerator', `Successfully launched business workflow for project ${projectId}`);
      return { 
        data: {
          project_id: projectId,
          brief,
          tasks_dispatched: workflowResponse.data?.length || 0
        }, 
        error: null 
      };
    } catch (error) {
      logger.error('BusinessGenerator', 'Failed to launch business workflow', error);
      return { data: null, error: String(error) };
    }
  }
};
