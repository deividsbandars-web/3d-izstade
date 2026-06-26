import { llmService } from '../../ai/llmService.js';
import { logger } from '../../logging/logger.js';
import { agentScheduler } from '../../../agents/system/scheduler/agentScheduler.js';

export const leadRunner = {
  async execute(taskId: string, _agentId: string, taskData: any) {
    try {
      logger.info('LeadRunner', `Executing task ${taskId}`);

      const action = taskData.action || 'Identify leads';
      const brief = taskData.brief || '';

      const prompt = `You are a Lead Generation Specialist AI.
      Action: ${action}
      Brief: ${brief}
      
      Identify the target B2B audience profiles, suggest scraping parameters, and list 3 ideal customer personas.`;

      const { text, error } = await llmService.generateText(prompt, { provider: 'openai', temperature: 0.5 });

      if (error || !text) throw new Error(String(error));

      const resultPayload = {
        status: 'success',
        runner: 'lead',
        audience_profiles: text,
        completed_at: new Date().toISOString()
      };

      await agentScheduler.completeTask(taskId, resultPayload, 'completed');
      logger.info('LeadRunner', `Task ${taskId} completed.`);

      return resultPayload;
    } catch (error) {
      logger.error('LeadRunner', `Task ${taskId} failed.`, error);
      await agentScheduler.completeTask(taskId, { error: String(error) }, 'failed');
      return null;
    }
  }
};
