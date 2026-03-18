import { llmService } from '../../ai/llmService';
import { logger } from '../../logging/logger';
import { agentScheduler } from '../../../agents/system/scheduler/agentScheduler';
export const salesRunner = {
    async execute(taskId, _agentId, taskData) {
        try {
            logger.info('SalesRunner', `Executing task ${taskId}`);
            const action = taskData.action || 'Draft outreach strategy';
            const brief = taskData.brief || '';
            const prompt = `You are a Senior Sales Executive AI.
      Action: ${action}
      Brief: ${brief}
      
      Create cold email outreach templates, objection handling scripts, and define the conversion pipeline stages.`;
            const { text, error } = await llmService.generateText(prompt, { provider: 'openai', temperature: 0.7 });
            if (error || !text)
                throw new Error(String(error));
            const resultPayload = {
                status: 'success',
                runner: 'sales',
                templates_and_scripts: text,
                completed_at: new Date().toISOString()
            };
            await agentScheduler.completeTask(taskId, resultPayload, 'completed');
            logger.info('SalesRunner', `Task ${taskId} completed.`);
            return resultPayload;
        }
        catch (error) {
            logger.error('SalesRunner', `Task ${taskId} failed.`, error);
            await agentScheduler.completeTask(taskId, { error: String(error) }, 'failed');
            return null;
        }
    }
};
